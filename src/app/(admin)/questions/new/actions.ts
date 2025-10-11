'use server'

import { createServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createQuestion(formData: FormData) {
  const supabase = await createServer()

  const subjectName = formData.get('subject') as string
  let { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .ilike('name', subjectName)
    .single()

  if (!subject) {
    const { data: newSubject } = await supabase
      .from('subjects')
      .insert({ name: subjectName })
      .select('id')
      .single()
    subject = newSubject
  }

  if (!subject) {
    throw new Error('Could not create or find subject.')
  }

  const { data: question } = await supabase
    .from('questions')
    .insert({
      subject_id: subject.id,
      statement: formData.get('statement') as string,
      explanation: formData.get('explanation') as string,
    })
    .select('id')
    .single()
  
  if (!question) {
    throw new Error('Could not create question.')
  }

  const correctOptionIndex = parseInt(formData.get('correctOptionIndex') as string, 10)
  const options = Array.from(formData.keys())
    .filter(key => key.startsWith('option_'))
    .map((key, index) => ({
      question_id: question.id,
      option_text: formData.get(key) as string,
      is_correct: index === correctOptionIndex,
    }))

  const { error: optionsError } = await supabase.from('options').insert(options)

  if (optionsError) {
    throw new Error('Could not create options: ' + optionsError.message)
  }

  revalidatePath('/admin')
  redirect('/dashboard')
}