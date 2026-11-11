import { useEffect, useRef, useState, type ReactNode } from 'react'
import logoNome from '../../assets/logo-nome.png'
import logoPonte from '../../assets/logo-ponte.png'
import { DashIcon } from '../dashboard/Icons'
import './AdminShell.css'

/** Identificadores das páginas disponíveis no painel administrativo. */
export type AdminPageKey = 'overview' | 'editais' | 'usuarios' | 'duvidas'

/** Itens de navegação da barra lateral do painel administrativo. */
const NAV_ITEMS: { key: AdminPageKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Visão Geral', icon: 'home' },
  { key: 'editais', label: 'Editais', icon: 'file' },
  { key: 'usuarios', label: 'Usuários', icon: 'people' },
  { key: 'duvidas', label: 'Dúvidas', icon: 'question' },
]

/**
 * Layout do painel administrativo: cabeçalho com menu do admin,
 * barra lateral de navegação e área principal onde as páginas
 * filhas são renderizadas com animação de entrada.
 * @param active - Chave da página atualmente ativa no menu lateral.
 * @param onNavigate - Callback acionado ao selecionar um item do menu.
 * @param onExitAdmin - Callback para voltar ao painel do usuário.
 * @param onLogout - Callback para encerrar a sessão.
 * @param children - Conteúdo da página atual exibido na área principal.
 */
export default function AdminShell({
  active,
  onNavigate,
  onExitAdmin,
  onLogout,
  children,
}: {
  active: string
  onNavigate: (page: string) => void
  onExitAdmin?: () => void
  onLogout?: () => void
  children: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  /**
   * Ativa a animação de entrada do shell logo após a montagem.
   */
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  /**
   * Fecha o menu suspensão do admin quando o usuário clica
   * fora dele enquanto está aberto.
   */
  useEffect(() => {
    if (!menuOpen) return
    /**
     * Fecha o menu se o clique ocorrer fora do seu contêiner.
     * @param e - Evento de clique no documento.
     */
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [menuOpen])

  return (
    <div className={`pda-shell ${mounted ? 'pda-shell--mounted' : ''}`}>
      <div
        className={`pda-backdrop ${menuOpen ? 'is-visible' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <header className="pda-header">
        <div className="pda-brand">
          <img src={logoPonte} alt="" aria-hidden="true" className="pda-brand__icon" />
          <img src={logoNome} alt="Ponte do Edital" className="pda-brand__logo" />
        </div>

        <div className="pda-header__actions">
          <div className="pda-admin-wrap" ref={menuRef}>
            <button
              type="button"
              className="pda-admin-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              Admin
              <span className="pda-admin-btn__icon">
                <DashIcon name="id-badge" />
              </span>
            </button>

            <div className={`pda-menu ${menuOpen ? 'is-open' : ''}`} role="menu">
              {onExitAdmin && (
                <button
                  type="button"
                  className="pda-menu__item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onExitAdmin()
                  }}
                >
                  Voltar ao painel
                </button>
              )}
              <button
                type="button"
                className="pda-menu__item"
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

      <div className="pda-body">
        <aside className="pda-sidebar">
          <nav className="pda-nav" aria-label="Navegação do painel administrativo">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`pda-nav__item ${active === item.key ? 'is-active' : ''}`}
                onClick={() => onNavigate(item.key)}
              >
                <span className="pda-nav__icon">
                  <DashIcon name={item.icon} />
                </span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="pda-main">
          <div key={active} className="pda-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
