import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="w-full py-20 md:py-32">
      <div className="container mx-auto text-center px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Estude de forma inteligente.{" "}
            <span className="bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              Passe mais rápido.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Oslo é a plataforma definitiva para quem busca a aprovação. Crie
            questões, pratique com simulados, revise seus erros de forma
            classificada e construa seu caderno de anotações digital.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/login">
              <Button size="lg">
                Começar a praticar gratuitamente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
); }