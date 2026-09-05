import { useCallback, useState } from 'react'

import { criarLista, obterLista } from '@/lib/listaApi'
import { semearListaInicial } from '@/lib/listaSeed'

const STORAGE_KEY = 'feira.lista.v1'

interface ListaVinculada {
  id: string
  codigo: string
}

function carregarVinculo(): ListaVinculada | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.id !== 'string' || typeof parsed?.codigo !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

function salvarVinculo(vinculo: ListaVinculada | null) {
  try {
    if (vinculo) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vinculo))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage indisponível: segue sem persistir o vínculo
  }
}

export type StatusLista = 'carregando' | 'sem-lista' | 'conectando' | 'conectada' | 'erro'

export function useLista() {
  const [vinculoInicial] = useState(carregarVinculo)
  const [status, setStatus] = useState<StatusLista>(vinculoInicial ? 'conectada' : 'sem-lista')
  const [lista, setLista] = useState<ListaVinculada | null>(vinculoInicial)
  const [erro, setErro] = useState<string | null>(null)

  const criar = useCallback(async () => {
    setStatus('conectando')
    setErro(null)
    try {
      const nova = await criarLista()
      await semearListaInicial(nova.codigo)
      salvarVinculo(nova)
      setLista(nova)
      setStatus('conectada')
      return nova
    } catch (e) {
      setErro('Não foi possível criar a lista. Verifique sua internet e tente de novo.')
      setStatus('erro')
      throw e
    }
  }, [])

  const entrar = useCallback(async (codigoDigitado: string) => {
    const codigo = codigoDigitado.trim().toUpperCase()
    if (!codigo) return
    setStatus('conectando')
    setErro(null)
    try {
      const estado = await obterLista(codigo)
      const vinculo = { id: estado.lista_id, codigo: estado.codigo }
      salvarVinculo(vinculo)
      setLista(vinculo)
      setStatus('conectada')
      return vinculo
    } catch {
      setErro('Código não encontrado. Confira se digitou certo.')
      setStatus('sem-lista')
      return undefined
    }
  }, [])

  const sair = useCallback(() => {
    salvarVinculo(null)
    setLista(null)
    setStatus('sem-lista')
  }, [])

  return { status, lista, erro, criar, entrar, sair }
}
