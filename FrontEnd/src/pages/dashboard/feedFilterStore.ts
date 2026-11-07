import { createContext, useContext } from 'react'

export const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const ESTADOS_UF = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG',
  'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR',
  'RS', 'SC', 'SE', 'SP', 'TO',
]

export type FilterCounts = {
  months: Record<number, number>
  states: Record<string, number>
}

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

export const EMPTY_COUNTS: FilterCounts = { months: {}, states: {} }

export const FeedFilterContext = createContext<FeedFilterValue | null>(null)

export function useFeedFilters(): FeedFilterValue {
  const ctx = useContext(FeedFilterContext)
  if (!ctx) throw new Error('useFeedFilters deve ser usado dentro de FeedFilterProvider')
  return ctx
}
