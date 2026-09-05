import type { EstadoPersistido } from '@/types'

const STORAGE_KEY = 'feira.estado.v2'

/**
 * Lê o estado salvo no localStorage do aparelho. Retorna null se não existir,
 * estiver corrompido, ou se o localStorage não estiver disponível (modo
 * privado, navegador antigo, etc). Nunca lança erro.
 */
export function carregarEstado(): EstadoPersistido | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || parsed.versao !== 2) return null
    if (typeof parsed.catalogo !== 'object' || !Array.isArray(parsed.outros)) return null
    return parsed as EstadoPersistido
  } catch {
    return null
  }
}

/**
 * Salva o estado no localStorage. Falha silenciosamente (ex: quota
 * excedida, storage bloqueado) para nunca quebrar a experiência da usuária.
 */
export function salvarEstado(estado: EstadoPersistido): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(estado))
    return true
  } catch {
    return false
  }
}
