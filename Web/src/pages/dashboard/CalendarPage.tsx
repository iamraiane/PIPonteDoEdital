import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { DashIcon } from './Icons'
import { type PageKey } from './DashboardShell'
import { getFavorites, type Favorite } from '../../services/favorite'
import './CalendarPage.css'

/** Iniciais dos dias da semana exibidas no cabeçalho do calendário. */
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
/** Nomes completos dos meses usados no cabeçalho e nos títulos de prazos. */
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/**
 * Monta a chave de data "AAAA-MM-DD" a partir dos componentes numéricos.
 * @param year - Ano.
 * @param month - Mês (0-11).
 * @param day - Dia do mês.
 * @returns Data no formato de chave.
 */
function toDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

/**
 * Formata uma data ISO no padrão brasileiro curto (ex.: "12 out. 2026").
 * @param dateStr - Data no formato "AAAA-MM-DD".
 * @returns Data formatada.
 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Página do calendário: grade mensal com navegação entre meses, marcadores de
 * dias com prazos de editais salvos e lista de eventos do dia selecionado.
 * Recurso exclusivo para assinantes Premium.
 */
export default function CalendarPage({
  hasPremium = false,
  userId,
  onNavigate,
}: {
  hasPremium?: boolean
  userId?: number
  onNavigate?: (page: PageKey) => void
}) {
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selected, setSelected] = useState(now.getDate())
  const [favorites, setFavorites] = useState<Favorite[]>([])

  /**
   * Carrega os editais salvos do usuário para marcar os dias com prazo.
   */
  useEffect(() => {
    if (!userId) return
    getFavorites()
      .then(setFavorites)
      .catch(() => {})
  }, [userId])

  /**
   * Agrupa os favoritos por data de prazo para consultar rapidamente
   * os editais de cada dia da grade.
   */
  const deadlineMap = useMemo(() => {
    const map = new Map<string, Favorite[]>()
    for (const fav of favorites) {
      const dateStr = fav.notice.deadline_date ?? fav.notice.publication_date
      if (!dateStr) continue
      const key = dateStr.slice(0, 10)
      const existing = map.get(key)
      if (existing) existing.push(fav)
      else map.set(key, [fav])
    }
    return map
  }, [favorites])

  /** Chave de data do dia atualmente selecionado (ou null se nenhum dia estiver ativo). */
  const selectedKey = selected > 0 ? toDateKey(cursor.year, cursor.month, selected) : null
  /** Editais salvos com prazo no dia selecionado. */
  const selectedFavorites = selectedKey ? deadlineMap.get(selectedKey) ?? [] : []

  /**
   * Monta as células da grade do mês: dias vazios de preenchimento seguidos
   * pelos dias numéricos do mês.
   */
  const cells = useMemo(() => {
    const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay()
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
    const arr: (number | null)[] = []
    for (let i = 0; i < firstWeekday; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(d)
    return arr
  }, [cursor])

  /**
   * Avança ou retrocede o calendário um mês, limpando a seleção de dia.
   * @param delta - +1 para o próximo mês, -1 para o anterior.
   */
  function changeMonth(delta: number) {
    setCursor((c) => {
      let month = c.month + delta
      let year = c.year
      if (month < 0) { month = 11; year -= 1 }
      if (month > 11) { month = 0; year += 1 }
      return { year, month }
    })
    setSelected(-1)
  }

  return (
    <div className="pdd-calendar-page">
      <h1 className="pdd-page-title">Calendario</h1>

      <div className="pdd-calendar-card">
        {!hasPremium && (
          <div className="pdd-calendar-locked">
            <div className="pdd-calendar-locked__card">
              <span className="pdd-calendar-locked__icon"><DashIcon name="trophy" /></span>
              <p className="pdd-calendar-locked__text">Para acessar:</p>
              <button
                type="button"
                className="pdd-calendar-locked__cta"
                onClick={() => onNavigate?.('plans')}
              >
                Assinar Premium
              </button>
            </div>
          </div>
        )}

        <div className="pdd-calendar-card__head">
          <p>{MONTHS[cursor.month]} {cursor.year}</p>
          <div className="pdd-calendar-nav">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
              <DashIcon name="chevron-left" />
            </button>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Proximo mes">
              <DashIcon name="chevron-right" />
            </button>
          </div>
        </div>

        <div className="pdd-calendar-grid pdd-calendar-grid--head">
          {WEEKDAYS.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>

        <div
          className="pdd-calendar-grid pdd-calendar-grid--body"
          key={`${cursor.year}-${cursor.month}`}
          style={{ '--pdd-cal-rows': Math.ceil(cells.length / 7) } as CSSProperties}
        >
          {cells.map((day, i) => {
            const hasEvents = day !== null && deadlineMap.has(toDateKey(cursor.year, cursor.month, day))
            return (
              <button
                key={i}
                type="button"
                disabled={day === null}
                className={`pdd-calendar-day ${day === selected ? 'is-selected' : ''} ${day === null ? 'is-empty' : ''} ${hasEvents ? 'has-events' : ''}`}
                style={{ animationDelay: `${i * 10}ms` }}
                onClick={() => day !== null && setSelected(day)}
              >
                {day}
                {hasEvents && <span className="pdd-calendar-day__dot" />}
              </button>
            )
          })}
        </div>
      </div>

      {selectedFavorites.length > 0 && (
        <div className="pdd-calendar-events">
          <h2 className="pdd-calendar-events__title">
            Prazos para {selected > 0 ? `${selected} de ${MONTHS[cursor.month]}` : ''}
          </h2>
          <div className="pdd-calendar-events__list">
            {selectedFavorites.map((fav) => {
              const n = fav.notice
              return (
                <article key={fav.id} className="pdd-calendar-event-card">
                  <div className="pdd-calendar-event-card__info">
                    <span className="pdd-calendar-event-card__org">
                      {n.state_code || n.state || 'Edital'}
                    </span>
                    <h3 className="pdd-calendar-event-card__title">{n.title}</h3>
                    <p className="pdd-calendar-event-card__date">
                      <DashIcon name="clock" /> {formatDate((n.deadline_date ?? n.publication_date)!)}
                    </p>
                  </div>
                  <a
                    href={n.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pdd-calendar-event-card__link"
                  >
                    <DashIcon name="arrow" /> Ver detalhes
                  </a>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
