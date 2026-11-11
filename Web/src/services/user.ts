/** URL base da API, lida da variável de ambiente VITE_API_URL com fallback local. */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/**
 * Erro de requisição HTTP contendo o status e o código retornado pela API.
 */
export class ApiError extends Error {
  status: number
  code?: string

  /**
   * Cria uma instância de ApiError.
   * @param message - Mensagem de erro descritiva.
   * @param status - Código de status HTTP da resposta.
   * @param code - Código opcional de erro devolvido pela API.
   */
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/**
 * Converte uma resposta HTTP com falha em uma instância de ApiError.
 * @param res - Resposta HTTP com status de erro.
 * @returns Erro contendo mensagem, status e código extraídos do corpo da resposta.
 */
async function toApiError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => ({}))
  return new ApiError(body.message || `Request failed: ${res.status}`, res.status, body.code)
}

/**
 * Executa uma requisição HTTP sem autenticação e retorna o corpo JSON.
 * @param path - Caminho relativo à base da API.
 * @param init - Opções adicionais do fetch (método, corpo etc.).
 * @returns Corpo da resposta convertido para o tipo informado.
 */
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

/**
 * Executa uma requisição HTTP autenticada com o token salvo no localStorage.
 * @param path - Caminho relativo à base da API.
 * @param init - Opções adicionais do fetch (método, corpo etc.).
 * @returns Corpo da resposta convertido para o tipo informado.
 * @throws {ApiError} Lançado quando a resposta indica falha.
 */
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

/** Resposta retornada pelo login com mensagem e token de autenticação. */
export type LoginResponse = {
  message: string
  token: string
}

/** Resposta retornada pelo cadastro com mensagem e token de autenticação. */
export type RegisterResponse = {
  message: string
  token: string
}

/** Dados de um usuário retornados pela API. */
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

/** Informação resumida da assinatura do usuário. */
export type SubscriptionData = {
  hasPremium: boolean
  plan: string
}

/**
 * Autentica um usuário com identificador (e-mail/usuário) e senha.
 * @param identifier - E-mail ou nome de usuário.
 * @param password - Senha em texto puro.
 * @returns Mensagem de sucesso e token JWT.
 */
export async function login(identifier: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })
}

/**
 * Cadastra um novo usuário e retorna um token de autenticação.
 * @param name - Nome completo do usuário.
 * @param email - E-mail do usuário.
 * @param password - Senha em texto puro.
 * @param cpf - CPF do usuário.
 * @param dataNascimento - Data de nascimento no formato ISO.
 * @param preferences - Preferências de temas do usuário (opcional).
 * @param stateCode - Código do estado do usuário (opcional).
 * @returns Mensagem de sucesso e token JWT.
 */
export async function register(name: string, email: string, password: string, cpf: string, dataNascimento: string, preferences?: string[], stateCode?: string): Promise<RegisterResponse> {
  return request<RegisterResponse>('users', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, cpf, data_nascimento: dataNascimento, preferences, state_code: stateCode }),
  })
}

/**
 * Busca a assinatura (plano premium) do usuário.
 * @param id - Identificador do usuário.
 * @returns Dados indicando se o usuário tem plano premium.
 */
export async function getUserSubscription(id: number): Promise<SubscriptionData> {
  return authRequest<SubscriptionData>(`users/${id}/subscription`)
}

/**
 * Busca os dados completos de um usuário pelo id.
 * @param id - Identificador do usuário.
 * @returns Dados do usuário.
 */
export async function getUserById(id: number): Promise<UserData> {
  return authRequest<UserData>(`users/${id}`)
}

/**
 * Envia um novo avatar (arquivo) para o usuário.
 * @param id - Identificador do usuário.
 * @param file - Arquivo de imagem do avatar.
 * @returns URL da imagem de avatar salva.
 */
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

/**
 * Remove o avatar atual do usuário.
 * @param id - Identificador do usuário.
 * @returns Mensagem de sucesso da operação.
 */
export async function removeAvatar(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`${id}/avatar`, { method: 'DELETE' })
}

