import { useEffect, useMemo, useRef, useState } from 'react'
import { DashIcon, GoogleGlyph } from './Icons'
import { getFavorites, removeFavorite, type Favorite } from '../../services/favorite'
import {
  isGoogleCalendarAvailable,
  getGoogleCalendarStatus,
  connectGoogleCalendar,
  insertGoogleEvent,
  deleteGoogleEvent,
  isGoogleEventSynced,
  type GcalStatus,
} from '../../services/googleCalendar'
import './SavedPage.css'

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MONTHS_FULL = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function noticeDate(fav: Favorite): string | null {
  const raw = fav.notice.deadline_date ?? fav.notice.publication_date
  return raw ? raw.slice(0, 10) : null
}

function formatDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function DatePill({ dateKey, isToday }: { dateKey: string; isToday: boolean }) {
  const d = parseDateKey(dateKey)
  return (
    <div className={`pdd-agenda-date ${isToday ? 'is-today' : ''}`}>
      <span className="pdd-agenda-date__wd">{WEEKDAYS[d.getDay()]}</span>
      <span className="pdd-agenda-date__day">{d.getDate()}</span>
    </div>
  )
}

function AgendaChip({
  fav,
  removing,
  userActive,
  showDate,
  onRemove,
}: {
  fav: Favorite
  removing: boolean
  userActive: boolean
  showDate?: boolean
  onRemove: () => void
}) {
  const n = fav.notice
  const dateKey = noticeDate(fav)
  const synced = isGoogleEventSynced(fav.notice_id)

  return (
    <article className={`pdd-agenda-chip ${removing ? 'is-removing' : ''}`}>
      <div className="pdd-agenda-chip__body">
        <div className="pdd-agenda-chip__tags">
          <span className="pdd-agenda-chip__org">{n.state_code || n.state || 'Edital'}</span>
          {synced && (
            <span className="pdd-agenda-chip__gcal">
              <GoogleGlyph /> Agenda
            </span>
          )}
        </div>
        <h2 className="pdd-agenda-chip__title">{n.title}</h2>
        {showDate && dateKey && (
          <p className="pdd-agenda-chip__meta">
            <DashIcon name="clock" /> {formatDate(dateKey)}
          </p>
        )}
      </div>

      <div className="pdd-agenda-chip__actions">
        <a
          href={n.link}
          target="_blank"
          rel="noopener noreferrer"
          className="pdd-status-btn"
        >
          <DashIcon name="arrow" /> Ver detalhes
        </a>
        <button
          type="button"
          className="pdd-remove-btn"
          disabled={!userActive}
          title={userActive ? undefined : 'Conta desativada'}
          onClick={onRemove}
        >
          <DashIcon name="trash" /> Remover
        </button>
      </div>
    </article>
  )
}

type DateGroup = { date: string; items: Favorite[] }
type TimelineEntry =
  | { kind: 'date'; key: string; group: DateGroup }
  | { kind: 'month'; key: string; label: string }

function startSync(
  favorites: Favorite[],
  onDone: (added: number, failed: number) => void,
): void {
  const today = todayKey()
  const pending = favorites.filter((fav) => {
    const date = noticeDate(fav)
    return date !== null && date >= today && !isGoogleEventSynced(fav.notice_id)
  })
  if (pending.length === 0) {
    onDone(0, 0)
    return
  }

  void (async () => {
    let added = 0
    let failed = 0
    for (const fav of pending) {
      const date = noticeDate(fav)
      if (!date) continue
      const ok = await insertGoogleEvent({
        noticeId: fav.notice_id,
        title: fav.notice.title,
        description: fav.notice.description,
        url: fav.notice.link,
        date,
      })
      if (ok) added += 1
      else failed += 1
    }
    onDone(added, failed)
  })()
}

