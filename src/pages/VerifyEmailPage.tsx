import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logoNome from '../assets/logo-nome.png'
import logoPonte from '../assets/logo-ponte.png'
import { verifyEmail, resendVerificationEmail } from '../services/user'
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
 * Página de verificação de e-mail: valida o token recebido por link,
 * exibe os estados de carregamento, sucesso ou erro e permite reenviar
 * o e-mail de verificação quando o link é inválido ou expirou.
 */
export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(() =>
    token ? 'loading' : 'error',
  )
  const [errorMsg, setErrorMsg] = useState(() =>
    token ? '' : 'Token de verificação não encontrado.',
  )
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)

  /**
   * Ativa a animação de entrada da página logo após a montagem do componente.
   */
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  /**
   * Dispara a verificação do token de e-mail obtido da URL.
   * Sem token, o estado de erro já é mantido a partir da inicialização.
   */
  useEffect(() => {
    if (!token) return

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err.message || 'Token inválido ou expirado.')
      })
  }, [token])

  /**
   * Valida o e-mail informado e solicita o reenvio do link de verificação.
   * Exibe mensagens de sucesso, erro ou de limite de tempo entre envios.
   * @param e - Evento de envio do formulário.
   */
  async function handleResendVerification(e: React.FormEvent) {
    e.preventDefault()
    setResendError(null)
    setResendMessage(null)
    setResendLoading(true)

    const email = resendEmail.trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResendError('Digite um e-mail válido')
      setResendLoading(false)
      return
    }

    try {
      await resendVerificationEmail(email)
      setResendMessage('Se existir uma conta não verificada com esse e-mail, enviaremos um novo link de confirmação')
      setResendEmail('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao reenviar e-mail'
      if (message.includes('Aguarde um minuto')) {
        setResendError('Aguarde um minuto antes de solicitar outro e-mail')
      } else {
        setResendError(message)
      }
    } finally {
      setResendLoading(false)
    }
  }

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
              <p className="pde-eyebrow"><span className="pde-eyebrow__line" />Verificação de email</p>
              <h1 className="pde-headline">
                Link <span className="pde-accent">inválido</span>.
              </h1>
              <p className="pde-sub">
                O link de verificação é inválido ou está incompleto.
                Acesse seu email e clique no link enviado.
              </p>
            </div>
            <p className="pde-copyright">© 2026 Todos os direitos reservados a Projeto Integrador Fatec</p>
          </div>
        </aside>

        <main className="pde-form-panel">
          <div className="pde-form-panel__inner">
            <header className="pde-form-header">
              <h2>Verificação</h2>
              <p><span>inválida</span></p>
            </header>
            <div className="pde-panel pde-panel--enter-right">
              <div className="pde-login-success">
                <span className="pde-login-success__ring pde-login-success__ring--error">
                  <Icon name="x" />
                </span>
                <p className="pde-done__title">Link <span>inválido</span></p>
                <p className="pde-login-success__sub">
                  Acesse seu email e clique no link de verificação enviado.
                </p>
                <div className="pde-resend-form">
                  {resendMessage && <p className="pde-resend-msg pde-resend-msg--ok">{resendMessage}</p>}
                  {resendError && <p className="pde-resend-msg pde-resend-msg--error">{resendError}</p>}
                  <form onSubmit={handleResendVerification}>
                    <input
                      type="email"
                      placeholder="Seu e-mail"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      disabled={resendLoading}
                      autoComplete="email"
                    />
                    <button
                      type="submit"
                      className="pde-btn pde-btn--secondary"
                      disabled={resendLoading}
                    >
                      {resendLoading ? 'Enviando…' : 'Reenviar e-mail'}
                    </button>
                  </form>
                </div>
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
            <p className="pde-eyebrow"><span className="pde-eyebrow__line" />Verificação de email</p>
            <h1 className="pde-headline">
              Confirme seu<br />
              <span className="pde-accent">email</span>.
            </h1>
            <p className="pde-sub">
              Estamos validando seu endereço de email para ativar sua conta.
            </p>
          </div>
          <p className="pde-copyright">© 2026 Todos os direitos reservados a Projeto Integrador Fatec</p>
        </div>
      </aside>

      <main className="pde-form-panel">
        <div className="pde-form-panel__inner">
          <header className="pde-form-header">
            <h2>Verificação de</h2>
            <p><span>email</span></p>
          </header>

          <div className="pde-panel pde-panel--enter-right">
            {status === 'loading' && (
              <div className="pde-login-success">
                <span className="pde-login-success__ring pde-login-success__ring--loading">
                  <Icon name="mail" />
                </span>
                <p className="pde-done__title">Verificando...</p>
                <p className="pde-login-success__sub">
                  Aguarde enquanto validamos seu email.
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="pde-login-success">
                <span className="pde-login-success__ring">
                  <Icon name="check" />
                </span>
                <p className="pde-done__title">Email <span>verificado!</span></p>
                <p className="pde-login-success__sub">
                  Sua conta foi ativada com sucesso. Agora você pode fazer login na plataforma.
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

            {status === 'error' && (
              <div className="pde-login-success">
                <span className="pde-login-success__ring pde-login-success__ring--error">
                  <Icon name="x" />
                </span>
                <p className="pde-done__title">Erro na <span>verificação</span></p>
                <p className="pde-login-success__sub">
                  {errorMsg}
                </p>
                <div className="pde-resend-form">
                  {resendMessage && <p className="pde-resend-msg pde-resend-msg--ok">{resendMessage}</p>}
                  {resendError && <p className="pde-resend-msg pde-resend-msg--error">{resendError}</p>}
                  <form onSubmit={handleResendVerification}>
                    <input
                      type="email"
                      placeholder="Seu e-mail"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      disabled={resendLoading}
                      autoComplete="email"
                    />
                    <button
                      type="submit"
                      className="pde-btn pde-btn--secondary"
                      disabled={resendLoading}
                    >
                      {resendLoading ? 'Enviando…' : 'Reenviar e-mail'}
                    </button>
                  </form>
                </div>
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
