import { createServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import RecentSessions from "./RecentSessions";
import { Target, CheckCircle, BarChart3, type LucideIcon } from "lucide-react";

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

function KPICard({ title, value, description, icon: Icon }: {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
); }

export default async function PerformanceMetrics() {
  const stats = await getPerformanceStats();

  if (!stats || stats.totalSessions === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>Seu Desempenho</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-5xl md:text-6xl mb-4">🎯</div>
          <p className="text-muted-foreground">
            Você ainda não completou nenhum quiz. Comece a praticar para ver suas estatísticas.
          </p>
        </CardContent>
      </Card>
  ); }

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <KPICard
          title="Total de Questões"
          value={stats.totalQuestionsAnswered}
          description="Questões respondidas"
          icon={CheckCircle}
        />
        
        <KPICard
          title="Quizzes Realizados"
          value={stats.totalSessions}
          description="Sessões completadas"
          icon={BarChart3}
        />
        
        <Card className="md:col-span-2 lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Média de Acertos</p>
              <div className="p-3 bg-primary/10 rounded-full">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-3xl font-bold">{stats.overallAccuracy}%</p>
              <Progress value={stats.overallAccuracy} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stats.overallAccuracy >= 70 ? "Ótimo desempenho!" : 
                 stats.overallAccuracy >= 50 ? "Bom trabalho, continue assim!" : "Continue praticando para melhorar!"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <RecentSessions />
    </section>
); }