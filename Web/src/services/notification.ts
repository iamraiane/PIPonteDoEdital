/** URL base da API, lida da variável de ambiente VITE_API_URL com fallback local. */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** Edital relacionado a uma notificação. */
export type NotificationNotice = {
  id: number
  title: string
  link: string
  deadline_date: string | null
}

/** Notificação exibida ao usuário sobre um edital. */
export type AppNotification = {
  id: number
  user_id: number
  notice_id: number
  title: string
  message: string
  days_left: number
  is_read: boolean
  created_at: string
  notice?: NotificationNotice
}

/** Preferências de dias de notificação do usuário. */
export type NotificationPreferences = {
  options: number[]
  selected: number[]
}

/**
 * Executa uma requisição HTTP autenticada com o token salvo no localStorage.
 * @param path - Caminho relativo à base da API.
 * @param init - Opções adicionais do fetch (método, corpo etc.).
 * @returns Corpo da resposta convertido para o tipo informado.
 * @throws {Error} Lançado quando a resposta indica falha.
 */
async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

/**
 * Lista as notificações do usuário autenticado.
 * @returns Lista de notificações.
 */
export async function getNotifications(): Promise<AppNotification[]> {
  return authRequest<AppNotification[]>('notifications')
}

/**
 * Marca uma notificação como lida.
 * @param id - Identificador da notificação.
 * @returns Mensagem de sucesso da operação.
 */
export async function markNotificationRead(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`notifications/${id}/read`, { method: 'PATCH' })
}

/**
 * Marca todas as notificações do usuário como lidas.
 * @returns Mensagem de sucesso da operação.
 */
export async function markAllNotificationsRead(): Promise<{ message: string }> {
  return authRequest<{ message: string }>('notifications/read-all', { method: 'PATCH' })
}

/**
 * Busca as preferências de notificação (dias disponíveis e selecionados).
 * @returns Preferências de notificação do usuário.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return authRequest<NotificationPreferences>('notifications/preferences')
}

/**
 * Atualiza os dias de notificação selecionados pelo usuário.
 * @param days - Lista de dias selecionados.
 * @returns Mensagem de sucesso e dias efetivamente selecionados.
 */
export async function updateNotificationPreferences(days: number[]): Promise<{ message: string; selected: number[] }> {
  return authRequest<{ message: string; selected: number[] }>('notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify({ days }),
  })
}

/**
 * Dispara manualmente o job de geração de notificações.
 * @returns Mensagem de sucesso da execução.
 */
export async function runNotificationJob(): Promise<{ message: string }> {
  return authRequest<{ message: string }>('notifications/run', { method: 'POST' })
}
