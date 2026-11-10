const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const API_BASE = 'https://www.googleapis.com/calendar/v3'
const STATUS_KEY = 'pdd_gcal_status'
const EVENTS_KEY = 'pdd_gcal_events'
const TOKEN_MARGIN_MS = 60_000

export type GcalStatus = 'unset' | 'granted' | 'skipped' | 'denied'

type TokenResponse = {
  access_token?: string
  expires_in?: number
  error?: string
}

type TokenClient = {
  requestAccessToken: (override?: { prompt?: string }) => void
}

type TokenClientConfig = {
  client_id: string
  scope: string
  callback: (resp: TokenResponse) => void
  error_callback: (err: { type?: string }) => void
}

type GisGlobal = {
  accounts?: {
    oauth2?: {
      initTokenClient: (cfg: TokenClientConfig) => TokenClient
      revoke?: (token: string, done?: () => void) => void
    }
  }
}

function gis(): GisGlobal | undefined {
  return (window as unknown as { google?: GisGlobal }).google
}

function readStatus(): GcalStatus {
  const value = localStorage.getItem(STATUS_KEY)
  return value === 'granted' || value === 'skipped' || value === 'denied' ? value : 'unset'
}

function writeStatus(status: GcalStatus) {
  if (status === 'unset') localStorage.removeItem(STATUS_KEY)
  else localStorage.setItem(STATUS_KEY, status)
}

function readEventMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function writeEventMap(map: Record<string, string>) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(map))
}

function plusOneDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

let gisLoader: Promise<void> | null = null
let tokenClient: TokenClient | null = null
let accessToken: string | null = null
let expiresAt = 0
let pendingToken: Promise<string | null> | null = null

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

export function isGoogleCalendarAvailable(): boolean {
  return Boolean(CLIENT_ID)
}

export function getGoogleCalendarStatus(): GcalStatus {
  if (!CLIENT_ID) return 'unset'
  return readStatus()
}

export function isGoogleEventSynced(noticeId: number): boolean {
  if (!CLIENT_ID) return false
  return Boolean(readEventMap()[String(noticeId)])
}

export async function connectGoogleCalendar(): Promise<GcalStatus> {
  const token = await acquireToken('interactive', true)
  return token ? 'granted' : readStatus()
}

export function prewarmGoogleToken(): void {
  if (!CLIENT_ID) return
  const status = readStatus()
  if (status === 'denied' || status === 'skipped') return
  void acquireToken(status === 'granted' ? 'silent' : 'interactive')
}

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
