const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export type NoticeApi = {
  id: number
  title: string
  state: string | null
  state_code: string | null
  description: string | null
  themes: string[] | null
  link: string
  publication_date: string | null
  deadline_date: string | null
  created_at: string
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
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json() as Promise<T>
}

export async function getNotices(userId: number): Promise<NoticeApi[]> {
  return authRequest<NoticeApi[]>(`notices/user/${userId}`)
}

export async function updateNotice(id: number, data: Partial<NoticeApi>): Promise<NoticeApi> {
  return authRequest<NoticeApi>(`notices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteNotice(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`notices/${id}`, {
    method: 'DELETE',
  })
}
