import { useCallback, useEffect, useState } from 'react'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '../../services/notification'
import { timeAgo } from '../../utils/timeAgo'
import type { PageKey } from './DashboardShell'
import './NotificationsPage.css'

type Filter = 'all' | 'unread'

function daysLabel(days: number): string {
  if (days === 0) return 'vence hoje'
  if (days === 1) return 'vence amanhã'
  return `faltam ${days} dias`
}

export default function NotificationsPage({
  onNavigate,
}: {
  onNavigate: (page: PageKey) => void
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  const refresh = useCallback(async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch {
      // falha ao carregar: mantém a lista atual
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const unread = notifications.filter((n) => !n.is_read).length
  const visible = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications

  async function handleOpen(n: AppNotification) {
    if (!n.is_read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)),
      )
      try {
        await markNotificationRead(n.id)
      } catch {
        refresh()
      }
    }
    onNavigate('saved')
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))
    try {
      await markAllNotificationsRead()
    } catch {
      refresh()
    }
  }

  return (
    <div className="pdd-notif-page">
      <div className="pdd-notif-page__header">
        <h1 className="pdd-page-title">Notificações</h1>
        {unread > 0 && (
          <button type="button" className="pdd-notif-page__mark-all" onClick={handleMarkAllRead}>
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="pdd-notif-page__tabs" role="tablist" aria-label="Filtrar notificações">
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'all'}
          className={`pdd-notif-page__tab ${filter === 'all' ? 'is-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todas <span className="pdd-notif-page__tab-count">{notifications.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'unread'}
          className={`pdd-notif-page__tab ${filter === 'unread' ? 'is-active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Não lidas <span className="pdd-notif-page__tab-count">{unread}</span>
        </button>
      </div>

      {loading ? (
        <p className="pdd-notif-page__empty">Carregando…</p>
      ) : visible.length === 0 ? (
        <p className="pdd-notif-page__empty">
          {filter === 'unread'
            ? 'Você não tem notificações não lidas.'
            : 'Nenhuma notificação por aqui.'}
        </p>
      ) : (
        <ul className="pdd-notif-page__list">
          {visible.map((n, i) => (
            <li key={n.id}>
              <button
                type="button"
                className={`pdd-notif-page__item ${n.is_read ? '' : 'is-unread'}`}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                onClick={() => handleOpen(n)}
              >
                <span className="pdd-notif-page__item-text">
                  <span className="pdd-notif-page__item-message">{n.message}</span>
                  <span className="pdd-notif-page__item-time">{timeAgo(n.created_at)}</span>
                </span>
                <span className="pdd-notif-page__item-days">{daysLabel(n.days_left)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
