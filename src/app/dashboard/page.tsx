import { createServer } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-3xl font-bold">Painel do Estudante</h1>
      <p className="mt-2">Olá, {user?.email}!</p>
      <p className="mt-4">
        Seja bem-vindo. Aqui você poderá ver suas estatísticas, matérias e muito
        mais.
      </p>
    </div>
); }