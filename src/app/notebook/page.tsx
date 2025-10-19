import { createServer } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { BookOpen, Highlighter, FileText, Bookmark, Search, Filter, Plus } from "lucide-react";
import NewNoteForm from "@/components/notebook/NewNoteForm";

type NotebookEntry = {
  id: string;
  content: string;
  entry_type: 'highlight' | 'user_note';
  subjects: {
    name: string;
  } | null;
  questions: {
    statement: string;
  }[] | null;
  created_at: string;
};

export default async function NotebookPage() {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: subjects } = await supabase.from('subjects').select('id, name');
  const { data: allEntries, error } = await supabase
    .from('notebook_entries')
    .select(`
      id,
      content,
      entry_type,
      created_at,
      subjects (name),
      questions (statement)
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  if (error || !allEntries || allEntries.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
            Meu Caderno
          </h1>
          <p className="text-muted-foreground mt-2">
            Organize seus grifos e anotações pessoais
          </p>
        </div>

        <div className="flex justify-end mb-8">
          <NewNoteForm subjects={subjects || []}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Anotação
            </Button>
          </NewNoteForm>
        </div>

        <Card className="border-2 border-dashed bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">
              Seu caderno está vazio
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Para adicionar anotações, selecione textos durante a resolução de questões e clique em &quot;Grifar&quot; ou crie anotações livres.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard">
                <Button>
                  <Highlighter className="h-4 w-4 mr-2" />
                  Começar a Estudar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
  ); }

  const typedEntries = allEntries as unknown as NotebookEntry[];
  const groupedBySubject = typedEntries.reduce((acc, entry) => {
    const subjectName = entry.subjects?.name || 'Sem Matéria';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(entry);
    return acc;
  }, {} as Record<string, NotebookEntry[]>);
  const totalEntries = allEntries.length;
  const highlightsCount = allEntries.filter(entry => entry.entry_type === 'highlight').length;
  const notesCount = allEntries.filter(entry => entry.entry_type === 'user_note').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
          Meu Caderno
        </h1>
        <p className="text-muted-foreground mt-2">
          {totalEntries} {totalEntries === 1 ? 'registro' : 'registros'} em {Object.keys(groupedBySubject).length} {Object.keys(groupedBySubject).length === 1 ? 'matéria' : 'matérias'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full justify-end mb-8">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar anotações..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtrar
        </Button>
        <NewNoteForm subjects={subjects || []}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Anotação
          </Button>
        </NewNoteForm>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total</p><p className="text-2xl font-bold">{totalEntries}</p></div><BookOpen className="h-8 w-8 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Grifos</p><p className="text-2xl font-bold">{highlightsCount}</p></div><Highlighter className="h-8 w-8 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Anotações</p><p className="text-2xl font-bold">{notesCount}</p></div><FileText className="h-8 w-8 text-muted-foreground" /></div></CardContent></Card>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedBySubject).map(([subject, entries]) => (
          <div key={subject} className="space-y-4">
            <div className="flex items-center gap-3"><div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center"><Bookmark className="h-4 w-4 text-primary" /></div><div><h2 className="text-2xl font-semibold">{subject}</h2><p className="text-sm text-muted-foreground">{entries.length} {entries.length === 1 ? 'anotação' : 'anotações'}</p></div></div>
            <div className="grid gap-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">{entry.entry_type === 'highlight' ? (<><Highlighter className="h-4 w-4" /><span>Grifo</span></>) : (<><FileText className="h-4 w-4" /><span>Anotação</span></>)}</div><span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString('pt-BR')}</span></div>
                    {entry.entry_type === 'highlight' && entry.questions?.[0] && (<CardDescription className="text-sm mt-2 p-3 bg-accent rounded-lg border-l-4"><span className="font-medium text-foreground">Questão:</span> {entry.questions[0].statement}</CardDescription>)}
                  </CardHeader>
                  <CardContent>
                    <blockquote className="border-l-4 pl-4 py-2"><p className="text-base font-medium leading-relaxed">{entry.entry_type === 'highlight' ? `"${entry.content}"` : entry.content}</p></blockquote>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 right-6 sm:hidden">
        <NewNoteForm subjects={subjects || []}>
            <Button size="lg" className="rounded-full w-14 h-14 shadow-lg"><Plus className="h-6 w-6" /></Button>
        </NewNoteForm>
      </div>
    </div>
); }