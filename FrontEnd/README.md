# Ponte do Edital - Frontend
Portal de editais públicos que centraliza oportunidades de concursos e licitações em um só lugar.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- React Router DOM v7

## Como rodar

### Pré-requisitos

- Node.js 18+
- npm

### Instalação e execução

```bash
npm install
npm run dev
```

### Build para produção

```bash
npm run build
```

## Estrutura do projeto

```
src/
├── pages/
│   ├── dashboard/     # Feed, Calendário, Salvo, Planos, FAQ, Sobre, Perfil
│   ├── admin/         # Painel administrativo
│   ├── SignupFlow.tsx # Cadastro
│   └── LoginFlow.tsx  # Login
├── services/          # Chamadas à API (user, notice, favorite)
├── utils/             # Validações (CPF, email, senha, nome)
└── App.tsx            # Rotas e autenticação
```

## Funcionalidades

- Cadastro e login com validação de email e verificação de conta
- Feed de editais filtrados por estado
- Sistema de favoritos para salvar editais
- Calendário de prazos de editais
- Perfil do usuário com edição
- Painel admin para gestão de usuários e editais
