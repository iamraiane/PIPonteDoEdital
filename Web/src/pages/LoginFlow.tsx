import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import logoNome from '../assets/logo-nome.png'
import logoPonte from '../assets/logo-ponte.png'
import { login, resendVerificationEmail, ApiError } from '../services/user'
import { sanitizeInput, sanitizeEmail, validateEmail } from '../utils/validation'
import './LoginFlow.css'

/** Diferenciais da plataforma exibidos na coluna lateral do login. */
const FEATURES = [
  { icon: 'bookmark', text: 'Salve seus editais de interesse para ser alertado' },
  { icon: 'bell', text: 'Fique por dentro de novos editais' },
  { icon: 'edit', text: 'Edite suas preferências quando quiser' },
]

/** Campos do formulário de autenticação. */
type LoginData = {
  email: string
  senha: string
}

/** Valores iniciais do formulário de login. */
const initialForm: LoginData = {  
  email: '',
  senha: '',
}

/**
 * Renderiza um ícone SVG inline de acordo com o nome informado.
 * @param name - Identificador do ícone (ex.: 'bookmark', 'mail', 'eye', 'check').
 * @returns O elemento SVG correspondente, ou null para nomes desconhecidos.
 */
function Icon({ name }: { name: string }) {
  switch (name) {
    case 'bookmark':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" strokeLinejoin="round" />
        </svg>
      )
    case 'bell':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
      )
    case 'edit':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" strokeLinejoin="round" />
          <path d="M13.5 8 16 10.5" strokeLinecap="round" />
        </svg>
      )
    case 'mail':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m4 6.5 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
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
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M4 12.5 9.5 18 20 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default:
      return null
  }
}

/**
 * Tela de login: valida as credenciais, autentica o usuário e o
 * redireciona para o feed. Quando o e-mail ainda não foi verificado,
 * exibe o aviso com a opção de reenviar o link de confirmação.
 */
