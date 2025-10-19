import { createServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

type Session = {
  id: string;
  completed_at: string;
  score: number;
  total_questions: number;
  subjects: {
    name: string;
  }[] | null;
};

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
  return sessions as Session[];
}

export default async function RecentSessions() {
  const sessions = await getRecentSessions();

  if (!sessions || sessions.length === 0) {
    return null;
  }
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Sessões Recentes</CardTitle>
        </div>
        <CardDescription>Seu histórico de últimos quizzes realizados.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {sessions.map((session) => {
            const accuracy = session.total_questions > 0 ? Math.round((session.score / session.total_questions) * 100) : 0;
            return (
              <li key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-secondary/50">
                <div className="flex-1">
                  <p className="font-semibold">{session.subjects?.[0]?.name || 'Matéria desconhecida'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(session.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                   <Badge variant={accuracy >= 70 ? "default" : "destructive"}>
                    {accuracy}% de acerto
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">
                    {session.score}/{session.total_questions}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
); }