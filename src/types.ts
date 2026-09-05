export interface ItemFeira {
  id: string
  nome: string
  quantidade: number
  observacao: string
  comprado: boolean
  /** true = vem do catálogo fixo (nome não pode ser editado/removido) */
  fixo: boolean
}

export interface EstadoPersistido {
  versao: 2
  /** overrides por id para itens fixos do catálogo */
  catalogo: Record<string, { quantidade: number; observacao: string; comprado: boolean }>
  /** lista completa da seção "Outros", controlada pela usuária */
  outros: ItemFeira[]
  atualizadoEm: string
}
