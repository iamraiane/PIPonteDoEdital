import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  getDoubts,
  answerDoubt,
  updateDoubt,
  deleteDoubt,
  updateAnswer,
  deleteAnswer,
  type Doubt,
  type DoubtAnswer,
} from '../../services/doubt'
import { timeAgo } from '../../utils/timeAgo'
import { Spinner } from '../../components/AppLoader'
import './EditaisPage.css'
import './DoubtsPage.css'

/** Categorias de filtro aplicáveis à lista de dúvidas. */
type Filtro = 'abertas' | 'respondidas' | 'todas'

/** Botões de filtro exibidos na barra de ferramentas da página. */
const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'abertas', label: 'Abertas' },
  { key: 'respondidas', label: 'Respondidas' },
  { key: 'todas', label: 'Todas' },
]

/** Limite máximo de caracteres do assunto ao editar uma dúvida. */
const ASSUNTO_MAX = 60
/** Limite máximo de caracteres da descrição ao editar uma dúvida. */
const DESCRICAO_MAX = 500
/** Limite máximo de caracteres de uma resposta de dúvida. */
const ANSWER_MAX = 1000

/**
 * Página administrativa de dúvidas dos usuários: lista as perguntas
 * enviadas pela comunidade com filtros de status e permite responder,
 * editar e excluir tanto as dúvidas quanto as respostas.
 */
