import { ClipboardList, ShoppingCart } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useShoppingList } from '@/hooks/useShoppingList'
import { ComprarPage } from '@/pages/ComprarPage'
import { PlanejarPage } from '@/pages/PlanejarPage'

function App() {
  const list = useShoppingList()

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 pt-safe-top backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container max-w-lg py-3">
          <h1 className="text-lg font-bold tracking-tight text-foreground">Lista da Feira</h1>
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

export default App
