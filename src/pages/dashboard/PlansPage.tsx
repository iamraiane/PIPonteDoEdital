import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { DashIcon } from './Icons'
import { PLANS } from '../../data/plans'
import {
  createSubscription,
  syncSubscriptions,
  cancelSubscription,
} from '../../services/subscription'
import './PlansPage.css'

function redirectTo(url: string) {
  window.location.href = url
}

export default function PlansPage({ hasPremium = false }: { hasPremium?: boolean }) {
  const navigate = useNavigate()
  const [subscribing, setSubscribing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCta(plan: typeof PLANS[number]) {
    if (plan.action === 'navigate') {
      navigate('/dashboard/feed')
      return
    }

    if (hasPremium) return

    setSubscribing(true)
    setError(null)
    try {
      const subscription = await createSubscription()
      redirectTo(subscription.checkoutUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível iniciar a assinatura.')
      setSubscribing(false)
    }
  }

  async function handleConfirmCancel() {
    setCancelling(true)
    setError(null)
    try {
      const sync = await syncSubscriptions()
      const active =
        sync.subscriptions.find((s) => s.status === 'authorized') ??
        sync.subscriptions.find((s) => s.status === 'pending')
      if (!active) {
        throw new Error('Nenhuma assinatura ativa encontrada para cancelar.')
      }
      await cancelSubscription(active.id)
      redirectTo('/dashboard/plans')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível cancelar a assinatura.')
      setCancelling(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div className="pdd-plans-page">
      <h1 className="pdd-page-title">Planos</h1>
      <p className="pdd-plans-sub">Escolha o plano ideal para você</p>

      <div className="pdd-plans-grid">
        {PLANS.map((p, i) => {
          const isActivePremium = p.action === 'subscribe' && hasPremium
          return (
        <div
          key={p.id}
          className={`pdd-plan-card ${p.featured ? 'is-featured' : ''}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {p.featured && <span className="pdd-plan-badge">mais popular</span>}

          <p className="pdd-plan-card__nome">{p.name}</p>
          <p className="pdd-plan-card__preco">
            {p.price}<span>{p.period}</span>
          </p>

              <ul className="pdd-plan-card__features">
                {p.features.map((f) => (
                  <li key={f}>
                    <span className="pdd-plan-check"><DashIcon name="check" /></span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`pdd-plan-cta ${p.destaque ? 'is-primary' : ''} ${isActivePremium ? 'is-active' : ''}`}
                disabled={isActivePremium || subscribing || cancelling}
                onClick={() => handleCta(p)}
              >
                {isActivePremium
                  ? 'Você já é Premium'
                  : p.action === 'subscribe' && subscribing
                    ? 'Abrindo checkout…'
                    : p.cta}
              </button>

              {isActivePremium && (
                <button
                  type="button"
                  className="pdd-plan-cancel"
                  disabled={cancelling}
                  onClick={() => setConfirmOpen(true)}
                >
                  {cancelling ? 'Cancelando…' : 'Cancelar assinatura'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {error && <p className="pdd-plans-error">{error}</p>}

      {createPortal(
        <div
          className={`pdd-plan-overlay ${confirmOpen ? 'is-open' : ''}`}
          onClick={() => !cancelling && setConfirmOpen(false)}
        >
          <div
            className={`pdd-plan-modal ${confirmOpen ? 'is-open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Cancelar assinatura"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="pdd-plan-modal__icon">
              <DashIcon name="close" />
            </span>
            <h2 className="pdd-plan-modal__title">Cancelar assinatura?</h2>
            <p className="pdd-plan-modal__text">
              Você perde o acesso Premium imediatamente, mesmo já tendo pago este mês.
              Esta ação não pode ser desfeita.
            </p>
            <div className="pdd-plan-modal__actions">
              <button
                type="button"
                className="pdd-plan-modal__btn pdd-plan-modal__btn--secondary"
                disabled={cancelling}
                onClick={() => setConfirmOpen(false)}
              >
                Manter Premium
              </button>
              <button
                type="button"
                className="pdd-plan-modal__btn pdd-plan-modal__btn--danger"
                disabled={cancelling}
                onClick={handleConfirmCancel}
              >
                {cancelling ? 'Cancelando…' : 'Cancelar assinatura'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
