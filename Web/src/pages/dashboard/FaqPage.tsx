import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { DashIcon } from './Icons'
import { getDoubts, createDoubt, type Doubt } from '../../services/doubt'
import { timeAgo } from '../../utils/timeAgo'
import './FaqPage.css'

const FAQS = [
  {
    id: '1',
    pergunta: 'Como funciona o agendamento de prazos?',
    resposta: 'Ao salvar um edital, você pode marcar o prazo no calendário e receber lembretes por e-mail.',
  },
  {
    id: '2',
    pergunta: 'Posso mudar de plano quando quiser?',
    resposta: 'Sim. Você pode fazer upgrade ou cancelar o plano Premium a qualquer momento, sem multa.',
  },
  {
    id: '3',
    pergunta: 'Como escolho minhas áreas de interesse?',
    resposta: 'Em "Ajustar preferências", na barra lateral, você pode selecionar ou alterar seus interesses quando quiser.',
  },
]

export default function FaqPage() {
  const [openId, setOpenId] = useState<string | null>('1')
  const [modalOpen, setModalOpen] = useState(false)
  const [assunto, setAssunto] = useState('')
  const [descricao, setDescricao] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [loadingDoubts, setLoadingDoubts] = useState(true)

  useEffect(() => {
    getDoubts()
      .then(setDoubts)
      .catch(() => {})
      .finally(() => setLoadingDoubts(false))
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [modalOpen])

  function refreshDoubts() {
    getDoubts().then(setDoubts).catch(() => {})
  }

  function openModal() {
    setModalOpen(true)
    setStatus('idle')
    setError('')
  }

  function closeModal() {
    setModalOpen(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!assunto.trim() || !descricao.trim()) return
    setStatus('sending')
    setError('')
    try {
      await createDoubt(`${assunto.trim()}\n\n${descricao.trim()}`)
      setStatus('sent')
      refreshDoubts()
      window.setTimeout(() => {
        setModalOpen(false)
        setAssunto('')
        setDescricao('')
        setStatus('idle')
      }, 1100)
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Não foi possível enviar. Tente novamente.')
    }
  }

  const sortedDoubts = [...doubts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <div className="pdd-faq-page">
      <div className="pdd-faq-header">
        <div>
          <h1 className="pdd-page-title">Perguntas Frequentes</h1>
          <p className="pdd-faq-sub">
            Respostas sobre a plataforma, planos, editais e muito mais. Se não encontrar o que
            precisa, nossa equipe está pronta para ajudar.
          </p>
        </div>
        <button type="button" className="pdd-faq-new" onClick={openModal}>
          <DashIcon name="plus" /> Nova pergunta
        </button>
      </div>

      <div className="pdd-faq-list">
        {FAQS.map((f, i) => {
          const open = openId === f.id
          return (
            <div
              key={f.id}
              className="pdd-faq-item"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <button
                type="button"
                className={`pdd-faq-question ${open ? 'is-open' : ''}`}
                onClick={() => setOpenId(open ? null : f.id)}
                aria-expanded={open}
              >
                <span className="pdd-faq-question__icon"><DashIcon name="question" /></span>
                {f.pergunta}
              </button>

              <div className={`pdd-faq-answer-wrap ${open ? 'is-open' : ''}`}>
                <p className="pdd-faq-answer">{f.resposta}</p>
              </div>
            </div>
          )
        })}
      </div>

      <section className="pdd-faq-doubts">
        <h2 className="pdd-faq-doubts__title">Dúvidas da comunidade</h2>
        <p className="pdd-faq-doubts__sub">
          Veja o que outros usuários perguntaram e as respostas da equipe.
        </p>

        {loadingDoubts ? (
          <p className="pdd-faq-doubts__empty">Carregando…</p>
        ) : sortedDoubts.length === 0 ? (
          <p className="pdd-faq-doubts__empty">
            Nenhuma dúvida ainda. Seja o primeiro a perguntar!
          </p>
        ) : (
          <ul className="pdd-faq-doubts__list">
            {sortedDoubts.map((d, i) => {
              const answered = d.answers.length > 0
              return (
                <li
                  key={d.id}
                  className="pdd-faq-doubts__item"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className="pdd-faq-doubts__head">
                    <span className="pdd-faq-doubts__author">{d.user?.name ?? 'Usuário'}</span>
                    <span className="pdd-faq-doubts__date">{timeAgo(d.created_at)}</span>
                    <span
                      className={`pdd-faq-doubts__badge ${answered ? 'is-answered' : ''}`}
                    >
                      {answered ? 'Respondida' : 'Aguardando resposta'}
                    </span>
                  </div>

                  <p className="pdd-faq-doubts__content">{d.content}</p>

                  {answered && (
                    <ul className="pdd-faq-doubts__answers">
                      {d.answers.map((a) => (
                        <li key={a.id} className="pdd-faq-doubts__answer">
                          <div className="pdd-faq-doubts__answer-head">
                            <span className="pdd-faq-doubts__answer-label">Equipe</span>
                            <span className="pdd-faq-doubts__date">{timeAgo(a.created_at)}</span>
                          </div>
                          <p className="pdd-faq-doubts__answer-content">{a.content}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {createPortal(
        <div className={`pdd-faq-modal-backdrop ${modalOpen ? 'is-open' : ''}`} onClick={closeModal}>
          <div
            className={`pdd-faq-modal ${modalOpen ? 'is-open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Nova pergunta"
            onClick={(e) => e.stopPropagation()}
          >
            {status === 'sent' ? (
              <div className="pdd-faq-modal__sent">
                <span className="pdd-faq-modal__sent-icon"><DashIcon name="check" /></span>
                <p>Pergunta enviada! Nossa equipe vai te responder em breve.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label className="pdd-faq-modal__field">
                  <span>Assunto</span>
                  <input
                    type="text"
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    placeholder="Ex: Problema ao salvar um edital"
                    autoFocus
                  />
                </label>

                <label className="pdd-faq-modal__field">
                  <span>Descreva o que está acontecendo</span>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Conte com detalhes o que você está vivenciando"
                    rows={4}
                  />
                </label>

                {error && <p className="pdd-faq-modal__error">{error}</p>}

                <div className="pdd-faq-modal__actions">
                  <button
                    type="submit"
                    className={`pdd-faq-modal__submit ${status === 'sending' ? 'is-loading' : ''}`}
                    disabled={status === 'sending'}
                  >
                    <span className="pdd-faq-modal__submit-label">Enviar</span>
                    <span className="pdd-faq-modal__spinner" aria-hidden="true" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}