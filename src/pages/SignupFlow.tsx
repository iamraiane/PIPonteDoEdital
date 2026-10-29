import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { useNavigate } from 'react-router-dom'
import logoNome from '../assets/logo-nome.png'
import logoPonte from '../assets/logo-ponte.png'
import { register, updateUser, getTokenPayload, resendVerificationEmail } from '../services/user'
import { sanitizeInput, sanitizeName, sanitizeEmail, validateName, validateEmail, validatePassword, sanitizeCpf, formatCpf, validateCpf } from '../utils/validation'
import './SignupFlow.css'

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
]

const INTERESSES = [
  'Tecnologia', 'Educação', 'Saúde', 'Infraestrutura',
  'Cultura', 'Serviços', 'Consultoria', 'Engenharia',
]

const FEATURES = [
  { icon: 'clipboard', text: 'Acompanhamento de prazos' },
  { icon: 'search', text: 'Filtros avançados por assunto' },
  { icon: 'bell', text: 'Alertas personalizados por interesse' },
]

type FormData = {
  nome: string
  estado: string
  cpf: string
  dataNascimento: string
  email: string
  senha: string
  confirmarSenha: string
  interesses: string[]
}

const initialForm: FormData = {
  nome: '',
  estado: 'SP',
  cpf: '',
  dataNascimento: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  interesses: [],
}

// ---------- rascunho do cadastro (sessionStorage) ----------
// Salva o preenchimento para não perder os dados em um refresh (F5).
// As senhas nunca são gravadas: se o usuário der F5, basta redigitá-las.

const DRAFT_KEY = 'signup-draft'

type Draft = {
  form: Omit<FormData, 'senha' | 'confirmarSenha'>
  acceptTerms: boolean
  step: 1 | 2 | 3
  userEmail: string
}

function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<Draft> | null
    if (!parsed || typeof parsed !== 'object' || typeof parsed.form !== 'object' || parsed.form === null) {
      return null
    }

    const f = parsed.form
    const draft: Draft = {
      form: {
        nome: typeof f.nome === 'string' ? f.nome : '',
        estado: typeof f.estado === 'string' && ESTADOS.includes(f.estado) ? f.estado : initialForm.estado,
        cpf: typeof f.cpf === 'string' ? f.cpf : '',
        dataNascimento: typeof f.dataNascimento === 'string' ? f.dataNascimento : '',
        email: typeof f.email === 'string' ? f.email : '',
        interesses: Array.isArray(f.interesses) && f.interesses.every((i) => typeof i === 'string')
          ? f.interesses
          : [],
      },
      acceptTerms: parsed.acceptTerms === true,
      step: parsed.step === 2 || parsed.step === 3 ? parsed.step : 1,
      userEmail: typeof parsed.userEmail === 'string' ? parsed.userEmail : '',
    }

    // Passo 2/3 pressupõe a conta já criada (token no localStorage).
    // Sem token válido o rascunho não serve mais — descarta e recomeça.
    if (draft.step > 1 && !getTokenPayload()?.id) {
      clearDraft()
      return null
    }

    return draft
  } catch {
    return null
  }
}

function saveDraft(draft: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // storage indisponível (aba anônima, cota) — segue sem rascunho
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // storage indisponível — nada a limpar
  }
}

// Nunca grava senha/confirmarSenha no rascunho
function toDraftForm({
  nome,
  estado,
  cpf,
  dataNascimento,
  email,
  interesses,
}: FormData): Draft['form'] {
  return { nome, estado, cpf, dataNascimento, email, interesses }
}

// ---------- validação de senha ----------

type PasswordChecks = {
  length: boolean
  upper: boolean
  lower: boolean
  special: boolean
}

function getPasswordChecks(senha: string): PasswordChecks {
  return {
    length: senha.length >= 8,
    upper: /[A-Z]/.test(senha),
    lower: /[a-z]/.test(senha),
    special: /[^A-Za-z0-9]/.test(senha),
  }
}

