import { Check, CloudOff, Loader2, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { StatusSincronizacao } from '@/types'

const CONFIG: Record<
  Exclude<StatusSincronizacao, 'local'>,
  { texto: string; icone: React.ReactNode; classe: string }
> = {
  sincronizado: {
    texto: 'Sincronizado',
    icone: <Check className="h-3.5 w-3.5" />,
    classe: 'text-primary',
  },
  sincronizando: {
    texto: 'Sincronizando…',
    icone: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    classe: 'text-muted-foreground',
  },
  offline: {
    texto: 'Sem internet — salvo neste aparelho',
    icone: <CloudOff className="h-3.5 w-3.5" />,
    classe: 'text-muted-foreground',
  },
  erro: {
    texto: 'Não sincronizou — tentando de novo',
    icone: <TriangleAlert className="h-3.5 w-3.5" />,
    classe: 'text-destructive',
  },
}

export function SyncBadge({ status }: { status: StatusSincronizacao }) {
  if (status === 'local') return null
  const cfg = CONFIG[status]
  return (
    <span className={cn('flex items-center gap-1 text-xs font-medium', cfg.classe)}>
      {cfg.icone}
      <span className="hidden sm:inline">{cfg.texto}</span>
    </span>
  )
}
