import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { DashIcon, DashAvatar, GoogleGlyph } from './Icons'
import { sanitizeName, validateName, formatCpf } from '../../utils/validation'
import {
  isGoogleCalendarAvailable,
  getGoogleCalendarStatus,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  type GcalStatus,
} from '../../services/googleCalendar'
import { changeEmail, ApiError } from '../../services/user'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../services/notification'
import './ProfilePage.css'

/** Áreas de interesse disponíveis para seleção no perfil. */
const INTERESSES = [
  'Tecnologia', 'Educação', 'Saúde', 'Infraestrutura',
  'Cultura', 'Serviços', 'Consultoria', 'Engenharia',
]

/** Associa cada área de interesse ao nome do ícone correspondente. */
const ICONE_POR_INTERESSE: Record<string, string> = {
  Tecnologia: 'tech',
  Educação: 'educacao',
  Saúde: 'saude',
  Infraestrutura: 'infraestrutura',
  Cultura: 'cultura',
  Serviços: 'servicos',
  Consultoria: 'consultoria',
  Engenharia: 'engenharia',
}

/** Lista de estados brasileiros (sigla e nome) para o campo de localização. */
const ESTADOS = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]

/** Opções de antecedência (em dias) para as notificações de prazo. */
const NOTIFICATION_DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 60, label: '60 dias antes' },
  { value: 30, label: '30 dias antes' },
  { value: 20, label: '20 dias antes' },
  { value: 10, label: '10 dias antes' },
  { value: 7, label: '7 dias antes' },
  { value: 1, label: '1 dia antes' },
  { value: 0, label: 'No dia do prazo' },
]

/** Dados exibidos e editados na página de perfil do usuário. */
export type ProfileData = {
  nome: string
  email: string
  cpf: string
  dataNascimento: string
  estado: string
  interesses: string[]
  avatarUrl: string | null
}

/**
 * Página de perfil: dados pessoais, troca de foto e e-mail, áreas de interesse,
 * preferências de notificação e integração com a Google Agenda.
 */
