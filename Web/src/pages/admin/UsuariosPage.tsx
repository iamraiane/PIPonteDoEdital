import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashIcon } from '../dashboard/Icons'
import { getAllUsers, promoteToAdmin, demoteToUser, promoteToPremium, disableUser, activateUser, deleteUser, getTokenPayload } from '../../services/user'
import type { UserData } from '../../services/user'
import { Spinner } from '../../components/AppLoader'
import './EditaisPage.css'
import './UsuariosPage.css'

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

export default function UsuariosPage() {
  const navigate = useNavigate()
  const currentUserId = getTokenPayload()?.id
  const [usuarios, setUsuarios] = useState<UserData[]>([])
  const [busca, setBusca] = useState('')
  const [mostrarTodos, setMostrarTodos] = useState(true)
  const [editando, setEditando] = useState<UserData | null>(null)
  const [excluindo, setExcluindo] = useState<UserData | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const avisar = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => {
    getAllUsers()
      .then((data) => setUsuarios(data))
      .catch((err) => {
        console.error('Erro ao carregar usuários:', err)
        avisar('Erro ao carregar usuários')
      })
      .finally(() => setLoading(false))
  }, [avisar])

  const termo = busca.toLowerCase()
  const filtrados = usuarios.filter((u) => {
    const bate = u.name.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
    if (!mostrarTodos) return bate && u.role === 'user'
    return bate
  })

  async function salvarStatus(id: number, isAdmin: boolean, isPremium: boolean, ativo: boolean) {
    try {
      const original = usuarios.find((u) => u.id === id)
      if (!ativo && id === currentUserId) {
        avisar('Você não pode desativar sua própria conta')
        return
      }
      let role: string
      if (isAdmin) {
        await promoteToAdmin(id)
        role = 'admin'
        avisar('Usuário promovido a admin')
      } else if (isPremium) {
        await promoteToPremium(id)
        role = 'premium'
        avisar('Usuário promovido a premium')
      } else {
        await demoteToUser(id)
        role = 'user'
        if (id === currentUserId) {
          navigate('/dashboard')
          return
        }
        avisar('Permissão removida')
      }
      if (ativo !== (original?.active !== false)) {
        if (ativo) {
          await activateUser(id)
          avisar('Usuário reativado')
        } else {
          await disableUser(id)
          avisar('Usuário desativado')
        }
      }
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role, active: ativo } : u))
      )
      setEditando(null)
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      avisar('Erro ao atualizar status')
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'premium':
        return 'Premium'
      default:
        return 'Ativo'
    }
  }

  async function handleExcluir() {
    if (!excluindo) return
    if (excluindo.id === currentUserId) {
      avisar('Você não pode excluir sua própria conta')
      setExcluindo(null)
      return
    }
    try {
      await deleteUser(excluindo.id)
      setUsuarios((prev) => prev.filter((u) => u.id !== excluindo.id))
      if (editando?.id === excluindo.id) setEditando(null)
      avisar('Usuário excluído')
      setExcluindo(null)
    } catch (err) {
      console.error('Erro ao excluir usuário:', err)
      avisar('Erro ao excluir usuário')
      setExcluindo(null)
    }
  }

  if (loading) {
    return (
      <div className="pda-usuarios-page">
        <h1 className="pda-page-title">Gerenciamento de Usuários</h1>
        <Spinner label="Carregando usuários..." />
      </div>
    )
  }

  return (
    <div className="pda-usuarios-page">
      <h1 className="pda-page-title">Gerenciamento de Usuários</h1>
      <p className="pda-page-sub">Controle acessos, planos e permissões</p>

      <div className="pda-toolbar">
        <label className="pda-search">
          <span className="pda-search__glyph"><DashIcon name="search" /></span>
          <input
            type="text"
            placeholder="Buscar por nome ou email"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>

        <label className="pda-toggle-label">
          Mostrar todos
          <button
            type="button"
            className={`pda-switch ${mostrarTodos ? 'is-on' : ''}`}
            aria-pressed={mostrarTodos}
            onClick={() => setMostrarTodos((v) => !v)}
          >
            <span className="pda-switch__knob" />
          </button>
        </label>
      </div>

      <div className="pda-table-wrap">
        <table className="pda-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>E-mail</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr className="pda-empty-row">
                <td colSpan={4}>Nenhum usuário encontrado.</td>
              </tr>
            )}
            {filtrados.map((u, i) => (
              <tr key={u.id} style={{ animationDelay: `${i * 40}ms` }}>
                <td data-label="Usuário">
                  <div className="pda-cell pda-user-cell">
                    <span className="pda-avatar">{iniciais(u.name)}</span>
                    <span className="pda-cell-title">{u.name}</span>
                  </div>
                </td>
                <td data-label="E-mail">{u.email}</td>
                <td data-label="Status">
                  <span className={`pda-badge pda-badge--${u.active === false ? 'inativo' : u.role === 'admin' ? 'admin' : u.role === 'premium' ? 'premium' : 'ativo'}`}>
                    {u.active === false ? 'Desativado' : getRoleLabel(u.role)}
                  </span>
                </td>
                <td className="pda-actions-cell pda-actions-cell--single" data-label="Ações">
                  <button
                    type="button"
                    className="pda-adjust-btn"
                    onClick={() => setEditando(u)}
                  >
                    Ajustar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <EditarStatusPanel
          usuario={editando}
          onCancel={() => setEditando(null)}
          onSave={salvarStatus}
          onExcluir={() => setExcluindo(editando)}
        />
      )}

      {excluindo && (
        <ConfirmarExclusaoUsuarioModal
          nome={excluindo.name}
          onCancel={() => setExcluindo(null)}
          onConfirm={handleExcluir}
        />
      )}

      {toast && <div className="pda-toast">{toast}</div>}
    </div>
  )
}