export default function LoginFlow() {
  const navigate = useNavigate()
  const [form, setForm] = useState<LoginData>(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [shake, setShake] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [errorKey, setErrorKey] = useState(0)
  const [touched, setTouched] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)
  const [resendErr, setResendErr] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  /**
   * Decrementa o contador de espera para reenvio de e-mail a cada segundo.
   */
  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])


  /**
   * Ativa a animação de entrada da página logo após a montagem do componente.
   */
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  /** Indica se o e-mail digitado passa na validação de formato. */
  const emailValid = validateEmail(form.email) === null
  /** Indica se a senha digitada possui o mínimo de 8 caracteres. */
  const senhaValid = form.senha.length >= 8
  /** Indica se todos os campos do formulário de login estão válidos. */
  const formValid = emailValid && senhaValid

  /**
   * Sanitiza e atualiza o e-mail do formulário, atualizando o erro em seguida.
   * @param value - Texto digitado pelo usuário.
   */
  function handleEmailChange(value: string) {
    const sanitized = sanitizeEmail(value)
    setForm((f) => ({ ...f, email: sanitized }))
    const error = validateEmail(sanitized)
    setEmailError(error || '')
  }

  /**
   * Sanitiza e atualiza a senha do formulário de login.
   * @param value - Texto digitado pelo usuário.
   */
  function handleSenhaChange(value: string) {
    const sanitized = sanitizeInput(value)
    setForm((f) => ({ ...f, senha: sanitized }))
  }

  /**
   * Revalida o e-mail quando o campo perde o foco,
   * atualizando a mensagem de erro exibida.
   */
  function handleEmailBlur() {
    const error = validateEmail(form.email)
    setEmailError(error || '')
  }

  /**
   * Dispara a animação de "shake" no formulário para sinalizar
   * erro de validação ou de autenticação.
   */
  function triggerShake() {
    setShake(true)
    window.setTimeout(() => setShake(false), 420)
  }

  /**
   * Valida o formulário e envia a solicitação de login. Em caso de
   * sucesso, armazena o token e redireciona para o feed; em caso de
   * e-mail não verificado, exibe o aviso de reenvio da confirmação.
   * @param e - Evento de envio do formulário.
   */
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    setEmailError(validateEmail(form.email) || '')

    if (!formValid || status === 'loading') {
      triggerShake()
      return
    }

    setStatus('loading')
    setErrorMessage('')
    setEmailNotVerified(false)
    setResendMsg(null)
    setResendErr(null)
    setShake(false)

  login(form.email, form.senha)
    .then(async (data) => {
      localStorage.setItem('token', data.token)
      localStorage.setItem('loginTime', String(Date.now()))

      setStatus('success')

      window.setTimeout(() => {
        window.location.href = '/dashboard/feed'
      }, 1300)
    })
    .catch((err: unknown) => {
      setStatus('error')
      const notVerified =
        err instanceof ApiError &&
        (err.code === 'EMAIL_NOT_VERIFIED' || (err.status === 403 && err.message.includes('Confirme seu e-mail')))
      if (notVerified) {
        setEmailNotVerified(true)
      } else {
        setErrorMessage('Email ou senha inválidos')
      }
      setErrorKey((k) => k + 1)
      triggerShake()
    })
  }

  /**
   * Solicita o reenvio do e-mail de verificação, tratando mensagens
   * de limite de tempo e reiniciando o contador de espera quando aplicável.
   */
  async function handleResend() {
    setResendMsg(null)
    setResendErr(null)
    setResendLoading(true)

    try {
      await resendVerificationEmail(form.email)
      setResendMsg('Se existir uma conta não verificada com esse e-mail, enviaremos um novo link de confirmação.')
      setCooldown(60)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao reenviar e-mail'
      if (message.includes('Aguarde um minuto')) {
        setResendErr('Aguarde um minuto antes de solicitar outro e-mail.')
        setCooldown(60)
      } else {
        setResendErr(message)
      }
    } finally {
      setResendLoading(false)
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
            <p className="pde-eyebrow"><span className="pde-eyebrow__line" />Plataforma de editais</p>
            <h1 className="pde-headline">
              Personalize com<br />
              <span className="pde-accent">seus</span> interesses.
            </h1>
            <p className="pde-sub">
              É bom te ver de volta para ficar sempre por dentro de novos
              editais disponíveis e não perder nenhum dos prazos.
            </p>

            <ul className="pde-features">
              {FEATURES.map((f, i) => (
                <li
                  key={f.text}
                  className="pde-features__item"
                  style={{ transitionDelay: `${420 + i * 110}ms` }}
                >
                  <span className="pde-features__icon"><Icon name={f.icon} /></span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="pde-copyright">© 2026 Todos os direitos reservados a Projeto Integrador Fatec</p>
        </div>
      </aside>

      <main className="pde-form-panel">
        <div className="pde-form-panel__inner">
          {status === 'success' ? (
            <div className="pde-login-success">
              <span className="pde-login-success__ring">
                <Icon name="check" />
              </span>
              <p className="pde-done__title">
                De volta, <span>bem-vindo!</span>
              </p>
              <p className="pde-login-success__sub">Redirecionando para o seu feed de editais…</p>
            </div>
          ) : (
            <>
              <header className="pde-form-header">
                <h2>De volta</h2>
                <p><span>ao Ponte do Edital</span></p>
              </header>

              <form
                className={`pde-fields pde-stage ${shake ? 'pde-stage--shake' : ''}`}
                onSubmit={handleSubmit}
                noValidate
              >
                {status === 'error' && emailNotVerified && (
                  <div key={errorKey} className="pde-verify-notice">
                    <p className="pde-error">E-mail não verificado</p>
                    <p className="pde-verify-notice__text">
                      Este e-mail ainda não foi confirmado. Verifique sua caixa de entrada e
                      clique no link de confirmação antes de entrar. Não recebeu?{' '}
                      <strong>{form.email}</strong>
                    </p>
                    {resendMsg && <p className="pde-resend-status pde-resend-status--ok">{resendMsg}</p>}
                    {resendErr && <p className="pde-resend-status pde-resend-status--error">{resendErr}</p>}
                    <div className="pde-resend-link">
                      Não recebeu o email?{' '}
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendLoading || cooldown > 0}
                      >
                        {resendLoading
                          ? 'Enviando…'
                          : cooldown > 0
                            ? `Aguarde ${cooldown}s para reenviar`
                            : 'Reenviar verificação'}
                      </button>
                    </div>
                  </div>
                )}
                {status === 'error' && !emailNotVerified && (
                  <p key={errorKey} className="pde-error">{errorMessage}</p>
                )}
                <div className="pde-field">
                  <label htmlFor="login-email">E-mail</label>
                  <div className={`pde-input-icon ${touched && !emailValid ? 'is-invalid' : ''}`}>
                    <input
                      id="login-email"
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={form.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={handleEmailBlur}
                      autoComplete="email"
                    />
                    <span className="pde-input-icon__glyph"><Icon name="mail" /></span>
                  </div>
                  {touched && emailError && <span className="pde-field-error">{emailError}</span>}
                </div>

                <div className="pde-field">
                  <label htmlFor="login-senha">Senha</label>
                  <div className={`pde-input-icon ${touched && !senhaValid ? 'is-invalid' : ''}`}>
                    <input
                      id="login-senha"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha"
                      value={form.senha}
                      onChange={(e) => handleSenhaChange(e.target.value)}
                      autoComplete="current-password"
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

                <a
                  href="#recuperar"
                  className="pde-forgot"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate('/recover')
                  }}
                >
                  Esqueci minha senha
                </a>

                <div className="pde-actions pde-actions--center">
                  <button
                    type="submit"
                    className={`pde-btn pde-btn--primary ${status === 'loading' ? 'is-loading' : ''}`}
                    disabled={status === 'loading'}
                  >
                    <span className="pde-btn__label">Entrar</span>
                    <Icon name="arrow" />
                    <span className="pde-btn__spinner" aria-hidden="true" />
                  </button>
                </div>
              </form>

              <p className="pde-login-hint">
                Ainda não tem conta?{' '}
                <a
                  href="#criar"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate('/signup')
                  }}
                >
                  Criar uma conta <Icon name="arrow" />
                </a>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}