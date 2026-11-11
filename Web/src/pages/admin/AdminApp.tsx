import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import AdminShell from './AdminShell'
import OverviewPage from './OverviewPage'
import EditaisPage from './EditaisPage'
import UsuariosPage from './UsuariosPage'
import DoubtsPage from './DoubtsPage'

/** Mapeia o segmento de URL da rota para a chave interna da página. */
const ROUTE_MAP: Record<string, string> = {
  overview: 'overview',
  editais: 'editais',
  usuarios: 'usuarios',
  duvidas: 'duvidas',
}

/** Mapeia a chave de navegação do menu para a rota completa do admin. */
const KEY_TO_ROUTE: Record<string, string> = {
  overview: '/admin/overview',
  editais: '/admin/editais',
  usuarios: '/admin/usuarios',
  duvidas: '/admin/duvidas',
}

/**
 * Aplicação do painel administrativo: define as rotas internas
 * (visão geral, editais, usuários e dúvidas) dentro do shell do admin
 * e sincroniza o item de menu ativo com a URL atual.
 */
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

  /**
   * Navega para a rota do admin correspondente à chave do menu.
   * @param key - Chave da página de destino ('overview', 'editais', 'usuarios' ou 'duvidas').
   */
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
        <Route path="duvidas" element={<DoubtsPage />} />
      </Routes>
    </AdminShell>
  )
}
