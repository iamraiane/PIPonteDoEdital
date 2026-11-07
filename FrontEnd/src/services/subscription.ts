import { authRequest } from './user'

export const PREMIUM_PLAN_ID = 1

export type CreateSubscriptionResponse = {
  message: string
  subscriptionId: number
  status: string
  checkoutUrl: string
}

export type SyncSubscriptionItem = {
  id: number
  status?: string
  skipped?: string
  error?: string
}

export type SyncSubscriptionResponse = {
  role: string | null
  subscriptions: SyncSubscriptionItem[]
}

export type CancelSubscriptionResponse = {
  id: number
  status: string
  role: string | null
}

export function createSubscription(planId: number = PREMIUM_PLAN_ID): Promise<CreateSubscriptionResponse> {
  return authRequest<CreateSubscriptionResponse>(`api/subscriptions/${planId}`, { method: 'POST' })
}

export function syncSubscriptions(): Promise<SyncSubscriptionResponse> {
  return authRequest<SyncSubscriptionResponse>('api/subscriptions/sync', { method: 'POST' })
}

export function cancelSubscription(subscriptionId: number): Promise<CancelSubscriptionResponse> {
  return authRequest<CancelSubscriptionResponse>(`api/subscriptions/${subscriptionId}/cancel`, { method: 'POST' })
}
