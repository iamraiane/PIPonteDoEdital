import { useEffect, useState } from 'react'
import { DashIcon } from '../dashboard/Icons'
import { getNotices, updateNotice, deleteNotice, type NoticeApi } from '../../services/notice'
import { getTokenPayload } from '../../services/user'
import { Spinner } from '../../components/AppLoader'
import './EditaisPage.css'

type Edital = {
  id: string
  titulo: string
  orgao: string
  stateCode: string
  description: string
  prazo: string
  deadlineDateISO: string
  publicationDateISO: string
}

function mapNoticeToEdital(n: NoticeApi): Edital {
  const dateStr = n.deadline_date ?? n.publication_date
  let prazo = 'Sem prazo'
  if (dateStr) {
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
    const d = iso
      ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
      : new Date(dateStr)
    prazo = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return {
    id: String(n.id),
    titulo: n.title,
    orgao: n.state ?? 'Órgão não informado',
    stateCode: n.state_code ?? '',
    description: n.description ?? '',
    prazo,
    deadlineDateISO: n.deadline_date ?? '',
    publicationDateISO: n.publication_date ?? '',
  }
}

export default function EditaisPage() {
  const [editais, setEditais] = useState<Edital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    const payload = getTokenPayload()
    if (!payload?.id) return
    getNotices(payload.id)
      .then((data) => setEditais(data.map(mapNoticeToEdital)))
      .catch(() => setError('Erro ao carregar editais'))
      .finally(() => setLoading(false))
  }, [])
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [editando, setEditando] = useState<Edital | null>(null)
  const [excluindo, setExcluindo] = useState<Edital | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const termo = busca.toLowerCase()
  const filtrados = editais.filter(
    (e) => e.titulo.toLowerCase().includes(termo) || e.orgao.toLowerCase().includes(termo)
  )

  function avisar(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  function parseDataBR(dataBR: string, fallback: string): string {
    try {
      const d = new Date(dataBR)
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    } catch {
      // data não interpretável: mantém a data existente (fallback)
    }
    return fallback
  }

  function formatIso(dateStr: string): string {
    if (!dateStr) return 'Sem prazo'
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
    const d = iso
      ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
      : new Date(dateStr)
    if (isNaN(d.getTime())) return 'Sem prazo'
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  async function salvarEdicao(atualizado: Edital) {
    try {
      const deadlineISO = parseDataBR(atualizado.prazo, atualizado.deadlineDateISO)
      await updateNotice(Number(atualizado.id), {
        title: atualizado.titulo,
        description: atualizado.description,
        deadline_date: deadlineISO,
      })
      const next = {
        ...atualizado,
        deadlineDateISO: deadlineISO,
        prazo: formatIso(deadlineISO),
      }
      setEditais((prev) => prev.map((e) => (e.id === atualizado.id ? next : e)))
      setEditando(null)
      avisar('Edital atualizado com sucesso')
    } catch (err) {
      console.error('Erro ao atualizar edital:', err)
      avisar('Erro ao atualizar edital')
    }
  }

  async function excluir() {
    if (!excluindo) return
    try {
      await deleteNotice(Number(excluindo.id))
      setEditais((prev) => prev.filter((e) => e.id !== excluindo.id))
      setExcluindo(null)
      avisar('Edital excluído')
    } catch (err) {
      console.error('Erro ao excluir edital:', err)
      avisar('Erro ao excluir edital')
    }
  }

  return (
    <div className="pda-editais-page">
      <h1 className="pda-page-title">Gerenciamento de Editais</h1>
      <p className="pda-page-sub">Acompanhe e edite os editais cadastrados</p>

      <div className="pda-toolbar">
        <label className="pda-search">
          <span className="pda-search__glyph"><DashIcon name="search" /></span>
          <input
            type="text"
            placeholder="Buscar por título ou órgão"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
      </div>

      {loading && <Spinner label="Carregando editais..." />}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && (
      <div className="pda-table-wrap">
        <table className="pda-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Estado</th>
              <th>UF</th>
              <th>Descrição</th>
              <th>Prazo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr className="pda-empty-row">
                <td colSpan={6}>Nenhum edital encontrado.</td>
              </tr>
            )}
            {filtrados.map((edital, i) => (
              <tr key={edital.id} className={menuAberto === edital.id ? 'pda-row--menu-open' : ''} style={{ animationDelay: `${i * 40}ms` }}>
                <td data-label="Título">
                  <div className="pda-cell">
                    <span className="pda-cell-title">{edital.titulo}</span>
                    <span className="pda-cell-sub">{edital.orgao}</span>
                  </div>
                </td>
                <td data-label="Estado">{edital.orgao}</td>
                <td data-label="UF">{edital.stateCode}</td>
                <td data-label="Descrição"><span className="pda-cell-desc">{edital.description}</span></td>
                <td className="pda-cell-prazo" data-label="Prazo">{edital.prazo}</td>
                <td className="pda-actions-cell" data-label="Ações">
                  <button
                    type="button"
                    className="pda-dots-btn"
                    aria-label="Ações"
                    onClick={() => setMenuAberto(menuAberto === edital.id ? null : edital.id)}
                  >
                    <DashIcon name="dots" />
                  </button>
                  {menuAberto === edital.id && (
                    <div className="pda-row-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setEditando(edital)
                          setMenuAberto(null)
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="is-danger"
                        onClick={() => {
                          setExcluindo(edital)
                          setMenuAberto(null)
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {editando && (
        <EditarEditalSidePanel
          edital={editando}
          onCancel={() => setEditando(null)}
          onSave={salvarEdicao}
        />
      )}

      {excluindo && (
        <ConfirmarExclusaoModal
          titulo={excluindo.titulo}
          onCancel={() => setExcluindo(null)}
          onConfirm={excluir}
        />
      )}

      {toast && <div className="pda-toast">{toast}</div>}
    </div>
  )
}

function EditarEditalSidePanel({
  edital,
  onCancel,
  onSave,
}: {
  edital: Edital
  onCancel: () => void
  onSave: (e: Edital) => void
}) {
  const [form, setForm] = useState<Edital>(edital)

  return (
    <>
      <div className="pda-side-panel-overlay" onClick={onCancel} />
      <div
        className="pda-side-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Editar edital"
      >
        <div className="pda-side-panel__header">
          <h2 className="pda-side-panel__title">Editar edital</h2>
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
          <div className="pda-field">
            <label>Título</label>
            <textarea
              rows={1}
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </div>

          <div className="pda-field">
            <label>Estado</label>
            <input
              type="text"
              value={form.orgao}
              disabled
              className="pda-field--readonly"
            />
          </div>

          <div className="pda-field">
            <label>UF</label>
            <input
              type="text"
              value={form.stateCode}
              disabled
              className="pda-field--readonly"
            />
          </div>

          <div className="pda-field">
            <label>Descrição</label>
            <textarea
              rows={1}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="pda-field">
            <label>Prazo</label>
            <input
              type="text"
              value={form.prazo}
              onChange={(e) => setForm({ ...form, prazo: e.target.value })}
              placeholder="Ex: 03 Ago 2026"
            />
          </div>
        </div>

        <div className="pda-side-panel__footer">
          <button type="button" className="pda-btn pda-btn--teal" onClick={() => onSave(form)}>
            Salvar Alterações
          </button>
        </div>
      </div>
    </>
  )
}

function ConfirmarExclusaoModal({
  titulo,
  onCancel,
  onConfirm,
}: {
  titulo: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="pda-overlay" onClick={onCancel}>
      <div className="pda-modal pda-modal--dark" onClick={(e) => e.stopPropagation()}>
        <h2 className="pda-modal-title">Tem certeza que deseja excluir esse edital?</h2>
        <p className="pda-modal-note">{titulo}</p>
        <div className="pda-modal-actions">
          <button type="button" className="pda-btn pda-btn--outline" onClick={onCancel}>
            Não
          </button>
          <button type="button" className="pda-btn pda-btn--teal" onClick={onConfirm}>
            Sim
          </button>
        </div>
      </div>
    </div>
  )
}
