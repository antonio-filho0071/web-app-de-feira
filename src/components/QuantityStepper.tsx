import { Minus, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export function QuantityStepper({ value, onChange, className }: QuantityStepperProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        aria-label="Diminuir quantidade"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors active:scale-95 disabled:opacity-40"
        disabled={value <= 0}
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => {
          const n = e.target.valueAsNumber
          onChange(Number.isNaN(n) ? 0 : n)
        }}
        onFocus={(e) => e.target.select()}
        className="h-9 w-11 shrink-0 rounded-md border border-input bg-background text-center text-sm font-medium tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Aumentar quantidade"
        onClick={() => onChange(value + 1)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors active:scale-95"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