function isPasswordValid(checks: PasswordChecks) {
  return checks.length && checks.upper && checks.lower && checks.special
}

function Icon({ name }: { name: string }) {
  switch (name) {
    case 'clipboard':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="4.5" width="14" height="16" rx="2" />
            <path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5" strokeLinecap="round" />
            <path d="M8.5 11.5h7M8.5 15h4.5" strokeLinecap="round" />
        </svg>
      )
    case 'search':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M20 20l-4.3-4.3" strokeLinecap="round" />
        </svg>
      )
    case 'bell':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 0 0 4 0" strokeLinecap="round" />
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
    case 'back':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'id':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="4" width="20" height="16" rx="2.5" />
          <circle cx="8" cy="10.5" r="2.5" />
          <path d="M4 18c0-2 1.8-3 4-3s4 1 4 3" strokeLinecap="round" />
          <path d="M14 9.5h6M14 13h4" strokeLinecap="round" />
        </svg>
      )
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
          <path d="M3 9.5h18" strokeLinecap="round" />
          <path d="M8 2.5v4M16 2.5v4" strokeLinecap="round" />
        </svg>
      )
    case 'dot':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="4" />
        </svg>
      )
    default:
      return null
  }
}

export default function SignupFlow() {
  const navigate = useNavigate()
  const [draft] = useState<Draft | null>(readDraft)
  const [step, setStep] = useState<1 | 2 | 3>(draft?.step ?? 1)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [form, setForm] = useState<FormData>(() =>
    draft ? { ...initialForm, ...draft.form } : initialForm
  )
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [shake, setShake] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [senhaTouched, setSenhaTouched] = useState(false)
  const [confirmarSenhaTouched, setConfirmarSenhaTouched] = useState(false)
  const [nomeError, setNomeError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [senhaErrorMsg, setSenhaErrorMsg] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(draft?.acceptTerms ?? false)
  const [cpfError, setCpfError] = useState('')
  const [cpfTouched, setCpfTouched] = useState(false)
  const [termsError, setTermsError] = useState('')
  const [dataNascimentoError, setDataNascimentoError] = useState('')
  const [userId, setUserId] = useState<number | null>(() =>
    draft && draft.step > 1 ? getTokenPayload()?.id ?? null : null
  )
  const [userEmail, setUserEmail] = useState(draft?.userEmail ?? '')

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  // Mantém o rascunho sempre atualizado (sem as senhas)
  useEffect(() => {
    saveDraft({ form: toDraftForm(form), acceptTerms, step, userEmail })
  }, [form, acceptTerms, step, userEmail])

  const passwordChecks = getPasswordChecks(form.senha)
  const senhaValid = isPasswordValid(passwordChecks)
  const senhasCoincidem = form.confirmarSenha.length > 0 && form.confirmarSenha === form.senha

  const step1Valid =
    validateName(form.nome) === null &&
    form.estado !== '' &&
    validateCpf(form.cpf) === null &&
    validateEmail(form.email) === null &&
    form.dataNascimento.trim().length > 0 &&
    senhaValid &&
    senhasCoincidem &&
    acceptTerms
  const step2Valid = form.interesses.length > 0

  function goTo(next: 1 | 2 | 3, dir: 1 | -1) {
    setDirection(dir)
    setStep(next)
  }

  function handleContinueStep1() {
    if (!step1Valid) {
      setNomeError(validateName(form.nome) || '')
      setCpfError(validateCpf(form.cpf) || '')
      setEmailError(validateEmail(form.email) || '')
      setDataNascimentoError(form.dataNascimento.trim().length > 0 ? '' : 'Data de Nascimento é obrigatória')
      setSenhaTouched(true)
      setConfirmarSenhaTouched(true)
      setCpfTouched(true)
      setTermsError(acceptTerms ? '' : 'Você precisa aceitar os Termos de Uso e a Política de Privacidade.')
      triggerShake()
      return
    }

    if (status === 'loading') return
    setStatus('loading')
    setEmailError('')
    setCpfError('')

    register(form.nome, form.email, form.senha, sanitizeCpf(form.cpf), form.dataNascimento, form.interesses, form.estado)
      .then((data) => {
        localStorage.setItem('token', data.token)
        const payload = getTokenPayload()
        if (payload?.id) setUserId(payload.id)
        setUserEmail(form.email)
        setStatus('idle')
        goTo(2, 1)
      })
      .catch((err) => {
        setStatus('idle')
        const msg = err.message || 'Erro ao criar conta'
        if (msg.toLowerCase().includes('email')) {
          setEmailError(msg)
        } else if (msg.toLowerCase().includes('cpf')) {
          setCpfError(msg)
        } else {
          setErrorMessage(msg)
        }
        triggerShake()
      })
  }

  function handleContinueStep2() {
    if (!step2Valid) {
      triggerShake()
      return
    }
    if (userId) {
      updateUser(userId, { preferences: form.interesses })
        .then(() => goTo(3, 1))
        .catch(() => goTo(3, 1))
    } else {
      goTo(3, 1)
    }
  }

  function handleNomeChange(value: string) {
    const sanitized = sanitizeName(value)
    setForm((f) => ({ ...f, nome: sanitized }))
    setNomeError(validateName(sanitized) || '')
  }

  function handleEmailChange(value: string) {
    const sanitized = sanitizeEmail(value)
    setForm((f) => ({ ...f, email: sanitized }))
    setEmailError(validateEmail(sanitized) || '')
  }

  function handleCpfChange(value: string) {
    const formatted = formatCpf(value)
    setForm((f) => ({ ...f, cpf: formatted }))
    setCpfError(validateCpf(formatted) || '')
  }

  function handleSenhaChange(value: string) {
    const sanitized = sanitizeInput(value)
    setForm((f) => ({ ...f, senha: sanitized }))
    setSenhaErrorMsg(validatePassword(sanitized) || '')
  }

  function handleConfirmarSenhaChange(value: string) {
    const sanitized = sanitizeInput(value)
    setForm((f) => ({ ...f, confirmarSenha: sanitized }))
  }

  function triggerShake() {
    setShake(true)
    window.setTimeout(() => setShake(false), 420)
  }

  function toggleInteresse(item: string) {
    setForm((f) => ({
      ...f,
      interesses: f.interesses.includes(item)
        ? f.interesses.filter((i) => i !== item)
        : [...f.interesses, item],
    }))
  }

  function handleFinish() {
    clearDraft()
    localStorage.removeItem('token')
    navigate('/login')
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
              Encontre os editais<br />
              <span className="pde-accent">certos</span> para você.
            </h1>
            <p className="pde-sub">
              Faça parte da plataforma para ficar por dentro dos seus editais
              favoritos e não perder nenhum prazo despercebido.
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
          <div className="pde-form-sticky">
            <header className="pde-form-header">
              <h2>Vamos criar sua conta</h2>
              <p><span>no Ponte do Edital</span></p>
            </header>

            <Stepper step={step} />
          </div>

          <div className={`pde-stage ${shake ? 'pde-stage--shake' : ''}`}>
            <div
              key={step}
              className={`pde-panel pde-panel--enter-${direction === 1 ? 'right' : 'left'}`}
            >
              {step === 1 && (
                <StepAccount
                  form={form}
                  setForm={setForm}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  onContinue={handleContinueStep1}
                  passwordChecks={passwordChecks}
                  senhaTouched={senhaTouched}
                  onSenhaTouched={() => setSenhaTouched(true)}
                  senhasCoincidem={senhasCoincidem}
                  confirmarSenhaTouched={confirmarSenhaTouched}
                  onConfirmarSenhaTouched={() => setConfirmarSenhaTouched(true)}
                  onNomeChange={handleNomeChange}
                  onEmailChange={handleEmailChange}
                  onSenhaChange={handleSenhaChange}
                  onConfirmarSenhaChange={handleConfirmarSenhaChange}
                  onCpfChange={handleCpfChange}
                  cpfError={cpfError}
                  cpfTouched={cpfTouched}
                  onCpfTouched={() => setCpfTouched(true)}
                  nomeError={nomeError}
                  emailError={emailError}
                  senhaErrorMsg={senhaErrorMsg}
                  acceptTerms={acceptTerms}
                  onAcceptTermsChange={setAcceptTerms}
                  termsError={termsError}
                  setTermsError={setTermsError}
                  dataNascimentoError={
                    form.dataNascimento.length > 0 ? '' : dataNascimentoError
                  }
                />
              )}
              {step === 2 && (
                <StepInterests
                  selected={form.interesses}
                  onToggle={toggleInteresse}
                  onBack={() => goTo(1, -1)}
                  onContinue={handleContinueStep2}
                />
              )}
              {step === 3 && (
                <StepDone
                  firstName={form.nome.trim().split(' ')[0] || 'visitante'}
                  email={userEmail}
                  onBack={() => goTo(2, -1)}
                  onFinish={handleFinish}
                  status={status}
                  errorMessage={errorMessage}
                />
              )}
            </div>
          </div>

          <p className="pde-login-hint">
            Já tem conta?{' '}
            <a
              href="#entrar"
              onClick={(e) => {
                e.preventDefault()
                clearDraft()
                navigate('/login')
              }}
            >
              Entrar na plataforma <Icon name="arrow" />
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="pde-stepper" role="list" aria-label="Progresso do cadastro">
      {[1, 2, 3].map((n, i) => (
        <div className="pde-stepper__group" key={n}>
          <div className={`pde-stepper__dot ${step === n ? 'is-current' : ''}`}>
            {n}
          </div>
          {i < 2 && <span className="pde-stepper__dash" aria-hidden="true" />}
        </div>
      ))}
    </div>
  )
}

function StepAccount({
  form,
  setForm,
  showPassword,
  setShowPassword,
  onContinue,
  passwordChecks,
  senhaTouched,
  onSenhaTouched,
  senhasCoincidem,
  confirmarSenhaTouched,
  onConfirmarSenhaTouched,
  onNomeChange,
  onEmailChange,
  onSenhaChange,
  onConfirmarSenhaChange,
  onCpfChange,
  cpfError,
  cpfTouched,
  onCpfTouched,
  nomeError,
  emailError,
  senhaErrorMsg,
  acceptTerms,
  onAcceptTermsChange,
  termsError,
  setTermsError,
  dataNascimentoError,
}: {
  form: FormData
  setForm: Dispatch<SetStateAction<FormData>>
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  onContinue: () => void
  passwordChecks: PasswordChecks
  senhaTouched: boolean
  onSenhaTouched: () => void
  senhasCoincidem: boolean
  confirmarSenhaTouched: boolean
  onConfirmarSenhaTouched: () => void
  onNomeChange: (value: string) => void
  onEmailChange: (value: string) => void
  onSenhaChange: (value: string) => void
  onConfirmarSenhaChange: (value: string) => void
  onCpfChange: (value: string) => void
  cpfError: string
  cpfTouched: boolean
  onCpfTouched: () => void
  nomeError: string
  emailError: string
  senhaErrorMsg: string
  acceptTerms: boolean
  onAcceptTermsChange: (v: boolean) => void
  termsError: string
  setTermsError: (v: string) => void
  dataNascimentoError: string
}) {
  const navigate = useNavigate()
  const showConfirmInvalid = confirmarSenhaTouched && form.confirmarSenha.length > 0 && !senhasCoincidem

  return (
    <form
      className="pde-fields"
      onSubmit={(e) => {
        e.preventDefault()
        onContinue()
      }}
    >
      {showConfirmInvalid && (
        <p className="pde-error">As senhas não coincidem</p>
      )}
      <div className="pde-row">
        <div className="pde-field pde-field--grow">
          <label htmlFor="signup-nome">Nome Completo</label>
          <input
            id="signup-nome"
            type="text"
            placeholder="Digite seu nome"
            value={form.nome}
            onChange={(e) => onNomeChange(e.target.value)}
            autoComplete="name"
          />
          {nomeError && <span className="pde-field-error">{nomeError}</span>}
        </div>

        <div className="pde-field pde-field--estado">
          <label htmlFor="signup-estado">Estado</label>
          <select
            id="signup-estado"
            value={form.estado}
            onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
          >
            {ESTADOS.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pde-field">
        <label htmlFor="signup-email">E-mail</label>
        <div className="pde-input-icon">
          <input
            id="signup-email"
            type="email"
            placeholder="pontedoedital@gmail.com"
            value={form.email}
            onChange={(e) => onEmailChange(e.target.value)}
            autoComplete="email"
          />
          <span className="pde-input-icon__glyph"><Icon name="mail" /></span>
        </div>
        {emailError && <span className="pde-field-error">{emailError}</span>}
      </div>

      <div className="pde-row">
        <div className="pde-field pde-field--grow">
          <label htmlFor="signup-cpf">CPF</label>
          <div className="pde-input-icon">
            <input
              id="signup-cpf"
              type="text"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => onCpfChange(e.target.value)}
              onBlur={onCpfTouched}
              maxLength={14}
              autoComplete="off"
            />
            <span className="pde-input-icon__glyph"><Icon name="id" /></span>
          </div>
          {cpfTouched && cpfError && <span className="pde-field-error">{cpfError}</span>}
        </div>

        <div className="pde-field pde-field--grow">
          <label htmlFor="signup-nascimento">Data de Nascimento</label>
          <div className="pde-input-icon">
            <input
              id="signup-nascimento"
              type="date"
              placeholder="dd/mm/aaaa"
              value={form.dataNascimento}
              onChange={(e) => {
                setForm((f) => ({ ...f, dataNascimento: e.target.value }))
              }}
              autoComplete="bday"
            />
            <span className="pde-input-icon__glyph"><Icon name="calendar" /></span>
          </div>
          {dataNascimentoError && <span className="pde-field-error">{dataNascimentoError}</span>}
        </div>
      </div>

      <div className="pde-password-block">
        <div className="pde-row">
          <div className="pde-field pde-field--grow">
            <label htmlFor="signup-senha">Senha</label>
            <div className="pde-input-icon">
              <input
                id="signup-senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={form.senha}
                onChange={(e) => onSenhaChange(e.target.value)}
                onBlur={onSenhaTouched}
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
            {senhaTouched && senhaErrorMsg && <span className="pde-field-error">{senhaErrorMsg}</span>}
          </div>

          <div className="pde-field pde-field--grow">
            <label htmlFor="signup-confirmar-senha">Confirmar Senha</label>
            <div className={`pde-input-icon ${showConfirmInvalid ? 'has-error' : ''}`}>
              <input
                id="signup-confirmar-senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={form.confirmarSenha}
                onChange={(e) => onConfirmarSenhaChange(e.target.value)}
                onBlur={onConfirmarSenhaTouched}
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
        </div>

        <PasswordRequirements checks={passwordChecks} touched={senhaTouched} />
      </div>

      <div className="pde-terms">
        <label className="pde-terms__item">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => {
              onAcceptTermsChange(e.target.checked)
              if (e.target.checked) setTermsError('')
            }}
          />
          <span>
            Concordo com os{' '}
            <a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Termos de Uso</a>{' '}
            e a{' '}
            <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>Política de Privacidade</a>
          </span>
        </label>
        {termsError && <span className="pde-field-error">{termsError}</span>}
      </div>

      <div className="pde-actions pde-actions--center">
        <button type="submit" className="pde-btn pde-btn--primary">
          Continuar <Icon name="arrow" />
        </button>
      </div>
    </form>
  )
}

