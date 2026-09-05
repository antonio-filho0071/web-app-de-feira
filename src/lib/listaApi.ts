import { supabase } from '@/lib/supabaseClient'

export interface ItemCatalogoRemoto {
  lista_id: string
  item_id: string
  quantidade: number
  observacao: string
  comprado: boolean
  atualizado_em: string
}

export interface ItemOutroRemoto {
  id: string
  lista_id: string
  nome: string
  quantidade: number
  observacao: string
  comprado: boolean
  criado_em: string
  atualizado_em: string
}

export interface EstadoRemoto {
  lista_id: string
  codigo: string
  catalogo: ItemCatalogoRemoto[]
  outros: ItemOutroRemoto[]
}

function client() {
  if (!supabase) throw new Error('Supabase não configurado')
  return supabase
}

export async function criarLista(): Promise<{ id: string; codigo: string }> {
  const { data, error } = await client().rpc('criar_lista')
  if (error) throw error
  const linha = Array.isArray(data) ? data[0] : data
  return { id: linha.id, codigo: linha.codigo }
}

export async function obterLista(codigo: string): Promise<EstadoRemoto> {
  const { data, error } = await client().rpc('obter_lista', { p_codigo: codigo })
  if (error) throw error
  return data as EstadoRemoto
}

export async function upsertItemCatalogo(
  codigo: string,
  itemId: string,
  quantidade: number,
  observacao: string,
  comprado: boolean,
): Promise<void> {
  const { error } = await client().rpc('upsert_item_catalogo', {
    p_codigo: codigo,
    p_item_id: itemId,
    p_quantidade: quantidade,
    p_observacao: observacao,
    p_comprado: comprado,
  })
  if (error) throw error
}

export async function adicionarItemOutro(
  codigo: string,
  nome: string,
  quantidade: number,
): Promise<string> {
  const { data, error } = await client().rpc('adicionar_item_outro', {
    p_codigo: codigo,
    p_nome: nome,
    p_quantidade: quantidade,
  })
  if (error) throw error
  const linha = Array.isArray(data) ? data[0] : data
  return linha.id as string
}

export async function atualizarItemOutro(
  codigo: string,
  itemId: string,
  quantidade: number,
  observacao: string,
  comprado: boolean,
): Promise<void> {
  const { error } = await client().rpc('atualizar_item_outro', {
    p_codigo: codigo,
    p_item_id: itemId,
    p_quantidade: quantidade,
    p_observacao: observacao,
    p_comprado: comprado,
  })
  if (error) throw error
}

export async function removerItemOutro(codigo: string, itemId: string): Promise<void> {
  const { error } = await client().rpc('remover_item_outro', {
    p_codigo: codigo,
    p_item_id: itemId,
  })
  if (error) throw error
}

export async function resetarComprasRemoto(codigo: string): Promise<void> {
  const { error } = await client().rpc('resetar_compras', { p_codigo: codigo })
  if (error) throw error
}
