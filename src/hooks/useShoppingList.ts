import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { CATALOGO_INICIAL, OUTROS_INICIAL } from '@/data/catalogo'
import {
  adicionarItemOutro,
  atualizarItemOutro,
  obterLista,
  removerItemOutro,
  resetarComprasRemoto,
  upsertItemCatalogo,
  type EstadoRemoto,
} from '@/lib/listaApi'
import { carregarEstadoNuvem, salvarEstadoNuvem } from '@/lib/storage'
import { supabase, supabaseConfigurado } from '@/lib/supabaseClient'
import type {
  CatalogoLocalOverride,
  ItemFeira,
  OutroLocalNuvem,
  StatusSincronizacao,
} from '@/types'

export interface ListaAtiva {
  id: string
  codigo: string
}

const TEMP_PREFIX = 'temp-'

function ehTemporario(id: string) {
  return id.startsWith(TEMP_PREFIX)
}

function gerarIdTemporario() {
  return `${TEMP_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Compara dois timestamps ISO e diz se `a` é mais recente que `b`. Não dá
 * para comparar como texto puro: o Postgres emite timestamps com até 6
 * dígitos de fração de segundo (ex: "...410500+00:00") enquanto o
 * `Date.toISOString()` do JavaScript sempre usa 3 dígitos e termina em "Z"
 * (ex: "...410Z") — comparar essas strings caractere a caractere pode dar
 * resultado errado bem perto do limite entre os dois formatos.
 */
function ehMaisRecente(a: string, b: string): boolean {
  return new Date(a).getTime() > new Date(b).getTime()
}

function estadoCatalogoInicial(): Record<string, CatalogoLocalOverride> {
  const catalogo: Record<string, CatalogoLocalOverride> = {}
  for (const item of CATALOGO_INICIAL) {
    catalogo[item.id] = {
      quantidade: item.quantidadeInicial,
      observacao: item.observacaoInicial ?? '',
      comprado: false,
      atualizadoEm: null,
      sincronizado: true,
    }
  }
  return catalogo
}

function estadoOutrosInicial(comSementeLocal: boolean): OutroLocalNuvem[] {
  if (!comSementeLocal) return []
  return OUTROS_INICIAL.map((item) => ({
    id: item.id,
    nome: item.nome,
    quantidade: item.quantidadeInicial,
    observacao: item.observacaoInicial ?? '',
    comprado: false,
    atualizadoEm: new Date(0).toISOString(),
    sincronizado: true,
    remoto: false,
    fixo: false,
  }))
}

export function useShoppingList(lista: ListaAtiva | null) {
  const chave = lista?.id ?? 'local'
  const modoNuvem = Boolean(lista && supabaseConfigurado && supabase)

  const inicial = useMemo(() => {
    const salvo = carregarEstadoNuvem(chave)
    if (salvo) return salvo
    return {
      versao: 1 as const,
      catalogo: estadoCatalogoInicial(),
      outros: estadoOutrosInicial(!modoNuvem),
      remocoesPendentes: [] as string[],
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [catalogo, setCatalogo] = useState(inicial.catalogo)
  const [outros, setOutros] = useState(inicial.outros)
  const [remocoesPendentes, setRemocoesPendentes] = useState(inicial.remocoesPendentes)
  const [statusRede, setStatusRede] = useState<'ocioso' | 'sincronizando' | 'erro'>('ocioso')
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  // Sempre acessível dentro de callbacks/efeitos sem precisar recriá-los a
  // cada mudança de estado (evita closures presas em valores antigos).
  const estadoRef = useRef({ catalogo, outros, remocoesPendentes })
  estadoRef.current = { catalogo, outros, remocoesPendentes }

  // ---------------------------------------------------------------------
  // Persistência local (cache offline-first)
  // ---------------------------------------------------------------------
  const salvarRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (salvarRef.current) clearTimeout(salvarRef.current)
    salvarRef.current = setTimeout(() => {
      salvarEstadoNuvem(chave, { versao: 1, catalogo, outros, remocoesPendentes })
    }, 250)
    return () => {
      if (salvarRef.current) clearTimeout(salvarRef.current)
    }
  }, [chave, catalogo, outros, remocoesPendentes])

  // ---------------------------------------------------------------------
  // Rede: acompanha online/offline
  // ---------------------------------------------------------------------
  useEffect(() => {
    function aoFicarOnline() {
      setOnline(true)
    }
    function aoFicarOffline() {
      setOnline(false)
    }
    window.addEventListener('online', aoFicarOnline)
    window.addEventListener('offline', aoFicarOffline)
    return () => {
      window.removeEventListener('online', aoFicarOnline)
      window.removeEventListener('offline', aoFicarOffline)
    }
  }, [])

  // ---------------------------------------------------------------------
  // Envio (flush) das mudanças pendentes para o Supabase
  // ---------------------------------------------------------------------
  const enviandoRef = useRef(false)

  const flush = useCallback(async () => {
    if (!modoNuvem || !lista || enviandoRef.current) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    const { catalogo: catAtual, outros: outAtual, remocoesPendentes: remAtual } = estadoRef.current
    const pendencias =
      Object.values(catAtual).some((i) => !i.sincronizado) ||
      outAtual.some((i) => !i.sincronizado) ||
      remAtual.length > 0
    if (!pendencias) return

    enviandoRef.current = true
    setStatusRede('sincronizando')
    let houveErro = false

    try {
      for (const [itemId, item] of Object.entries(estadoRef.current.catalogo)) {
        if (item.sincronizado) continue
        try {
          await upsertItemCatalogo(lista.codigo, itemId, item.quantidade, item.observacao, item.comprado)
          setCatalogo((prev) =>
            prev[itemId] === item ? { ...prev, [itemId]: { ...item, sincronizado: true } } : prev,
          )
        } catch {
          houveErro = true
        }
      }

      for (const item of estadoRef.current.outros) {
        if (item.sincronizado) continue
        try {
          if (!item.remoto || ehTemporario(item.id)) {
            const novoId = await adicionarItemOutro(lista.codigo, item.nome, item.quantidade)
            if (item.observacao || item.comprado) {
              await atualizarItemOutro(lista.codigo, novoId, item.quantidade, item.observacao, item.comprado)
            }
            setOutros((prev) =>
              prev.map((it) =>
                it.id === item.id ? { ...it, id: novoId, remoto: true, sincronizado: true } : it,
              ),
            )
          } else {
            await atualizarItemOutro(lista.codigo, item.id, item.quantidade, item.observacao, item.comprado)
            setOutros((prev) =>
              prev.map((it) => (it.id === item.id ? { ...it, sincronizado: true } : it)),
            )
          }
        } catch {
          houveErro = true
        }
      }

      for (const id of estadoRef.current.remocoesPendentes) {
        try {
          await removerItemOutro(lista.codigo, id)
          setRemocoesPendentes((prev) => prev.filter((r) => r !== id))
        } catch {
          houveErro = true
        }
      }
    } finally {
      enviandoRef.current = false
      setStatusRede(houveErro ? 'erro' : 'ocioso')
    }
  }, [modoNuvem, lista])

  const flushDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const agendarFlush = useCallback(() => {
    if (flushDebounceRef.current) clearTimeout(flushDebounceRef.current)
    flushDebounceRef.current = setTimeout(() => {
      void flush()
    }, 400)
  }, [flush])

  useEffect(() => {
    if (!modoNuvem) return
    void flush()
    const intervalo = setInterval(() => void flush(), 20000)
    window.addEventListener('online', flush)
    return () => {
      clearInterval(intervalo)
      window.removeEventListener('online', flush)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoNuvem])

  // ---------------------------------------------------------------------
  // Recebimento (pull + merge) do estado remoto
  // ---------------------------------------------------------------------
  const aplicarEstadoRemoto = useCallback((remoto: EstadoRemoto) => {
    setCatalogo((prevCatalogo) => {
      const novo = { ...prevCatalogo }
      for (const linha of remoto.catalogo) {
        const local = novo[linha.item_id]
        if (!local) continue
        if (local.atualizadoEm === null || ehMaisRecente(linha.atualizado_em, local.atualizadoEm)) {
          novo[linha.item_id] = {
            quantidade: linha.quantidade,
            observacao: linha.observacao,
            comprado: linha.comprado,
            atualizadoEm: linha.atualizado_em,
            sincronizado: true,
          }
        }
      }
      return novo
    })

    setOutros((prevOutros) => {
      const remotosPorId = new Map(remoto.outros.map((o) => [o.id, o]))
      const localPorId = new Map(prevOutros.map((o) => [o.id, o]))

      const resultado: OutroLocalNuvem[] = []

      // Atualiza ou mantém itens que já existem localmente.
      for (const local of prevOutros) {
        const remotoCorrespondente = remotosPorId.get(local.id)
        if (!remotoCorrespondente) {
          // Não existe mais no servidor: ou é uma criação local ainda não
          // sincronizada (mantém), ou foi removido em outro aparelho (descarta).
          if (!local.remoto || ehTemporario(local.id)) resultado.push(local)
          continue
        }
        if (!local.sincronizado || ehMaisRecente(remotoCorrespondente.atualizado_em, local.atualizadoEm)) {
          resultado.push(
            local.sincronizado
              ? {
                  id: remotoCorrespondente.id,
                  nome: remotoCorrespondente.nome,
                  quantidade: remotoCorrespondente.quantidade,
                  observacao: remotoCorrespondente.observacao,
                  comprado: remotoCorrespondente.comprado,
                  atualizadoEm: remotoCorrespondente.atualizado_em,
                  sincronizado: true,
                  remoto: true,
                  fixo: false,
                }
              : local,
          )
        } else {
          resultado.push(local)
        }
      }

      // Adiciona itens novos vindos de outro aparelho.
      for (const remotoItem of remoto.outros) {
        if (!localPorId.has(remotoItem.id)) {
          resultado.push({
            id: remotoItem.id,
            nome: remotoItem.nome,
            quantidade: remotoItem.quantidade,
            observacao: remotoItem.observacao,
            comprado: remotoItem.comprado,
            atualizadoEm: remotoItem.atualizado_em,
            sincronizado: true,
            remoto: true,
            fixo: false,
          })
        }
      }

      return resultado
    })
  }, [])

  const pull = useCallback(async () => {
    if (!modoNuvem || !lista) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    try {
      const remoto = await obterLista(lista.codigo)
      aplicarEstadoRemoto(remoto)
      setStatusRede((s) => (s === 'sincronizando' ? s : 'ocioso'))
    } catch {
      setStatusRede('erro')
    }
  }, [modoNuvem, lista, aplicarEstadoRemoto])

  // Primeira carga + fallback periódico + ao voltar para a aba/app.
  useEffect(() => {
    if (!modoNuvem) return
    void pull()
    const intervalo = setInterval(() => void pull(), 30000)
    function aoFicarVisivel() {
      if (document.visibilityState === 'visible') void pull()
    }
    document.addEventListener('visibilitychange', aoFicarVisivel)
    window.addEventListener('online', pull)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', aoFicarVisivel)
      window.removeEventListener('online', pull)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoNuvem])

  // Tempo real: qualquer mudança nas tabelas desta lista dispara um novo pull.
  useEffect(() => {
    const client = supabase
    if (!modoNuvem || !lista || !client) return
    const canal = client
      .channel(`lista-${lista.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'itens_catalogo', filter: `lista_id=eq.${lista.id}` },
        () => void pull(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'itens_outros', filter: `lista_id=eq.${lista.id}` },
        () => void pull(),
      )
      .subscribe()

    return () => {
      void client.removeChannel(canal)
    }
  }, [modoNuvem, lista, pull])

  // ---------------------------------------------------------------------
  // Ações (mutações locais otimistas + agendamento de envio)
  // ---------------------------------------------------------------------
  const itensCatalogo: ItemFeira[] = useMemo(
    () =>
      CATALOGO_INICIAL.map((base) => {
        const o = catalogo[base.id]
        return {
          id: base.id,
          nome: base.nome,
          quantidade: o?.quantidade ?? base.quantidadeInicial,
          observacao: o?.observacao ?? '',
          comprado: o?.comprado ?? false,
          fixo: true,
        }
      }),
    [catalogo],
  )

  const todosItens: ItemFeira[] = useMemo(
    () => [...itensCatalogo, ...outros],
    [itensCatalogo, outros],
  )

  const setQuantidade = useCallback(
    (id: string, quantidade: number) => {
      const q = Number.isFinite(quantidade) ? Math.max(0, Math.round(quantidade)) : 0
      const agora = new Date().toISOString()
      setCatalogo((prev) => {
        if (!(id in prev)) return prev
        return { ...prev, [id]: { ...prev[id], quantidade: q, atualizadoEm: agora, sincronizado: false } }
      })
      setOutros((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, quantidade: q, atualizadoEm: agora, sincronizado: false } : it,
        ),
      )
      agendarFlush()
    },
    [agendarFlush],
  )

  const setObservacao = useCallback(
    (id: string, observacao: string) => {
      const agora = new Date().toISOString()
      setCatalogo((prev) => {
        if (!(id in prev)) return prev
        return { ...prev, [id]: { ...prev[id], observacao, atualizadoEm: agora, sincronizado: false } }
      })
      setOutros((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, observacao, atualizadoEm: agora, sincronizado: false } : it,
        ),
      )
      agendarFlush()
    },
    [agendarFlush],
  )

  const toggleComprado = useCallback(
    (id: string, valor?: boolean) => {
      const agora = new Date().toISOString()
      setCatalogo((prev) => {
        if (!(id in prev)) return prev
        const novo = valor ?? !prev[id].comprado
        return { ...prev, [id]: { ...prev[id], comprado: novo, atualizadoEm: agora, sincronizado: false } }
      })
      setOutros((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, comprado: valor ?? !it.comprado, atualizadoEm: agora, sincronizado: false }
            : it,
        ),
      )
      agendarFlush()
    },
    [agendarFlush],
  )

  const adicionarOutro = useCallback(
    (nome: string, quantidade = 1) => {
      const nomeLimpo = nome.trim()
      if (!nomeLimpo) return
      setOutros((prev) => [
        ...prev,
        {
          id: gerarIdTemporario(),
          nome: nomeLimpo,
          quantidade: Math.max(0, Math.round(quantidade)) || 1,
          observacao: '',
          comprado: false,
          atualizadoEm: new Date().toISOString(),
          sincronizado: false,
          remoto: false,
          fixo: false,
        },
      ])
      agendarFlush()
    },
    [agendarFlush],
  )

  const removerOutro = useCallback(
    (id: string) => {
      setOutros((prev) => {
        const item = prev.find((it) => it.id === id)
        if (item?.remoto && !ehTemporario(id)) {
          setRemocoesPendentes((r) => (r.includes(id) ? r : [...r, id]))
        }
        return prev.filter((it) => it.id !== id)
      })
      agendarFlush()
    },
    [agendarFlush],
  )

  const resetarCompras = useCallback(() => {
    const agora = new Date().toISOString()
    setCatalogo((prev) => {
      const novo: typeof prev = {}
      for (const [id, v] of Object.entries(prev)) {
        novo[id] = v.comprado ? { ...v, comprado: false, atualizadoEm: agora, sincronizado: false } : v
      }
      return novo
    })
    setOutros((prev) =>
      prev.map((it) =>
        it.comprado ? { ...it, comprado: false, atualizadoEm: agora, sincronizado: false } : it,
      ),
    )
    agendarFlush()
    if (modoNuvem && lista) void resetarComprasRemoto(lista.codigo).catch(() => {})
  }, [agendarFlush, modoNuvem, lista])

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

  const statusSincronizacao: StatusSincronizacao = !modoNuvem
    ? 'local'
    : !online
      ? 'offline'
      : statusRede === 'sincronizando'
        ? 'sincronizando'
        : statusRede === 'erro'
          ? 'erro'
          : 'sincronizado'

  return {
    itensCatalogo,
    itensOutros: outros,
    itensParaComprar,
    progresso,
    statusSincronizacao,
    setQuantidade,
    setObservacao,
    toggleComprado,
    adicionarOutro,
    removerOutro,
    resetarCompras,
  }
}
