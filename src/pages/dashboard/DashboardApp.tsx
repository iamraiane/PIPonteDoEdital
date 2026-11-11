import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import DashboardShell, { type PageKey } from './DashboardShell'
import FeedPage from './FeedPage'
import CalendarPage from './CalendarPage'
import SavedPage from './SavedPage'
import PlansPage from './PlansPage'
import FaqPage from './FaqPage'
import AboutPage from './AboutPage'
import ProfilePage, { type ProfileData } from './ProfilePage'
import NotificationsPage from './NotificationsPage'
import { FeedFilterProvider } from './FeedFilterContext'
import { getUserById, updateUser, uploadAvatar } from '../../services/user'

/** Mapeia o segmento de URL da rota atual para a chave interna da página exibida. */
const ROUTE_MAP: Record<string, PageKey> = {
  feed: 'feed',
  calendar: 'calendar',
  saved: 'saved',
  plans: 'plans',
  faq: 'faq',
  about: 'about',
  profile: 'profile',
  notifications: 'notifications',
}

/** Mapeia cada chave de página para a rota completa usada no React Router. */
const KEY_TO_ROUTE: Record<PageKey, string> = {
  feed: '/dashboard/feed',
  calendar: '/dashboard/calendar',
  saved: '/dashboard/saved',
  plans: '/dashboard/plans',
  faq: '/dashboard/faq',
  about: '/dashboard/about',
  profile: '/dashboard/profile',
  notifications: '/dashboard/notifications',
}

/**
 * Compara dois perfis campo a campo para detectar alterações ainda não salvas.
 * @param a - Perfil de referência (última versão salva).
 * @param b - Perfil atual em edição.
 * @returns true se todos os campos e a lista de interesses forem idênticos.
 */
function profilesEqual(a: ProfileData, b: ProfileData): boolean {
  return (
    a.nome === b.nome &&
    a.email === b.email &&
    a.cpf === b.cpf &&
    a.dataNascimento === b.dataNascimento &&
    a.estado === b.estado &&
    a.avatarUrl === b.avatarUrl &&
    a.interesses.length === b.interesses.length &&
    a.interesses.every((item, i) => item === b.interesses[i])
  )
}

/**
 * Raiz do dashboard: gerencia as rotas internas, o estado do perfil do usuário,
 * o fluxo de salvamento com proteção de alterações não salvas e o shell de navegação.
 */
