import './OverviewPage.css'

const METRICS = [
  { label: 'Usuários Ativos', value: '1.284' },
  { label: 'Prazos Agendados', value: '2.910' },
  { label: 'Assinaturas Premium', value: '192' },
]

export default function OverviewPage() {
  return (
    <div className="pda-overview-page">
      <h1 className="pda-page-title">Visão Geral</h1>
      <p className="pda-page-sub">Métricas principais</p>

      <div className="pda-metrics-panel">
        {METRICS.map((m, i) => (
          <div key={m.label} className="pda-metric-card" style={{ animationDelay: `${i * 100}ms` }}>
            <p className="pda-metric-card__label">{m.label}</p>
            <p className="pda-metric-card__value">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
