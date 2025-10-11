import { createServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

// This is a dynamic page that receives params from the URL
export default async function PracticePage({
  params,
}: {
  params: { subjectId: string };
}) {
  const supabase = await createServer();

  // Fetch the subject details
  const { data: subject } = await supabase
    .from("subjects")
    .select("name")
    .eq("id", params.subjectId)
    .single();

  if (!subject) {
    notFound(); // If subject doesn't exist, show a 404 page
  }

  // Fetch all questions for this subject, along with their options
  const { data: questions } = await supabase
    .from("questions")
    .select("id, statement, options (id, option_text, is_correct)")
    .eq("subject_id", params.subjectId);

  return (
    <div>
      <h1 className="text-3xl font-bold">Practice: {subject.name}</h1>
      <p className="mt-2 text-muted-foreground">
        Here are the questions we loaded for this session.
      </p>
      
      {/* This is a temporary way to display the data we fetched.
        In the next step, we will replace this with the actual quiz UI.
      */}
      <pre className="mt-6 p-4 bg-secondary rounded-md overflow-x-auto">
        {JSON.stringify(questions, null, 2)}
      </pre>
    </div>
  );
}