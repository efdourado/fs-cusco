import { createServer } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PerformanceMetrics from "@/components/dashboard/PerformanceMetrics";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type SubjectStat = {
  id: string;
  name: string;
  question_count: number;
  session_count: number;
  average_accuracy: number;
};

function SubjectCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
); }

function SubjectCard({ subject }: { subject: SubjectStat }) {
  const accuracyColor = subject.average_accuracy >= 70 ? "text-green-600 dark:text-green-400" :
                        subject.average_accuracy >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300 h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{subject.name}</CardTitle>
          <Badge variant="secondary">
            {subject.question_count} {subject.question_count === 1 ? 'questão' : 'questões'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-4 pb-4">
        <div className="space-y-3">
          {subject.session_count > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quizzes realizados:</span>
                <span className="font-semibold">{subject.session_count}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Média de acertos:</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${accuracyColor}`}>
                    {Math.round(subject.average_accuracy)}%
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 flex flex-col items-center justify-center">
              <div className="text-2xl mb-2">📚</div>
              <p className="text-sm text-muted-foreground">
                Você ainda não praticou esta matéria
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 mt-auto">
        <Link href={`/practice/${subject.id}`} className="w-full">
          <Button className="w-full">
            {subject.session_count > 0 ? 'Continuar Praticando' : 'Começar a Praticar'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
); }

function EmptySubjectsState() {
  return (
    <div className="text-center rounded-2xl border-2 border-dashed col-span-1 md:col-span-2 lg:col-span-3 border-muted-foreground/30 p-12 md:p-16">
      <div className="text-5xl md:text-6xl mb-4">📚</div>
      <h3 className="text-xl font-semibold mb-2">Nenhuma matéria encontrada</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        Não foram encontradas matérias com questões disponíveis.
        Peça ao administrador para adicionar novo conteúdo.
      </p>
    </div>
); }

async function SubjectsList() {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: subjects, error } = await supabase
    .rpc('get_subject_stats', { p_user_id: user!.id });

  if (error) {
    console.error("Erro ao buscar estatísticas das matérias:", error);
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Matérias Disponíveis</h2>
          {subjects && (
            <p className="text-muted-foreground mt-1">
              {subjects.length} {subjects.length === 1 ? 'matéria encontrada' : 'matérias encontradas'}
            </p>
          )}
        </div>
        
        {subjects && subjects.length > 0 && (
          <Badge variant="outline" className="text-sm py-1 px-3">
            {subjects.reduce((acc: number, subject: SubjectStat) => acc + subject.question_count, 0)} questões no total
          </Badge>
        )}
      </div>

      {subjects && subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(subjects as SubjectStat[]).map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      ) : (
        <EmptySubjectsState />
      )}
    </>
); }

export default function DashboardPage() {
  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold">
          Dashboard Inicial
        </h1>
        <p className="mt-2 text-muted-foreground">
          Mapeie seu progresso e descubra o que ainda pode evoluir!
        </p>
      </div>

      {/* Performance Section */}
      <Suspense fallback={
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      }>
        <PerformanceMetrics />
      </Suspense>

      {/* Subjects Section */}
      <section>
        <Suspense fallback={
          <>
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <SubjectCardSkeleton key={i} />
              ))}
            </div>
          </>
        }>
          <SubjectsList />
        </Suspense>
      </section>
    </div>
); }