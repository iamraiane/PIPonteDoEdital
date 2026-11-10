import { useState, type FormEvent } from 'react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logoNome from '../assets/logo-nome.png'
import logoPonte from '../assets/logo-ponte.png'
import { resetPassword } from '../services/user'
import './ResetPasswordPage.css'

function Icon({ name }: { name: string }) {
  switch (name) {
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M4 12.5 9.5 18 20 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'lock':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="11" width="18" height="11" rx="2.5" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
        </svg>
      )
    case 'eye':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="2.7" />
        </svg>
      )
    case 'eyeOff':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 3l18 18" strokeLinecap="round" />
          <path d="M10.6 5.7A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15 15 0 0 1-3.2 3.9M6.6 6.9C4 8.7 2.5 12 2.5 12S6 18.5 12 18.5c1.2 0 2.3-.2 3.3-.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.9 10c-.3.5-.4 1-.4 1.6 0 1.5 1.2 2.7 2.7 2.7.6 0 1.1-.2 1.6-.5" strokeLinecap="round" />
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

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [mounted, setMounted] = useState(false)
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [touched, setTouched] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const senhaValid = senha.length >= 8
  const hasToken = !!token

  function triggerShake() {
    setShake(true)
    window.setTimeout(() => setShake(false), 420)
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!senhaValid) {
      triggerShake()
      return
    }
    if (!token) return
    setStatus('loading')
    setErrorMsg('')
    try {
      await resetPassword(token, senha)
      setStatus('success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao redefinir senha.'
      setErrorMsg(message)
      setStatus('error')
    }
  }

  if (!hasToken) {
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
                Link <span className="pde-accent">inválido</span>.
              </h1>
              <p className="pde-sub">
                O link de redefinição de senha é inválido ou está incompleto.
                Solicite uma nova recuperação de senha.
              </p>
            </div>

            <p className="pde-copyright">© 2026 Todos os direitos reservados a Projeto Integrador Fatec</p>
          </div>
        </aside>

        <main className="pde-form-panel">
          <div className="pde-form-panel__inner">
            <header className="pde-form-header">
              <h2>Link</h2>
              <p><span>inválido</span></p>
            </header>

            <div className="pde-panel pde-panel--enter-right">
              <div className="pde-login-success">
                <span className="pde-login-success__ring pde-login-success__ring--error">
                  <Icon name="eyeOff" />
                </span>
                <p className="pde-done__title">
                  Link <span>inválido</span>
                </p>
                <p className="pde-login-success__sub">
                  Solicite uma nova recuperação de senha pelo login.
                </p>
                <div className="pde-actions pde-actions--center">
                  <button
                    type="button"
                    className="pde-btn pde-btn--primary"
                    onClick={() => navigate('/recover')}
                  >
                    Solicitar nova recuperação <Icon name="arrow" />
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
            <p className="pde-eyebrow"><span className="pde-eyebrow__line" />Recuperação de acesso</p>
            <h1 className="pde-headline">
              Redefina a sua<br />
              <span className="pde-accent">senha</span>.
            </h1>
            <p className="pde-sub">
              Crie uma nova senha segura para acessar a plataforma novamente.
            </p>

            <div className="pde-note">
              <span className="pde-note__icon"><Icon name="lock" /></span>
              <p>Sua nova senha deve ter no mínimo 8 caracteres.</p>
            </div>
          </div>

          <p className="pde-copyright">© 2026 Todos os direitos reservados a Projeto Integrador Fatec</p>
        </div>
      </aside>

      <main className="pde-form-panel">
        <div className="pde-form-panel__inner">
          <header className="pde-form-header">
            <h2>Redefina sua</h2>
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
                    Senha <span>redefinida!</span>
                  </p>
                  <p className="pde-login-success__sub">
                    Sua senha foi alterada com sucesso. Você já pode entrar na plataforma.
                  </p>
                  <div className="pde-actions pde-actions--center">
                    <button
                      type="button"
                      className="pde-btn pde-btn--primary"
                      onClick={() => navigate('/login')}
                    >
                      Entrar na plataforma <Icon name="arrow" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div key="reset" className="pde-panel pde-panel--enter-right">
                <form className="pde-fields" onSubmit={handleResetPassword} noValidate>
                  <div className="pde-step-heading">
                    <p className="pde-step-title">Redefina sua senha</p>
                    <p className="pde-step-sub">
                      Digite sua nova senha para ter acesso à plataforma novamente
                    </p>
                  </div>

                  {errorMsg && (
                    <p className="pde-error-message">{errorMsg}</p>
                  )}

                  <div className="pde-field">
                    <label htmlFor="reset-senha">Nova senha</label>
                    <div className={`pde-input-icon ${touched && !senhaValid ? 'is-invalid' : ''}`}>
                      <input
                        id="reset-senha"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Digite sua nova senha"
                        value={senha}
                        onChange={(ev) => setSenha(ev.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="pde-input-icon__glyph pde-input-icon__glyph--btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        <Icon name={showPassword ? 'eyeOff' : 'eye'} />
                      </button>
                    </div>
                  </div>

                  <div className="pde-actions pde-actions--center">
                    <button
                      type="submit"
                      className={`pde-btn pde-btn--primary ${status === 'loading' ? 'is-loading' : ''}`}
                      disabled={status === 'loading'}
                    >
                      <span className="pde-btn__label">Redefinir</span>
                      <Icon name="arrow" />
                      <span className="pde-btn__spinner" aria-hidden="true" />
                    </button>
                  </div>
                </form>

                <p className="pde-login-hint">
                  <a
                    href="#entrar"
                    onClick={(ev) => {
                      ev.preventDefault()
                      navigate('/login')
                    }}
                  >
                    Voltar ao login <Icon name="arrow" />
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