export default function ProfilePage({
  profile,
  onChange,
  onSave,
  onAvatarSelect,
  avatarPending = false,
  userActive = true,
}: {
  profile: ProfileData
  onChange: (next: ProfileData) => void
  onSave: () => Promise<void>
  onAvatarSelect: (file: File) => void
  avatarPending?: boolean
  userActive?: boolean
}) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailChangeOpen, setEmailChangeOpen] = useState(false)
  const [emailChangeLoading, setEmailChangeLoading] = useState(false)
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null)
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [gcalAvailable] = useState(isGoogleCalendarAvailable)
  const [gcalStatus, setGcalStatus] = useState<GcalStatus>(getGoogleCalendarStatus)
  const [gcalBusy, setGcalBusy] = useState(false)
  const [gcalMsg, setGcalMsg] = useState<string | null>(null)
  const [notifDays, setNotifDays] = useState<number[]>([])
  const [notifError, setNotifError] = useState<string | null>(null)

  /**
   * Carrega as preferências de notificação do usuário ao montar a página.
   */
  useEffect(() => {
    getNotificationPreferences()
      .then((data) => setNotifDays(data.selected))
      .catch(() => setNotifError('Não foi possível carregar as preferências de notificação'))
  }, [])

  /**
   * Atualiza um campo do perfil e marca a página como com alterações não salvas.
   * @param key - Campo a alterar.
   * @param value - Novo valor do campo.
   */
  function set<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    onChange({ ...profile, [key]: value })
    setSaved(false)
  }

  /**
   * Trata a digitação do nome, sanitizando caracteres e validando o conteúdo.
   * @param e - Evento de alteração do campo de nome.
   */
  function handleNomeChange(e: ChangeEvent<HTMLInputElement>) {
    const sanitized = sanitizeName(e.target.value)
    set('nome', sanitized)
    const error = validateName(sanitized)
    setNameError(error)
  }

  /**
   * Adiciona ou remove uma área de interesse da lista do usuário.
   * @param item - Nome da área de interesse.
   */
  function toggleInteresse(item: string) {
    const has = profile.interesses.includes(item)
    set(
      'interesses',
      has ? profile.interesses.filter((i) => i !== item) : [...profile.interesses, item],
    )
  }

  /**
   * Ativa ou desativa uma antecedência de notificação.
   * @param value - Quantidade de dias antes do prazo.
   */
  function toggleNotifDay(value: number) {
    setNotifError(null)
    setNotifDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value],
    )
  }

  /** Formatos de imagem aceitos para a foto de perfil. */
  const AVATAR_TIPOS = ['image/jpeg', 'image/png', 'image/webp']
  /** Tamanho máximo (2 MB) aceito para a foto de perfil. */
  const AVATAR_TAMANHO_MAX = 2 * 1024 * 1024

  /**
   * Valida o arquivo de foto escolhido (formato e tamanho) e o encaminha para preview.
   * @param e - Evento de alteração do input de arquivo.
   */
  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    input.value = ''
    setAvatarError(null)

    if (!AVATAR_TIPOS.includes(file.type)) {
      setAvatarError('Formato inválido. Use uma imagem JPG, PNG ou WEBP.')
      return
    }
    if (file.size > AVATAR_TAMANHO_MAX) {
      setAvatarError('A imagem deve ter no máximo 2 MB.')
      return
    }

    onAvatarSelect(file)
  }

  /**
   * Salva o perfil e as preferências de notificação em paralelo, exibindo
   * confirmação temporária e tratando erros de upload da foto.
   */
  async function handleSave() {
    const error = validateName(profile.nome)
    if (error) {
      setNameError(error)
      return
    }
    setSaving(true)
    try {
      await Promise.all([
        onSave(),
        updateNotificationPreferences(notifDays).then((data) => setNotifDays(data.selected)),
      ])
      setSaved(true)
      setNameError(null)
      setAvatarError(null)
      window.setTimeout(() => setSaved(false), 2200)
    } catch (err: unknown) {
      if (avatarPending && err instanceof ApiError) {
        setAvatarError(
          err.status === 400 || err.status === 413 || err.status === 415
            ? err.message
            : 'Não foi possível enviar a foto. Tente novamente.',
        )
      }
      // falha ao gravar: o estado 'saving' é liberado no finally
    } finally {
      setSaving(false)
    }
  }

  /**
   * Valida e envia a solicitação de alteração de e-mail, tratando os
   * erros mais comuns (e-mail em uso, senha incorreta etc.).
   * @param e - Evento de submissão do formulário do modal de e-mail.
   */
  async function handleEmailChangeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailChangeError(null)
    setEmailChangeLoading(true)

    if (!newEmail.trim() || !currentPassword) {
      setEmailChangeError('Preencha todos os campos')
      setEmailChangeLoading(false)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setEmailChangeError('E-mail inválido')
      setEmailChangeLoading(false)
      return
    }

    try {
      await changeEmail(newEmail.trim().toLowerCase(), currentPassword)
      setEmailChangeOpen(false)
      setNewEmail('')
      setCurrentPassword('')
      setEmailChangeSuccess(true)
      window.setTimeout(() => setEmailChangeSuccess(false), 8000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao solicitar alteração de e-mail'
      if (message.includes('já está em uso') || message.includes('já cadastrado')) {
        setEmailChangeError('Este e-mail já está em uso')
      } else if (message.includes('Senha incorreta') || message.includes('401')) {
        setEmailChangeError('Senha incorreta')
      } else if (message.includes('igual ao atual')) {
        setEmailChangeError('O novo e-mail é igual ao atual')
      } else {
        setEmailChangeError(message)
      }
    } finally {
      setEmailChangeLoading(false)
    }
  }

  /** Abre o modal de alteração de e-mail com os campos limpos. */
  function openEmailChangeModal() {
    setEmailChangeOpen(true)
    setEmailChangeError(null)
    setNewEmail('')
    setCurrentPassword('')
  }

  /** Fecha o modal de alteração de e-mail e limpa os campos. */
  function closeEmailChangeModal() {
    setEmailChangeOpen(false)
    setEmailChangeError(null)
    setNewEmail('')
    setCurrentPassword('')
  }

  /** CPF do usuário já formatado com máscara (ou vazio). */
  const formattedCpf = profile.cpf ? formatCpf(profile.cpf) : ''

  /** Indica se a integração com a Google Agenda está autorizada. */
  const gcalConnected = gcalStatus === 'granted'

  /**
   * Inicia a conexão com a Google Agenda e informa o resultado ao usuário.
   */
  async function handleGcalConnect() {
    setGcalBusy(true)
    const status = await connectGoogleCalendar()
    setGcalStatus(status)
    setGcalBusy(false)
    setGcalMsg(
      status === 'granted'
        ? 'Conectado! Os prazos dos editais salvos serão adicionados à sua agenda.'
        : 'Conexão não concluída. Você pode tentar de novo quando quiser.',
    )
  }

  /**
   * Desconecta a Google Agenda após confirmação, removendo os eventos criados
   * e informando quantos eventos puderam (ou não) ser excluídos.
   */
  async function handleGcalDisconnect() {
    const confirmed = window.confirm(
      'Desconectar a Google Agenda?\n\nOs prazos já adicionados serão removidos do seu calendário.',
    )
    if (!confirmed) return
    setGcalBusy(true)
    const { removed, kept } = await disconnectGoogleCalendar()
    setGcalStatus('skipped')
    setGcalBusy(false)
    setGcalMsg(
      kept > 0
        ? `Desconectado. ${kept} evento(s) não puderam ser removidos — apague-os pelo Google Agenda, se desejar.`
        : removed > 0
          ? `Desconectado. ${removed} evento(s) removido(s) do seu calendário.`
          : 'Desconectado.',
    )
  }

  return (
    <div className="pdd-profile-page">
      <h1 className="pdd-page-title">Meu perfil</h1>
      <p className="pdd-profile-sub">Mantenha suas informações e preferências atualizadas.</p>

      {emailChangeSuccess && (
        <div className="pdd-email-success-banner" role="status">
          <DashIcon name="check" />
          <div>
            <strong>Link de confirmação enviado!</strong>
            <p>Enviamos um link de confirmação para o novo e-mail. Verifique sua caixa de entrada e clique no link para concluir a alteração.</p>
          </div>
          <button
            type="button"
            className="pdd-email-success-banner__close"
            onClick={() => setEmailChangeSuccess(false)}
            aria-label="Fechar aviso"
          >
            <DashIcon name="close" />
          </button>
        </div>
      )}

      <section className="pdd-profile-card">
        <h2>Dados Pessoais</h2>

        <div className="pdd-profile-photo-row">
          <button
            type="button"
            className="pdd-profile-avatar"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Alterar foto de perfil"
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" />
            ) : (
              <DashAvatar size={64} seed={2} />
            )}
            <span className="pdd-profile-avatar__badge">
              <DashIcon name="camera" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="pdd-profile-photo-input"
            onChange={handleFile}
          />
          <div>
            <p className="pdd-profile-photo-label">Foto de Perfil</p>
            <p className="pdd-profile-photo-hint">
              {avatarPending ? 'Foto selecionada — clique em "Salvar alterações"' : 'JPG, PNG ou WEBP · até 2 MB'}
            </p>
            {avatarError && <p className="pdd-profile-photo-error">{avatarError}</p>}
          </div>
        </div>

        <div className="pdd-profile-grid">
          <label className="pdd-profile-field">
            <span>Nome completo</span>
            <input
              type="text"
              value={profile.nome}
              onChange={handleNomeChange}
            />
            {nameError && <span className="pdd-profile-field__error">{nameError}</span>}
          </label>
          <label className="pdd-profile-field">
            <span>E-mail</span>
            <div className="pdd-profile-email-row">
              <input
                type="email"
                value={profile.email}
                disabled
                className="pdd-profile-field--readonly"
              />
              <button
                type="button"
                className="pdd-profile-email-change-btn"
                onClick={openEmailChangeModal}
                disabled={!userActive}
                title={!userActive ? 'Conta desativada' : undefined}
              >
                Alterar e-mail
              </button>
            </div>
          </label>
          <label className="pdd-profile-field">
            <span>CPF</span>
            <input
              type="text"
              value={formattedCpf}
              disabled
              className="pdd-profile-field--readonly"
            />
          </label>
          <label className="pdd-profile-field">
            <span>Data de nascimento</span>
            <input
              type="text"
              value={profile.dataNascimento ? new Date(profile.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
              disabled
              className="pdd-profile-field--readonly"
            />
          </label>
          <label className="pdd-profile-field">
            <span>Estado</span>
            <select value={profile.estado} onChange={(e) => set('estado', e.target.value)}>
              <option value="">Selecione</option>
              {ESTADOS.map((uf) => (
                <option key={uf.value} value={uf.value}>{uf.label} ({uf.value})</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="pdd-profile-card">
        <h2>Preferências</h2>
        <p className="pdd-profile-card__hint">Escolha as áreas que você quer acompanhar de perto.</p>

        <div className="pdd-profile-tags">
          {INTERESSES.map((item, i) => {
            const active = profile.interesses.includes(item)
            return (
              <button
                key={item}
                type="button"
                className={`pdd-profile-tag ${active ? 'is-active' : ''}`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => toggleInteresse(item)}
                aria-pressed={active}
              >
                <span className="pdd-profile-tag__icon">
                  <DashIcon name={ICONE_POR_INTERESSE[item] ?? 'tech'} />
                </span>
                {item}
              </button>
            )
          })}
        </div>
      </section>

      <section className="pdd-profile-card">
        <h2>Notificações</h2>
        <p className="pdd-profile-card__hint">
          Escolha com quanto antecedência quer receber avisos dos editais salvos.
        </p>

        {!userActive && (
          <p className="pdd-profile-card__hint">Conta desativada: não é possível alterar.</p>
        )}

        <div className="pdd-notif-days">
          {NOTIFICATION_DAY_OPTIONS.map((opt) => {
            const active = notifDays.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                className={`pdd-notif-day ${active ? 'is-active' : ''}`}
                onClick={() => toggleNotifDay(opt.value)}
                aria-pressed={active}
                disabled={!userActive}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {notifError && <p className="pdd-notif-days__error">{notifError}</p>}
      </section>

      <div className="pdd-profile-save-row">
        <button
          type="button"
          className="pdd-profile-save"
          onClick={handleSave}
          disabled={saving || !userActive}
          title={userActive ? undefined : 'Conta desativada'}
        >
          {saving ? (
            'Salvando...'
          ) : saved ? (
            <>
              <DashIcon name="check" /> Salvo!
            </>
          ) : (
            'Salvar alterações'
          )}
        </button>
      </div>

      {gcalAvailable && (
        <section className="pdd-profile-card">
          <h2>Permissões</h2>
          <p className="pdd-profile-card__hint">Controle as integrações da sua conta.</p>

          <div className="pdd-profile-perm">
            <div className="pdd-profile-perm__info">
              <div className="pdd-profile-perm__head">
                <span className="pdd-profile-perm__gicon">
                  <GoogleGlyph />
                </span>
                <strong>Google Agenda</strong>
                <span className={`pdd-profile-perm__status ${gcalConnected ? 'is-on' : ''}`}>
                  {gcalConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <p className="pdd-profile-perm__desc">
                Adiciona os prazos dos editais salvos ao seu Google Agenda automaticamente.
              </p>
              {gcalMsg && <p className="pdd-profile-perm__msg">{gcalMsg}</p>}
            </div>

            <div className="pdd-profile-perm__actions">
              {gcalConnected ? (
                <button
                  type="button"
                  className="pdd-profile-perm__btn pdd-profile-perm__btn--danger"
                  onClick={handleGcalDisconnect}
                  disabled={gcalBusy || !userActive}
                  title={!userActive ? 'Conta desativada' : undefined}
                >
                  {gcalBusy ? 'Desconectando…' : 'Desconectar'}
                </button>
              ) : (
                <button
                  type="button"
                  className="pdd-profile-perm__btn"
                  onClick={handleGcalConnect}
                  disabled={gcalBusy || !userActive}
                  title={!userActive ? 'Conta desativada' : undefined}
                >
                  {gcalBusy ? 'Conectando…' : 'Conectar'}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {emailChangeOpen && (
        <div className="pdd-modal-overlay" onClick={closeEmailChangeModal} role="presentation">
          <div className="pdd-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="email-change-title">
            <h2 id="email-change-title">Alterar e-mail</h2>
            <p className="pdd-modal-hint">Insira o novo e-mail e sua senha atual para confirmar a alteração.</p>
            <form onSubmit={handleEmailChangeSubmit}>
              {emailChangeError && <p className="pdd-modal-error">{emailChangeError}</p>}
              <div className="pdd-modal-field">
                <label htmlFor="new-email">Novo e-mail</label>
                <input
                  type="email"
                  id="new-email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="novo@email.com"
                  required
                  autoComplete="email"
                  disabled={emailChangeLoading}
                />
              </div>
              <div className="pdd-modal-field">
                <label htmlFor="current-password">Senha atual</label>
                <input
                  type="password"
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={emailChangeLoading}
                />
              </div>
              <div className="pdd-modal-actions">
                <button
                  type="button"
                  className="pdd-modal-btn pdd-modal-btn--secondary"
                  onClick={closeEmailChangeModal}
                  disabled={emailChangeLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pdd-modal-btn pdd-modal-btn--primary"
                  disabled={emailChangeLoading}
                >
                  {emailChangeLoading ? 'Enviando…' : 'Confirmar alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
