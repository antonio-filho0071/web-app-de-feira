import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

import { AddOutroForm } from '@/components/AddOutroForm'
import { ItemPlanejarRow } from '@/components/ItemPlanejarRow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { normalizarTexto } from '@/lib/normalize'
import type { useShoppingList } from '@/hooks/useShoppingList'
import type { ItemFeira } from '@/types'

interface PlanejarPageProps {
  list: ReturnType<typeof useShoppingList>
}

function ordenarPorNome(itens: ItemFeira[]) {
  return [...itens].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export function PlanejarPage({ list }: PlanejarPageProps) {
  const [busca, setBusca] = useState('')
  const {
    itensCatalogo,
    itensOutros,
    setQuantidade,
    setObservacao,
    adicionarOutro,
    removerOutro,
  } = list

  const buscaNormalizada = normalizarTexto(busca)

  const catalogoFiltrado = useMemo(() => {
    const ordenado = ordenarPorNome(itensCatalogo)
    if (!buscaNormalizada) return ordenado
    return ordenado.filter((it) => normalizarTexto(it.nome).includes(buscaNormalizada))
  }, [itensCatalogo, buscaNormalizada])

  const outrosFiltrados = useMemo(() => {
    const ordenado = ordenarPorNome(itensOutros)
    if (!buscaNormalizada) return ordenado
    return ordenado.filter((it) => normalizarTexto(it.nome).includes(buscaNormalizada))
  }, [itensOutros, buscaNormalizada])

  const selecionados = itensCatalogo.filter((it) => it.quantidade > 0).length + itensOutros.filter((it) => it.quantidade > 0).length

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar item..."
          className="pl-9 pr-9"
          aria-label="Buscar item"
        />
        {busca ? (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => setBusca('')}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        {selecionados} {selecionados === 1 ? 'item marcado' : 'itens marcados'} para comprar este mês
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catálogo</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {catalogoFiltrado.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum item encontrado.
            </p>
          ) : (
            <ul>
              {catalogoFiltrado.map((item) => (
                <ItemPlanejarRow
                  key={item.id}
                  item={item}
                  onQuantidadeChange={setQuantidade}
                  onObservacaoChange={setObservacao}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outros</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {outrosFiltrados.length === 0 && !busca ? (
            <p className="py-2 text-sm text-muted-foreground">
              Nenhum item ainda. Adicione abaixo.
            </p>
          ) : outrosFiltrados.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum item encontrado.
            </p>
          ) : (
            <ul>
              {outrosFiltrados.map((item) => (
                <ItemPlanejarRow
                  key={item.id}
                  item={item}
                  onQuantidadeChange={setQuantidade}
                  onObservacaoChange={setObservacao}
                  onRemover={removerOutro}
                />
              ))}
            </ul>
          )}
          {!busca ? <AddOutroForm onAdicionar={adicionarOutro} /> : null}
        </CardContent>
      </Card>
    </div>
  )
}
