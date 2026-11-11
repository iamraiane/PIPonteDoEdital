import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignupFlow from './pages/SignupFlow'
import LoginFlow from './pages/LoginFlow'
import RecoverFlow from './pages/RecoverFlow'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ConfirmEmailChangePage from './pages/ConfirmEmailChangePage'
import DashboardApp from './pages/dashboard/DashboardApp'
import AdminApp from './pages/admin/AdminApp'
import CommercialPage from './pages/CommercialPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import PremiumReturnPage from './pages/PremiumReturnPage'
import { getTokenPayload, getUserById } from './services/user'
import AppLoader from './components/AppLoader'

/** Duração máxima da sessão em milissegundos (3 dias). */
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

// Avalia a sessão uma vez por carregamento de página (o login usa window.location,
// garantindo reload). Assim o render não precisa chamar Date.now (pureza do React).
/**
 * Verifica se há uma sessão válida (token e login recentes) no carregamento.
 * @returns Payload do usuário quando a sessão é válida; caso contrário, null.
 */
function peekSession(): { id: number } | null {
  const token = localStorage.getItem('token')
  const loginTime = localStorage.getItem('loginTime')
  if (!token || !loginTime) return null
  if (Date.now() - Number(loginTime) > THREE_DAYS_MS) return null
  const payload = getTokenPayload()
  return payload?.id ? payload : null
}

/** Sessão avaliada uma única vez no carregamento da página. */
const sessionAtLoad = peekSession()

/**
 * Rota protegida: redireciona para /login quando não há sessão válida.
 * @param children - Elementos renderizados apenas com sessão ativa.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!sessionAtLoad) return <Navigate to="/login" replace />
  const token = localStorage.getItem('token')
  const loginTime = localStorage.getItem('loginTime')
  if (!token || !loginTime) return <Navigate to="/login" replace />
  const payload = getTokenPayload()
  if (!payload?.id) return <Navigate to="/login" replace />

  return <>{children}</>
}

/**
 * Rota de administrador: permite acesso apenas a admins ativos,
 * redirecionando para /dashboard nos demais casos.
 * @param userRole - Papel do usuário autenticado.
 * @param userActive - Indica se a conta do usuário está ativa.
 * @param children - Elementos renderizados apenas para admins ativos.
 */
function AdminRoute({
  userRole,
  userActive,
  children,
}: {
  userRole: string
  userActive: boolean
  children: React.ReactNode
}) {
  if (userRole !== 'admin' || !userActive) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

/**
 * Componente raiz: define as rotas da aplicação e carrega os dados
 * do usuário autenticado (nome, papel e status) para as rotas protegidas.
 */
function App() {
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState<number | undefined>()
  const [userRole, setUserRole] = useState<string>('')
  const [userActive, setUserActive] = useState(true)
  const [loaded, setLoaded] = useState(false)

  /**
   * Carrega os dados do usuário autenticado ao montar o componente;
   * limpa o token quando a sessão é inválida ou a requisição falha.
   */
  useEffect(() => {
    if (!sessionAtLoad) {
      localStorage.removeItem('token')
      localStorage.removeItem('loginTime')
      return
    }

    getUserById(sessionAtLoad.id)
      .then((user) => {
        setUserName(user.name)
        setUserId(user.id)
        setUserRole(user.role)
        setUserActive(user.active !== false)
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('loginTime')
      })
      .finally(() => setLoaded(true))
  }, [])

  /**
   * Encerra a sessão do usuário e redireciona para a página comercial.
   */
  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('loginTime')
    window.location.href = '/commercial'
  }

  if (sessionAtLoad && !loaded) return <AppLoader />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginFlow />} />
        <Route path="/signup" element={<SignupFlow />} />
        <Route path="/recover" element={<RecoverFlow />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/confirm-email-change" element={<ConfirmEmailChangePage />} />
        <Route path="/commercial" element={<CommercialPage />} />
        <Route index element={<Navigate to="/commercial" replace />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route
          path="/premium/retorno"
          element={
            <ProtectedRoute>
              <PremiumReturnPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardApp
                userName={userName}
                userId={userId}
                userRole={userRole}
                userActive={userActive}
                onLogout={handleLogout}
                onOpenAdmin={userRole === 'admin' && userActive ? () => window.location.href = '/admin' : undefined}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <AdminRoute userRole={userRole} userActive={userActive}>
              <ProtectedRoute>
                <AdminApp
                  onExitAdmin={() => window.location.href = '/dashboard'}
                  onLogout={handleLogout}
                />
              </ProtectedRoute>
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
