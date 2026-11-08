# Ponte do Edital

Portal de editais públicos que centraliza oportunidades de concursos e licitações em um só lugar.
Monorepo com Frontend, Backend e coleta de editais (webscrapping).

## Tech Stack

- **Frontend:** React 19 + TypeScript, Vite 8, React Router DOM v7
- **Backend:** Node.js + Express, TypeORM + MySQL (Aiven), node-cron, Resend
- **Webscrapping:** Python 3.12 (roda diariamente no GitHub Actions)

## Como rodar

### Pré-requisitos

- Node.js 18+ e npm
- Python 3.12+ (apenas para o webscrapping)

### Instalação e execução

```bash
npm install
npm run dev        # Backend + Frontend juntos (concurrently)
```

Ou separados:

```bash
npm run dev:back
npm run dev:front
```

### Variáveis de ambiente

- **Frontend:** copie `.env.example` para `.env` e ajuste `VITE_API_URL`
- **Backend:** crie um `.env` com `DB_*`, `PORT`, `JWT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `FRONTEND_URL` etc.

## Estrutura do projeto

```
PIPonteDoEdital/
├── FrontEnd/       # Portal React (deploy na Vercel)
├── Backend/        # API Express (deploy na Render)
├── webscrapping/   # Coletor Python (GitHub Actions, cron diário)
├── espelhar.ps1    # Sincroniza os repos antigos com este monorepo
└── package.json    # Scripts dev (concurrently)
```

## Funcionalidades

- Cadastro e login com validação de email e verificação de conta
- Feed de editais filtrados por estado
- Sistema de favoritos para salvar editais
- Calendário de prazos de editais (com integração opcional ao Google Agenda)
- Notificações em tempo real (sino com polling e página completa)
- Perfil do usuário com edição e planos de assinatura (Mercado Pago/Stripe)
- Painel admin para gestão de usuários e editais
- Coleta automática de editais de outros sites

## Regra do monorepo

Este repo é um **espelho**. Edite sempre nos repos antigos:

- `PonteEdital/FrontEnd` → [iamraiane/PonteDoEdital](https://github.com/iamraiane/PonteDoEdital) (Vercel)
- `PonteEdital/Backend` → [GustavoNori/PI_2026_BACKEND](https://github.com/GustavoNori/PI_2026_BACKEND) (Render)
- `PonteEdital/webscrapping` → [GustavoNori/webScraping](https://github.com/GustavoNori/webScraping) (GitHub Actions)

Depois de commitar lá, rode na raiz deste monorepo:

```powershell
.\espelhar.ps1
```

O script faz push nos repos antigos (dispara os deploys) e traz os commits para cá via `git subtree`.
