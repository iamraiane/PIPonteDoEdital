/** ID de cliente OAuth do Google (variável de ambiente VITE_GOOGLE_CLIENT_ID). */
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
/** Escopo de permissão para criar eventos no calendário do usuário. */
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
/** URL base da API do Google Calendar v3. */
const API_BASE = 'https://www.googleapis.com/calendar/v3'
/** Chave do localStorage onde o status de permissão é persistido. */
const STATUS_KEY = 'pdd_gcal_status'
/** Chave do localStorage onde o mapa de eventos criados é persistido. */
const EVENTS_KEY = 'pdd_gcal_events'
/** Margem de segurança (em ms) para considerar o token expirado antes do prazo real. */
const TOKEN_MARGIN_MS = 60_000

/** Status da permissão de integração com o Google Calendar. */
export type GcalStatus = 'unset' | 'granted' | 'skipped' | 'denied'

/** Resposta do fluxo de token OAuth do Google. */
type TokenResponse = {
  access_token?: string
  expires_in?: number
  error?: string
}

/** Cliente de token retornado pelo Google Identity Services. */
type TokenClient = {
  requestAccessToken: (override?: { prompt?: string }) => void
}

/** Configuração usada para inicializar o token client do Google. */
type TokenClientConfig = {
  client_id: string
  scope: string
  callback: (resp: TokenResponse) => void
  error_callback: (err: { type?: string }) => void
}

/** Forma global do objeto `google` injetado pelo Google Identity Services. */
type GisGlobal = {
  accounts?: {
    oauth2?: {
      initTokenClient: (cfg: TokenClientConfig) => TokenClient
      revoke?: (token: string, done?: () => void) => void
    }
  }
}

/**
 * Obtém o objeto global do Google Identity Services se disponível.
 * @returns Referência para `window.google` ou undefined quando não carregado.
 */
function gis(): GisGlobal | undefined {
  return (window as unknown as { google?: GisGlobal }).google
}

/**
 * Lê o status de permissão do Google Calendar armazenado no localStorage.
 * @returns Status persistido ou 'unset' quando ausente/inválido.
 */
function readStatus(): GcalStatus {
  const value = localStorage.getItem(STATUS_KEY)
  return value === 'granted' || value === 'skipped' || value === 'denied' ? value : 'unset'
}

/**
 * Persiste o status de permissão no localStorage.
 * @param status - Novo status a salvar; 'unset' remove o registro.
 */
function writeStatus(status: GcalStatus) {
  if (status === 'unset') localStorage.removeItem(STATUS_KEY)
  else localStorage.setItem(STATUS_KEY, status)
}

/**
 * Lê o mapa de eventos criados (id do edital → id do evento no Google).
 * @returns Mapa de eventos ou objeto vazio em caso de erro de parsing.
 */
function readEventMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

/**
 * Persiste o mapa de eventos criados no localStorage.
 * @param map - Mapa de id do edital para id do evento no Google.
 */
function writeEventMap(map: Record<string, string>) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(map))
}

/**
 * Calcula o dia seguinte à data informada no formato AAAA-MM-DD.
 * @param date - Data no formato ISO (AAA-MM-DD).
 * @returns Data do dia seguinte no mesmo formato.
 */
function plusOneDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/** Estado de carregamento do script GIS (compartilhado entre chamadas). */
let gisLoader: Promise<void> | null = null
/** Cliente de token OAuth instanciado uma única vez. */
let tokenClient: TokenClient | null = null
/** Token de acesso atual em memória. */
let accessToken: string | null = null
/** Timestamp em que o token de acesso expira. */
let expiresAt = 0
/** Promessa de obtenção de token em andamento (evita chamadas concorrentes). */
let pendingToken: Promise<string | null> | null = null

/**
 * Carrega o script do Google Identity Services de forma lazy e única.
 * @returns Promise que resolve quando o script está disponível.
 */
