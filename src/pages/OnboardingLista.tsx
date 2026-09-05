import { useState } from 'react'
import { Loader2, ShoppingBasket } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { StatusLista } from '@/hooks/useLista'

interface OnboardingListaProps {
  status: StatusLista
  erro: string | null
  onCriar: () => void
  onEntrar: (codigo: string) => void
}

export function OnboardingLista({ status, erro, onCriar, onEntrar }: OnboardingListaProps) {
  const [codigo, setCodigo] = useState('')
  const carregando = status === 'conectando'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (codigo.trim()) onEntrar(codigo)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-xs flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <ShoppingBasket className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Lista da Feira</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compartilhe uma lista de compras entre celulares — as mudanças aparecem para todo mundo
            na hora.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button onClick={onCriar} disabled={carregando} className="w-full">
            {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Criar uma lista nova
          </Button>

          <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <Input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Código da lista (ex: 7F3K9P)"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect="off"
              className="text-center text-base font-semibold tracking-widest"
              disabled={carregando}
            />
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={carregando || !codigo.trim()}
            >
              {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Entrar com o código
            </Button>
          </form>
        </div>

        {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
      </div>
    </div>
  )
}
