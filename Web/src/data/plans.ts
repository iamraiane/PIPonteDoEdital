/**
 * Dados de um plano de assinatura exibido na página comercial.
 */
export interface Plan {
  id: 'free' | 'premium'
  name: string
  price: string
  period: string
  featured: boolean
  features: string[]
  cta: string
  action?: 'navigate' | 'subscribe'
}

/**
 * Lista dos planos disponíveis (gratuito e premium) para a página comercial.
 */
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Grátis',
    price: 'R$ 0',
    period: '/mês',
    featured: false,
    features: [
      'Até 5 editais recomendados',
      'Feed personalizado básico',
    ],
    cta: 'Continuar',
    action: 'navigate',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 9,90',
    period: '/mês',
    featured: true,
    features: [
      'Editais ilimitados',
      'Calendário com lembretes',
      'Filtro avançado',
      'Alertas em tempo real',
      'Notificações personalizadas',
      'Acompanhe quantos editais quiser',
    ],
    cta: 'Assinar',
    action: 'subscribe',
  },
]
