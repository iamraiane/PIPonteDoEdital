/** URL base da API, lida da variável de ambiente VITE_API_URL com fallback local. */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** Edital como retornado pela API. */
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

/**
 * Executa uma requisição HTTP autenticada com o token salvo no localStorage.
 * @param path - Caminho relativo à base da API.
 * @param init - Opções adicionais do fetch (método, corpo etc.).
 * @returns Corpo da resposta convertido para o tipo informado.
 * @throws {Error} Mensagem de erro do backend (message/detail) ou status da resposta.
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
    const body = (await res.json().catch(() => null)) as
      | { message?: string; detail?: string }
      | null
    throw new Error(body?.message ?? body?.detail ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

/**
 * Lista os editais salvos de um usuário.
 * @param userId - Identificador do usuário.
 * @returns Lista de editais do usuário.
 */
export async function getNotices(userId: number): Promise<NoticeApi[]> {
  return authRequest<NoticeApi[]>(`notices/user/${userId}`)
}

/**
 * Atualiza campos de um edital existente.
 * @param id - Identificador do edital.
 * @param data - Campos a atualizar (parciais do edital).
 * @returns O edital atualizado.
 */
export async function updateNotice(id: number, data: Partial<NoticeApi>): Promise<NoticeApi> {
  return authRequest<NoticeApi>(`notices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Remove um edital salvo.
 * @param id - Identificador do edital.
 * @returns Mensagem de sucesso da operação.
 */
export async function deleteNotice(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`notices/${id}`, {
    method: 'DELETE',
  })
}

/**
 * Dispara manualmente a raspagem de editais de outros sites (scraper).
 * A raspagem roda em background no servidor; a resposta indica só o início.
 * @returns Mensagem de confirmação de que o scraper foi iniciado.
 */
export async function runScraper(): Promise<{ message: string }> {
  return authRequest<{ message: string }>('notices/scraper/run', {
    method: 'POST',
  })
}
