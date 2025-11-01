import { createServer } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ReviewFilters from "@/components/shared/ReviewFilters";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  ChartNoAxesColumn,
  AlertCircle,
  RefreshCw,
  Filter,
  BookOpen,
  Book,
} from "lucide-react";

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
  error_type: "attention" | "knowledge" | null;
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
  error_types: Set<"attention" | "knowledge">;
  last_answered_at: string;
  last_selected_option_id: string;
};
type ReviewPageProps = {
  searchParams: Promise<{
    subject?: string;
    errorType?: string;
}>; };


function getErrorBarColor(percentage: number) {
  if (percentage < 20) return "bg-green-500";
  if (percentage < 40) return "bg-yellow-500";

  return "bg-red-500";
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
    
  const { data: subjectsForFilter } = await supabase
    .from("subjects")
    .select("id, name");

  let query = supabase
    .from("answers")
    .select(
      `
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
    `
    )
    .eq("user_id", user!.id)
    .eq("is_correct", false)
    .order("created_at", { ascending: false });

  if (resolvedSearchParams.subject) {
    query = query.eq("questions.subject_id", resolvedSearchParams.subject);
  }
  if (
    resolvedSearchParams.errorType &&
    resolvedSearchParams.errorType !== "all"
  ) {
    if (resolvedSearchParams.errorType === "unclassified") {
      query = query.is("error_type", null);
    } else {
      query = query.eq("error_type", resolvedSearchParams.errorType);
  } }

  const { data: incorrectAnswers, error } = await query;
  const reviewQuestionsMap = new Map<string, ReviewQuestion>();

  if (incorrectAnswers) {
    for (const answer of incorrectAnswers as unknown as RawIncorrectAnswer[]) {
      if (!answer.questions) continue;

      const question = answer.questions;
      const questionId = question.id;

      if (!reviewQuestionsMap.has(questionId)) {
        reviewQuestionsMap.set(questionId, {
          question_id: questionId,
          statement: question.statement,
          explanation: question.explanation,
          subject_name: question.subjects?.name || "N/A",
          topic_name: question.topics?.name || "N/A",
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
  const totalToReview = reviewQuestions.length;
  const knowledgeQuestions = reviewQuestions.filter((q) =>
    q.error_types.has("knowledge")
  ).length;
  const attentionQuestions = reviewQuestions.filter((q) =>
    q.error_types.has("attention")
  ).length;

  
  const totalAllErrors = incorrectAnswers ? incorrectAnswers.length : 0;

  const { count: totalAnswersCount, error: countError } = await supabase
    .from('answers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id);

  const totalBarPct = totalAnswersCount && totalAnswersCount > 0 
    ? Math.round((totalToReview / totalAnswersCount) * 100) 
    : 0;
  const totalBarColor = getErrorBarColor(totalBarPct);

  const knowledgePct = totalToReview > 0 
    ? Math.round((knowledgeQuestions / totalAllErrors) * 100) 
    : 0;
  const knowledgeBarColor = getErrorBarColor(knowledgePct);

  const attentionPct = totalToReview > 0 
    ? Math.round((attentionQuestions / totalAllErrors) * 100) 
    : 0;
  const attentionBarColor = getErrorBarColor(attentionPct);


  return (
    <div className="space-y-12">
      {/* --- 1. Header --- */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
          Revisão (Questões)
        </h1>
        <p className="mt-2 text-muted-foreground">
          Grupo de questões marcadas para revisão com base em seus erros
          anteriores.
        </p>
      </div>

      {/* --- 2. KPI Cards --- */}
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="px-6 pt-0">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-6 w-6 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">Questões para Reestudo</CardTitle>
                  <CardDescription>
                    Com questões erradas anteriormente.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-3 text-center space-y-6">
              <p className="text-3xl font-bold">{totalToReview}</p>

              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className={cn("rounded-full h-2 transition-all", totalBarColor)}
                  style={{ width: `${totalBarPct}%` }}
                  title={`Sua taxa de erro geral é ${totalBarPct}%`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 pt-0">
              <div className="flex items-center gap-3">
                <ChartNoAxesColumn className="h-6 w-6 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">Erros (Conhecimento)</CardTitle>
                  <CardDescription>
                    Por falta de domínio do conteúdo.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-3 text-center space-y-6">
              <p className="text-3xl font-bold">{knowledgeQuestions}</p>

              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className={cn("rounded-full h-2 transition-all", knowledgeBarColor)}
                  style={{ width: `${knowledgePct}%` }}
                />
              </div>              
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 pt-0">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">Erros (Cautela)</CardTitle>
                  <CardDescription>
                    Distração, descuido. Falhas momentâneas.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-3 text-center space-y-6">
              <p className="text-3xl font-bold">{attentionQuestions}</p>

              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className={cn("rounded-full h-2 transition-all", attentionBarColor)}
                  style={{ width: `${attentionPct}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- Filtros e Conteúdo --- */}
      <section>
        <ReviewFilters subjects={subjectsForFilter || []} />

        {error ? (
          <Card className="border-2 border-dashed border-destructive/50 bg-destructive/5 mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-destructive">
                Ocorreu um erro
              </h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Não foi possível buscar suas revisões. Detalhe: {error.message}
              </p>
            </CardContent>
          </Card>
        ) : reviewQuestions.length === 0 ? (
          <>
            {/* --- 3. Estado Vazio Atualizado (dividido em dois casos) --- */}
            {resolvedSearchParams.subject || resolvedSearchParams.errorType ? (
              // Caso 1: Vazio devido a filtros
              <Card className="border-2 border-dashed bg-card mt-8">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Filter className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">
                    Nenhum resultado encontrado
                  </h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Tente ajustar os filtros de matéria ou tipo de erro para ver
                    outras questões.
                  </p>
                </CardContent>
              </Card>
            ) : (
              // Caso 2: Vazio porque o usuário não tem erros
              <Card className="border-2 border-dashed bg-card mt-8">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">
                    Caixa de Revisão Limpa!
                  </h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Você ainda não errou nenhuma questão. Continue praticando
                    para construir seu banco de revisão.
                  </p>
                  <Link href="/dashboard">
                    <Button>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Ir para o Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {reviewQuestions.map((question) => (
              <Card key={question.question_id}>
                <CardHeader className="px-6 pt-0">
                  <div className="flex items-center gap-3">
                    <Book className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{question.statement}</CardTitle>
                      <CardDescription>{question.subject_name} ({question.topic_name})</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-4">
                      Opções:
                    </h4>
                    <ul className="space-y-2">
                      {question.options.map((option) => {
                        const isSelected =
                          option.id === question.last_selected_option_id;
                        const isCorrect = option.is_correct;
                        return (
                          <li
                            key={option.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-md border text-sm",
                              isCorrect
                                ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950"
                                : "",
                              isSelected && !isCorrect
                                ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950"
                                : ""
                            )}
                          >
                            {isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                            ) : null}
                            {isSelected && !isCorrect ? (
                              <ChartNoAxesColumn className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                            ) : null}
                            {!isSelected && !isCorrect ? (
                              <div className="h-5 w-5 shrink-0" />
                            ) : null}

                            <div className="flex-1">
                              <p>{option.option_text}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  {/* --- 4. Bloco de Justificativa --- */}
                  {question.explanation && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm text-muted-foreground mb-4">
                        Justificativa:
                      </h4>
                      <blockquote className="text-sm p-3 bg-accent rounded-lg border-l-4 border-blue-600 mt-2">
                        <p className="text-accent-foreground/90">
                          {question.explanation}
                        </p>
                      </blockquote>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="relative mt-4 border-t pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2"></div>

                  <div className="flex flex-col sm:flex-row items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <span className="font-semibold text-foreground">
                          {question.error_count}
                        </span>{" "}
                        {question.error_count === 1 ? "erro" : "erros"} nesta questão!
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 sm:mt-0">
                      {question.error_types.has("attention") && (
                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Cautela</span>
                        </div>
                      )}
                      {question.error_types.has("knowledge") && (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <ChartNoAxesColumn className="h-4 w-4" />
                          <span className="text-xs font-medium">Conhecimento</span>
                        </div>
                      )}
                      {question.error_types.size === 0 && (
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Sem classificação</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
); }