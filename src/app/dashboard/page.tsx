import { createServer } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PerformanceMetrics from "@/components/dashboard/PerformanceMetrics";
import { Badge } from "@/components/ui/badge";

type SubjectStat = {
  id: string;
  name: string;
  question_count: number;
  session_count: number;
  average_accuracy: number;
};

export default async function DashboardPage() {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: subjects, error } = await supabase
    .rpc('get_subject_stats', { p_user_id: user!.id });

  if (error) {
    console.error("Erro ao buscar estatísticas das matérias:", error);
  }
  return (
    <div>
      <h1 className="text-3xl font-bold">Painel do Estudante</h1>
      <p className="mt-2 text-muted-foreground">
        Acompanhe seu progresso e selecione uma matéria para praticar.
      </p>

      <PerformanceMetrics />

      <div className="mt-12">
        <h2 className="text-2xl font-bold">Matérias Disponíveis</h2>
        {subjects && subjects.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(subjects as SubjectStat[]).map((subject) => (
              <Card key={subject.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{subject.name}</CardTitle>
                  <CardDescription>
                    {subject.question_count} {subject.question_count === 1 ? 'questão disponível' : 'questões disponíveis'}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  {subject.session_count > 0 ? (
                    <>
                      <div className="text-sm text-muted-foreground">
                        Você completou{" "}
                        <span className="font-bold text-foreground">{subject.session_count} {subject.session_count === 1 ? 'quiz' : 'quizzes'}</span>
                        {" "}desta matéria.
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Sua média de acertos:</span>
                        <Badge variant={subject.average_accuracy >= 70 ? "default" : "destructive"}>
                          {Math.round(subject.average_accuracy)}%
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Você ainda não praticou esta matéria.
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Link href={`/practice/${subject.id}`} className="w-full">
                    <Button className="w-full">Começar a Praticar</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12">
            <p className="text-muted-foreground">
              Nenhuma matéria com questões foi encontrada. Adicione algumas no painel de administrador.
            </p>
          </div>
        )}
      </div>
    </div>
); }