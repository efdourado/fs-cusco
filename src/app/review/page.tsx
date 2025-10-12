// src/app/review/page.tsx
import { createServer } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReviewFilters from "@/components/shared/ReviewFilters";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

// Tipos atualizados para refletir a nova estrutura de dados
type Option = {
  id: string;
  option_text: string;
  is_correct: boolean;
};

type Question = {
  statement: string;
  explanation: string | null;
  subjects: { id: string; name: string } | null;
  topics: { name: string } | null;
  options: Option[];
};

type FetchedAnswer = {
  id: string;
  error_type: 'attention' | 'knowledge' | null;
  selected_option_id: string;
  questions: Question | null;
};

type ReviewPageProps = {
  searchParams: Promise<{
    subject?: string;
    errorType?: string;
  }>
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <p>Você precisa estar logado para ver suas revisões.</p>;
  }

  const { data: subjectsForFilter } = await supabase
    .from('subjects')
    .select('id, name');

  // Query otimizada para buscar todos os dados necessários de uma vez
  let query = supabase
    .from('answers')
    .select(`
      id,
      error_type,
      selected_option_id,
      questions!inner (
        statement,
        explanation,
        subject_id,
        subjects (id, name),
        topics (name),
        options (id, option_text, is_correct)
      )
    `)
    .eq('user_id', user.id)
    .eq('is_correct', false);

  if (resolvedSearchParams.subject) {
    query = query.eq('questions.subject_id', resolvedSearchParams.subject);
  }

  if (resolvedSearchParams.errorType) {
    if (resolvedSearchParams.errorType === 'unclassified') {
      query = query.is('error_type', null);
    } else {
      query = query.eq('error_type', resolvedSearchParams.errorType);
    }
  }

  const { data: incorrectAnswers, error } = await query;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Questões para Revisão</h1>
      <p className="text-muted-foreground mb-8">
        Filtre suas questões erradas para focar nos seus pontos fracos.
      </p>

      <ReviewFilters subjects={subjectsForFilter || []} />

      {error || !incorrectAnswers || incorrectAnswers.length === 0 ? (
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
          {(incorrectAnswers as unknown as FetchedAnswer[]).map((answer) => {

            const question = answer.questions;
            const subject = question?.subjects;
            const topic = question?.topics;

            if (!question || !subject || !topic) return null;

            return (
              <Card key={answer.id}>
                <CardHeader>
                  <CardTitle className="text-lg leading-relaxed">{question.statement}</CardTitle>
                  <CardDescription className="flex items-center gap-2 pt-4">
                    <Badge variant="secondary">{subject.name}</Badge>
                    <Badge variant="outline">{topic.name}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Alternativas:</h4>
                        <ul className="space-y-2">
                            {question.options.map(option => {
                                const isSelected = option.id === answer.selected_option_id;
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
                                          {isSelected && !isCorrect && <span className="text-xs font-semibold text-red-600 dark:text-red-400 block mt-1">Sua Resposta</span>}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                     {question.explanation && (
                        <div className="pt-4 border-t">
                            <h4 className="font-semibold text-sm mb-2">Explicação:</h4>
                            <p className="text-sm text-muted-foreground">{question.explanation}</p>
                        </div>
                     )}
                </CardContent>
                <CardFooter>
                  {answer.error_type ? (
                    <p className="text-sm">
                      Erro classificado como: <span className="font-semibold">{answer.error_type === 'attention' ? 'Falta de Atenção' : 'Falta de Conhecimento'}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Este erro ainda não foi classificado.</p>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}