function loadGis(): Promise<void> {
  if (gis()?.accounts?.oauth2) return Promise.resolve()
  if (gisLoader) return gisLoader
  gisLoader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="accounts.google.com/gsi/client"]',
    )
    const script = existing ?? document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', () => {
      gisLoader = null
      reject(new Error('Falha ao carregar o Google Identity Services'))
    })
    if (!existing) document.head.appendChild(script)
  })
  return gisLoader
}

/**
 * Solicita um token de acesso de forma interativa junto ao Google.
 * @param override - Opções de prompt (ex.: 'consent') repassadas ao GIS.
 * @returns Resposta do fluxo OAuth, contendo access_token ou error.
 */
function requestToken(override?: { prompt?: string }): Promise<TokenResponse> {
  return new Promise<TokenResponse>((resolve) => {
    void loadGis()
      .then(() => {
        const oauth2 = gis()?.accounts?.oauth2
        if (!oauth2 || !CLIENT_ID) {
          resolve({ error: 'unavailable' })
          return
        }
        if (!tokenClient) {
          tokenClient = oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPE,
            callback: (resp) => resolve(resp),
            error_callback: (err) => resolve({ error: err.type ?? 'unknown' }),
          })
        }
        tokenClient.requestAccessToken(override)
      })
      .catch(() => resolve({ error: 'script_error' }))
  })
}

/**
 * Obtém um token de acesso, reutilizando o cache quando ainda é válido.
 * @param mode - 'silent' tenta sem interação; 'interactive' pode abrir o popup.
 * @param force - Força novo consentimento mesmo com status negado/ignorado.
 * @returns Token de acesso ou null quando não disponível.
 */
async function acquireToken(
  mode: 'interactive' | 'silent',
  force = false,
): Promise<string | null> {
  if (!CLIENT_ID) return null
  if (accessToken && Date.now() < expiresAt - TOKEN_MARGIN_MS) return accessToken
  if (pendingToken) return pendingToken

  const status = readStatus()
  if (mode === 'silent') {
    if (status !== 'granted') return null
  } else if (!force && (status === 'denied' || status === 'skipped')) {
    return null
  }

  const prompt =
    mode === 'silent'
      ? ''
      : force && (status === 'denied' || status === 'skipped')
        ? 'consent'
        : undefined

  pendingToken = (async () => {
    try {
      const resp = await requestToken(prompt === undefined ? undefined : { prompt })
      if (resp.access_token && !resp.error) {
        accessToken = resp.access_token
        expiresAt = Date.now() + (Number(resp.expires_in) || 3600) * 1000
        writeStatus('granted')
        return accessToken
      }
      if (mode === 'interactive') {
        writeStatus(resp.error === 'access_denied' ? 'denied' : 'skipped')
      } else {
        writeStatus('skipped')
      }
      return null
    } catch {
      return null
    } finally {
      pendingToken = null
    }
  })()

  return pendingToken
}

/**
 * Verifica se a integração com o Google Calendar está configurada.
 * @returns true quando há ID de cliente OAuth definido.
 */
export function isGoogleCalendarAvailable(): boolean {
  return Boolean(CLIENT_ID)
}

/**
 * Consulta o status atual de permissão do Google Calendar.
 * @returns Status persistido ou 'unset' se não configurado.
 */
export function getGoogleCalendarStatus(): GcalStatus {
  if (!CLIENT_ID) return 'unset'
  return readStatus()
}

/**
 * Verifica se o edital já foi sincronizado com o Google Calendar.
 * @param noticeId - Identificador do edital.
 * @returns true se existe evento criado para o edital.
 */
export function isGoogleEventSynced(noticeId: number): boolean {
  if (!CLIENT_ID) return false
  return Boolean(readEventMap()[String(noticeId)])
}

/**
 * Conecta ao Google Calendar de forma interativa, solicitando consentimento.
 * @returns Status resultante da conexão ('granted' ou o último status conhecido).
 */
export async function connectGoogleCalendar(): Promise<GcalStatus> {
  const token = await acquireToken('interactive', true)
  return token ? 'granted' : readStatus()
}

