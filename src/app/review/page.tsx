import { createServer } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReviewFilters from "@/components/shared/ReviewFilters";

type FetchedAnswer = {
  id: string;
  error_type: 'attention' | 'knowledge' | null;
  questions: {
    statement: string;
    subjects: { id: string; name: string; } | null;
    topics: { name: string; } | null;
} | null; };

type ReviewPageProps = {
  searchParams: Promise<{
    subject?: string;
    errorType?: string;
}> }

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
  
  let query = supabase
    .from('answers')
    .select(`
      id,
      error_type,
      questions!inner (
        statement,
        subject_id,
        subjects (id, name),
        topics (name)
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
  } }

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
        <div className="grid gap-4">
          {(incorrectAnswers as unknown as FetchedAnswer[]).map((answer) => {
            
            const question = answer.questions;
            const subject = question?.subjects;
            const topic = question?.topics;
            
            if (!question || !subject || !topic) return null;

            return (
              <Card key={answer.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{question.statement}</CardTitle>
                  <CardDescription className="flex items-center gap-2 pt-2">
                    <Badge variant="secondary">{subject.name}</Badge>
                    <Badge variant="outline">{topic.name}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {answer.error_type ? (
                    <p className="text-sm">
                      Você classificou este erro como: <span className="font-semibold">{answer.error_type === 'attention' ? 'Falta de Atenção' : 'Falta de Conhecimento'}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Este erro ainda não foi classificado.</p>
                  )}
                </CardContent>
              </Card>
          ) })}
        </div>
      )}
    </div>
); }