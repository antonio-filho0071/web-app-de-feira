import type { EstadoNuvemPersistido } from '@/types'

const LEGACY_STORAGE_KEY = 'feira.estado.v2'
const NUVEM_STORAGE_PREFIX = 'feira.nuvem.v1.'
const CHAVE_LOCAL = 'local'

interface EstadoLegado {
  versao: 2
  catalogo: Record<string, { quantidade: number; observacao: string; comprado: boolean }>
  outros: Array<{
    id: string
    nome: string
    quantidade: number
    observacao: string
    comprado: boolean
  }>
}

/**
 * Converte o formato usado antes da sincronização em nuvem existir (só
 * modo local, sem os campos de controle de sincronização) para o formato
 * atual. Existe só para não perder os dados de quem já usava o app antes
 * desta atualização.
 */
function migrarEstadoLegado(): EstadoNuvemPersistido | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const legado = JSON.parse(raw) as EstadoLegado
    if (!legado || legado.versao !== 2) return null

    const catalogo: EstadoNuvemPersistido['catalogo'] = {}
    for (const [id, v] of Object.entries(legado.catalogo)) {
      catalogo[id] = { ...v, atualizadoEm: null, sincronizado: true }
    }

    const outros: EstadoNuvemPersistido['outros'] = legado.outros.map((o) => ({
      ...o,
      atualizadoEm: new Date(0).toISOString(),
      sincronizado: true,
      remoto: false,
      fixo: false,
    }))

    return { versao: 1, catalogo, outros, remocoesPendentes: [] }
  } catch {
    return null
  }
}

/**
 * Cache local (offline-first) do estado da lista de compras. Uma chave por
 * lista sincronizada (para não misturar dados entre listas diferentes no
 * mesmo aparelho), e a chave especial "local" para quando não há
 * sincronização configurada. Nunca lança erro: retorna null se não existir,
 * estiver corrompido, ou se o localStorage não estiver disponível.
 */
export function carregarEstadoNuvem(listaId: string): EstadoNuvemPersistido | null {
  try {
    const raw = window.localStorage.getItem(NUVEM_STORAGE_PREFIX + listaId)
    if (!raw) {
      return listaId === CHAVE_LOCAL ? migrarEstadoLegado() : null
    }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || parsed.versao !== 1) return null
    if (typeof parsed.catalogo !== 'object' || !Array.isArray(parsed.outros)) return null
    if (!Array.isArray(parsed.remocoesPendentes)) return null
    return parsed as EstadoNuvemPersistido
  } catch {
    return null
  }
}

/**
 * Salva o estado no localStorage. Falha silenciosamente (ex: quota
 * excedida, storage bloqueado) para nunca quebrar a experiência da usuária.
 */
export function salvarEstadoNuvem(listaId: string, estado: EstadoNuvemPersistido): boolean {
  try {
    window.localStorage.setItem(NUVEM_STORAGE_PREFIX + listaId, JSON.stringify(estado))
    return true
  } catch {
    return false
  }
}
