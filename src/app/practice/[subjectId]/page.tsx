import { createServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type PracticePageProps = {
  params: Promise<{ subjectId: string }>;
};

export default async function PracticePage({ params }: PracticePageProps) {

  const { subjectId } = await params;

  const supabase = await createServer();

  const { data: subject } = await supabase
    .from("subjects")
    .select("name")
    .eq("id", subjectId)
    .single();

  if (!subject) {
    notFound();
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, statement, options (id, option_text, is_correct)")
    .eq("subject_id", subjectId);

  return (
    <div>
      <h1 className="text-3xl font-bold">Practice: {subject.name}</h1>
      <p className="mt-2 text-muted-foreground">
        Here are the questions we loaded for this session.
      </p>
      
      <pre className="mt-6 p-4 bg-secondary rounded-md overflow-x-auto">
        {JSON.stringify(questions, null, 2)}
      </pre>
    </div>
); }