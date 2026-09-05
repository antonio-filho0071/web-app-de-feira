import { useState } from 'react'
import { Check, Copy, LogOut, Share2, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ListaMenuProps {
  codigo: string
  onSair: () => void
}

export function ListaMenu({ codigo, onSair }: ListaMenuProps) {
  const [aberto, setAberto] = useState(false)
  const [confirmarSaida, setConfirmarSaida] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      // sem permissão de clipboard: a usuária pode copiar manualmente o texto exibido
    }
  }

  async function compartilhar() {
    const texto = `Entra na nossa lista de compras! Abre o app e digita o código: ${codigo}`
    if (navigator.share) {
      try {
        await navigator.share({ text: texto })
      } catch {
        // usuária cancelou o compartilhamento — sem problema
      }
    } else {
      await copiarCodigo()
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Compartilhar lista"
        onClick={() => setAberto(true)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Users className="h-5 w-5" />
      </button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar lista</DialogTitle>
            <DialogDescription>
              Quem digitar este código no app vê e edita a mesma lista, em tempo real.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center rounded-lg border border-border bg-secondary py-4">
            <span className="text-3xl font-bold tracking-[0.3em] text-foreground">{codigo}</span>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <Button onClick={compartilhar} className="w-full">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
            <Button variant="outline" onClick={copiarCodigo} className="w-full">
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiado ? 'Copiado!' : 'Copiar código'}
            </Button>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            {confirmarSaida ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  Sair desconecta este aparelho da lista (os dados continuam salvos na nuvem).
                  Tem certeza?
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmarSaida(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={onSair}>
                    Sair
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-destructive"
                onClick={() => setConfirmarSaida(true)}
              >
                <LogOut className="h-4 w-4" />
                Sair desta lista
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
