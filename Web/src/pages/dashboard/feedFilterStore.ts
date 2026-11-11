import { createContext, useContext } from 'react'

/** Rótulos dos meses usados na lista de filtros de prazo (índice 0 = Janeiro). */
export const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/** Siglas das unidades federativas brasileiras disponíveis no filtro de estado. */
export const ESTADOS_UF = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG',
  'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR',
  'RS', 'SC', 'SE', 'SP', 'TO',
]

/** Contagem de editais disponíveis por mês e por estado para exibir nos filtros. */
export type FilterCounts = {
  months: Record<number, number>
  states: Record<string, number>
}

/** Contrato do estado de filtros do feed consumido pelas páginas. */
export type FeedFilterValue = {
  query: string
  months: number[]
  states: string[]
  counts: FilterCounts
  activeCount: number
  setQuery: (value: string) => void
  toggleMonth: (month: number) => void
  toggleState: (uf: string) => void
  setCounts: (counts: FilterCounts) => void
  clearFilters: () => void
}

/** Objeto vazio de contagens usado como estado inicial dos filtros. */
export const EMPTY_COUNTS: FilterCounts = { months: {}, states: {} }

/** Contexto React que carrega o estado de filtros do feed (null fora do provedor). */
export const FeedFilterContext = createContext<FeedFilterValue | null>(null)

/**
 * Hook de acesso ao estado de filtros do feed.
 * @returns Os filtros atuais e as funções para alterá-los.
 * @throws Error se usado fora de um FeedFilterProvider.
 */
export function useFeedFilters(): FeedFilterValue {
  const ctx = useContext(FeedFilterContext)
  if (!ctx) throw new Error('useFeedFilters deve ser usado dentro de FeedFilterProvider')
  return ctx
}
