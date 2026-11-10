import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { DashIcon, DashAvatar } from './Icons'
import './FeedPage.css'
import { getNotices, type NoticeApi } from '../../services/notice'
import { getFavorites, addFavorite, removeFavorite } from '../../services/favorite'
import { prewarmGoogleToken, insertGoogleEvent, deleteGoogleEvent } from '../../services/googleCalendar'
import { useFeedFilters } from './feedFilterStore'

type Edital = {
  id: string
  orgao: string
  local: string
  tempo: string
  tag: string
  tipo: string
  titulo: string
  descricao: string
  temas: string[]
  recomendado: boolean
  prazo: string
  dataPrazo: string | null
  mes: number | null
  link: string
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  if (hour >= 18 || hour < 5) return 'Boa noite'
  return 'Bom dia'
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `há ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `há ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `há ${diffD} dias`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Sem prazo'
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  const date = iso
    ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    : new Date(dateStr)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function monthFromDate(dateStr: string | null): number | null {
  if (!dateStr) return null
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (iso) return Number(iso[2])
  const date = new Date(dateStr)
  return Number.isNaN(date.getTime()) ? null : date.getMonth() + 1
}

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function mapNoticeToEdital(n: NoticeApi, preferences: string[]): Edital {
  const temas = Array.isArray(n.themes) ? n.themes : []
  const prefNorm = preferences.map(normalizeText)
  const recomendado =
    prefNorm.length > 0 && temas.some((t) => prefNorm.includes(normalizeText(t)))
  return {
    id: String(n.id),
    orgao: n.title,
    local: n.state ?? 'Local não informado',
    tempo: formatTimeAgo(n.created_at),
    tag: n.state_code ?? n.state ?? '',
    tipo: 'Edital Público',
    titulo: n.description?.trim() || n.title,
    descricao: n.description ?? '',
    temas,
    recomendado,
    prazo: formatDate(n.deadline_date ?? n.publication_date),
    dataPrazo: n.deadline_date ?? n.publication_date,
    mes: monthFromDate(n.deadline_date ?? n.publication_date),
    link: n.link,
  }
}

function matchesQuery(e: Edital, queryNorm: string): boolean {
  if (!queryNorm) return true
  return normalizeText(e.orgao).includes(queryNorm) || normalizeText(e.titulo).includes(queryNorm)
}

function matchesMonths(e: Edital, months: number[]): boolean {
  return months.length === 0 || (e.mes !== null && months.includes(e.mes))
}

function matchesStates(e: Edital, states: string[]): boolean {
  return states.length === 0 || states.includes(e.tag)
}

const NO_PREFERENCES: string[] = []

export default function FeedPage({ userName, userId, hasPremium = false, userActive = true, preferences = NO_PREFERENCES, onNavigate }: { userName: string; userId?: number; hasPremium?: boolean; userActive?: boolean; preferences?: string[]; onNavigate?: (page: string) => void }) {
  const { query, months, states, setCounts, activeCount, clearFilters } = useFeedFilters()
  const [salvos, setSalvos] = useState<Record<string, boolean>>({})
  const [editais, setEditais] = useState<Edital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favoriteError, setFavoriteError] = useState<string | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      getNotices(userId),
      getFavorites().catch(() => []),
    ])
      .then(([notices, favorites]) => {
        setEditais(notices.map((n) => mapNoticeToEdital(n, preferences)))
        const savedMap: Record<string, boolean> = {}
        favorites.forEach((f) => { savedMap[String(f.notice_id)] = true })
        setSalvos(savedMap)
      })
      .catch(() => setError('Erro ao carregar editais'))
      .finally(() => setLoading(false))
  }, [userId, preferences])

  function toggleSalvo(id: string) {
    const noticeId = parseInt(id)
    const isSaved = salvos[id]

    setSalvos((s) => ({ ...s, [id]: !isSaved }))
    setFavoriteError(null)

    if (!isSaved) prewarmGoogleToken()

    const action = isSaved ? removeFavorite(noticeId) : addFavorite(noticeId)
    action
      .then(() => {
        const edital = editais.find((item) => item.id === id)
        if (!edital) return
        if (isSaved) {
          void deleteGoogleEvent(noticeId)
        } else if (edital.dataPrazo) {
          void insertGoogleEvent({
            noticeId,
            title: edital.orgao,
            description: edital.descricao,
            url: edital.link,
            date: edital.dataPrazo,
          })
        }
      })
      .catch((err) => {
        setSalvos((s) => ({ ...s, [id]: isSaved }))
        if (err.message.includes('limit') || err.message.includes('5')) {
          setShowLimitModal(true)
        } else {
          setFavoriteError(err.message || 'Erro ao salvar edital')
        }
      })
  }

  const queryNorm = normalizeText(query.trim())
  const filteredEditais = editais.filter(
    (e) => matchesQuery(e, queryNorm) && matchesMonths(e, months) && matchesStates(e, states),
  )

  useEffect(() => {
    const monthCounts: Record<number, number> = {}
    const stateCounts: Record<string, number> = {}
    const norm = normalizeText(query.trim())
    for (const e of editais) {
      if (matchesQuery(e, norm) && matchesStates(e, states) && e.mes !== null) {
        monthCounts[e.mes] = (monthCounts[e.mes] ?? 0) + 1
      }
      if (matchesQuery(e, norm) && matchesMonths(e, months) && e.tag) {
        stateCounts[e.tag] = (stateCounts[e.tag] ?? 0) + 1
      }
    }
    setCounts({ months: monthCounts, states: stateCounts })
  }, [editais, query, months, states, setCounts])

  return (
    <div className="pdd-feed">
      <h1 className="pdd-greeting">
        {getGreeting()}, <span>{userName}</span>
      </h1>

      <div className="pdd-filters">
        <span className="pdd-filters__hint">
          {activeCount === 0
            ? ''
            : `${activeCount} filtro${activeCount > 1 ? 's' : ''} ativo${activeCount > 1 ? 's' : ''}`}
        </span>
        {activeCount > 0 && (
          <button type="button" className="pdd-filters__clear" onClick={clearFilters}>
            Limpar filtros
          </button>
        )}
      </div>

      {loading && <p>Carregando editais...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {favoriteError && (
        <div className="pdd-save-premium-overlay is-open" onClick={() => setFavoriteError(null)}>
          <div className="pdd-save-premium-card" onClick={(e) => e.stopPropagation()}>
            <span className="pdd-save-premium-card__crown">
              <DashIcon name="trophy" />
            </span>
            <h3 className="pdd-save-premium-card__title">Precisa assinar o Premium</h3>
            <button type="button" className="pdd-save-premium-card__btn" onClick={() => onNavigate?.('plans')}>
              Assinar Premium
            </button>
          </div>
        </div>
      )}

      <div className="pdd-edital-list">
        {!loading && filteredEditais.length === 0 && (
          <p className="pdd-feed-empty">
            {activeCount > 0
              ? 'Nenhum edital encontrado com esses filtros.'
              : 'Nenhum edital encontrado.'}
          </p>
        )}
        {filteredEditais.map((e, i) => (
          <article
            key={e.id}
            className="pdd-edital-card"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="pdd-edital-card__head">
              <div className="pdd-edital-card__org">
                <DashAvatar size={34} seed={i} />
                <div>
                  <p className="pdd-edital-card__org-name">{e.orgao}</p>
                  <p className="pdd-edital-card__org-meta">
                    <DashIcon name="pin" /> {e.local} · {e.tempo}
                  </p>
                </div>
              </div>
              <span className="pdd-tag">{e.tag}</span>
            </div>

            <p className="pdd-edital-card__tipo">
              <DashIcon name="building" /> {e.tipo}
              {e.recomendado && <span className="pdd-badge-rec">Recomendado</span>}
            </p>

            {e.temas.length > 0 && (
              <div className="pdd-edital-card__themes">
                {e.temas.map((tema) => (
                  <span key={tema} className="pdd-theme-chip">{tema}</span>
                ))}
              </div>
            )}

            <div className="pdd-edital-card__panel">
              <h2 className="pdd-edital-card__titulo">{e.titulo}</h2>
            </div>

            <div className="pdd-edital-card__actions">
              <button
                type="button"
                className={`pdd-btn-outline ${salvos[e.id] ? 'is-done' : ''}`}
                disabled={!userActive}
                title={userActive ? undefined : 'Conta desativada'}
                onClick={() => toggleSalvo(e.id)}
              >
                <DashIcon name={salvos[e.id] ? 'bookmark-filled' : 'bookmark'} />
                {salvos[e.id] ? 'Edital salvo' : 'Salvar edital'}
              </button>
            </div>

            <div className="pdd-edital-card__footer">
              <span><DashIcon name="clock" /> Prazo: {e.prazo}</span>
              <a href={e.link} target="_blank" rel="noopener noreferrer">Ver detalhes <DashIcon name="arrow" /></a>
            </div>
          </article>
        ))}

        {!loading && !hasPremium && filteredEditais.length > 0 && (
          <article
            className="pdd-premium-cta"
            style={{ animationDelay: `${filteredEditais.length * 80}ms` }}
          >
            <span className="pdd-premium-cta__icon">
              <DashIcon name="trophy" />
            </span>
            <h3 className="pdd-premium-cta__title">Mais editais disponíveis</h3>
            <p className="pdd-premium-cta__text">Assine o Premium para ter acesso a todos os editais e recursos da plataforma.</p>
            <button
              type="button"
              className="pdd-premium-cta__btn"
              onClick={() => onNavigate?.('plans')}
            >
              Assinar Premium
            </button>
          </article>
        )}
      </div>

      {createPortal(
        <div className={`pdd-limit-overlay ${showLimitModal ? 'is-open' : ''}`} onClick={() => setShowLimitModal(false)}>
          <div
            className={`pdd-limit-modal ${showLimitModal ? 'is-open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Limite de favoritos"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="pdd-limit-modal__icon">
              <DashIcon name="bookmark-filled" />
            </span>
            <h2 className="pdd-limit-modal__title">Limite atingido</h2>
            <p className="pdd-limit-modal__text">
              Você atingiu o limite de 5 editais salvos.<br />
              Assine o Premium para salvar quantos editais quiser.
            </p>
            <div className="pdd-limit-modal__actions">
              <button
                type="button"
                className="pdd-limit-modal__btn pdd-limit-modal__btn--secondary"
                onClick={() => setShowLimitModal(false)}
              >
                Entendi
              </button>
              <button
                type="button"
                className="pdd-limit-modal__btn pdd-limit-modal__btn--primary"
                onClick={() => {
                  setShowLimitModal(false)
                  onNavigate?.('plans')
                }}
              >
                Assinar Premium
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
