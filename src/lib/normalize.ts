const COMBINING_MARKS = /[\u0300-\u036f]/g

export function normalizarTexto(texto: string): string {
  return texto.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().trim()
}