export default function DashboardApp({
  userName = 'Raiane',
  userId,
  userRole,
  userActive = true,
  onLogout,
  onOpenAdmin,
}: {
  userName?: string
  userId?: number
  userRole?: string
  userActive?: boolean
  onLogout?: () => void
  onOpenAdmin?: () => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const hasPremium = userRole === 'premium' || userRole === 'admin'
  const [profile, setProfile] = useState<ProfileData>({
    nome: userName || '',
    email: '',
    cpf: '',
    dataNascimento: '',
    estado: '',
    interesses: [],
    avatarUrl: null,
  })
  const [savedProfile, setSavedProfile] = useState<ProfileData>(profile)
  const [pendingAvatar, setPendingAvatar] = useState<{ file: File; previewUrl: string } | null>(null)
  const [unsavedOpen, setUnsavedOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  /**
   * Carrega os dados do usuário pela API sempre que o identificador está disponível.
   */
  useEffect(() => {
    if (!userId) return
    getUserById(userId)
      .then((data) => {
        const loaded: ProfileData = {
          nome: data.name || '',
          email: data.email || '',
          cpf: data.cpf || '',
          dataNascimento: data.data_nascimento || '',
          estado: data.state_code || '',
          interesses: data.preferences || [],
          avatarUrl: data.avatar_url ?? null,
        }
        setProfile(loaded)
        setSavedProfile(loaded)
      })
      .catch(console.error)
  }, [userId])

  /**
   * Descarta a foto pendente e revoga a URL de preview criada para ela.
   */
  function clearPendingAvatar() {
    setPendingAvatar((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
  }

  /**
   * Seleciona uma nova foto de perfil, gerando preview e revogando o anterior.
   * @param file - Arquivo de imagem escolhido pelo usuário.
   */
  function handleAvatarSelect(file: File) {
    const previewUrl = URL.createObjectURL(file)
    setPendingAvatar((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return { file, previewUrl }
    })
    setProfile((prev) => ({ ...prev, avatarUrl: previewUrl }))
  }

  const pathSegment = location.pathname.split('/')[2] || 'feed'
  const page: PageKey = ROUTE_MAP[pathSegment] || 'feed'
  const isDirty = page === 'profile' && !profilesEqual(profile, savedProfile)

  /**
   * Envia os dados do perfil (e a nova foto, se houver) para a API e atualiza
   * a referência usada para detectar alterações não salvas.
   */
  async function handleSaveProfile() {
    if (!userId) return
    const snapshot = profile
    let avatarUrl = snapshot.avatarUrl
    if (pendingAvatar) {
      const { avatar_url } = await uploadAvatar(userId, pendingAvatar.file)
      avatarUrl = avatar_url ?? snapshot.avatarUrl
    }
    await updateUser(userId, {
      name: snapshot.nome,
      state_code: snapshot.estado,
      preferences: snapshot.interesses,
    })
    clearPendingAvatar()
    setSavedProfile({ ...snapshot, avatarUrl })
    if (avatarUrl !== snapshot.avatarUrl) {
      setProfile((prev) => ({ ...prev, avatarUrl }))
    }
  }

  /**
   * Executa uma ação apenas se não houver alterações pendentes; caso contrário,
   * abre o modal de confirmação antes de executá-la.
   * @param action - Ação a ser executada (navegação, logout etc.).
   */
  function runGuarded(action: () => void) {
    if (isDirty) {
      setPendingAction(() => action)
      setUnsavedOpen(true)
      return
    }
    action()
  }

  /**
   * Navega para outra página do dashboard, protegendo o perfil em edição.
   * @param key - Chave da página de destino.
   */
  function handleNavigate(key: PageKey) {
    if (key === page) return
    runGuarded(() => navigate(KEY_TO_ROUTE[key]))
  }

  /** Dispara o logout, passando pelo modal de alterações não salvas se necessário. */
  function handleLogout() {
    if (onLogout) runGuarded(onLogout)
  }

  /** Fecha o modal de alterações não salvas, mantendo o usuário na edição. */
  function handleKeepEditing() {
    setUnsavedOpen(false)
    setPendingAction(null)
  }

  /** Descarta as alterações do perfil e retoma a ação que estava pendente. */
  function handleDiscardChanges() {
    clearPendingAvatar()
    setProfile(savedProfile)
    setUnsavedOpen(false)
    const action = pendingAction
    setPendingAction(null)
    action?.()
  }

  /**
   * Impede o fechamento ou recarga da aba enquanto o perfil tiver alterações não salvas.
   */
  useEffect(() => {
    if (!isDirty) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  /**
   * Permite fechar o modal de alterações não salvas com a tecla Escape.
   */
  useEffect(() => {
    if (!unsavedOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setUnsavedOpen(false)
        setPendingAction(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [unsavedOpen])

  /** Primeiro nome do usuário (ou o nome padrão) usado na saudação e no menu. */
  const firstName = profile.nome.trim().split(' ')[0] || userName

  return (
    <FeedFilterProvider>
      <DashboardShell
        active={page}
        onNavigate={handleNavigate}
        userName={firstName}
        interesses={profile.interesses}
        avatarUrl={profile.avatarUrl}
        hasPremium={hasPremium}
        userActive={userActive}
        onLogout={handleLogout}
        onOpenAdmin={onOpenAdmin}
      >
        <Routes>
          <Route index element={<Navigate to="feed" replace />} />
          <Route path="feed" element={<FeedPage userName={firstName} userId={userId} hasPremium={hasPremium} userActive={userActive} preferences={profile.interesses} onNavigate={(p) => navigate(`/dashboard/${p}`)} />} />
          <Route path="calendar" element={<CalendarPage hasPremium={hasPremium} userId={userId} onNavigate={(p) => navigate(`/dashboard/${p}`)} />} />
          <Route path="saved" element={<SavedPage userId={userId} userActive={userActive} />} />
          <Route path="plans" element={<PlansPage hasPremium={hasPremium} />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="profile" element={<ProfilePage profile={profile} onChange={setProfile} onSave={handleSaveProfile} onAvatarSelect={handleAvatarSelect} avatarPending={!!pendingAvatar} userActive={userActive} />} />
          <Route path="notifications" element={<NotificationsPage onNavigate={(p) => navigate(`/dashboard/${p}`)} />} />
        </Routes>
      </DashboardShell>

      <div
        className={`pdd-unsaved-overlay ${unsavedOpen ? 'is-open' : ''}`}
        onClick={handleKeepEditing}
        role="presentation"
      >
        <div
          className={`pdd-unsaved-modal ${unsavedOpen ? 'is-open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdd-unsaved-title"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="pdd-unsaved-title" id="pdd-unsaved-title">
            Alterações não salvas
          </h2>
          <p className="pdd-unsaved-text">
            Você tem alterações na sua página de perfil que ainda não foram salvas. O que
            deseja fazer?
          </p>
          <div className="pdd-unsaved-actions">
            <button
              type="button"
              className="pdd-unsaved-btn pdd-unsaved-btn--secondary"
              onClick={handleKeepEditing}
            >
              Continuar editando
            </button>
            <button
              type="button"
              className="pdd-unsaved-btn pdd-unsaved-btn--danger"
              onClick={handleDiscardChanges}
            >
              Descartar alterações
            </button>
          </div>
        </div>
      </div>
    </FeedFilterProvider>
  )
}
