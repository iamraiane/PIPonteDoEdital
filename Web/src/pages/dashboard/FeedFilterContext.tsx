import { useMemo, useState, type ReactNode } from 'react'
import {
  FeedFilterContext,
  EMPTY_COUNTS,
  type FeedFilterValue,
  type FilterCounts,
} from './feedFilterStore'

/**
 * Provedor do estado global de filtros do feed: mantém busca, meses e estados
 * selecionados (mais as contagens) e os repassa por contexto às páginas.
 */
export function FeedFilterProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('')
  const [months, setMonths] = useState<number[]>([])
  const [states, setStates] = useState<string[]>([])
  const [counts, setCounts] = useState<FilterCounts>(EMPTY_COUNTS)

  /**
   * Adiciona ou remove um mês do filtro de prazo.
   * @param month - Mês de 1 a 12.
   */
  function toggleMonth(month: number) {
    setMonths((list) =>
      list.includes(month) ? list.filter((m) => m !== month) : [...list, month],
    )
  }

  /**
   * Adiciona ou remove um estado (UF) do filtro.
   * @param uf - Sigla do estado.
   */
  function toggleState(uf: string) {
    setStates((list) =>
      list.includes(uf) ? list.filter((s) => s !== uf) : [...list, uf],
    )
  }

  /** Limpa a busca e todos os filtros de mês e estado. */
  function clearFilters() {
    setQuery('')
    setMonths([])
    setStates([])
  }

  /** Número total de filtros ativos (meses + estados + busca). */
  const activeCount = months.length + states.length + (query.trim() ? 1 : 0)

  /** Valor do contexto memoizado para evitar re-renderizações desnecessárias. */
  const value = useMemo<FeedFilterValue>(
    () => ({
      query,
      months,
      states,
      counts,
      activeCount,
      setQuery,
      toggleMonth,
      toggleState,
      setCounts,
      clearFilters,
    }),
    [query, months, states, counts, activeCount],
  )

  return <FeedFilterContext.Provider value={value}>{children}</FeedFilterContext.Provider>
}
