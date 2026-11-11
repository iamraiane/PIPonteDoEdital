import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import logoNome from '../../assets/logo-nome.png'
import logoPonte from '../../assets/logo-ponte.png'
import { DashIcon, DashAvatar } from './Icons'
import { useFeedFilters, MONTH_LABELS, ESTADOS_UF } from './feedFilterStore'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '../../services/notification'
import { timeAgo } from '../../utils/timeAgo'
import './DashboardShell.css'

/** Identificador interno de cada página acessível pelo menu do dashboard. */
export type PageKey =
  | 'feed'
  | 'calendar'
  | 'saved'
  | 'plans'
  | 'faq'
  | 'about'
  | 'profile'
  | 'notifications'

/** Itens do menu lateral: chave da página, rótulo, ícone e marcação de premium. */
const NAV_ITEMS: { key: PageKey; label: string; icon: string; premium?: boolean }[] = [
  { key: 'feed', label: 'Feed', icon: 'home' },
  { key: 'calendar', label: 'Calendário', icon: 'calendar', premium: true },
  { key: 'saved', label: 'Salvos', icon: 'bookmark', premium: true },
  { key: 'plans', label: 'Planos', icon: 'filter' },
  { key: 'faq', label: 'Faq e dúvidas', icon: 'question' },
  { key: 'about', label: 'Quem somos', icon: 'people' },
]

/** Páginas exibidas diretamente na barra inferior do celular. */
// No celular só cabem alguns atalhos na barra inferior; o restante fica
// dentro do item "Mais" (mesmo padrão do protótipo mobile).
const MOBILE_PRIMARY_KEYS: PageKey[] = ['feed', 'calendar', 'saved', 'plans']
/** Demais itens do menu, exibidos dentro do painel "Mais" no celular. */
const MOBILE_MORE_ITEMS = NAV_ITEMS.filter((item) => !MOBILE_PRIMARY_KEYS.includes(item.key))

/** Associa cada área de interesse ao nome do ícone exibido no painel lateral. */
const ICONE_POR_INTERESSE: Record<string, string> = {
  Tecnologia: 'tech',
  Educação: 'educacao',
  Saúde: 'saude',
  Infraestrutura: 'infraestrutura',
  Cultura: 'cultura',
  Serviços: 'servicos',
  Consultoria: 'consultoria',
  Engenharia: 'engenharia',
}

/**
 * Casca visual do dashboard: cabeçalho com busca e notificações, menu lateral,
 * barra de navegação mobile, card de preferências e a área de conteúdo (children).
 */
