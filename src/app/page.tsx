import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    // Container principal para centralizar o conteúdo vertical e horizontalmente
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      
      {/* Título principal */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in-down">
        Bem-vindo à sua Plataforma de Estudos
      </h1>

      {/* Parágrafo de descrição */}
      <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in-up">
        Onde a preparação encontra a tecnologia. Crie, responda e revise questões de forma inteligente para alcançar a sua aprovação.
      </p>

      {/* Botão de Call to Action */}
      <Link href="/login">
        <Button size="lg" className="animate-pulse">
          Começar Agora
        </Button>
      </Link>
      
    </div>
  );
}