import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import AdminShell from './AdminShell'
import OverviewPage from './OverviewPage'
import EditaisPage from './EditaisPage'
import UsuariosPage from './UsuariosPage'

const ROUTE_MAP: Record<string, string> = {
  overview: 'overview',
  editais: 'editais',
  usuarios: 'usuarios',
}

const KEY_TO_ROUTE: Record<string, string> = {
  overview: '/admin/overview',
  editais: '/admin/editais',
  usuarios: '/admin/usuarios',
}

export default function AdminApp({
  onExitAdmin,
  onLogout,
}: {
  onExitAdmin?: () => void
  onLogout?: () => void
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const pathSegment = location.pathname.split('/')[2] || 'overview'
  const page = ROUTE_MAP[pathSegment] || 'overview'

  function handleNavigate(key: string) {
    navigate(KEY_TO_ROUTE[key])
  }

  return (
    <AdminShell active={page} onNavigate={handleNavigate} onExitAdmin={onExitAdmin} onLogout={onLogout}>
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="editais" element={<EditaisPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
      </Routes>
    </AdminShell>
  )
}
