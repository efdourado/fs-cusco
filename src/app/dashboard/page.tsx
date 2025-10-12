import { createServer } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PerformanceMetrics from "@/components/dashboard/PerformanceMetrics";

export default async function DashboardPage() {
  const supabase = await createServer();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, questions!inner(id)");

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
            {subjects.map((subject) => (
              <Card key={subject.id}>
                <CardHeader>
                  <CardTitle>{subject.name}</CardTitle>
                  <CardDescription>
                    {subject.questions.length} {subject.questions.length === 1 ? 'questão disponível' : 'questões disponíveis'}.
                  </CardDescription>
                </CardHeader>
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