import { useNavigate } from 'react-router-dom'
import logoPonte from '../assets/logo-ponte.png'
import logoNome from '../assets/logo-nome.png'
import './PrivacyPage.css'

export default function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div className="pp">
      <header className="pp-header">
        <div className="pp-container pp-header__row">
          <a className="pp-brand" href="/commercial" onClick={(e) => { e.preventDefault(); navigate('/commercial'); }}>
            <img src={logoPonte} alt="" aria-hidden="true" className="pp-brand__icon" />
            <img src={logoNome} alt="Ponte do Edital" className="pp-brand__logo" />
          </a>
          <button className="pp-btn-back" onClick={() => navigate(-1)}>
            ← Voltar
          </button>
        </div>
      </header>

      <main className="pp-main">
        <div className="pp-container">
          <h1 className="pp-title">Política de Privacidade</h1>
          <p className="pp-date">Última atualização: 28 de agosto de 2026</p>

          <div className="pp-content">
            <div className="pp-info-box">
              <p>
                A sua privacidade é importante para nós. Esta Política de Privacidade explica quais informações podem ser coletadas pelo <strong>Ponte do Edital</strong>, como são utilizadas e quais são os seus direitos.
              </p>
            </div>

            <section className="pp-section">
              <h2>1. Informações que coletamos</h2>
              <p>Para oferecer determinadas funcionalidades, o Ponte do Edital poderá coletar informações fornecidas pelo próprio usuário.</p>
              <p>Entre essas informações podem estar:</p>
              <ul>
                <li>Nome;</li>
                <li>Endereço de e-mail;</li>
                <li>Informações necessárias para criação da conta;</li>
                <li>Preferências relacionadas aos editais;</li>
                <li>Editais salvos pelo usuário.</li>
              </ul>
            </section>

            <section className="pp-section">
              <h2>2. Informações de navegação</h2>
              <p>Durante a utilização da plataforma, determinadas informações técnicas podem ser registradas automaticamente, como informações relacionadas ao dispositivo, navegador e interação com o sistema.</p>
              <p>Esses dados podem ser utilizados para melhorar a segurança, estabilidade e experiência de utilização da plataforma.</p>
            </section>

            <section className="pp-section">
              <h2>3. Como utilizamos os dados</h2>
              <p>As informações coletadas podem ser utilizadas para:</p>
              <ul>
                <li>Criar e administrar a conta do usuário;</li>
                <li>Permitir o acesso às funcionalidades da plataforma;</li>
                <li>Processar pagamentos, quando aplicável;</li>
                <li>Personalizar as oportunidades apresentadas;</li>
                <li>Enviar notificações relacionadas às preferências do usuário;</li>
                <li>Melhorar o funcionamento e a segurança do sistema;</li>
                <li>Identificar e prevenir usos indevidos da plataforma.</li>
              </ul>
            </section>

            <section className="pp-section">
              <h2>4. Editais e fontes externas</h2>
              <p>O Ponte do Edital reúne informações de editais disponibilizados publicamente por diferentes órgãos e fontes.</p>
              <p>A plataforma não é responsável pelas políticas de privacidade, conteúdos ou práticas de terceiros responsáveis pelas páginas oficiais dos editais.</p>
            </section>

            <section className="pp-section">
              <h2>5. Compartilhamento de informações</h2>
              <p>O Ponte do Edital não comercializa os dados pessoais dos usuários.</p>
              <p>As informações poderão ser compartilhadas quando isso for necessário para o funcionamento da plataforma, cumprimento de obrigações legais ou proteção dos direitos e segurança da plataforma e de seus usuários.</p>
            </section>

            <section className="pp-section">
              <h2>6. Segurança das informações</h2>
              <p>Adotamos medidas técnicas e organizacionais adequadas para proteger as informações dos usuários contra acessos não autorizados, alterações, divulgação ou destruição indevida.</p>
              <p>Apesar dos esforços para proteger os dados, nenhum sistema conectado à internet pode garantir segurança absoluta.</p>
            </section>

            <section className="pp-section">
              <h2>7. Armazenamento dos dados</h2>
              <p>As informações pessoais serão armazenadas pelo período necessário para cumprir as finalidades para as quais foram coletadas, respeitando as obrigações legais aplicáveis.</p>
              <p>Quando os dados não forem mais necessários, poderão ser excluídos, salvo quando houver obrigação legal de conservação.</p>
            </section>

            <section className="pp-section">
              <h2>8. Seus direitos</h2>
              <p>O usuário possui direitos relacionados aos seus dados pessoais, observadas as condições previstas na legislação aplicável.</p>
              <div className="pp-highlight-box">
                <p><strong>Você poderá solicitar, quando aplicável:</strong></p>
                <ul>
                  <li>Confirmação da existência de tratamento de dados;</li>
                  <li>Acesso aos seus dados pessoais;</li>
                  <li>Correção de informações incorretas;</li>
                  <li>Atualização dos seus dados;</li>
                  <li>Exclusão de dados, quando legalmente possível;</li>
                  <li>Informações sobre o tratamento dos seus dados.</li>
                </ul>
              </div>
            </section>

            <section className="pp-section">
              <h2>9. Cookies e tecnologias semelhantes</h2>
              <p>O Ponte do Edital poderá utilizar cookies ou tecnologias semelhantes para melhorar a experiência do usuário, manter funcionalidades da plataforma e compreender como os usuários interagem com o sistema.</p>
              <p>O usuário poderá controlar determinadas permissões de cookies por meio das configurações do próprio navegador, quando disponível.</p>
            </section>

            <section className="pp-section">
              <h2>10. Privacidade de menores</h2>
              <p>A plataforma não tem como objetivo coletar intencionalmente dados pessoais de crianças em desacordo com a legislação aplicável.</p>
            </section>

            <section className="pp-section">
              <h2>10. Alterações nesta Política</h2>
              <p>Esta Política de Privacidade poderá ser atualizada periodicamente para refletir alterações na plataforma, nos processos de tratamento de dados ou na legislação aplicável.</p>
              <p>A versão atualizada estará disponível nesta página.</p>
            </section>

            <section className="pp-section">
              <h2>10. Contato</h2>
              <p>Caso você tenha dúvidas, solicitações ou queira obter mais informações sobre o tratamento de seus dados pessoais, poderá entrar em contato com a equipe do Ponte do Edital por meio dos canais disponibilizados na plataforma.</p>
            </section>
          </div>
        </div>
      </main>

      <footer className="pp-footer">
        <div className="pp-container">
          <p>© 2026 Todos os direitos reservados a Projeto Integrador Fatec</p>
        </div>
      </footer>
    </div>
  )
}
