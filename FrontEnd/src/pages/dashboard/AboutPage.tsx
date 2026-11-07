import { DashAvatar } from './Icons'
import './AboutPage.css'

const TEAM = [
  { nome: 'Raiane Cecílio', papel: 'Estudante do 5º ano do curso de Análise e Desenvolvimento de Sistemas' },
  { nome: 'Gustavo Nori', papel: 'Estudante do 5º ano do curso de Análise e Desenvolvimento de Sistemas' },
]

export default function AboutPage() {
  return (
    <div className="pdd-about-page">
      <h1 className="pdd-page-title">Quem Somos</h1>
      <p className="pdd-about-intro">
        Transformamos preparação em aprovação. O Ponte do Edital nasceu para facilitar o acesso
        a conteúdos de qualidade, simulados e materiais completos para concursos públicos.
      </p>

      <section className="pdd-about-card">
        <h2>Nossa História</h2>
        <div className="pdd-about-card__inner">
          <p>
            Fundado em 2026, o Ponte do Edital reúne tecnologia e inteligência para transformar
            o modo como profissionais acompanham oportunidades públicas.
          </p>
        </div>
      </section>

      <section className="pdd-about-card">
        <h2>Equipe</h2>
        <div className="pdd-team-grid">
          {TEAM.map((m, i) => (
            <div key={m.nome} className="pdd-team-card" style={{ animationDelay: `${i * 90}ms` }}>
              <DashAvatar size={56} seed={i} />
              <p className="pdd-team-card__nome">{m.nome}</p>
              <p className="pdd-team-card__papel">{m.papel}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
