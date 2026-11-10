const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export type NotificationNotice = {
  id: number
  title: string
  link: string
  deadline_date: string | null
}

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

export type NotificationPreferences = {
  options: number[]
  selected: number[]
}

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

export async function getNotifications(): Promise<AppNotification[]> {
  return authRequest<AppNotification[]>('notifications')
}

export async function markNotificationRead(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`notifications/${id}/read`, { method: 'PATCH' })
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  return authRequest<{ message: string }>('notifications/read-all', { method: 'PATCH' })
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return authRequest<NotificationPreferences>('notifications/preferences')
}

export async function updateNotificationPreferences(days: number[]): Promise<{ message: string; selected: number[] }> {
  return authRequest<{ message: string; selected: number[] }>('notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify({ days }),
  })
}

export async function runNotificationJob(): Promise<{ message: string }> {
  return authRequest<{ message: string }>('notifications/run', { method: 'POST' })
}