/**
 * Solicita a recuperação de senha enviando um e-mail com o link de redefinição.
 * @param email - E-mail da conta a recuperar.
 * @returns Mensagem de sucesso da solicitação.
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

/**
 * Redefine a senha do usuário usando o token enviado por e-mail.
 * @param token - Token de redefinição recebido por e-mail.
 * @param password - Nova senha em texto puro.
 * @returns Mensagem de sucesso da operação.
 */
export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return request<{ message: string }>('auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

/** Dados atualizáveis do perfil do usuário. */
export type UpdateUserData = {
  name?: string
  state_code?: string
  preferences?: string[]
}

/**
 * Atualiza os dados do perfil do usuário.
 * @param id - Identificador do usuário.
 * @param data - Campos a atualizar (nome, estado, preferências).
 * @returns Mensagem de sucesso da operação.
 */
export async function updateUser(id: number, data: UpdateUserData): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Confirma o e-mail do usuário utilizando o token enviado no cadastro.
 * @param token - Token de verificação recebido por e-mail.
 * @returns Mensagem de sucesso da verificação.
 */
export async function verifyEmail(token: string): Promise<{ message: string }> {
  return request<{ message: string }>('verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

/**
 * Lê e decodifica o payload do JWT armazenado no localStorage.
 * @returns Payload com id e role do usuário, ou null se ausente/inválido.
 */
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

/**
 * Inicia a troca de e-mail validando a senha atual do usuário.
 * @param email - Novo e-mail desejado.
 * @param password - Senha atual do usuário.
 * @returns Mensagem de sucesso da solicitação.
 */
export async function changeEmail(email: string, password: string): Promise<{ message: string }> {
  return authRequest<{ message: string }>('change-email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/**
 * Confirma a troca de e-mail utilizando o token enviado ao novo endereço.
 * @param token - Token de confirmação recebido por e-mail.
 * @returns Mensagem de sucesso da confirmação.
 */
export async function confirmEmailChange(token: string): Promise<{ message: string }> {
  return request<{ message: string }>('confirm-email-change', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

/**
 * Reenvia o e-mail de verificação para o endereço informado.
 * @param email - E-mail a ser verificado.
 * @returns Mensagem de sucesso do reenvio.
 */
export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

/**
 * Lista todos os usuários cadastrados (uso administrativo).
 * @returns Lista completa de usuários.
 */
export async function getAllUsers(): Promise<UserData[]> {
  return authRequest<UserData[]>('users')
}

/**
 * Promove um usuário para administrador.
 * @param id - Identificador do usuário.
 * @returns Mensagem de sucesso da operação.
 */
export async function promoteToAdmin(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}/promoteToAdmin`, { method: 'PATCH' })
}

/**
 * Rebaixa um usuário para o papel comum (user).
 * @param id - Identificador do usuário.
 * @returns Mensagem de sucesso da operação.
 */
export async function demoteToUser(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}/demoteToUser`, { method: 'PATCH' })
}

/**
 * Promove um usuário para o plano premium.
 * @param id - Identificador do usuário.
 * @returns Mensagem de sucesso da operação.
 */
export async function promoteToPremium(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}/promoteToPremium`, { method: 'PATCH' })
}

/**
 * Desativa a conta de um usuário.
 * @param id - Identificador do usuário.
 * @returns Mensagem de sucesso da operação.
 */
export async function disableUser(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}/disable`, { method: 'PATCH' })
}

/**
 * Reativa a conta de um usuário desativado.
 * @param id - Identificador do usuário.
 * @returns Mensagem de sucesso da operação.
 */
export async function activateUser(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}/activate`, { method: 'PATCH' })
}

/**
 * Exclui permanentemente a conta de um usuário.
 * @param id - Identificador do usuário.
 * @returns Mensagem de sucesso da operação.
 */
export async function deleteUser(id: number): Promise<{ message: string }> {
  return authRequest<{ message: string }>(`users/${id}`, { method: 'DELETE' })
}
