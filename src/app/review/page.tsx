import { createServer } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReviewFilters from "@/components/shared/ReviewFilters";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle, Repeat } from "lucide-react";

type Option = {
  id: string;
  option_text: string;
  is_correct: boolean;
};
type QuestionFromSupabase = {
    id: string;
    statement: string;
    explanation: string | null;
    subject_id: string;
    subjects: { name: string } | null;
    topics: { name: string } | null;
    options: Option[];
};
type RawIncorrectAnswer = {
  id: string;
  selected_option_id: string;
  error_type: 'attention' | 'knowledge' | null;
  created_at: string;
  questions: QuestionFromSupabase | null;
};
type ReviewQuestion = {
  question_id: string;
  statement: string;
  explanation: string | null;
  subject_name: string;
  topic_name: string;
  options: Option[];
  error_count: number;
  error_types: Set<'attention' | 'knowledge'>;
  last_answered_at: string;
  last_selected_option_id: string;
};
type ReviewPageProps = {
  searchParams: Promise<{
    subject?: string;
    errorType?: string;
}> }

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: subjectsForFilter } = await supabase.from('subjects').select('id, name');

  let query = supabase
    .from('answers')
    .select(`
      id,
      selected_option_id,
      error_type,
      created_at,
      questions (
        id,
        statement,
        explanation,
        subject_id,
        subjects (name),
        topics (name),
        options (id, option_text, is_correct)
      )
    `)
    .eq('user_id', user!.id)
    .eq('is_correct', false)
    .order('created_at', { ascending: false });

  if (resolvedSearchParams.subject) {
    query = query.eq('questions.subject_id', resolvedSearchParams.subject);
  }
  if (resolvedSearchParams.errorType && resolvedSearchParams.errorType !== 'all') {
    if (resolvedSearchParams.errorType === 'unclassified') {
      query = query.is('error_type', null);
    } else {
      query = query.eq('error_type', resolvedSearchParams.errorType);
  } }

  const { data: incorrectAnswers, error } = await query;
  const reviewQuestionsMap = new Map<string, ReviewQuestion>();

  if (incorrectAnswers) {
    for (const answer of (incorrectAnswers as unknown as RawIncorrectAnswer[])) {
      if (!answer.questions) continue;

      const question = answer.questions;
      const questionId = question.id;

      if (!reviewQuestionsMap.has(questionId)) {
        reviewQuestionsMap.set(questionId, {
          question_id: questionId,
          statement: question.statement,
          explanation: question.explanation,
          subject_name: question.subjects?.name || 'N/A',
          topic_name: question.topics?.name || 'N/A',
          options: question.options || [],
          error_count: 0,
          error_types: new Set(),
          last_answered_at: answer.created_at,
          last_selected_option_id: answer.selected_option_id,
      }); }

      const existing = reviewQuestionsMap.get(questionId)!;
      existing.error_count += 1;
      if (answer.error_type) {
        existing.error_types.add(answer.error_type);
  } } }

  const reviewQuestions = Array.from(reviewQuestionsMap.values());

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Questões para Revisão</h1>
      <p className="text-muted-foreground mb-8">
        Aqui estão as questões que você errou, agrupadas para um estudo focado.
      </p>

      <ReviewFilters subjects={subjectsForFilter || []} />

      {error ? (
         <div className="text-center border-2 border-dashed rounded-lg p-12 mt-8">
            <h2 className="text-xl font-semibold text-destructive">Ocorreu um erro ao buscar suas revisões.</h2>
            <p className="text-muted-foreground mt-2">Detalhe do erro: {error.message}</p>
         </div>
      ) : reviewQuestions.length === 0 ? (
        <div className="text-center border-2 border-dashed rounded-lg p-12 mt-8">
          <h2 className="text-xl font-semibold">Nenhum resultado encontrado.</h2>
          <p className="text-muted-foreground mt-2">
            {resolvedSearchParams.subject || resolvedSearchParams.errorType
              ? "Tente ajustar os filtros."
              : "Você ainda não errou nenhuma questão para revisar. Continue praticando!"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviewQuestions.map((question) => (
            <Card key={question.question_id}>
              <CardHeader>
                <CardTitle className="text-lg leading-relaxed">{question.statement}</CardTitle>
                <CardDescription className="flex items-center gap-2 pt-4">
                  <Badge variant="secondary">{question.subject_name}</Badge>
                  <Badge variant="outline">{question.topic_name}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div>
                      <h4 className="text-sm font-semibold mb-2">Alternativas:</h4>
                      <ul className="space-y-2">
                          {question.options.map(option => {
                              const isSelected = option.id === question.last_selected_option_id;
                              const isCorrect = option.is_correct;
                              return (
                                  <li key={option.id} className={cn(
                                      "flex items-start gap-3 p-3 rounded-md border text-sm",
                                      isCorrect ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950" : "",
                                      isSelected && !isCorrect ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950" : ""
                                  )}>
                                      {isCorrect ? <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /> : null}
                                      {isSelected && !isCorrect ? <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" /> : null}
                                      {!isSelected && !isCorrect ? <div className="h-5 w-5 shrink-0" /> : null}
                                      
                                      <div className="flex-1">
                                        <p>{option.option_text}</p>
                                        {isCorrect && <span className="text-xs font-semibold text-green-600 dark:text-green-400 block mt-1">Resposta Correta</span>}
                                        {isSelected && !isCorrect && <span className="text-xs font-semibold text-red-600 dark:text-red-400 block mt-1">Sua Resposta (última tentativa)</span>}
                                      </div>
                                  </li>
                          ) })}
                      </ul>
                  </div>
                   {question.explanation && (
                      <div className="pt-4 border-t">
                          <h4 className="font-semibold text-sm mb-2">Explicação:</h4>
                          <p className="text-sm text-muted-foreground">{question.explanation}</p>
                      </div>
                   )}
              </CardContent>
              <CardFooter className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Repeat className="h-4 w-4 text-red-500" />
                  <span className="font-semibold text-red-500">{question.error_count} {question.error_count === 1 ? 'erro' : 'erros'}</span>
                   nesta questão.
                </div>
                <div className="flex items-center gap-2">
                  {Array.from(question.error_types).map(type => (
                     <Badge key={type} variant="outline" className="gap-1">
                       <AlertCircle className="h-3 w-3" />
                       {type === 'attention' ? 'Falta de Atenção' : 'Falta de Conhecimento'}
                     </Badge>
                  ))}
                   {(question.error_types.size < question.error_count) && (
                    <Badge variant="outline">Não Classificado</Badge>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
); }