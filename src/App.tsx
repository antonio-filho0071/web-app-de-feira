import { ClipboardList, Loader2, ShoppingCart } from 'lucide-react'

import { ListaMenu } from '@/components/ListaMenu'
import { SyncBadge } from '@/components/SyncBadge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLista } from '@/hooks/useLista'
import { useShoppingList, type ListaAtiva } from '@/hooks/useShoppingList'
import { supabaseConfigurado } from '@/lib/supabaseClient'
import { ComprarPage } from '@/pages/ComprarPage'
import { OnboardingLista } from '@/pages/OnboardingLista'
import { PlanejarPage } from '@/pages/PlanejarPage'

function AppShell({ lista, onSair }: { lista: ListaAtiva | null; onSair?: () => void }) {
  const list = useShoppingList(lista)

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 pt-safe-top backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex max-w-lg items-center justify-between gap-2 py-3">
          <h1 className="text-lg font-bold tracking-tight text-foreground">Lista da Feira</h1>
          <div className="flex items-center gap-2">
            <SyncBadge status={list.statusSincronizacao} />
            {lista && onSair ? <ListaMenu codigo={lista.codigo} onSair={onSair} /> : null}
          </div>
        </div>
      </header>

      <main className="container max-w-lg pb-safe-bottom pt-4">
        <Tabs defaultValue="planejar">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="planejar" className="gap-1.5">
              <ClipboardList className="h-4 w-4" />
              Planejar
            </TabsTrigger>
            <TabsTrigger value="comprar" className="gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              Comprar
            </TabsTrigger>
          </TabsList>
          <TabsContent value="planejar">
            <PlanejarPage list={list} />
          </TabsContent>
          <TabsContent value="comprar">
            <ComprarPage list={list} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function App() {
  const { status, lista, erro, criar, entrar, sair } = useLista()

  if (!supabaseConfigurado) {
    return <AppShell key="local" lista={null} />
  }

  if (status === 'carregando') {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status === 'sem-lista' || status === 'conectando' || status === 'erro') {
    return <OnboardingLista status={status} erro={erro} onCriar={criar} onEntrar={entrar} />
  }

  return <AppShell key={lista?.id ?? 'sem-lista'} lista={lista} onSair={sair} />
}

export default App
