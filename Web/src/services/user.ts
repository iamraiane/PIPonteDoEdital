const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => ({}))
  return new ApiError(body.message || `Request failed: ${res.status}`, res.status, body.code)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    throw await toApiError(res)
  }
  return res.json() as Promise<T>
}

export async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
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
    throw await toApiError(res)
  }
  return res.json() as Promise<T>
}

export type LoginResponse = {
  message: string
  token: string
}

export type RegisterResponse = {
  message: string
  token: string
}

export type UserData = {
  id: number
  name: string
  email: string
  cpf: string
  data_nascimento: string
  state_code: string
  preferences: string[]
  role: string
  active: boolean
  avatar_url?: string | null
}

export type SubscriptionData = {
  hasPremium: boolean
  plan: string
}

export async function login(identifier: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })
}

export async function register(name: string, email: string, password: string, cpf: string, dataNascimento: string, preferences?: string[], stateCode?: string): Promise<RegisterResponse> {
  return request<RegisterResponse>('users', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, cpf, data_nascimento: dataNascimento, preferences, state_code: stateCode }),
  })
}

export async function getUserSubscription(id: number): Promise<SubscriptionData> {
  return authRequest<SubscriptionData>(`users/${id}/subscription`)
}

export async function getUserById(id: number): Promise<UserData> {
  return authRequest<UserData>(`users/${id}`)
}

export async function uploadAvatar(id: number, file: File): Promise<{ avatar_url: string }> {
  const token = localStorage.getItem('token')
  const body = new FormData()
  body.append('avatar', file)
  const res = await fetch(`${API_BASE}/${id}/avatar`, {
    method: 'PUT',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    throw await toApiError(res)
  }
  return res.json() as Promise<{ avatar_url: string }>
}

export async function removeAvatar(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`${id}/avatar`, { method: 'DELETE' })
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return request<{ message: string }>('auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export type UpdateUserData = {
  name?: string
  state_code?: string
  preferences?: string[]
}

export async function updateUser(id: number, data: UpdateUserData): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return request<{ message: string }>('verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export function getTokenPayload(): { id: number; role: string } | null {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { id: payload.id, role: payload.role }
  } catch {
    return null
  }
}

export async function changeEmail(email: string, password: string): Promise<{ message: string }> {
  return authRequest<{ message: string }>('change-email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function confirmEmailChange(token: string): Promise<{ message: string }> {
  return request<{ message: string }>('confirm-email-change', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function getAllUsers(): Promise<UserData[]> {
  return authRequest<UserData[]>('users')
}

export async function promoteToAdmin(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}/promoteToAdmin`, { method: 'PATCH' })
}

export async function demoteToUser(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}/demoteToUser`, { method: 'PATCH' })
}

export async function promoteToPremium(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}/promoteToPremium`, { method: 'PATCH' })
}

export async function disableUser(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}/disable`, { method: 'PATCH' })
}

export async function activateUser(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}/activate`, { method: 'PATCH' })
}

export async function deleteUser(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}`, { method: 'DELETE' })
}
