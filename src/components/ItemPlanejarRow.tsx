import { Trash2 } from 'lucide-react'

import { QuantityStepper } from '@/components/QuantityStepper'
import { Input } from '@/components/ui/input'
import type { ItemFeira } from '@/types'

interface ItemPlanejarRowProps {
  item: ItemFeira
  onQuantidadeChange: (id: string, quantidade: number) => void
  onObservacaoChange: (id: string, observacao: string) => void
  onRemover?: (id: string) => void
}

export function ItemPlanejarRow({
  item,
  onQuantidadeChange,
  onObservacaoChange,
  onRemover,
}: ItemPlanejarRowProps) {
  return (
    <li className="flex flex-col gap-2 border-b border-border py-3 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[15px] leading-snug text-foreground">
          {item.nome}
        </span>
        <QuantityStepper
          value={item.quantidade}
          onChange={(q) => onQuantidadeChange(item.id, q)}
        />
        {onRemover ? (
          <button
            type="button"
            aria-label={`Remover ${item.nome}`}
            onClick={() => onRemover(item.id)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {item.quantidade > 0 ? (
        <Input
          value={item.observacao}
          onChange={(e) => onObservacaoChange(item.id, e.target.value)}
          placeholder="Observação (opcional)"
          className="h-8 text-xs"
        />
      ) : null}
    </li>
  )
}
