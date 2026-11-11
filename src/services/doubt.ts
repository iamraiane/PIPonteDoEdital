/** URL base da API, lida da variável de ambiente VITE_API_URL com fallback local. */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** Resposta dada a uma dúvida. */
export type DoubtAnswer = {
  id: number
  content: string
  created_at: string
  doubt_id: number
  answered_by: number
}

/** Usuário autor de uma dúvida. */
export type DoubtUser = {
  id: number
  name: string
}

/** Dúvida com seu autor e respostas. */
export type Doubt = {
  id: number
  content: string
  status: string
  created_at: string
  user_id: number
  user: DoubtUser | null
  answers: DoubtAnswer[]
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
 * Lista todas as dúvidas com autor e respostas.
 * @returns Lista de dúvidas.
 */
export async function getDoubts(): Promise<Doubt[]> {
  return authRequest<Doubt[]>('doubts')
}

/**
 * Cria uma nova dúvida para o usuário autenticado.
 * @param content - Texto da dúvida.
 * @returns A dúvida criada.
 */
export async function createDoubt(content: string): Promise<Doubt> {
  return authRequest<Doubt>('doubts', {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

/**
 * Atualiza o conteúdo de uma dúvida existente.
 * @param id - Identificador da dúvida.
 * @param content - Novo texto da dúvida.
 * @returns A dúvida atualizada.
 */
export async function updateDoubt(id: number, content: string): Promise<Doubt> {
  return authRequest<Doubt>(`doubts/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  })
}

/**
 * Remove uma dúvida.
 * @param id - Identificador da dúvida.
 * @returns Mensagem de sucesso da operação.
 */
export async function deleteDoubt(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`doubts/${id}`, {
    method: 'DELETE',
  })
}

/**
 * Atualiza o conteúdo de uma resposta de dúvida.
 * @param doubtId - Identificador da dúvida.
 * @param answerId - Identificador da resposta.
 * @param content - Novo texto da resposta.
 * @returns A resposta atualizada.
 */
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

/**
 * Remove uma resposta de dúvida.
 * @param doubtId - Identificador da dúvida.
 * @param answerId - Identificador da resposta.
 * @returns Mensagem de sucesso da operação.
 */
export async function deleteAnswer(
  doubtId: number,
  answerId: number,
): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`doubts/${doubtId}/answers/${answerId}`, {
    method: 'DELETE',
  })
}

/**
 * Cria uma nova resposta para uma dúvida.
 * @param doubtId - Identificador da dúvida.
 * @param content - Texto da resposta.
 * @returns A resposta criada.
 */
export async function answerDoubt(doubtId: number, content: string): Promise<DoubtAnswer> {
  return authRequest<DoubtAnswer>(`doubts/${doubtId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}
