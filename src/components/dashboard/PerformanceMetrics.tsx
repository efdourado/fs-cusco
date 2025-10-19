import { createServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import RecentSessions from "./RecentSessions";

async function getPerformanceStats() {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: sessions, error } = await supabase
    .from('quiz_sessions')
    .select('score, total_questions')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null);

  if (error || !sessions || sessions.length === 0) {
    return {
      totalQuestionsAnswered: 0,
      overallAccuracy: 0,
      totalSessions: 0,
  }; }
  
  const totalQuestionsAnswered = sessions.reduce((sum, s) => sum + s.total_questions, 0);
  const totalCorrectAnswers = sessions.reduce((sum, s) => sum + s.score, 0);
  const overallAccuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) : 0;

  return {
    totalQuestionsAnswered,
    overallAccuracy,
    totalSessions: sessions.length,
}; }

export default async function PerformanceMetrics() {
  const stats = await getPerformanceStats();

  if (!stats || stats.totalSessions === 0) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Seu Desempenho</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Você ainda não completou nenhum quiz. Comece a praticar para ver suas estatísticas.
          </p>
        </CardContent>
      </Card>
  ); }

  return (
    <div className="mt-8 space-y-8">
      <h2 className="text-2xl font-bold">Seu Desempenho</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total de Questões Respondidas
              </p>
              <p className="text-2xl font-bold">{stats.totalQuestionsAnswered}</p>
            </div>
             <div>
              <p className="text-sm font-medium text-muted-foreground">
                Quizzes Realizados
              </p>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Média de Acertos
              </p>
              <p className="text-2xl font-bold">{stats.overallAccuracy}%</p>
              <Progress value={stats.overallAccuracy} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <RecentSessions />
      </div>
    </div>
); }