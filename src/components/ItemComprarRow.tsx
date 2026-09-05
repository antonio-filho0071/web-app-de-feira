import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ItemFeira } from '@/types'

interface ItemComprarRowProps {
  item: ItemFeira
  onToggle: (id: string) => void
}

export function ItemComprarRow({ item, onToggle }: ItemComprarRowProps) {
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={item.comprado}
        onClick={() => onToggle(item.id)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors active:bg-secondary',
        )}
      >
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            item.comprado
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-background',
          )}
        >
          {item.comprado ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block truncate text-[15px] leading-snug',
              item.comprado ? 'text-muted-foreground line-through' : 'text-foreground',
            )}
          >
            {item.nome}
          </span>
          {item.observacao ? (
            <span className="block truncate text-xs text-muted-foreground">
              {item.observacao}
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold tabular-nums text-secondary-foreground',
            item.comprado && 'opacity-60',
          )}
        >
          {item.quantidade}
        </span>
      </button>
    </li>
  )
}
