import { useNavigate } from 'react-router-dom'
import logoPonte from '../assets/logo-ponte.png'
import logoNome from '../assets/logo-nome.png'
import './TermsPage.css'

export default function TermsPage() {
  const navigate = useNavigate()

  return (
    <div className="tp">
      <header className="tp-header">
        <div className="tp-container tp-header__row">
          <a className="tp-brand" href="/commercial" onClick={(e) => { e.preventDefault(); navigate('/commercial'); }}>
            <img src={logoPonte} alt="" aria-hidden="true" className="tp-brand__icon" />
            <img src={logoNome} alt="Ponte do Edital" className="tp-brand__logo" />
          </a>
          <button className="tp-btn-back" onClick={() => navigate(-1)}>
            ← Voltar
          </button>
        </div>
      </header>

      <main className="tp-main">
        <div className="tp-container">
          <h1 className="tp-title">Termos de Uso</h1>
          <p className="tp-date">Última atualização: 28 de agosto de 2026</p>

          <div className="tp-content">
            <div className="tp-info-box">
              <p>
                Ao utilizar o <strong>Ponte do Edital</strong>, você declara que leu, compreendeu e concorda com os presentes Termos de Uso. Caso não concorde com alguma das condições, recomendamos que não utilize a plataforma.
              </p>
            </div>

            <section className="tp-section">
              <h2>1. Sobre o Ponte do Edital</h2>
              <p>O Ponte do Edital é uma plataforma desenvolvida para facilitar o acesso e o acompanhamento de editais e oportunidades públicas disponíveis em diferentes fontes.</p>
              <p>A plataforma utiliza tecnologia para reunir, organizar e apresentar informações públicas de maneira simples e acessível aos usuários.</p>
            </section>

            <section className="tp-section">
              <h2>2. Cadastro e conta do usuário</h2>
              <p>Para utilizar determinadas funcionalidades da plataforma, poderá ser necessário criar uma conta.</p>
              <p>Ao realizar o cadastro, o usuário se compromete a:</p>
              <ul>
                <li>Fornecer informações verdadeiras e atualizadas;</li>
                <li>Mantar seus dados de acesso em segurança;</li>
                <li>Não compartilhar sua senha com terceiros;</li>
                <li>Não utilizar a conta de outra pessoa;</li>
                <li>Informar qualquer acesso não autorizado à sua conta.</li>
              </ul>
            </section>

            <section className="tp-section">
              <h2>3. Atualização da plataforma</h2>
              <p>O usuário deve utilizar o Ponte do Edital de maneira legal, responsável e compatível com a finalidade da plataforma.</p>
              <p>É proibido:</p>
              <ul>
                <li>Utilizar a plataforma para atividades ilegais;</li>
                <li>Tentar obter acesso não autorizado aos sistemas;</li>
                <li>Interferir no funcionamento da plataforma;</li>
                <li>Inserir conteúdos maliciosos ou prejudiciais;</li>
                <li>Utilizar mecanismos automatizados de maneira abusiva.</li>
              </ul>
            </section>

            <section className="tp-section">
              <h2>4. Informações sobre os editais</h2>
              <p>Os editais apresentados na plataforma são provenientes de fontes públicas e externas.</p>
              <p>O Ponte do Edital tem como objetivo facilitar a localização dessas informações, mas não substitui a consulta ao edital oficial publicado pelo órgão responsável.</p>
              <p>Antes de participar de qualquer processo seletivo, concurso ou oportunidade, recomendamos que o usuário consulte a fonte oficial e verifique todas as informações, prazos e requisitos.</p>
            </section>

            <section className="tp-section">
              <h2>5. Favoritos e preferências</h2>
              <p>A plataforma pode permitir que o usuário salve editais de interesse e configure preferências para receber informações relacionadas aos seus interesses.</p>
              <p>Essas funcionalidades existem para facilitar o acompanhamento das oportunidades e podem ser alteradas pelo usuário a qualquer momento.</p>
            </section>

            <section className="tp-section">
              <h2>6. Disponibilidade do serviço</h2>
              <p>Buscamos manter a plataforma disponível e funcionando corretamente. Entretanto, podem ocorrer interrupções temporárias decorrentes de manutenção, atualizações, problemas técnicos ou fatores externos.</p>
            </section>

            <section className="tp-section">
              <h2>7. Propriedade intelectual</h2>
              <p>O layout, identidade visual, código, funcionalidades e demais elementos próprios do Ponte do Edital são protegidos pela legislação aplicável.</p>
              <p>As informações referentes aos editais pertencem às suas respectivas fontes e órgãos responsáveis.</p>
            </section>

            <section className="tp-section">
              <h2>8. Responsabilidades do usuário</h2>
              <p>O usuário é responsável pelas informações fornecidas durante o cadastro e pela utilização de sua conta.</p>
              <p>Também é responsabilidade do usuário conferir as informações diretamente nas fontes oficiais antes de tomar decisões relacionadas a inscrições, provas, prazos ou processos seletivos.</p>
            </section>

            <section className="tp-section">
              <h2>9. Alterações dos termos</h2>
              <p>Estes Termos de Uso poderão ser atualizados para refletir mudanças na plataforma, na legislação ou em nossas práticas.</p>
              <p>A versão mais recente estará sempre disponível nesta página.</p>
            </section>

            <section className="tp-section">
              <h2>10. Contato</h2>
              <p>Caso tenha dúvidas sobre estes Termos de Uso ou sobre o funcionamento da plataforma, o usuário poderá entrar em contato com a equipe do Ponte do Edital por meio dos canais disponibilizados na plataforma.</p>
            </section>
          </div>
        </div>
      </main>

      <footer className="tp-footer">
        <div className="tp-container">
          <p>© 2026 Todos os direitos reservados a Projeto Integrador Fatec</p>
        </div>
      </footer>
    </div>
  )
}
