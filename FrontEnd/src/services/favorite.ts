const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export type FavoriteNotice = {
  id: number
  title: string
  state: string | null
  state_code: string | null
  description: string | null
  link: string
  publication_date: string | null
  deadline_date: string | null
  created_at: string
}

export type Favorite = {
  id: number
  created_at: string
  user_id: number
  notice_id: number
  notified: boolean
  notice: FavoriteNotice
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
    throw new Error(body.message || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function getFavorites(): Promise<Favorite[]> {
  return authRequest<Favorite[]>('favorites')
}

export async function addFavorite(noticeId: number): Promise<Favorite> {
  return authRequest<Favorite>(`favorites/${noticeId}`, { method: 'POST' })
}

export async function removeFavorite(noticeId: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`favorites/${noticeId}`, { method: 'DELETE' })
}