export default function DoubtsPage() {
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [filtro, setFiltro] = useState<Filtro>('abertas')
  const [respondendo, setRespondendo] = useState<number | null>(null)
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Doubt | null>(null)
  const [editAssunto, setEditAssunto] = useState('')
  const [editDescricao, setEditDescricao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<number | null>(null)
  const [editandoResposta, setEditandoResposta] = useState<DoubtAnswer | null>(null)
  const [editRespostaConteudo, setEditRespostaConteudo] = useState('')
  const [salvandoResposta, setSalvandoResposta] = useState(false)
  const [excluindoResposta, setExcluindoResposta] = useState<number | null>(null)

  /**
   * Exibe uma mensagem temporária em toast e a remove após 2,2 segundos.
   * @param msg - Texto da mensagem a ser exibida.
   */
  const avisar = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }, [])

  /**
   * Carrega a lista de dúvidas do servidor ao montar o componente,
   * exibindo toast de erro caso a requisição falhe.
   */
  useEffect(() => {
    getDoubts()
      .then(setDoubts)
      .catch(() => avisar('Erro ao carregar dúvidas'))
      .finally(() => setLoading(false))
  }, [avisar])

  /** Dúvidas ordenadas da mais recente para a mais antiga. */
  const ordenadas = [...doubts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  /** Dúvidas filtradas conforme a categoria selecionada na barra de ferramentas. */
  const filtradas = ordenadas.filter((d) => {
    if (filtro === 'abertas') return d.answers.length === 0
    if (filtro === 'respondidas') return d.answers.length > 0
    return true
  })

  /**
   * Envia uma nova resposta para a dúvida indicada e recarrega a lista.
   * @param doubtId - Identificador da dúvida respondida.
   */
  async function enviarResposta(doubtId: number) {
    if (!resposta.trim()) return
    setEnviando(true)
    try {
      await answerDoubt(doubtId, resposta.trim())
      const atualizadas = await getDoubts()
      setDoubts(atualizadas)
      setRespondendo(null)
      setResposta('')
      avisar('Resposta enviada')
    } catch (err) {
      avisar(err instanceof Error ? err.message : 'Erro ao enviar resposta')
    } finally {
      setEnviando(false)
    }
  }

  /**
   * Abre o modal de edição da dúvida, separando o conteúdo em
   * assunto e descrição pela primeira quebra de linha dupla.
   * @param d - Dúvida a ser editada.
   */
  function abrirEdicao(d: Doubt) {
    const [assunto, ...resto] = d.content.split('\n\n')
    setEditando(d)
    setEditAssunto(assunto ?? '')
    setEditDescricao(resto.join('\n\n'))
    setSalvando(false)
  }

  /** Fecha o modal de edição da dúvida e reinicia o estado de salvamento. */
  function fecharEdicao() {
    setEditando(null)
    setSalvando(false)
  }

  /**
   * Salva as alterações da dúvida no servidor e recarrega a lista.
   * @param e - Evento de envio do formulário de edição.
   */
  async function handleEditar(e: FormEvent) {
    e.preventDefault()
    if (!editando || !editAssunto.trim() || !editDescricao.trim() || salvando) return
    setSalvando(true)
    try {
      await updateDoubt(editando.id, `${editAssunto.trim()}\n\n${editDescricao.trim()}`)
      const atualizadas = await getDoubts()
      setDoubts(atualizadas)
      fecharEdicao()
      avisar('Dúvida atualizada')
    } catch (err) {
      setSalvando(false)
      avisar(err instanceof Error ? err.message : 'Erro ao editar dúvida')
    }
  }

  /**
   * Confirma e exclui a dúvida no servidor, recarregando a lista.
   * @param d - Dúvida a ser excluída.
   */
  async function handleExcluir(d: Doubt) {
    if (excluindo !== null) return
    const confirmado = window.confirm('Tem certeza que deseja excluir esta dúvida?')
    if (!confirmado) return
    setExcluindo(d.id)
    try {
      await deleteDoubt(d.id)
      const atualizadas = await getDoubts()
      setDoubts(atualizadas)
      avisar('Dúvida excluída')
    } catch (err) {
      avisar(err instanceof Error ? err.message : 'Erro ao excluir dúvida')
    } finally {
      setExcluindo(null)
    }
  }

  /**
   * Abre o modal de edição da resposta selecionada.
   * @param a - Resposta a ser editada.
   */
  function abrirEdicaoResposta(a: DoubtAnswer) {
    setEditandoResposta(a)
    setEditRespostaConteudo(a.content)
    setSalvandoResposta(false)
  }

  /** Fecha o modal de edição da resposta e reinicia o estado de salvamento. */
  function fecharEdicaoResposta() {
    setEditandoResposta(null)
    setSalvandoResposta(false)
  }

  /**
   * Salva as alterações da resposta no servidor e recarrega a lista.
   * @param e - Evento de envio do formulário de edição.
   */
  async function handleEditarResposta(e: FormEvent) {
    e.preventDefault()
    if (!editandoResposta || !editRespostaConteudo.trim() || salvandoResposta) return
    setSalvandoResposta(true)
    try {
      await updateAnswer(editandoResposta.doubt_id, editandoResposta.id, editRespostaConteudo.trim())
      const atualizadas = await getDoubts()
      setDoubts(atualizadas)
      fecharEdicaoResposta()
      avisar('Resposta atualizada')
    } catch (err) {
      setSalvandoResposta(false)
      avisar(err instanceof Error ? err.message : 'Erro ao editar resposta')
    }
  }

  /**
   * Confirma e exclui a resposta no servidor, recarregando a lista.
   * @param a - Resposta a ser excluída.
   */
  async function handleExcluirResposta(a: DoubtAnswer) {
    if (excluindoResposta !== null) return
    const confirmado = window.confirm('Tem certeza que deseja excluir esta resposta?')
    if (!confirmado) return
    setExcluindoResposta(a.id)
    try {
      await deleteAnswer(a.doubt_id, a.id)
      const atualizadas = await getDoubts()
      setDoubts(atualizadas)
      avisar('Resposta excluída')
    } catch (err) {
      avisar(err instanceof Error ? err.message : 'Erro ao excluir resposta')
    } finally {
      setExcluindoResposta(null)
    }
  }

  return (
    <div className="pda-doubts-page">
      <h1 className="pda-page-title">Dúvidas dos Usuários</h1>
      <p className="pda-page-sub">Responda as perguntas enviadas pela comunidade</p>

      <div className="pda-toolbar">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`pda-btn pda-toolbar__btn ${filtro === f.key ? 'is-active' : ''}`}
            onClick={() => setFiltro(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <Spinner label="Carregando dúvidas..." />}

      {!loading && (
        <div className="pda-doubts-list">
          {filtradas.length === 0 ? (
            <p className="pda-doubts-empty">
              {filtro === 'abertas'
                ? 'Nenhuma dúvida aberta. Tudo respondido!'
                : filtro === 'respondidas'
                  ? 'Nenhuma dúvida respondida ainda.'
                  : 'Nenhuma dúvida enviada ainda.'}
            </p>
          ) : (
            filtradas.map((d, i) => (
              <article
                key={d.id}
                className="pda-doubt-card"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <header className="pda-doubt-card__head">
                  <span className="pda-doubt-card__author">
                    {d.user?.name ?? 'Usuário'}
                  </span>
                  <span className="pda-doubt-card__date">{timeAgo(d.created_at)}</span>
                  <span
                    className={`pda-doubt-card__badge ${d.answers.length > 0 ? 'is-answered' : ''}`}
                  >
                    {d.answers.length > 0 ? 'Respondida' : 'Aberta'}
                  </span>
                  <span className="pda-doubt-card__actions">
                    <button
                      type="button"
                      className="pda-doubt-card__action"
                      onClick={() => abrirEdicao(d)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="pda-doubt-card__action pda-doubt-card__action--danger"
                      disabled={excluindo === d.id}
                      onClick={() => handleExcluir(d)}
                    >
                      {excluindo === d.id ? 'Excluindo…' : 'Excluir'}
                    </button>
                  </span>
                </header>

                <p className="pda-doubt-card__content">{d.content}</p>

                {d.answers.length > 0 && (
                  <ul className="pda-doubt-card__answers">
                    {d.answers.map((a) => (
                      <li key={a.id} className="pda-doubt-card__answer">
                        <div className="pda-doubt-card__answer-head">
                          <span className="pda-doubt-card__answer-label">Equipe</span>
                          <span className="pda-doubt-card__date">{timeAgo(a.created_at)}</span>
                          <span className="pda-doubt-card__answer-actions">
                            <button
                              type="button"
                              className="pda-doubt-card__action"
                              onClick={() => abrirEdicaoResposta(a)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="pda-doubt-card__action pda-doubt-card__action--danger"
                              disabled={excluindoResposta === a.id}
                              onClick={() => handleExcluirResposta(a)}
                            >
                              {excluindoResposta === a.id ? 'Excluindo…' : 'Excluir'}
                            </button>
                          </span>
                        </div>
                        <p className="pda-doubt-card__answer-content">{a.content}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {respondendo === d.id ? (
                  <div className="pda-doubt-card__reply">
                    <label
                      className="pda-doubt-card__reply-label"
                      htmlFor={`doubt-reply-${d.id}`}
                    >
                      Sua resposta
                    </label>
                    <textarea
                      id={`doubt-reply-${d.id}`}
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                      rows={3}
                      placeholder="Escreva sua resposta..."
                      maxLength={1000}
                      autoFocus
                    />
                    <span className="pda-counter">{resposta.length} / 1000</span>
                    <div className="pda-doubt-card__reply-actions">
                      <button
                        type="button"
                        className="pda-btn pda-btn--outline"
                        onClick={() => {
                          setRespondendo(null)
                          setResposta('')
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="pda-btn pda-btn--teal"
                        disabled={enviando || !resposta.trim()}
                        onClick={() => enviarResposta(d.id)}
                      >
                        {enviando ? 'Enviando...' : 'Responder'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="pda-btn pda-doubt-card__reply-btn"
                    onClick={() => {
                      setRespondendo(d.id)
                      setResposta('')
                    }}
                  >
                    Responder
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      )}

      {toast && <div className="pda-toast">{toast}</div>}

      {editando && (
        <div className="pda-doubt-edit-backdrop" onClick={fecharEdicao}>
          <div
            className="pda-doubt-edit"
            role="dialog"
            aria-modal="true"
            aria-label="Editar dúvida"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="pda-doubt-edit__title">Editar dúvida</h2>
            <form onSubmit={handleEditar}>
              <label className="pda-doubt-edit__field">
                <span>Assunto</span>
                <input
                  type="text"
                  value={editAssunto}
                  onChange={(e) => setEditAssunto(e.target.value)}
                  maxLength={ASSUNTO_MAX}
                  autoFocus
                />
                <span className="pda-counter">
                  {editAssunto.length} / {ASSUNTO_MAX}
                </span>
              </label>

              <label className="pda-doubt-edit__field">
                <span>Descrição</span>
                <textarea
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  rows={4}
                  maxLength={DESCRICAO_MAX}
                />
                <span className="pda-counter">
                  {editDescricao.length} / {DESCRICAO_MAX}
                </span>
              </label>

              <div className="pda-doubt-edit__actions">
                <button
                  type="button"
                  className="pda-btn pda-btn--outline"
                  onClick={fecharEdicao}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pda-btn pda-btn--teal"
                  disabled={salvando || !editAssunto.trim() || !editDescricao.trim()}
                >
                  {salvando ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editandoResposta && (
        <div className="pda-doubt-edit-backdrop" onClick={fecharEdicaoResposta}>
          <div
            className="pda-doubt-edit"
            role="dialog"
            aria-modal="true"
            aria-label="Editar resposta"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="pda-doubt-edit__title">Editar resposta</h2>
            <form onSubmit={handleEditarResposta}>
              <label className="pda-doubt-edit__field">
                <span>Sua resposta</span>
                <textarea
                  value={editRespostaConteudo}
                  onChange={(e) => setEditRespostaConteudo(e.target.value)}
                  rows={4}
                  maxLength={ANSWER_MAX}
                  autoFocus
                />
                <span className="pda-counter">
                  {editRespostaConteudo.length} / {ANSWER_MAX}
                </span>
              </label>

              <div className="pda-doubt-edit__actions">
                <button
                  type="button"
                  className="pda-btn pda-btn--outline"
                  onClick={fecharEdicaoResposta}
                  disabled={salvandoResposta}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pda-btn pda-btn--teal"
                  disabled={salvandoResposta || !editRespostaConteudo.trim()}
                >
                  {salvandoResposta ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
