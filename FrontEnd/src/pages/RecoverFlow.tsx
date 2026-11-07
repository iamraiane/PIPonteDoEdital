import { useState, type FormEvent } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoNome from '../assets/logo-nome.png'
import logoPonte from '../assets/logo-ponte.png'
import { forgotPassword } from '../services/user'
import './RecoverFlow.css'

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

export default function RecoverFlow() {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [touched, setTouched] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const emailValid = email.includes('@') && email.includes('.')

  function triggerShake() {
    setShake(true)
    window.setTimeout(() => setShake(false), 420)
  }

  async function handleSendEmail(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!emailValid) {
      triggerShake()
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      await forgotPassword(email)
      setStatus('success')
    } catch {
      setErrorMsg('Erro ao enviar e-mail. Tente novamente.')
      setStatus('error')
    }
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
            <p className="pde-eyebrow"><span className="pde-eyebrow__line" />Recuperação de acesso</p>
            <h1 className="pde-headline">
              Recupere a sua<br />
              <span className="pde-accent">senha</span>.
            </h1>
            <p className="pde-sub">
              Um processo simples, seguro e rápido. Você estará de volta à
              plataforma em poucos minutos.
            </p>

            <div className="pde-note">
              <span className="pde-note__icon"><Icon name="check" /></span>
              <p>Informe seu e-mail e enviaremos um link para você criar uma nova senha.</p>
            </div>
          </div>

          <p className="pde-copyright">© 2026 Todos os direitos reservados a Projeto Integrador Fatec</p>
        </div>
      </aside>

      <main className="pde-form-panel">
        <div className="pde-form-panel__inner">
          <header className="pde-form-header">
            <h2>Recupere sua</h2>
            <p><span>senha</span></p>
          </header>

          <div className={`pde-stage ${shake ? 'pde-stage--shake' : ''}`}>
            {status === 'success' ? (
              <div key="done" className="pde-panel pde-panel--enter-right">
                <div className="pde-login-success">
                  <span className="pde-login-success__ring">
                    <Icon name="check" />
                  </span>
                  <p className="pde-done__title">
                    E-mail <span>enviado!</span>
                  </p>
                  <p className="pde-login-success__sub">
                    Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.
                  </p>
                  <div className="pde-actions pde-actions--center">
                    <button
                      type="button"
                      className="pde-btn pde-btn--primary"
                      onClick={() => navigate('/login')}
                    >
                      Voltar ao login <Icon name="arrow" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div key="email" className="pde-panel pde-panel--enter-right">
                <form className="pde-fields" onSubmit={handleSendEmail} noValidate>
                  <div className="pde-step-heading">
                    <p className="pde-step-title">Qual é seu e-mail?</p>
                    <p className="pde-step-sub">
                      Digite seu e-mail cadastrado. Enviaremos a liberação para redefinir a senha
                    </p>
                  </div>

                  {errorMsg && (
                    <p className="pde-error-message">{errorMsg}</p>
                  )}

                  <div className="pde-field">
                    <label htmlFor="recover-email">E-mail</label>
                    <div className={`pde-input-icon ${touched && !emailValid ? 'is-invalid' : ''}`}>
                      <input
                        id="recover-email"
                        type="email"
                        placeholder="Digite seu e-mail"
                        value={email}
                        onChange={(ev) => setEmail(ev.target.value)}
                        autoComplete="email"
                      />
                      <span className="pde-input-icon__glyph"><Icon name="mail" /></span>
                    </div>
                  </div>

                  <div className="pde-actions pde-actions--center">
                    <button
                      type="submit"
                      className={`pde-btn pde-btn--primary ${status === 'loading' ? 'is-loading' : ''}`}
                      disabled={status === 'loading'}
                    >
                      <span className="pde-btn__label">Enviar</span>
                      <Icon name="arrow" />
                      <span className="pde-btn__spinner" aria-hidden="true" />
                    </button>
                  </div>
                </form>

                <p className="pde-login-hint">
                  Lembrou a senha?{' '}
                  <a
                    href="#entrar"
                    onClick={(ev) => {
                      ev.preventDefault()
                      navigate('/login')
                    }}
                  >
                    Entrar na plataforma <Icon name="arrow" />
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
