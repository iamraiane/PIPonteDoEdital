const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export type DoubtAnswer = {
  id: number
  content: string
  created_at: string
  doubt_id: number
  answered_by: number
}

export type DoubtUser = {
  id: number
  name: string
}

export type Doubt = {
  id: number
  content: string
  status: string
  created_at: string
  user_id: number
  user: DoubtUser | null
  answers: DoubtAnswer[]
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

export async function getDoubts(): Promise<Doubt[]> {
  return authRequest<Doubt[]>('doubts')
}

export async function createDoubt(content: string): Promise<Doubt> {
  return authRequest<Doubt>('doubts', {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export async function updateDoubt(id: number, content: string): Promise<Doubt> {
  return authRequest<Doubt>(`doubts/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  })
}

export async function deleteDoubt(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`doubts/${id}`, {
    method: 'DELETE',
  })
}

export async function updateAnswer(
  doubtId: number,
  answerId: number,
  content: string,
): Promise<DoubtAnswer> {
  return authRequest<DoubtAnswer>(`doubts/${doubtId}/answers/${answerId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  })
}

export async function deleteAnswer(
  doubtId: number,
  answerId: number,
): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`doubts/${doubtId}/answers/${answerId}`, {
    method: 'DELETE',
  })
}

export async function answerDoubt(doubtId: number, content: string): Promise<DoubtAnswer> {
  return authRequest<DoubtAnswer>(`doubts/${doubtId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}
