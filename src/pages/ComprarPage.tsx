import { useState } from 'react'
import { RotateCcw, ShoppingBasket } from 'lucide-react'

import { ItemComprarRow } from '@/components/ItemComprarRow'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import type { useShoppingList } from '@/hooks/useShoppingList'

interface ComprarPageProps {
  list: ReturnType<typeof useShoppingList>
}

export function ComprarPage({ list }: ComprarPageProps) {
  const { itensParaComprar, progresso, toggleComprado, resetarCompras } = list
  const [confirmarReset, setConfirmarReset] = useState(false)

  const pendentes = itensParaComprar.filter((it) => !it.comprado)
  const comprados = itensParaComprar.filter((it) => it.comprado)

  if (itensParaComprar.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <ShoppingBasket className="h-10 w-10 text-muted-foreground" />
        <p className="max-w-[22rem] text-sm text-muted-foreground">
          Nenhum item marcado para comprar ainda. Vá em <strong>Planejar</strong> e defina as
          quantidades deste mês.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {progresso.comprados} de {progresso.total} comprados
            </p>
            <p className="text-sm text-muted-foreground">{progresso.percentual}%</p>
          </div>
          <Progress value={progresso.percentual} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-2">
          {pendentes.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Tudo comprado! 🎉
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {pendentes.map((item) => (
                <ItemComprarRow key={item.id} item={item} onToggle={toggleComprado} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {comprados.length > 0 ? (
        <Card>
          <CardContent className="p-2">
            <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Comprados ({comprados.length})
            </p>
            <ul className="divide-y divide-border">
              {comprados.map((item) => (
                <ItemComprarRow key={item.id} item={item} onToggle={toggleComprado} />
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Button
        variant="outline"
        className="mt-2"
        onClick={() => setConfirmarReset(true)}
      >
        <RotateCcw className="h-4 w-4" />
        Nova Feira
      </Button>

      <Dialog open={confirmarReset} onOpenChange={setConfirmarReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Começar uma nova feira?</DialogTitle>
            <DialogDescription>
              Isso desmarca todos os itens comprados para você começar a próxima compra do zero.
              As quantidades definidas em Planejar não são alteradas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarReset(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                resetarCompras()
                setConfirmarReset(false)
              }}
            >
              Sim, começar nova feira
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
