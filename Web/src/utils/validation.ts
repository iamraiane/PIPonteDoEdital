/** Expressão regular para validar formato de e-mail. */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

/** Expressão regular que aceita apenas letras (com acentos) e espaços no nome. */
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s]+$/

/** Expressão regular que identifica tags HTML (possível XSS). */
const XSS_REGEX = /<[^>]*>/g

/** Expressão regular que identifica emojis e sequências relacionadas. */
// Classe de caracteres com ZWJ/keycap/variation selectors é intencional:
// o sanitizador remove emoji code point por code point (não por grapheme cluster).
// eslint-disable-next-line no-misleading-character-class
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu

/**
 * Verifica se o valor contém tags HTML suspeitas.
 * @param value - Texto a analisar.
 * @returns true se alguma tag HTML for encontrada.
 */
function containsXSS(value: string): boolean {
  return XSS_REGEX.test(value)
}

/**
 * Verifica se o valor contém emojis.
 * @param value - Texto a analisar.
 * @returns true se algum emoji for encontrado.
 */
function containsEmoji(value: string): boolean {
  return EMOJI_REGEX.test(value)
}

/**
 * Remove tags HTML e emojis do valor informado.
 * @param value - Texto de entrada.
 * @returns Texto limpo sem tags HTML nem emojis.
 */
export function sanitizeInput(value: string): string {
  let clean = value
  clean = clean.replace(XSS_REGEX, '')
  clean = clean.replace(EMOJI_REGEX, '')
  return clean
}

/**
 * Sanitiza um nome mantendo apenas letras (com acentos) e espaços.
 * @param value - Nome de entrada.
 * @returns Nome limpo e seguro para exibição.
 */
export function sanitizeName(value: string): string {
  let clean = sanitizeInput(value)
  clean = clean.replace(/[^a-zA-ZÀ-ÿ\s]/g, '')
  return clean
}

/**
 * Sanitiza um e-mail removendo caracteres inválidos.
 * @param value - E-mail de entrada.
 * @returns E-mail limpo com caracteres permitidos.
 */
export function sanitizeEmail(value: string): string {
  let clean = sanitizeInput(value)
  clean = clean.replace(/[^a-zA-Z0-9._%+-@]/g, '')
  return clean
}

/**
 * Valida um nome de usuário.
 * @param name - Nome a validar.
 * @returns Mensagem de erro em português ou null se válido.
 */
export function validateName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length === 0) return 'Nome é obrigatório'
  if (trimmed.length < 2) return 'Nome deve ter pelo menos 2 caracteres'
  if (containsXSS(trimmed)) return 'Nome contém caracteres não permitidos'
  if (containsEmoji(trimmed)) return 'Nome não pode conter emojis'
  if (!NAME_REGEX.test(trimmed)) return 'Nome só pode conter letras e espaços'
  return null
}

/**
 * Valida um endereço de e-mail.
 * @param email - E-mail a validar.
 * @returns Mensagem de erro em português ou null se válido.
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (trimmed.length === 0) return 'E-mail é obrigatório'
  if (containsXSS(trimmed)) return 'E-mail contém caracteres não permitidos'
  if (containsEmoji(trimmed)) return 'E-mail não pode conter emojis'
  if (!EMAIL_REGEX.test(trimmed)) return 'E-mail inválido'
  return null
}

/**
 * Valida uma senha quanto aos requisitos mínimos.
 * @param senha - Senha a validar.
 * @returns Mensagem de erro em português ou null se válida.
 */
export function validatePassword(senha: string): string | null {
  if (senha.length === 0) return 'Senha é obrigatória'
  if (senha.length < 8) return 'Senha deve ter pelo menos 8 caracteres'
  if (containsXSS(senha)) return 'Senha contém caracteres não permitidos'
  if (containsEmoji(senha)) return 'Senha não pode conter emojis'
  return null
}

/**
 * Valida se a confirmação de senha coincide com a senha.
 * @param senha - Senha original.
 * @param confirmar - Confirmação de senha.
 * @returns Mensagem de erro em português ou null se coincidem.
 */
export function validatePasswordMatch(senha: string, confirmar: string): string | null {
  if (confirmar.length === 0) return 'Confirmação de senha é obrigatória'
  if (senha !== confirmar) return 'As senhas não coincidem'
  return null
}

/**
 * Remove tudo que não for dígito do CPF, limitando a 11 caracteres.
 * @param value - Valor de entrada (com ou sem máscara).
 * @returns Apenas os dígitos do CPF.
 */
export function sanitizeCpf(value: string): string {
  return value.replace(/[^\d]/g, '').slice(0, 11)
}

/**
 * Formata o CPF com a máscara padrão (000.000.000-00).
 * @param value - CPF com ou sem máscara.
 * @returns CPF formatado conforme a quantidade de dígitos.
 */
export function formatCpf(value: string): string {
  const digits = sanitizeCpf(value)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/**
 * Valida o CPF pelos dígitos verificadores (algoritmo oficial).
 * @param cpf - CPF com ou sem máscara.
 * @returns Mensagem de erro em português ou null se válido.
 */
export function validateCpf(cpf: string): string | null {
  const digits = sanitizeCpf(cpf)
  if (digits.length === 0) return 'CPF é obrigatório'
  if (digits.length !== 11) return 'CPF deve ter 11 dígitos'
  if (/^(\d)\1{10}$/.test(digits)) return 'CPF inválido'

  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digits.charAt(i)) * (10 - i)
  }
  let resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  if (resto !== parseInt(digits.charAt(9))) return 'CPF inválido'

  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digits.charAt(i)) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  if (resto !== parseInt(digits.charAt(10))) return 'CPF inválido'

  return null
}
