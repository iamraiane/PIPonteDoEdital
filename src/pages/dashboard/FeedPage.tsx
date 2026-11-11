import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { DashIcon, DashAvatar } from './Icons'
import './FeedPage.css'
import { getNotices, type NoticeApi } from '../../services/notice'
import { getFavorites, addFavorite, removeFavorite } from '../../services/favorite'
import { prewarmGoogleToken, insertGoogleEvent, deleteGoogleEvent } from '../../services/googleCalendar'
import { useFeedFilters } from './feedFilterStore'

/** Estrutura de um edital já normalizada para exibição no feed. */
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

/**
 * Monta a saudação de acordo com a hora atual do relógio.
 * @returns "Bom dia", "Boa tarde" ou "Boa noite".
 */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  if (hour >= 18 || hour < 5) return 'Boa noite'
  return 'Bom dia'
}

/**
 * Converte uma data em texto relativo ("há 5 min", "há 2h", "há 3 dias").
 * @param dateStr - Data em formato ISO ou null.
 * @returns Texto de tempo relativo ou string vazia.
 */
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

/**
 * Formata a data do prazo no padrão brasileiro curto (ex.: "12 out. 2026").
 * @param dateStr - Data em formato ISO ou null.
 * @returns Data formatada ou "Sem prazo" quando não há data.
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Sem prazo'
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  const date = iso
    ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    : new Date(dateStr)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Extrai o número do mês (1-12) a partir de uma data.
 * @param dateStr - Data em formato ISO ou null.
 * @returns Mês de 1 a 12 ou null quando a data é inválida/ausente.
 */
function monthFromDate(dateStr: string | null): number | null {
  if (!dateStr) return null
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (iso) return Number(iso[2])
  const date = new Date(dateStr)
  return Number.isNaN(date.getTime()) ? null : date.getMonth() + 1
}

/**
 * Remove acentos e converte o texto para minúsculas, para comparações estáveis.
 * @param value - Texto de entrada.
 * @returns Texto normalizado sem acentos e em minúsculas.
 */
function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/**
 * Converte um edital da API para o formato exibido no feed, calculando o
 * destaque "Recomendado" conforme os interesses do usuário.
 * @param n - Edital retornado pela API.
 * @param preferences - Áreas de interesse do usuário.
 * @returns Edital pronto para renderização.
 */
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

/**
 * Verifica se o edital corresponde ao texto digitado na busca.
 * @param e - Edital a testar.
 * @param queryNorm - Consulta já normalizada (sem acentos, minúscula).
 * @returns true se o edital casa com a consulta ou se a consulta estiver vazia.
 */
function matchesQuery(e: Edital, queryNorm: string): boolean {
  if (!queryNorm) return true
  return normalizeText(e.orgao).includes(queryNorm) || normalizeText(e.titulo).includes(queryNorm)
}

/**
 * Verifica se o edital está no intervalo de meses filtrado.
 * @param e - Edital a testar.
 * @param months - Meses selecionados no filtro (1-12).
 * @returns true se nenhum mês estiver filtrado ou se o mês do prazo estiver incluído.
 */
function matchesMonths(e: Edital, months: number[]): boolean {
  return months.length === 0 || (e.mes !== null && months.includes(e.mes))
}

/**
 * Verifica se o edital pertence a um dos estados filtrados.
 * @param e - Edital a testar.
 * @param states - UFs selecionadas no filtro.
 * @returns true se nenhum estado estiver filtrado ou se a UF do edital estiver incluída.
 */
function matchesStates(e: Edital, states: string[]): boolean {
  return states.length === 0 || states.includes(e.tag)
}

/** Lista vazia usada como valor padrão para os interesses do usuário. */
const NO_PREFERENCES: string[] = []

/**
 * Página do feed de editais: saudação, filtros compartilhados, lista de cards
 * com salvamento (e sincronização com a Google Agenda) e chamada ao Premium.
 */
export default function FeedPage({ userName, userId, hasPremium = false, userActive = true, preferences = NO_PREFERENCES, onNavigate }: { userName: string; userId?: number; hasPremium?: boolean; userActive?: boolean; preferences?: string[]; onNavigate?: (page: string) => void }) {
  const { query, months, states, setCounts, activeCount, clearFilters } = useFeedFilters()
  const [salvos, setSalvos] = useState<Record<string, boolean>>({})
  const [editais, setEditais] = useState<Edital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favoriteError, setFavoriteError] = useState<string | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)

  /**
   * Carrega os editais da API e marca os que já estão nos favoritos do usuário.
   */
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

  /**
   * Alterna o edital entre salvo e não salvo, espelhando a mudança no Google
   * Agenda e revertendo em caso de falha (ex.: limite de favoritos).
   * @param id - Identificador do edital.
   */
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

  /** Texto da busca já normalizado, usado nas comparações de filtro. */
  const queryNorm = normalizeText(query.trim())
  /** Editais que passam por todos os filtros ativos (busca, meses e estados). */
  const filteredEditais = editais.filter(
    (e) => matchesQuery(e, queryNorm) && matchesMonths(e, months) && matchesStates(e, states),
  )

  /**
   * Recalcula a contagem de editais por mês e por estado para exibir nos filtros.
   */
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
