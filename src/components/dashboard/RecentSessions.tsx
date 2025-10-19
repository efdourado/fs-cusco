import { createServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Calendar, Target } from "lucide-react";

type Session = {
  id: string;
  completed_at: string;
  score: number;
  total_questions: number;
  subjects: {
    name: string;
} | null; };

async function getRecentSessions() {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: sessions, error } = await supabase
    .from('quiz_sessions')
    .select(`
      id,
      completed_at,
      score,
      total_questions,
      subjects (name)
    `)
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Erro ao buscar sessões recentes:", error);
    return null;
  }

  const formattedSessions = sessions?.map((s: any) => ({
    ...s,
    subjects: Array.isArray(s.subjects) ? s.subjects[0] : s.subjects,
  }));

  return formattedSessions as Session[];
}

function AccuracyBadge({ accuracy }: { accuracy: number }) {
  const variant = accuracy >= 70 ? "default" : 
                  accuracy >= 50 ? "secondary" : "destructive";
  
  const icon = accuracy >= 70 ? "🎯" : accuracy >= 50 ? "📊" : "💪";

  return (
    <Badge variant={variant} className="flex items-center gap-1.5 py-1 px-2">
      <span>{icon}</span>
      <span>{accuracy}%</span>
    </Badge>
); }

export default async function RecentSessions() {
  const sessions = await getRecentSessions();

  if (!sessions || sessions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <CardTitle>Sessões Recentes</CardTitle>
        </div>
        <CardDescription>Seu histórico dos últimos 5 quizzes realizados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session) => {
            const accuracy = session.total_questions > 0 ? 
              Math.round((session.score / session.total_questions) * 100) : 0;
            
            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
                  {/* Matéria */}
                  <div className="flex items-center gap-3 col-span-1">
                    <div className="hidden sm:block p-2 bg-primary/10 rounded-full">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {session.subjects?.name || 'Matéria desconhecida'}
                      </p>
                       <p className="sm:hidden text-xs text-muted-foreground">
                        {new Date(session.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>

                  {/* Data */}
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground col-span-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(session.completed_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>

                  {/* Estatísticas */}
                  <div className="flex items-center justify-end gap-4 col-span-1">
                    <AccuracyBadge accuracy={accuracy} />
                    <span className="text-sm font-medium min-w-[50px] text-right text-muted-foreground">
                      {session.score}/{session.total_questions}
                    </span>
                  </div>
                </div>
              </div>
          ); })}
        </div>
      </CardContent>
    </Card>
); }