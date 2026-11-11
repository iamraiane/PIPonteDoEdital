/** URL base da API, lida da variável de ambiente VITE_API_URL com fallback local. */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** Edital associado a um favorito. */
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

/** Favorito criado por um usuário para um edital. */
export type Favorite = {
  id: number
  created_at: string
  user_id: number
  notice_id: number
  notified: boolean
  notice: FavoriteNotice
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
    throw new Error(body.message || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

/**
 * Lista os favoritos do usuário autenticado.
 * @returns Lista de favoritos com os editais correspondentes.
 */
export async function getFavorites(): Promise<Favorite[]> {
  return authRequest<Favorite[]>('favorites')
}

/**
 * Adiciona um edital aos favoritos do usuário.
 * @param noticeId - Identificador do edital.
 * @returns O favorito criado.
 */
export async function addFavorite(noticeId: number): Promise<Favorite> {
  return authRequest<Favorite>(`favorites/${noticeId}`, { method: 'POST' })
}

/**
 * Remove um edital dos favoritos do usuário.
 * @param noticeId - Identificador do edital.
 * @returns Mensagem de sucesso da operação.
 */
export async function removeFavorite(noticeId: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`favorites/${noticeId}`, { method: 'DELETE' })
}