export default function SavedPage({ userId, userActive = true }: { userId?: number; userActive?: boolean }) {
  const [items, setItems] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [gcalAvailable] = useState(isGoogleCalendarAvailable)
  const [gcalStatus, setGcalStatus] = useState<GcalStatus>(getGoogleCalendarStatus)
  const [gcalMsg, setGcalMsg] = useState<string | null>(null)
  const syncStartedRef = useRef(false)

  useEffect(() => {
    if (!userId) return
    getFavorites()
      .then((data) => {
        setItems(data)
        if (
          !syncStartedRef.current &&
          userActive !== false &&
          getGoogleCalendarStatus() === 'granted'
        ) {
          syncStartedRef.current = true
          startSync(data, (added, failed) => {
            if (added > 0 || failed > 0) {
              setGcalMsg(
                failed > 0
                  ? `${added} editais adicionados e ${failed} não puderam ser sincronizados.`
                  : `${added} editais adicionados à sua Google Agenda.`,
              )
            }
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId, userActive])

  const { timeline, expired, noDate } = useMemo(() => {
    const today = todayKey()
    const future: Favorite[] = []
    const expiredItems: Favorite[] = []
    const withoutDate: Favorite[] = []

    for (const fav of items) {
      const date = noticeDate(fav)
      if (!date) withoutDate.push(fav)
      else if (date >= today) future.push(fav)
      else expiredItems.push(fav)
    }

    future.sort((a, b) => {
      const da = noticeDate(a) ?? ''
      const db = noticeDate(b) ?? ''
      return da < db ? -1 : da > db ? 1 : 0
    })
    expiredItems.sort((a, b) => {
      const da = noticeDate(a) ?? ''
      const db = noticeDate(b) ?? ''
      return da > db ? -1 : da < db ? 1 : 0
    })

    const groupMap = new Map<string, Favorite[]>()
    for (const fav of future) {
      const date = noticeDate(fav)!
      const arr = groupMap.get(date)
      if (arr) arr.push(fav)
      else groupMap.set(date, [fav])
    }
    const groups: DateGroup[] = [...groupMap.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, groupItems]) => ({ date, items: groupItems }))

    const entries: TimelineEntry[] = []
    let currentMonth = ''
    for (const group of groups) {
      const monthKey = group.date.slice(0, 7)
      if (monthKey !== currentMonth) {
        currentMonth = monthKey
        const [y, m] = monthKey.split('-').map(Number)
        entries.push({ kind: 'month', key: monthKey, label: `${MONTHS_FULL[m - 1]} de ${y}` })
      }
      entries.push({ kind: 'date', key: group.date, group })
    }

    return { timeline: entries, expired: expiredItems, noDate: withoutDate }
  }, [items])

  function remove(id: string) {
    const noticeId = parseInt(id)
    setRemoving(id)
    removeFavorite(noticeId)
      .then(() => {
        setItems((list) => list.filter((it) => String(it.notice_id) !== id))
        void deleteGoogleEvent(noticeId)
      })
      .catch(() => {})
      .finally(() => setRemoving(null))
  }

  async function handleConnect() {
    if (userActive === false) return
    const status = await connectGoogleCalendar()
    setGcalStatus(status)
    if (status !== 'granted') {
      setGcalMsg('Conexão não concluída. Você pode tentar de novo quando quiser.')
      return
    }
    if (!syncStartedRef.current && items.length > 0) {
      setGcalMsg('Google Agenda conectada! Sincronizando editais salvos…')
      syncStartedRef.current = true
      startSync(items, (added, failed) => {
        setGcalMsg(
          failed > 0
            ? `${added} editais adicionados e ${failed} não puderam ser sincronizados.`
            : added > 0
              ? `${added} editais adicionados à sua Google Agenda.`
              : 'Google Agenda conectada! Editais salvos serão adicionados automaticamente.',
        )
      })
    } else {
      setGcalMsg('Google Agenda conectada! Editais salvos serão adicionados automaticamente.')
    }
  }

  const today = todayKey()

  return (
    <div className="pdd-saved-page">
      <div className="pdd-saved-header">
        <h1 className="pdd-page-title">Editais Salvos</h1>
        {gcalAvailable && gcalStatus !== 'granted' && (
          <button
            type="button"
            className="pdd-gcal-connect"
            disabled={userActive === false}
            title={userActive === false ? 'Conta desativada' : undefined}
            onClick={handleConnect}
          >
            <GoogleGlyph /> Conectar Google Agenda
          </button>
        )}
      </div>

      {gcalAvailable && gcalStatus === 'granted' && (
        <p className="pdd-gcal-hint pdd-gcal-hint--on">
          <DashIcon name="check" /> Editais salvos são adicionados à sua agenda Google automaticamente.
        </p>
      )}
      {gcalMsg && <p className="pdd-gcal-hint">{gcalMsg}</p>}

      {loading && <p>Carregando...</p>}

      {!loading && items.length === 0 && (
        <p className="pdd-saved-empty">Você ainda não tem editais salvos.</p>
      )}

      {!loading && items.length > 0 && (
        <div className="pdd-agenda">
          {timeline.map((entry) =>
            entry.kind === 'month' ? (
              <div key={entry.key} className="pdd-agenda-month">
                <span>{entry.label}</span>
              </div>
            ) : (
              <div
                key={entry.key}
                className={`pdd-agenda-row ${entry.group.date === today ? 'is-today' : ''}`}
              >
                <DatePill dateKey={entry.group.date} isToday={entry.group.date === today} />
                <div className="pdd-agenda-events">
                  {entry.group.items.map((fav) => (
                    <AgendaChip
                      key={fav.id}
                      fav={fav}
                      removing={removing === String(fav.notice_id)}
                      userActive={userActive !== false}
                      onRemove={() => remove(String(fav.notice_id))}
                    />
                  ))}
                </div>
              </div>
            ),
          )}

          {expired.length > 0 && (
            <section className="pdd-agenda-section">
              <h2 className="pdd-agenda-section__title">Prazos encerrados</h2>
              <div className="pdd-agenda-list">
                {expired.map((fav) => (
                  <AgendaChip
                    key={fav.id}
                    fav={fav}
                    removing={removing === String(fav.notice_id)}
                    userActive={userActive !== false}
                    showDate
                    onRemove={() => remove(String(fav.notice_id))}
                  />
                ))}
              </div>
            </section>
          )}

          {noDate.length > 0 && (
            <section className="pdd-agenda-section">
              <h2 className="pdd-agenda-section__title">Sem prazo definido</h2>
              <div className="pdd-agenda-list">
                {noDate.map((fav) => (
                  <AgendaChip
                    key={fav.id}
                    fav={fav}
                    removing={removing === String(fav.notice_id)}
                    userActive={userActive !== false}
                    onRemove={() => remove(String(fav.notice_id))}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
