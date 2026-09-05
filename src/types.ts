export interface ItemFeira {
  id: string
  nome: string
  quantidade: number
  observacao: string
  comprado: boolean
  /** true = vem do catálogo fixo (nome não pode ser editado/removido) */
  fixo: boolean
}

// ---------------------------------------------------------------------------
// Modo sincronizado (Supabase) — cache local offline-first por lista
// ---------------------------------------------------------------------------

export interface CatalogoLocalOverride {
  quantidade: number
  observacao: string
  comprado: boolean
  /** null = nunca editado neste aparelho; sempre aceita o valor remoto */
  atualizadoEm: string | null
  /** false = há uma mudança local ainda não confirmada no servidor */
  sincronizado: boolean
}

export interface OutroLocalNuvem {
  id: string
  nome: string
  quantidade: number
  observacao: string
  comprado: boolean
  atualizadoEm: string
  /** false = ainda não confirmado no servidor (criação ou edição pendente) */
  sincronizado: boolean
  /** true = já existe no servidor (tem id real, não temporário) */
  remoto: boolean
  /** sempre false — presente só para os itens de "Outros" serem compatíveis com ItemFeira */
  fixo: false
}

export interface EstadoNuvemPersistido {
  versao: 1
  catalogo: Record<string, CatalogoLocalOverride>
  outros: OutroLocalNuvem[]
  /** ids remotos de itens de "Outros" removidos localmente, aguardando exclusão no servidor */
  remocoesPendentes: string[]
}

export type StatusSincronizacao = 'local' | 'sincronizado' | 'sincronizando' | 'offline' | 'erro'
