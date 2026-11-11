import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import logoPonte from "../assets/logo-ponte.png";
import logoNome from "../assets/logo-nome.png";
import AppLoader from "../components/AppLoader";
import { PLANS } from "../data/plans";
import "./CommercialPage.css";
/** Estatísticas de destaque exibidas no painel lateral do hero. */
const STATS = [
  { value: "15.500+", label: "editais monitorados" },
  { value: "27", label: "estados e DF cobertos" },
  { value: "500+", label: "usuários cadastrados" },
  { value: "600+", label: "prazos agendados" },
];

/** Cartões de recursos do produto apresentados na seção "Recursos". */
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "Acompanhamento de prazos",
    body: "Cada edital salvo ganha uma contagem regressiva. Você vê de longe o que vence essa semana e o que ainda pode esperar.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    ),
    title: "Filtros avançados por assunto",
    body: "Cruze estado, área de atuação e valor estimado para chegar só nos editais que fazem sentido pro seu negócio.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: "Alertas personalizados",
    body: "Escolha como quer ser avisado, com email ou notificação e com quantos dias de antecedência do prazo final.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    title: "Painel centralizado",
    body: "Editais favoritos, em análise e enviados, tudo organizado num só feed, sem precisar abrir dez sites diferentes.",
  },
];

/** Passos numerados da seção "Como funciona" da página comercial. */
const STEPS = [
  {
    n: "1",
    title: "Crie sua conta",
    body: "Nome, e-mail e estado. Menos de um minuto para começar.",
  },
  {
    n: "2",
    title: "Escolha suas áreas",
    body: "Nome, data de nascimento, CPF, e-mail e estado. Menos de um minuto para começar.",
  },
  {
    n: "3",
    title: "Receba o alerta certo",
    body: "Seu feed passa a mostrar só os editais que combinam com seu perfil, com prazo visível.",
  },
];

/**
 * Hook que observa a visibilidade do elemento referenciado e ativa a
 * animação de revelação quando ele entra na área visível da página.
 * Respeita a preferência por movimento reduzido do usuário.
 * @returns Referência do elemento e flag indicando que já foi revelado.
 */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/**
 * Wrapper que aplica a animação de revelação (fade/slide) aos filhos
 * quando eles se tornam visíveis na tela.
 * @param children - Conteúdo a ser revelado.
 * @param className - Classes adicionais aplicadas ao elemento.
 * @param delay - Atraso em milissegundos antes da animação.
 * @param as - Tag HTML usada para renderizar o elemento.
 */
