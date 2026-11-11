import { authRequest } from './user'

/** Identificador do plano premium usado por padrão nas assinaturas. */
export const PREMIUM_PLAN_ID = 1

/** Resposta da criação de uma assinatura com a URL do checkout. */
export type CreateSubscriptionResponse = {
  message: string
  subscriptionId: number
  status: string
  checkoutUrl: string
}

/** Item de assinatura processado na sincronização. */
export type SyncSubscriptionItem = {
  id: number
  status?: string
  skipped?: string
  error?: string
}

/** Resposta da sincronização de assinaturas com o papel resultante. */
export type SyncSubscriptionResponse = {
  role: string | null
  subscriptions: SyncSubscriptionItem[]
}

/** Resposta do cancelamento de assinatura. */
export type CancelSubscriptionResponse = {
  id: number
  status: string
  role: string | null
}

/**
 * Cria uma nova assinatura e retorna a URL do checkout.
 * @param planId - Identificador do plano (padrão: plano premium).
 * @returns Dados da assinatura criada incluindo a URL de pagamento.
 */
export function createSubscription(planId: number = PREMIUM_PLAN_ID): Promise<CreateSubscriptionResponse> {
  return authRequest<CreateSubscriptionResponse>(`api/subscriptions/${planId}`, { method: 'POST' })
}

/**
 * Sincroniza o status das assinaturas do usuário com o provedor de pagamento.
 * @returns Papel resultante e detalhes de cada assinatura processada.
 */
export function syncSubscriptions(): Promise<SyncSubscriptionResponse> {
  return authRequest<SyncSubscriptionResponse>('api/subscriptions/sync', { method: 'POST' })
}

/**
 * Cancela uma assinatura existente.
 * @param subscriptionId - Identificador da assinatura.
 * @returns Status da assinatura e papel resultante do usuário.
 */
export function cancelSubscription(subscriptionId: number): Promise<CancelSubscriptionResponse> {
  return authRequest<CancelSubscriptionResponse>(`api/subscriptions/${subscriptionId}/cancel`, { method: 'POST' })
}
