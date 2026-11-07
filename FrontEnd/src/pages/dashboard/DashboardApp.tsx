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
import { getUserById, updateUser } from '../../services/user'

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
  const [unsavedOpen, setUnsavedOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

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
          avatarUrl: null,
        }
        setProfile(loaded)
        setSavedProfile(loaded)
      })
      .catch(console.error)
  }, [userId])

  const pathSegment = location.pathname.split('/')[2] || 'feed'
  const page: PageKey = ROUTE_MAP[pathSegment] || 'feed'
  const isDirty = page === 'profile' && !profilesEqual(profile, savedProfile)

  async function handleSaveProfile() {
    if (!userId) return
    const snapshot = profile
    await updateUser(userId, {
      name: snapshot.nome,
      state_code: snapshot.estado,
      preferences: snapshot.interesses,
    })
    setSavedProfile(snapshot)
  }

  function runGuarded(action: () => void) {
    if (isDirty) {
      setPendingAction(() => action)
      setUnsavedOpen(true)
      return
    }
    action()
  }

  function handleNavigate(key: PageKey) {
    if (key === page) return
    runGuarded(() => navigate(KEY_TO_ROUTE[key]))
  }

  function handleLogout() {
    if (onLogout) runGuarded(onLogout)
  }

  function handleKeepEditing() {
    setUnsavedOpen(false)
    setPendingAction(null)
  }

  function handleDiscardChanges() {
    setProfile(savedProfile)
    setUnsavedOpen(false)
    const action = pendingAction
    setPendingAction(null)
    action?.()
  }

  useEffect(() => {
    if (!isDirty) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

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

  const firstName = profile.nome.trim().split(' ')[0] || userName
  const preference = profile.interesses.length > 0 ? profile.interesses.join(' & ') : undefined

  return (
    <FeedFilterProvider>
      <DashboardShell
        active={page}
        onNavigate={handleNavigate}
        userName={firstName}
        preference={preference}
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
          <Route path="profile" element={<ProfilePage profile={profile} onChange={setProfile} onSave={handleSaveProfile} userActive={userActive} />} />
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