function Reveal({ children, className = "", delay = 0, as: Tag = "div" }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "p" | "h2";
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <Tag ref={ref as never} className={`reveal ${visible ? "reveal--in" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}>
      {children}
    </Tag>
  );
}

/**
 * Página comercial (landing page) do Ponte do Edital: apresenta hero
 * com estatísticas, recursos, passos de utilização, planos e chamadas
 * para ação, com menu responsivo e animações de revelação.
 */
export default function CommercialPage() {
  const navigate = useNavigate();
  const [heroPlayed, setHeroPlayed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loader, setLoader] = useState<"loading" | "fading" | "gone">("loading");

  /**
   * Pré-carrega as imagens da marca e mantém o loader visível por um
   * tempo mínimo antes de liberar a animação de entrada do hero.
   */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    let fadeTimer: number | undefined;

    const images = Promise.all(
      [logoPonte, logoNome].map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = img.onerror = () => resolve();
            img.src = src;
          })
      )
    );
    const minDelay = new Promise<void>((resolve) =>
      window.setTimeout(resolve, reduced ? 0 : 700)
    );

    Promise.all([images, minDelay]).then(() => {
      if (cancelled) return;
      setHeroPlayed(true);
      setLoader("fading");
      fadeTimer = window.setTimeout(() => {
        if (!cancelled) setLoader("gone");
      }, reduced ? 0 : 350);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(fadeTimer);
    };
  }, []);

  /**
   * Bloqueia a rolagem do corpo enquanto o loader está na tela
   * e a libera quando ele termina de desaparecer.
   */
  useEffect(() => {
    if (loader === "gone") {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [loader]);

  /**
   * Detecta rolagens da página para alternar o estilo fixo do cabeçalho.
   */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Fecha o menu móvel e rola suavemente até a seção indicada.
   * @param id - Identificador da seção de destino.
   */
  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="pe">
      {loader !== "gone" && (
        <AppLoader fading={loader === "fading"} />
      )}

      {/* Header */}
      <header className={`pe-header ${scrolled ? "pe-header--scrolled" : ""}`}>
        <div className="pe-container pe-header__row">
          <a className="pe-brand" href="#top" onClick={(e) => { e.preventDefault(); scrollTo("top"); }}>
            <img src={logoPonte} alt="" aria-hidden="true" className="pe-brand__icon" />
            <img src={logoNome} alt="Ponte do Edital" className="pe-brand__logo" />
          </a>

          <nav className={`pe-nav ${menuOpen ? "pe-nav--open" : ""}`}>
            <button className="pe-nav__link" onClick={() => scrollTo("recursos")}>Recursos</button>
            <button className="pe-nav__link" onClick={() => scrollTo("como-funciona")}>Como funciona</button>
            <button className="pe-nav__link" onClick={() => scrollTo("planos")}>Planos</button>
          </nav>

          <div className="pe-header__actions">
            <button className="pe-link-btn" onClick={() => navigate("/login")}>Entrar</button>
            <button className="pe-btn pe-btn--primary pe-btn--sm" onClick={() => navigate("/signup")}>Criar Conta</button>
            <button className={`pe-burger ${menuOpen ? "pe-burger--open" : ""}`} aria-label="Abrir menu" onClick={() => setMenuOpen((v) => !v)}>
              <span /><span />
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="pe-hero">
          <div className="pe-container pe-hero__grid">
            <div className="pe-hero__copy">
              <p className={`pe-eyebrow ${heroPlayed ? "pe-anim-1" : "pe-pre"}`}>PLATAFORMA DE EDITAIS</p>
              <h1 className={heroPlayed ? "pe-anim-2" : "pe-pre"}>
                A ponte entre você <span className="pe-hero__highlight"> e o<br />edital certo</span>.  
              </h1>
              <p className={`pe-hero__lede ${heroPlayed ? "pe-anim-3" : "pe-pre"}`}>
                O Ponte do Edital reúne oportunidades públicas de todo o Brasil, entregamos o que combina com o seu perfil e avisamos você no momento certo — filtrando pelo que realmente importa.
              </p>
              <div className={`pe-hero__actions ${heroPlayed ? "pe-anim-4" : "pe-pre"}`}>
                <button className="pe-btn pe-btn--primary" onClick={() => navigate("/signup")}>
                  Criar conta grátis <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>

            <div className={`pe-hero__right ${heroPlayed ? "pe-anim-5" : "pe-pre"}`}>
              <div className="pe-hero__panel">
                <div className="pe-stats">
                  {STATS.map((s) => (
                    <div className="pe-stats__item" key={s.label}>
                      <span className="pe-stats__value">{s.value}</span>
                      <span className="pe-stats__label">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="pe-btn pe-btn--teal-outline pe-btn--block" onClick={() => scrollTo("como-funciona")}>
                Como participar <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </section>

        {/* Recursos */}
        <section id="recursos" className="pe-section pe-section--recursos">
          <div className="pe-container">
            <Reveal as="p" className="pe-kicker pe-kicker--center">Recursos</Reveal>
            <Reveal as="h2" className="pe-section__title" delay={60}>
              Tudo que você precisa para não ficar<br />de fora de um edital
            </Reveal>
            <Reveal as="p" className="pe-section__sub" delay={100}>
              Construímos a Ponte do Edital em torno de um problema só:
              prazos que se perdem no meio de tantos portais diferentes.
            </Reveal>
            <div className="pe-features">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={80 * i} className="pe-card">
                  <div className="pe-card__icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="pe-section pe-section--dark">
          <div className="pe-container">
            <Reveal as="p" className="pe-kicker pe-kicker--center pe-kicker--light">Como funciona</Reveal>
            <Reveal as="h2" className="pe-section__title pe-section__title--light" delay={60}>
              Do cadastro ao primeiro alerta, em<br />três passos
            </Reveal>
            <Reveal as="p" className="pe-section__sub pe-section__sub--light" delay={100}>
              É o mesmo fluxo simples que você usa para criar sua conta na plataforma.
            </Reveal>
            <div className="pe-steps">
              <div className="pe-steps__line" aria-hidden="true" />
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={100 * i} className="pe-steps__item">
                  <span className="pe-steps__num">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="pe-section pe-section--planos">
          <div className="pe-container">
            <Reveal as="p" className="pe-kicker pe-kicker--center">Planos</Reveal>
            <Reveal as="h2" className="pe-section__title pe-section__title--wrap" delay={60}>
              Comece de graça, evolua quando<br />fizer sentido
            </Reveal>
            <div className="pe-plans">
              {PLANS.map((p, i) => (
                <Reveal key={p.name} delay={100 * i} className={`pe-plan ${p.featured ? "pe-plan--featured" : ""}`}>
                  {p.featured && <span className="pe-plan__badge">mais popular</span>}
                  <h3>{p.name}</h3>
                  <div className="pe-plan__price">
                    {p.price}<span>{p.period}</span>
                  </div>
                  <ul className="pe-plan__list">
                    {p.features.map((f) => (
                      <li key={f}>
                        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="M2 8.5 6 12.5 14 3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`pe-btn ${p.featured ? "pe-btn--primary" : "pe-btn--outline"} pe-btn--block`} onClick={() => navigate("/signup")}>
                    {p.cta}
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pe-cta">
          <div className="pe-container pe-cta__inner">
            <Reveal as="h2">Pronto para nunca mais perder um prazo?</Reveal>
            <Reveal as="p" delay={60}>
              Crie sua conta grátis e monte seu feed de editais em menos de dois minutos.
            </Reveal>
            <Reveal delay={120}>
              <button className="pe-btn pe-btn--primary pe-btn--lg" onClick={() => navigate("/signup")}>
                Criar conta grátis <span aria-hidden="true">→</span>
              </button>
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="pe-footer">
        <div className="pe-container pe-footer__grid">
          <div>
            <a className="pe-brand pe-brand--footer" href="#top">
              <img src={logoPonte} alt="" aria-hidden="true" className="pe-brand__icon pe-brand__icon--footer" />
              <img src={logoNome} alt="Ponte do Edital" className="pe-brand__logo pe-brand__logo--footer" />
            </a>
            <p className="pe-footer__tag">
              Plataforma que conecta profissionais e empresas aos editais
              públicos certos, no momento certo.
            </p>
          </div>
          <div className="pe-footer__col">
            <h4>Produto</h4>
            <a href="#recursos" onClick={(e) => { e.preventDefault(); scrollTo("recursos"); }}>Recursos</a>
            <a href="#como-funciona" onClick={(e) => { e.preventDefault(); scrollTo("como-funciona"); }}>Como funciona</a>
            <a href="#planos" onClick={(e) => { e.preventDefault(); scrollTo("planos"); }}>Planos</a>
          </div>
          <div className="pe-footer__col">
            <h4>Empresa</h4>
            <a href="#top" onClick={(e) => e.preventDefault()}>Sobre o projeto</a>
            <a href="#top" onClick={(e) => e.preventDefault()}>Contato</a>
          </div>
          <div className="pe-footer__col">
            <h4>Termos</h4>
            <a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Termos de uso</a>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>Privacidade</a>
          </div>
        </div>
        <div className="pe-container pe-footer__bottom">
          © 2026 Todos os direitos reservados a Projeto Integrador Fatec
        </div>
      </footer>
    </div>
  );
}
