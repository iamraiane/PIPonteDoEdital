/**
 * Formata uma data ISO como tempo relativo em português (ex.: "há 5 min").
 * @param iso - Data em formato ISO 8601.
 * @returns Texto com o tempo decorrido ou a data curta (pt-BR) após 7 dias.
 */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days} dia${days > 1 ? 's' : ''}`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
