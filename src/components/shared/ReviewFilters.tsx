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
    <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-card rounded-lg border">
      <div className="grid gap-2 flex-1">
        <Label htmlFor="subject-filter">Filtrar por Matéria</Label>
        <Select onValueChange={(value) => handleFilterChange('subject', value)} defaultValue={searchParams.get('subject') || 'all'}>
          <SelectTrigger id="subject-filter">
            <SelectValue placeholder="Selecione a matéria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Matérias</SelectItem>
            {subjects.map(subject => (
              <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2 flex-1">
        <Label htmlFor="error-filter">Filtrar por Tipo de Erro</Label>
        <Select onValueChange={(value) => handleFilterChange('errorType', value)} defaultValue={searchParams.get('errorType') || 'all'}>
          <SelectTrigger id="error-filter">
            <SelectValue placeholder="Selecione o tipo de erro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Erros</SelectItem>
            <SelectItem value="attention">Falta de Atenção</SelectItem>
            <SelectItem value="knowledge">Falta de Conhecimento</SelectItem>
            <SelectItem value="unclassified">Não Classificado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
) }