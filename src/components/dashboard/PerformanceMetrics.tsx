import { createServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

async function getPerformanceStats() {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: answers, error } = await supabase
    .from("answers")
    .select("is_correct, questions(subjects(id, name))")
    .eq("user_id", user.id);

  if (error || !answers) {
    return null;
  }

  const totalAnswers = answers.length;
  if (totalAnswers === 0) {
    return {
      totalAnswers: 0,
      overallAccuracy: 0,
      subjectAccuracy: [],
  }; }

  const correctAnswers = answers.filter((a) => a.is_correct).length;
  const overallAccuracy = Math.round((correctAnswers / totalAnswers) * 100);

  const statsBySubject: { [key: string]: { name: string, total: number; correct: number } } = {};

  for (const answer of answers) {
    // @ts-expect-error - selects aninhados
    const subject = answer.questions?.subjects;
    if (subject) {
      if (!statsBySubject[subject.id]) {
        statsBySubject[subject.id] = { name: subject.name, total: 0, correct: 0 };
      }
      statsBySubject[subject.id].total++;
      if (answer.is_correct) {
        statsBySubject[subject.id].correct++;
  } } }

  const subjectAccuracy = Object.values(statsBySubject)
    .map(({ name, total, correct }) => ({
      name,
      accuracy: Math.round((correct / total) * 100),
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  return {
    totalAnswers,
    overallAccuracy,
    subjectAccuracy,
}; }

export default async function PerformanceMetrics() {
  const stats = await getPerformanceStats();

  if (!stats || stats.totalAnswers === 0) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Desempenho Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Você ainda não respondeu nenhuma questão. Comece a praticar para ver
            suas estatísticas.
          </p>
        </CardContent>
      </Card>
  ); }

  return (
    <div className="mt-8 space-y-8">
      <h2 className="text-2xl font-bold">Seu Desempenho</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total de Questões Respondidas
              </p>
              <p className="text-2xl font-bold">{stats.totalAnswers}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Acertos
              </p>
              <p className="text-2xl font-bold">{stats.overallAccuracy}%</p>
              <Progress value={stats.overallAccuracy} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Desempenho por Matéria</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {stats.subjectAccuracy.map((subject) => (
                <li
                  key={subject.name}
                  className="flex items-center justify-between"
                >
                  <span className="font-medium">{subject.name}</span>
                  <span className="font-semibold">{subject.accuracy}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
); }