function PasswordRequirements({
  checks,
  touched,
}: {
  checks: PasswordChecks
  touched: boolean
}) {
  const items: { key: keyof PasswordChecks; label: string }[] = [
    { key: 'length', label: 'Mínimo de 8 caracteres' },
    { key: 'upper', label: '1 letra maiúscula' },
    { key: 'lower', label: '1 letra minúscula' },
    { key: 'special', label: '1 caractere especial' },
  ]

  return (
    <ul className="pde-pw-reqs" aria-live="polite">
      {items.map((item) => {
        const met = checks[item.key]
        const showInvalid = touched && !met
        return (
          <li
            key={item.key}
            className={`pde-pw-reqs__item ${met ? 'is-met' : ''} ${showInvalid ? 'is-invalid' : ''}`}
          >
            <span className="pde-pw-reqs__icon">
              <Icon name={met ? 'check' : 'dot'} />
            </span>
            {item.label}
          </li>
        )
      })}
    </ul>
  )
}

function StepInterests({
  selected,
  onToggle,
  onBack,
  onContinue,
}: {
  selected: string[]
  onToggle: (item: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <div className="pde-fields">
      <p className="pde-question">Quais são suas áreas de interesse?</p>

      <div className="pde-tags">
        {INTERESSES.map((item, i) => {
          const active = selected.includes(item)
          return (
            <button
              key={item}
              type="button"
              className={`pde-tag ${active ? 'is-active' : ''}`}
              style={{ animationDelay: `${i * 45}ms` }}
              onClick={() => onToggle(item)}
              aria-pressed={active}
            >
              {item}
            </button>
          )
        })}
      </div>

      <div className="pde-actions">
        <button type="button" className="pde-btn pde-btn--ghost" onClick={onBack}>
          <Icon name="back" /> Voltar
        </button>
        <button type="button" className="pde-btn pde-btn--primary" onClick={onContinue}>
          Continuar <Icon name="arrow" />
        </button>
      </div>
    </div>
  )
}

function StepDone({
  email,
  onBack,
  onFinish,
  status,
  errorMessage,
}: {
  firstName: string
  email: string
  onBack: () => void
  onFinish?: () => void
  status?: 'idle' | 'loading' | 'error'
  errorMessage?: string
}) {
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)
  const [resendErr, setResendErr] = useState<string | null>(null)

  async function handleResend() {
    setResendMsg(null)
    setResendErr(null)
    setResendLoading(true)

    try {
      await resendVerificationEmail(email)
      setResendMsg('Se existir uma conta não verificada com esse e-mail, enviaremos um novo link de confirmação.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao reenviar e-mail'
      if (message.includes('Aguarde um minuto')) {
        setResendErr('Aguarde um minuto antes de solicitar outro e-mail.')
      } else {
        setResendErr(message)
      }
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="pde-done">
      {status === 'error' && errorMessage && (
        <p className="pde-error">{errorMessage}</p>
      )}
      <p className="pde-done__title">
        Verifique seu <span>email</span>
      </p>
      <p className="pde-done__sub">
        Enviamos um link de confirmação para <strong>{email}</strong>.
        Clique no link para ativar sua conta antes de fazer login.
      </p>

      {resendMsg && <p className="pde-resend-status pde-resend-status--ok">{resendMsg}</p>}
      {resendErr && <p className="pde-resend-status pde-resend-status--error">{resendErr}</p>}

      <div className="pde-actions">
        <button type="button" className="pde-btn pde-btn--ghost" onClick={onBack}>
          <Icon name="back" /> Voltar
        </button>
        <button
          type="button"
          className="pde-btn pde-btn--primary"
          onClick={onFinish}
        >
          <span className="pde-btn__label">Ir para o login</span>
          <Icon name="arrow" />
        </button>
      </div>

      <p className="pde-resend-link">
        Não recebeu o email?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading}
        >
          {resendLoading ? 'Enviando…' : 'Reenviar verificação'}
        </button>
      </p>
    </div>
  )
}