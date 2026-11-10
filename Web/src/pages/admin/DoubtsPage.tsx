import { useCallback, useEffect, useState } from 'react'
import { getDoubts, answerDoubt, type Doubt } from '../../services/doubt'
import { timeAgo } from '../../utils/timeAgo'
import { Spinner } from '../../components/AppLoader'
import './EditaisPage.css'
import './DoubtsPage.css'

type Filtro = 'abertas' | 'respondidas' | 'todas'

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'abertas', label: 'Abertas' },
  { key: 'respondidas', label: 'Respondidas' },
  { key: 'todas', label: 'Todas' },
]

export default function DoubtsPage() {
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [filtro, setFiltro] = useState<Filtro>('abertas')
  const [respondendo, setRespondendo] = useState<number | null>(null)
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const avisar = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => {
    getDoubts()
      .then(setDoubts)
      .catch(() => avisar('Erro ao carregar dúvidas'))
      .finally(() => setLoading(false))
  }, [avisar])

  const ordenadas = [...doubts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  const filtradas = ordenadas.filter((d) => {
    if (filtro === 'abertas') return d.answers.length === 0
    if (filtro === 'respondidas') return d.answers.length > 0
    return true
  })

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
                </header>

                <p className="pda-doubt-card__content">{d.content}</p>

                {d.answers.length > 0 && (
                  <ul className="pda-doubt-card__answers">
                    {d.answers.map((a) => (
                      <li key={a.id} className="pda-doubt-card__answer">
                        <div className="pda-doubt-card__answer-head">
                          <span className="pda-doubt-card__answer-label">Equipe</span>
                          <span className="pda-doubt-card__date">{timeAgo(a.created_at)}</span>
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
                      autoFocus
                    />
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
    </div>
  )
}
