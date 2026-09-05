import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { CATALOGO_INICIAL, OUTROS_INICIAL } from '@/data/catalogo'
import { carregarEstado, salvarEstado } from '@/lib/storage'
import type { EstadoPersistido, ItemFeira } from '@/types'

type CatalogoOverrides = EstadoPersistido['catalogo']

function estadoInicial(): { catalogo: CatalogoOverrides; outros: ItemFeira[] } {
  const salvo = carregarEstado()

  const catalogo: CatalogoOverrides = {}
  for (const item of CATALOGO_INICIAL) {
    const override = salvo?.catalogo[item.id]
    catalogo[item.id] = override ?? {
      quantidade: item.quantidadeInicial,
      observacao: item.observacaoInicial ?? '',
      comprado: false,
    }
  }

  const outros: ItemFeira[] =
    salvo?.outros ??
    OUTROS_INICIAL.map((item) => ({
      id: item.id,
      nome: item.nome,
      quantidade: item.quantidadeInicial,
      observacao: item.observacaoInicial ?? '',
      comprado: false,
      fixo: false,
    }))

  return { catalogo, outros }
}

function gerarId() {
  return `outro-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function useShoppingList() {
  const inicial = useMemo(() => estadoInicial(), [])
  const [catalogoOverrides, setCatalogoOverrides] = useState<CatalogoOverrides>(inicial.catalogo)
  const [outros, setOutros] = useState<ItemFeira[]>(inicial.outros)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      salvarEstado({
        versao: 2,
        catalogo: catalogoOverrides,
        outros,
        atualizadoEm: new Date().toISOString(),
      })
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [catalogoOverrides, outros])

  const itensCatalogo: ItemFeira[] = useMemo(
    () =>
      CATALOGO_INICIAL.map((base) => {
        const o = catalogoOverrides[base.id]
        return {
          id: base.id,
          nome: base.nome,
          quantidade: o?.quantidade ?? base.quantidadeInicial,
          observacao: o?.observacao ?? '',
          comprado: o?.comprado ?? false,
          fixo: true,
        }
      }),
    [catalogoOverrides],
  )

  const todosItens: ItemFeira[] = useMemo(
    () => [...itensCatalogo, ...outros],
    [itensCatalogo, outros],
  )

  const setQuantidade = useCallback((id: string, quantidade: number) => {
    const q = Number.isFinite(quantidade) ? Math.max(0, Math.round(quantidade)) : 0
    setCatalogoOverrides((prev) => {
      if (!(id in prev)) return prev
      return { ...prev, [id]: { ...prev[id], quantidade: q } }
    })
    setOutros((prev) => prev.map((it) => (it.id === id ? { ...it, quantidade: q } : it)))
  }, [])

  const setObservacao = useCallback((id: string, observacao: string) => {
    setCatalogoOverrides((prev) => {
      if (!(id in prev)) return prev
      return { ...prev, [id]: { ...prev[id], observacao } }
    })
    setOutros((prev) => prev.map((it) => (it.id === id ? { ...it, observacao } : it)))
  }, [])

  const toggleComprado = useCallback((id: string, valor?: boolean) => {
    setCatalogoOverrides((prev) => {
      if (!(id in prev)) return prev
      const novo = valor ?? !prev[id].comprado
      return { ...prev, [id]: { ...prev[id], comprado: novo } }
    })
    setOutros((prev) =>
      prev.map((it) => (it.id === id ? { ...it, comprado: valor ?? !it.comprado } : it)),
    )
  }, [])

  const adicionarOutro = useCallback((nome: string, quantidade = 1) => {
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) return
    setOutros((prev) => [
      ...prev,
      {
        id: gerarId(),
        nome: nomeLimpo,
        quantidade: Math.max(0, Math.round(quantidade)) || 1,
        observacao: '',
        comprado: false,
        fixo: false,
      },
    ])
  }, [])

  const removerOutro = useCallback((id: string) => {
    setOutros((prev) => prev.filter((it) => it.id !== id))
  }, [])

  const resetarCompras = useCallback(() => {
    setCatalogoOverrides((prev) => {
      const novo: CatalogoOverrides = {}
      for (const [id, v] of Object.entries(prev)) novo[id] = { ...v, comprado: false }
      return novo
    })
    setOutros((prev) => prev.map((it) => ({ ...it, comprado: false })))
  }, [])

  const itensParaComprar = useMemo(
    () =>
      todosItens
        .filter((it) => it.quantidade > 0)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [todosItens],
  )

  const progresso = useMemo(() => {
    const total = itensParaComprar.length
    const comprados = itensParaComprar.filter((it) => it.comprado).length
    return { total, comprados, percentual: total === 0 ? 0 : Math.round((comprados / total) * 100) }
  }, [itensParaComprar])

  return {
    itensCatalogo,
    itensOutros: outros,
    itensParaComprar,
    progresso,
    setQuantidade,
    setObservacao,
    toggleComprado,
    adicionarOutro,
    removerOutro,
    resetarCompras,
  }
}
