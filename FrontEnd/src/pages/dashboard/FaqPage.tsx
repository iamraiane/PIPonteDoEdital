import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { DashIcon } from './Icons'
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

  useEffect(() => {
    if (!modalOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [modalOpen])

  function openModal() {
    setModalOpen(true)
    setStatus('idle')
  }

  function closeModal() {
    setModalOpen(false)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!assunto.trim() || !descricao.trim()) return
    setStatus('sending')
    window.setTimeout(() => {
      setStatus('sent')
      window.setTimeout(() => {
        setModalOpen(false)
        setAssunto('')
        setDescricao('')
        setStatus('idle')
      }, 1100)
    }, 700)
  }

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