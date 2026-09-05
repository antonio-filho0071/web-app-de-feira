import { adicionarItemOutro, atualizarItemOutro, upsertItemCatalogo } from '@/lib/listaApi'
import { CATALOGO_INICIAL, OUTROS_INICIAL } from '@/data/catalogo'

/**
 * Roda uma única vez, logo após criar uma lista nova, para publicar os
 * valores padrão (vindos da planilha original) no servidor — assim, quando
 * uma segunda pessoa entrar com o código, ela já vê o catálogo correto em
 * vez de uma lista vazia.
 *
 * Só itens com um valor inicial "não trivial" (quantidade > 0 ou alguma
 * observação) precisam ser publicados: itens zerados já são o padrão de
 * quem entra numa lista nova, então não há necessidade de gravá-los.
 */
export async function semearListaInicial(codigo: string): Promise<void> {
  const tarefasCatalogo = CATALOGO_INICIAL.filter(
    (item) => item.quantidadeInicial > 0 || item.observacaoInicial,
  ).map((item) =>
    upsertItemCatalogo(codigo, item.id, item.quantidadeInicial, item.observacaoInicial ?? '', false),
  )

  const tarefasOutros = OUTROS_INICIAL.map(async (item) => {
    const novoId = await adicionarItemOutro(codigo, item.nome, item.quantidadeInicial)
    if (item.observacaoInicial) {
      await atualizarItemOutro(codigo, novoId, item.quantidadeInicial, item.observacaoInicial, false)
    }
  })

  const resultados = await Promise.allSettled([...tarefasCatalogo, ...tarefasOutros])
  const falhas = resultados.filter((r) => r.status === 'rejected')
  if (falhas.length > 0) {
    // Não é fatal: a lista já existe e pode ser usada; os itens que
    // falharam simplesmente não aparecerão até serem adicionados/editados
    // manualmente. Registramos no console para facilitar diagnóstico.
    console.warn(`${falhas.length} item(ns) não foram semeados na lista nova.`, falhas)
  }
}