export default function DashboardShell({
  active,
  onNavigate,
  userName,
  interesses,
  avatarUrl,
  hasPremium,
  userActive = true,
  onLogout,
  onOpenAdmin,
  children,
}: {
  active: PageKey
  onNavigate: (page: PageKey) => void
  userName: string
  interesses?: string[]
  avatarUrl?: string | null
  hasPremium?: boolean
  userActive?: boolean
  onLogout?: () => void
  onOpenAdmin?: () => void
  children: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [statesExpanded, setStatesExpanded] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  /** Quantidade de notificações não lidas (usada no indicador do sino). */
  const unread = notifications.filter((n) => !n.is_read).length

  /**
   * Recarrega a lista de notificações da API, ignorando falhas de rede.
   */
  const refreshNotifications = useCallback(async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch {
      // falha ao carregar notificações: mantém a lista atual
    } finally {
      setNotifLoading(false)
    }
  }, [])

  /**
   * Carrega as notificações ao montar e as mantém atualizadas por polling de
   * 60 s e sempre que a aba volta a ficar visível.
   */
  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => {})

    // Polling: mantém o sino atualizado sem precisar recarregar a página.
    const intervalId = window.setInterval(() => {
      refreshNotifications()
    }, 60_000)

    /** Recarrega a lista de notificações quando o usuário retorna para a aba. */
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') refreshNotifications()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [refreshNotifications])

  /** Estado global de filtros do feed (busca, meses e estados) compartilhado entre as páginas. */
  const { query, setQuery, months, states, counts, activeCount, toggleMonth, toggleState, clearFilters } =
    useFeedFilters()

  /**
   * Marca o shell como montado após o primeiro frame para acionar a animação de entrada.
   */
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  /**
   * Fecha os painéis flutuantes (menu, notificações, "Mais" e filtros) ao clicar fora deles.
   */
  useEffect(() => {
    if (!menuOpen && !notifOpen && !moreOpen && !filtersOpen) return
    /** Fecha apenas os painéis que não contêm o elemento clicado. */
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (menuOpen && menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false)
      }
      if (notifOpen && notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false)
      }
      if (moreOpen && moreRef.current && !moreRef.current.contains(target)) {
        setMoreOpen(false)
      }
      if (filtersOpen && searchRef.current && !searchRef.current.contains(target)) {
        setFiltersOpen(false)
      }
    }
    document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [menuOpen, notifOpen, moreOpen, filtersOpen])

  /**
   * Fecha o painel de filtros do feed ao pressionar a tecla Escape.
   */
  useEffect(() => {
    if (!filtersOpen) return
    /** Fecha o painel de filtros quando a tecla Escape é pressionada. */
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setFiltersOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [filtersOpen])

  /**
   * Abre ou fecha o painel de notificações (recarregando a lista ao abrir)
   * e fecha os demais painéis flutuantes.
   */
  function toggleNotif() {
    const next = !notifOpen
    setNotifOpen(next)
    if (next) {
      setNotifLoading(true)
      refreshNotifications()
    }
    setMenuOpen(false)
    setFiltersOpen(false)
  }

  /**
   * Marca a notificação como lida, fecha o painel e leva o usuário para a página de salvos.
   * @param n - Notificação clicada no painel do sino.
   */
  async function handleNotifClick(n: AppNotification) {
    if (!n.is_read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)),
      )
      try {
        await markNotificationRead(n.id)
      } catch {
        // se falhar, a lista será atualizada no próximo refresh
      }
    }
    setNotifOpen(false)
    onNavigate('saved')
  }

  /**
   * Marca todas as notificações como lidas, primeiro localmente e depois na API.
   */
  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))
    try {
      await markAllNotificationsRead()
    } catch {
      refreshNotifications()
    }
  }

  /** Abre/fecha o menu do avatar e fecha os painéis de notificações e filtros. */
  function toggleMenu() {
    setMenuOpen((v) => !v)
    setNotifOpen(false)
    setFiltersOpen(false)
  }

  /**
   * Abre o painel de filtros do feed, navegando para a página do feed caso o
   * usuário esteja em outra, e fecha os demais painéis.
   */
  function openFilters() {
    setFiltersOpen(true)
    setMenuOpen(false)
    setNotifOpen(false)
    setMoreOpen(false)
    if (active !== 'feed') onNavigate('feed')
  }

  return (
    <div className={`pdd-shell ${mounted ? 'pdd-shell--mounted' : ''}`}>
      <div
        className={`pdd-backdrop ${menuOpen || notifOpen || moreOpen || filtersOpen ? 'is-visible' : ''}`}
        onClick={() => {
          setMenuOpen(false)
          setNotifOpen(false)
          setMoreOpen(false)
          setFiltersOpen(false)
        }}
        aria-hidden="true"
      />

      <header className="pdd-header">
        <div className="pdd-brand">
          <img src={logoPonte} alt="" aria-hidden="true" className="pdd-brand__icon" />
          <img src={logoNome} alt="Ponte do Edital" className="pdd-brand__logo" />
        </div>

        <div className="pdd-search-wrap" ref={searchRef}>
          <label
            className="pdd-search"
            onClick={() => {
              if (!hasPremium) onNavigate('plans')
            }}
          >
            <span className="pdd-search__glyph"><DashIcon name="search" /></span>
            <input
              type="text"
              placeholder={hasPremium ? 'Buscar editais, prazos, estados...' : 'Busca somente para premium...'}
              value={hasPremium ? query : ''}
              readOnly={!hasPremium}
              onChange={(e) => hasPremium && setQuery(e.target.value)}
              onFocus={() => (hasPremium ? openFilters() : onNavigate('plans'))}
              aria-label="Buscar editais por título"
            />
            {hasPremium && activeCount > 0 && <span className="pdd-search__badge">{activeCount}</span>}
            {!hasPremium && (
              <span className="pdd-search__trophy"><DashIcon name="trophy" /></span>
            )}
          </label>

          <div
            className={`pdd-filter-panel ${filtersOpen ? 'is-open' : ''}`}
            role="dialog"
            aria-label="Filtros do feed"
          >
            <div className="pdd-filter-panel__head">
              <p className="pdd-filter-panel__title">Filtrar editais</p>
              <button
                type="button"
                className="pdd-filter-panel__close"
                aria-label="Fechar filtros"
                onClick={() => setFiltersOpen(false)}
              >
                <DashIcon name="close" />
              </button>
            </div>

            <section className="pdd-filter-panel__section">
              <h3 className="pdd-filter-panel__section-title">Prazo (mês)</h3>
              <ul className="pdd-filter-panel__list">
                {MONTH_LABELS.map((label, index) => {
                  const month = index + 1
                  return (
                    <li key={label}>
                      <label className="pdd-filter-option">
                        <input
                          type="checkbox"
                          checked={months.includes(month)}
                          onChange={() => toggleMonth(month)}
                        />
                        <span className="pdd-filter-option__label">
                          {label} <span className="pdd-filter-option__count">({counts.months[month] ?? 0})</span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className="pdd-filter-panel__section">
              <h3 className="pdd-filter-panel__section-title">Estado</h3>
              <ul className="pdd-filter-panel__list">
                {(statesExpanded ? ESTADOS_UF : ESTADOS_UF.slice(0, 8)).map((uf) => (
                  <li key={uf}>
                    <label className="pdd-filter-option">
                      <input
                        type="checkbox"
                        checked={states.includes(uf)}
                        onChange={() => toggleState(uf)}
                      />
                      <span className="pdd-filter-option__label">
                        {uf} <span className="pdd-filter-option__count">({counts.states[uf] ?? 0})</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="pdd-filter-more"
                onClick={() => setStatesExpanded((v) => !v)}
              >
                {statesExpanded ? 'Ver menos' : 'Ver mais'}
              </button>
            </section>

            <div className="pdd-filter-panel__footer">
              <span className="pdd-filter-panel__summary">
                {activeCount === 0 ? 'Nenhum filtro ativo' : `${activeCount} filtro${activeCount > 1 ? 's' : ''} ativo${activeCount > 1 ? 's' : ''}`}
              </span>
              <button
                type="button"
                className="pdd-filter-clear"
                disabled={activeCount === 0}
                onClick={clearFilters}
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </div>

        <div className="pdd-header__actions">
          <div className="pdd-notif-wrap" ref={notifRef}>
            <button
              type="button"
              className="pdd-bell"
              aria-label="Notificações"
              aria-haspopup="menu"
              aria-expanded={notifOpen}
              onClick={toggleNotif}
            >
              <DashIcon name="bell" />
              {unread > 0 && <span className="pdd-bell__dot" />}
            </button>

            <div className={`pdd-notif-panel ${notifOpen ? 'is-open' : ''}`} role="menu">
              <div className="pdd-notif-panel__head">
                <span className="pdd-notif-panel__title">Notificações</span>
                <div className="pdd-notif-panel__head-actions">
                  <button
                    type="button"
                    className="pdd-notif-panel__view-all"
                    onClick={() => {
                      setNotifOpen(false)
                      onNavigate('notifications')
                    }}
                  >
                    Ver todas
                  </button>
                  {unread > 0 && (
                    <button
                      type="button"
                      className="pdd-notif-panel__mark-all"
                      onClick={handleMarkAllRead}
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
              </div>

              {notifLoading && notifications.length === 0 ? (
                <p className="pdd-notif-panel__empty">Carregando…</p>
              ) : notifications.length === 0 ? (
                <p className="pdd-notif-panel__empty">Nenhuma notificação</p>
              ) : (
                notifications.slice(0, 5).map((n, i) => (
                  <button
                    key={n.id}
                    type="button"
                    role="menuitem"
                    className={`pdd-notif-panel__item ${n.is_read ? '' : 'is-unread'}`}
                    style={{ transitionDelay: notifOpen ? `${Math.min(i, 8) * 45}ms` : '0ms' }}
                    onClick={() => handleNotifClick(n)}
                  >
                    <span className="pdd-notif-panel__item-text">{n.message}</span>
                    <span className="pdd-notif-panel__item-time">{timeAgo(n.created_at)}</span>
                  </button>
                ))
              )}

              {notifications.length > 5 && (
                <button
                  type="button"
                  className="pdd-notif-panel__more"
                  onClick={() => {
                    setNotifOpen(false)
                    onNavigate('notifications')
                  }}
                >
                  Mostrar mais
                </button>
              )}
            </div>
          </div>

          <div className="pdd-avatar-wrap" ref={menuRef}>
            <button
              type="button"
              className="pdd-avatar-btn"
              onClick={toggleMenu}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Menu de ${userName}`}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="pdd-avatar-btn__img" />
              ) : (
                <DashAvatar size={36} seed={1} />
              )}
            </button>

            <div className={`pdd-menu ${menuOpen ? 'is-open' : ''}`} role="menu">
              <button
                type="button"
                className="pdd-menu__item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onNavigate('profile')
                }}
              >
                Perfil
              </button>
              {onOpenAdmin && (
                <button
                  type="button"
                  className="pdd-menu__item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onOpenAdmin()
                  }}
                >
                  Painel Admin
                </button>
              )}
              <button
                type="button"
                className="pdd-menu__item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  if (onLogout) onLogout()
                }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {!userActive && (
        <div className="pdd-account-disabled" role="status">
          <span>
            Sua conta está desativada. Você pode navegar pelo site, mas não pode realizar ações.
          </span>
        </div>
      )}

      <div className="pdd-body">
        <aside className="pdd-sidebar">
          <nav className="pdd-nav" aria-label="Navegação principal">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`pdd-nav__item ${active === item.key ? 'is-active' : ''}`}
                onClick={() => {
                  setFiltersOpen(false)
                  onNavigate(item.key)
                }}
              >
                <span className="pdd-nav__icon"><DashIcon name={item.icon} /></span>
                {item.label}
                {item.premium && !hasPremium && (
                  <span className="pdd-nav__trophy"><DashIcon name="trophy" /></span>
                )}
              </button>
            ))}
          </nav>

          <div className="pdd-pref-card">
            <p className="pdd-pref-card__title">Suas preferências</p>
            <div className="pdd-pref-icons">
              {(interesses ?? []).map((item) => (
                <span
                  key={item}
                  className="pdd-pref-icon"
                  title={item}
                >
                  <DashIcon name={ICONE_POR_INTERESSE[item] ?? 'tech'} />
                </span>
              ))}
              {(interesses ?? []).length === 0 && (
                <p className="pdd-pref-card__value">Nenhuma preferência definida</p>
              )}
            </div>
            <button type="button" className="pdd-pref-card__cta" onClick={() => { setFiltersOpen(false); onNavigate('profile') }}>
              Ajustar preferências
            </button>
          </div>
        </aside>

        <main className="pdd-main">
          <div key={active} className="pdd-page-enter">
            {children}
          </div>
        </main>
      </div>

      <nav className="pdd-tabbar" aria-label="Navegação principal (celular)">
        {NAV_ITEMS.filter((item) => MOBILE_PRIMARY_KEYS.includes(item.key)).map((item) => (
          <button
            key={item.key}
            type="button"
            className={`pdd-tabbar__item ${active === item.key ? 'is-active' : ''}`}
            onClick={() => {
              setMoreOpen(false)
              setFiltersOpen(false)
              onNavigate(item.key)
            }}
          >
            <span className="pdd-tabbar__icon"><DashIcon name={item.icon} /></span>
            {item.label}
          </button>
        ))}

        <div className="pdd-tabbar__more-wrap" ref={moreRef}>
          <button
            type="button"
            className={`pdd-tabbar__item ${MOBILE_MORE_ITEMS.some((i) => i.key === active) ? 'is-active' : ''}`}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            <span className="pdd-tabbar__icon"><DashIcon name="plus" /></span>
            Mais
          </button>

          <div className={`pdd-tabbar__sheet ${moreOpen ? 'is-open' : ''}`} role="menu">
            {MOBILE_MORE_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={`pdd-tabbar__sheet-item ${active === item.key ? 'is-active' : ''}`}
                onClick={() => {
                  setMoreOpen(false)
                  setFiltersOpen(false)
                  onNavigate(item.key)
                }}
              >
                <span className="pdd-tabbar__icon"><DashIcon name={item.icon} /></span>
                {item.label}
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              className="pdd-tabbar__sheet-item"
              onClick={() => {
                setMoreOpen(false)
                setFiltersOpen(false)
                onNavigate('profile')
              }}
            >
              <span className="pdd-tabbar__icon"><DashIcon name="id-badge" /></span>
              Perfil
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}

/** Reexporta os itens de navegação para uso em outros módulos. */
export { NAV_ITEMS }