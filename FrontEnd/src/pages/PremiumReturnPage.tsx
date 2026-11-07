import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { syncSubscriptions } from '../services/subscription'
import './PremiumReturnPage.css'

type Phase = 'checking' | 'success' | 'pending' | 'none' | 'error'

const MAX_ATTEMPTS = 10
const RETRY_MS = 4000

export default function PremiumReturnPage() {
  const [phase, setPhase] = useState<Phase>('checking')
  const [errorMsg, setErrorMsg] = useState('')
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    let cancelled = false
    let attempt = 0
    let timer: number | undefined

    async function check() {
      attempt += 1
      setPhase('checking')
      try {
        const res = await syncSubscriptions()
        if (cancelled) return

        const activated =
          res.role === 'premium' ||
          res.subscriptions.some((s) => s.status === 'authorized')

        if (activated) {
          setPhase('success')
          return
        }

        if (res.subscriptions.length === 0) {
          setPhase('none')
          return
        }

        if (attempt >= MAX_ATTEMPTS) {
          setPhase('pending')
          return
        }

        timer = window.setTimeout(check, RETRY_MS)
      } catch (e) {
        if (cancelled) return
        setErrorMsg(e instanceof Error ? e.message : 'Não foi possível verificar o pagamento.')
        setPhase('error')
      }
    }

    check()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [runId])

  function handleRetry() {
    setErrorMsg('')
    setRunId((n) => n + 1)
  }

  return (
    <div className="pdd-retorno-page">
      <div className="pdd-retorno-card">
        {phase === 'checking' && (
          <>
            <span className="pdd-retorno-icon pdd-retorno-icon--checking">
              <span className="pdd-retorno-spinner" />
            </span>
            <h1 className="pdd-retorno-title">Confirmando seu pagamento…</h1>
            <p className="pdd-retorno-text">
              Aguarde alguns instantes enquanto verificamos com o Mercado Pago.
            </p>
          </>
        )}

        {phase === 'success' && (
          <>
            <span className="pdd-retorno-icon pdd-retorno-icon--success">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h1 className="pdd-retorno-title">Pagamento confirmado!</h1>
            <p className="pdd-retorno-text">
              Seu plano Premium já está ativo. Aproveite todos os recursos da plataforma.
            </p>
            <button
              type="button"
              className="pdd-retorno-btn pdd-retorno-btn--primary"
              onClick={() => {
                window.location.href = '/dashboard/feed'
              }}
            >
              Ir para o feed
            </button>
          </>
        )}

        {phase === 'pending' && (
          <>
            <span className="pdd-retorno-icon pdd-retorno-icon--pending">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h1 className="pdd-retorno-title">Pagamento em processamento</h1>
            <p className="pdd-retorno-text">
              Seu pagamento ainda está sendo confirmado pelo Mercado Pago. Isso costuma levar
              alguns minutos — você pode verificar novamente.
            </p>
            <div className="pdd-retorno-actions">
              <button
                type="button"
                className="pdd-retorno-btn pdd-retorno-btn--primary"
                onClick={handleRetry}
              >
                Verificar novamente
              </button>
              <Link className="pdd-retorno-btn pdd-retorno-btn--secondary" to="/dashboard/plans">
                Voltar aos planos
              </Link>
            </div>
          </>
        )}

        {phase === 'none' && (
          <>
            <span className="pdd-retorno-icon pdd-retorno-icon--pending">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h1 className="pdd-retorno-title">Nenhuma assinatura encontrada</h1>
            <p className="pdd-retorno-text">
              Não encontramos nenhuma assinatura pendente na sua conta. Se você acabou de
              assinar, tente novamente em instantes.
            </p>
            <div className="pdd-retorno-actions">
              <button
                type="button"
                className="pdd-retorno-btn pdd-retorno-btn--primary"
                onClick={handleRetry}
              >
                Verificar novamente
              </button>
              <Link className="pdd-retorno-btn pdd-retorno-btn--secondary" to="/dashboard/plans">
                Ver planos
              </Link>
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <span className="pdd-retorno-icon pdd-retorno-icon--error">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8v5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="12" cy="16.5" r="1.2" fill="currentColor" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <h1 className="pdd-retorno-title">Não foi possível verificar</h1>
            <p className="pdd-retorno-text">{errorMsg}</p>
            <div className="pdd-retorno-actions">
              <button
                type="button"
                className="pdd-retorno-btn pdd-retorno-btn--primary"
                onClick={handleRetry}
              >
                Tentar novamente
              </button>
              <Link className="pdd-retorno-btn pdd-retorno-btn--secondary" to="/dashboard/plans">
                Voltar aos planos
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
