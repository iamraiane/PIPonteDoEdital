import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logoNome from '../assets/logo-nome.png'
import logoPonte from '../assets/logo-ponte.png'
import { confirmEmailChange } from '../services/user'
import './VerifyEmailPage.css'

/**
 * Renderiza um ícone SVG inline de acordo com o nome informado.
 * @param name - Identificador do ícone ('check', 'mail', 'x' ou 'arrow').
 * @returns O elemento SVG correspondente, ou null para nomes desconhecidos.
 */
function Icon({ name }: { name: string }) {
  switch (name) {
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M4 12.5 9.5 18 20 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'mail':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m4 6.5 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      )
    case 'arrow':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default:
      return null
  }
}

/**
 * Página de confirmação da alteração de e-mail: valida o token recebido
 * por link e exibe os estados de carregamento, sucesso ou erro da
 * troca de endereço de e-mail do usuário.
 */
export default function ConfirmEmailChangePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(() =>
    token ? 'loading' : 'error',
  )
  const [errorMsg, setErrorMsg] = useState(() =>
    token ? '' : 'Token de confirmação não encontrado.',
  )

  /**
   * Ativa a animação de entrada da página logo após a montagem do componente.
   */
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  /**
   * Dispara a confirmação da troca de e-mail com o token obtido da URL.
   * Sem token, o estado de erro já é mantido a partir da inicialização.
   */
  useEffect(() => {
    if (!token) return

    confirmEmailChange(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err.message || 'Token inválido ou expirado.')
      })
  }, [token])

  if (!token) {
    return (
      <div className={`pde-shell ${mounted ? 'pde-shell--mounted' : ''}`}>
        <aside className="pde-side">
          <div className="pde-side__inner">
            <div className="pde-brand">
              <img src={logoPonte} alt="" aria-hidden="true" className="pde-brand__icon" />
              <img src={logoNome} alt="Ponte do Edital" className="pde-brand__logo" />
            </div>
            <div className="pde-side__body">
              <p className="pde-eyebrow"><span className="pde-eyebrow__line" />Confirmação de e-mail</p>
              <h1 className="pde-headline">
                Link <span className="pde-accent">inválido</span>.
              </h1>
              <p className="pde-sub">
                O link de confirmação é inválido ou está incompleto.
                Solicite a alteração de e-mail novamente no seu perfil.
              </p>
            </div>
            <p className="pde-copyright">© 2026 Todos os direitos reservados a Projeto Integrador Fatec</p>
          </div>
        </aside>

        <main className="pde-form-panel">
          <div className="pde-form-panel__inner">
            <header className="pde-form-header">
              <h2>Confirmação</h2>
              <p><span>inválida</span></p>
            </header>
            <div className="pde-panel pde-panel--enter-right">
              <div className="pde-login-success">
                <span className="pde-login-success__ring pde-login-success__ring--error">
                  <Icon name="x" />
                </span>
                <p className="pde-done__title">Link <span>inválido</span></p>
                <p className="pde-login-success__sub">
                  Solicite a alteração de e-mail novamente na sua página de perfil.
                </p>
                <div className="pde-actions pde-actions--center">
                  <button
                    type="button"
                    className="pde-btn pde-btn--primary"
                    onClick={() => navigate('/login')}
                  >
                    Ir para o login <Icon name="arrow" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={`pde-shell ${mounted ? 'pde-shell--mounted' : ''}`}>
      <aside className="pde-side">
        <div className="pde-side__inner">
          <div className="pde-brand">
            <img src={logoPonte} alt="" aria-hidden="true" className="pde-brand__icon" />
            <img src={logoNome} alt="Ponte do Edital" className="pde-brand__logo" />
          </div>
          <div className="pde-side__body">
            <p className="pde-eyebrow"><span className="pde-eyebrow__line" />Confirmação de e-mail</p>
            <h1 className="pde-headline">
              Confirme seu<br />
              <span className="pde-accent">novo e-mail</span>.
            </h1>
            <p className="pde-sub">
              Estamos validando seu novo endereço de e-mail para completar a alteração.
            </p>
          </div>
          <p className="pde-copyright">© 2026 Todos os direitos reservados a Projeto Integrador Fatec</p>
        </div>
      </aside>

      <main className="pde-form-panel">
        <div className="pde-form-panel__inner">
          <header className="pde-form-header">
            <h2>Confirmação de</h2>
            <p><span>e-mail</span></p>
          </header>

          <div className="pde-panel pde-panel--enter-right">
            {status === 'loading' && (
              <div className="pde-login-success">
                <span className="pde-login-success__ring pde-login-success__ring--loading">
                  <Icon name="mail" />
                </span>
                <p className="pde-done__title">Verificando...</p>
                <p className="pde-login-success__sub">
                  Aguarde enquanto validamos seu novo e-mail.
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="pde-login-success">
                <span className="pde-login-success__ring">
                  <Icon name="check" />
                </span>
                <p className="pde-done__title">E-mail <span>confirmado!</span></p>
                <p className="pde-login-success__sub">
                  Seu e-mail foi atualizado com sucesso. Redirecionando para o login...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="pde-login-success">
                <span className="pde-login-success__ring pde-login-success__ring--error">
                  <Icon name="x" />
                </span>
                <p className="pde-done__title">Erro na <span>confirmação</span></p>
                <p className="pde-login-success__sub">
                  {errorMsg}
                </p>
                <div className="pde-actions pde-actions--center">
                  <button
                    type="button"
                    className="pde-btn pde-btn--primary"
                    onClick={() => navigate('/login')}
                  >
                    Ir para o login <Icon name="arrow" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}