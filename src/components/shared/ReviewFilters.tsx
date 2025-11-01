'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label'

type FilterProps = {
  subjects: { id: string; name: string }[]
}

export default function ReviewFilters({ subjects }: FilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleFilterChange = (type: 'subject' | 'errorType', value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (!value || value === 'all') {
      current.delete(type);
    } else {
      current.set(type, value);
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex flex-col lg:flex-row gap-6 lg:justify-between p-6 bg-card rounded-2xl border shadow-sm transition-all duration-300">
        
        {/* Filtro por Matéria */}
        <div className="space-y-3">
          <Label 
            htmlFor="subject-filter" 
            className="text-sm font-medium text-foreground flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            Filtrar por Matéria
          </Label>
          <Select 
            onValueChange={(value) => handleFilterChange('subject', value)} 
            defaultValue={searchParams.get('subject') || 'all'}
          >
            <SelectTrigger 
              id="subject-filter"
              className="h-12 bg-background border hover:border-blue-400 transition-colors duration-200 rounded-xl shadow-sm"
            >
              <SelectValue placeholder="Selecione a matéria" />
            </SelectTrigger>

            <SelectContent className="rounded-xl border shadow-lg">
              <SelectItem value="all" className="rounded-lg hover:bg-accent">
                <span className="text-muted-foreground">Todas as Matérias</span>
              </SelectItem>
              {subjects.map(subject => (
                <SelectItem 
                  key={subject.id} 
                  value={subject.id}
                  className="rounded-lg hover:bg-accent transition-colors"
                >
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por Tipo de Erro */}
        <div className="space-y-3">
          <Label 
            htmlFor="error-filter" 
            className="text-sm font-medium text-foreground flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            Filtrar por Erro
          </Label>
          <Select 
            onValueChange={(value) => handleFilterChange('errorType', value)} 
            defaultValue={searchParams.get('errorType') || 'all'}
          >
            <SelectTrigger 
              id="error-filter" 
              className="h-12 bg-background border hover:border-amber-400 transition-colors duration-200 rounded-xl shadow-sm"
            >
              <SelectValue placeholder="Selecione o tipo de erro" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border shadow-lg">
              <SelectItem value="all" className="rounded-lg hover:bg-accent">
                <span className="text-muted-foreground">Todos os Erros</span>
              </SelectItem>
              <SelectItem value="attention" className="rounded-lg hover:bg-accent">
                Falta de Cautela
              </SelectItem>
              <SelectItem value="knowledge" className="rounded-lg hover:bg-accent">
                Falta de Conhecimento
              </SelectItem>
              <SelectItem value="unclassified" className="rounded-lg hover:bg-accent">
                Sem Classificação
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>
    </div>
) }