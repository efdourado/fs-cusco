'use server'

import { createServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createQuestion(formData: FormData) {
  const supabase = await createServer()

  const subjectName = formData.get('subject') as string
  let { data: subject } = await supabase.from('subjects').select('id').ilike('name', subjectName.trim()).single()
  if (!subject) {
    const { data: newSubject, error } = await supabase.from('subjects').insert({ name: subjectName.trim() }).select('id').single()
    if (error) throw new Error('Falha ao criar matéria: ' + error.message)
    subject = newSubject
  }

  const topicName = formData.get('topic') as string
  let { data: topic } = await supabase.from('topics').select('id').eq('subject_id', subject.id).ilike('name', topicName.trim()).single()
  if (!topic) {
    const { data: newTopic, error } = await supabase.from('topics').insert({ name: topicName.trim(), subject_id: subject.id }).select('id').single()
    if (error) throw new Error('Falha ao criar assunto: ' + error.message)
    topic = newTopic
  }

  const { data: question, error: questionError } = await supabase
    .from('questions')
    .insert({
      subject_id: subject.id,
      topic_id: topic.id,
      statement: formData.get('statement') as string,
      explanation: formData.get('explanation') as string,
      tips: formData.get('tips') as string,

      banca: formData.get('banca') as string,
      ano: Number(formData.get('ano')) || null,
      orgao: formData.get('orgao') as string,
      cargo: formData.get('cargo') as string,
    })
    .select('id')
    .single()
  
  if (questionError) throw new Error('Falha ao criar questão: ' + questionError.message)
  if (!question) throw new Error('Não foi possível obter o ID da questão criada.')

  const correctOptionIndex = parseInt(formData.get('correctOptionIndex') as string, 10)
  const options = Array.from(formData.keys())
    .filter(key => key.startsWith('option_'))
    .map((key, index) => ({
      question_id: question.id,
      option_text: formData.get(key) as string,
      is_correct: index === correctOptionIndex,
    }))

  const { error: optionsError } = await supabase.from('options').insert(options)
  if (optionsError) throw new Error('Falha ao criar opções: ' + optionsError.message)

  revalidatePath('/admin')
  redirect('/dashboard')
}