/**
 * Pré-aquece o token em segundo plano para agilizar chamadas futuras.
 * Não bloqueia a UI e ignora status negado/ignorado.
 */
export function prewarmGoogleToken(): void {
  if (!CLIENT_ID) return
  const status = readStatus()
  if (status === 'denied' || status === 'skipped') return
  void acquireToken(status === 'granted' ? 'silent' : 'interactive')
}

/**
 * Envia um novo evento para o calendário primário do usuário.
 * @param token - Token de acesso válido.
 * @param body - Corpo JSON do evento a criar.
 * @returns Resposta HTTP da API do Google Calendar.
 */
async function postEvent(token: string, body: string): Promise<Response> {
  return fetch(`${API_BASE}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  })
}

/**
 * Cria um evento de edital no Google Calendar e registra o id criado.
 * @param event - Dados do edital: id, título, descrição, url e data.
 * @returns true se o evento foi criado com sucesso.
 */
export async function insertGoogleEvent(event: {
  noticeId: number
  title: string
  description?: string | null
  url: string
  date: string
}): Promise<boolean> {
  if (!CLIENT_ID || !event.date) return false

  const token = await acquireToken('interactive')
  if (!token) return false

  const body = JSON.stringify({
    summary: event.title,
    description: [event.description, event.url].filter(Boolean).join('\n\n'),
    source: { title: 'Ponte do Edital', url: event.url },
    start: { date: event.date },
    end: { date: plusOneDay(event.date) },
  })

  try {
    let res = await postEvent(token, body)
    if (res.status === 401) {
      accessToken = null
      expiresAt = 0
      const fresh = await acquireToken('silent')
      if (!fresh) return false
      res = await postEvent(fresh, body)
    }
    if (!res.ok) return false
    const data = (await res.json()) as { id?: string }
    if (data.id) {
      const map = readEventMap()
      map[String(event.noticeId)] = data.id
      writeEventMap(map)
    }
    return true
  } catch {
    return false
  }
}

/**
 * Remove o evento do Google Calendar associado ao edital.
 * @param noticeId - Identificador do edital.
 */
export async function deleteGoogleEvent(noticeId: number): Promise<void> {
  if (!CLIENT_ID) return
  const map = readEventMap()
  const eventId = map[String(noticeId)]
  if (!eventId) return

  const token = await acquireToken('silent')
  if (!token) return

  try {
    const res = await fetch(
      `${API_BASE}/calendars/primary/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
    )
    if (res.ok || res.status === 404) {
      delete map[String(noticeId)]
      writeEventMap(map)
    }
  } catch {
    // mantém o id para uma futura tentativa; falha silenciosa
  }
}

/**
 * Desconecta do Google Calendar: remove eventos criados e revoga o token.
 * Eventos que não puderem ser removidos são mantidos para nova tentativa.
 * @returns Quantidade de eventos removidos e mantidos.
 */
export async function disconnectGoogleCalendar(): Promise<{ removed: number; kept: number }> {
  const map = readEventMap()
  const ids = Object.keys(map)
  let removed = 0
  let kept = 0

  if (ids.length > 0) {
    const cached = accessToken && Date.now() < expiresAt ? accessToken : null
    const token = cached ?? (await acquireToken('silent'))
    if (token) {
      for (const noticeId of ids) {
        try {
          const res = await fetch(
            `${API_BASE}/calendars/primary/events/${encodeURIComponent(map[noticeId])}`,
            { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
          )
          if (res.ok || res.status === 404) {
            delete map[noticeId]
            removed += 1
          } else {
            kept += 1
          }
        } catch {
          // sem conexão: mantém o id para uma futura tentativa
          kept += 1
        }
      }
      writeEventMap(map)
    } else {
      kept = ids.length
    }
  }

  if (accessToken) {
    try {
      gis()?.accounts?.oauth2?.revoke?.(accessToken, () => {})
    } catch {
      // revogação é melhor esforço; não bloqueia a desconexão
    }
  }
  accessToken = null
  expiresAt = 0
  writeStatus('skipped')
  return { removed, kept }
}