function EditarStatusPanel({
  usuario,
  onCancel,
  onSave,
  onExcluir,
}: {
  usuario: UserData
  onCancel: () => void
  onSave: (id: number, isAdmin: boolean, isPremium: boolean, ativo: boolean) => void
  onExcluir: () => void
}) {
  const [isAdmin, setIsAdmin] = useState(usuario.role === 'admin')
  const [isPremium, setIsPremium] = useState(usuario.role === 'premium')
  const [ativo, setAtivo] = useState(usuario.active !== false)
  const isSelf = usuario.id === getTokenPayload()?.id

  function toggleAdmin() {
    const next = !isAdmin
    setIsAdmin(next)
    if (next) setIsPremium(false)
  }

  return (
    <>
      <div className="pda-side-panel-overlay" onClick={onCancel} />
      <div
        className="pda-side-panel pda-side-panel--status"
        role="dialog"
        aria-modal="true"
        aria-label="Editar status do usuário"
      >
        <div className="pda-side-panel__header">
          <h2 className="pda-side-panel__title">Editar Status</h2>
          <button
            type="button"
            className="pda-side-panel__close"
            onClick={onCancel}
            aria-label="Fechar"
          >
            <DashIcon name="close" />
          </button>
        </div>

        <div className="pda-side-panel__body">
          <p className="pda-modal-note pda-modal-note--tight">{usuario.name}</p>

          <div className="pda-status-row">
            Habilitar para Admin
            <button
              type="button"
              className={`pda-switch ${isAdmin ? 'is-on' : ''}`}
              aria-pressed={isAdmin}
              onClick={toggleAdmin}
            >
              <span className="pda-switch__knob" />
            </button>
          </div>

          <div
            className="pda-status-row"
            style={isAdmin ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            Habilitar para Premium
            <button
              type="button"
              className={`pda-switch ${isPremium ? 'is-on' : ''}`}
              aria-pressed={isPremium}
              disabled={isAdmin}
              title={isAdmin ? 'Admin já possui acesso premium' : 'Habilitar premium'}
              onClick={() => setIsPremium((v) => !v)}
            >
              <span className="pda-switch__knob" />
            </button>
          </div>

          <div
            className="pda-status-row"
            style={isSelf ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            Habilitar usuário
            <button
              type="button"
              className={`pda-switch ${ativo ? 'is-on' : ''}`}
              aria-pressed={ativo}
              disabled={isSelf}
              title={isSelf ? 'Você não pode desativar sua própria conta' : 'Conta ativa'}
              onClick={() => setAtivo((v) => !v)}
            >
              <span className="pda-switch__knob" />
            </button>
          </div>
        </div>

        <div className="pda-side-panel__footer pda-side-panel__footer--split">
          {!isSelf && (
            <button
              type="button"
              className="pda-btn pda-btn--danger"
              onClick={onExcluir}
            >
              Excluir
            </button>
          )}
          <button
            type="button"
            className="pda-btn pda-btn--teal"
            onClick={() => onSave(usuario.id, isAdmin, isPremium, ativo)}
          >
            Salvar
          </button>
        </div>
      </div>
    </>
  )
}

function ConfirmarExclusaoUsuarioModal({
  nome,
  onCancel,
  onConfirm,
}: {
  nome: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="pda-overlay" onClick={onCancel}>
      <div className="pda-modal pda-modal--dark" onClick={(e) => e.stopPropagation()}>
        <h2 className="pda-modal-title">Tem certeza que deseja excluir esse usuário?</h2>
        <p className="pda-modal-note">{nome}</p>
        <p className="pda-modal-note">Essa ação não pode ser desfeita.</p>
        <div className="pda-modal-actions">
          <button type="button" className="pda-btn pda-btn--outline" onClick={onCancel}>
            Não
          </button>
          <button type="button" className="pda-btn pda-btn--danger" onClick={onConfirm}>
            Sim, excluir
          </button>
        </div>
      </div>
    </div>
  )
}
