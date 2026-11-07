import { useMemo, useState, type ReactNode } from 'react'
import {
  FeedFilterContext,
  EMPTY_COUNTS,
  type FeedFilterValue,
  type FilterCounts,
} from './feedFilterStore'

export function FeedFilterProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('')
  const [months, setMonths] = useState<number[]>([])
  const [states, setStates] = useState<string[]>([])
  const [counts, setCounts] = useState<FilterCounts>(EMPTY_COUNTS)

  function toggleMonth(month: number) {
    setMonths((list) =>
      list.includes(month) ? list.filter((m) => m !== month) : [...list, month],
    )
  }

  function toggleState(uf: string) {
    setStates((list) =>
      list.includes(uf) ? list.filter((s) => s !== uf) : [...list, uf],
    )
  }

  function clearFilters() {
    setQuery('')
    setMonths([])
    setStates([])
  }

  const activeCount = months.length + states.length + (query.trim() ? 1 : 0)

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
