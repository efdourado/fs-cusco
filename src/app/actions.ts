'use server'

import { createServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createServer()
  await supabase.auth.signOut()
  return redirect('/login')
}

export async function saveAnswer(
  questionId: string,
  selectedOptionId: string,
  isCorrect: boolean
): Promise<string | null> {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Usuário não autenticado.')
  }

  const { data: newAnswer, error } = await supabase.from('answers').insert({
    user_id: user.id,
    question_id: questionId,
    selected_option_id: selectedOptionId,
    is_correct: isCorrect,
  }).select('id').single()

  if (error) {
    console.error('Erro ao salvar resposta:', error)
    return null
  }

  revalidatePath('/dashboard')
  return newAnswer.id
}

export async function classifyError(answerId: string, errorType: 'attention' | 'knowledge') {
  const supabase = await createServer()

  const { error } = await supabase
    .from('answers')
    .update({ error_type: errorType })
    .eq('id', answerId)

  if (error) {
    console.error('Erro ao classificar o erro:', error)
    throw new Error('Não foi possível classificar o erro.')
  }

  revalidatePath('/dashboard')
}

export async function createNotebookHighlight(
  questionId: string,
  subjectId: string,
  highlightedText: string
) {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuário não autenticado.');
  }

  const { error } = await supabase.from('notebook_entries').insert({
    user_id: user.id,
    subject_id: subjectId,
    content: highlightedText,
    entry_type: 'highlight',
    // CORREÇÃO APLICADA AQUI:
    source_question_id: questionId, 
  });

  if (error) {
    console.error('Erro ao salvar grifo no caderno:', error);
    throw new Error('Não foi possível salvar o grifo no caderno.');
  }

  revalidatePath('/notebook');
}

export async function createNotebookNote(formData: FormData) {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const subjectId = formData.get('subjectId') as string;
  const noteContent = formData.get('noteContent') as string;

  if (!subjectId || !noteContent) {
    throw new Error("Matéria e conteúdo da anotação são obrigatórios.");
  }

  const { error } = await supabase.from("notebook_entries").insert({
    user_id: user.id,
    subject_id: subjectId,
    content: noteContent,
    entry_type: "user_note",
  });

  if (error) {
    console.error("Erro ao salvar anotação:", error);
    throw new Error("Não foi possível salvar a anotação.");
  }

  revalidatePath("/notebook");
}