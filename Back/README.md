# Ponte do Edital — Backend

API do **Ponte do Edital**, projeto integrador da Fatec. É o servidor do portal de editais e concursos públicos: cuida de usuários, editais, favoritos, dúvidas, notificações, assinaturas e upload de foto de perfil.

## Tecnologias

- **Node.js 20+** com **Express 5** (ESM)
- **TypeORM** + **MySQL** (`synchronize: true` — o schema é criado/atualizado automaticamente)
- **JWT** (autenticação) + papéis `admin` / `premium` / `user`
- **multer** + **Azure Blob Storage** (foto de perfil)
- **node-cron** (job de notificações por e-mail)
- **Nodemailer** / **Resend** (e-mails transacionais)
- **Mercado Pago** (assinaturas/premium)
- **Docker** (opcional)

## Requisitos

- Node.js 20 ou superior
- Um banco **MySQL** acessível
- Chaves opcionais conforme a funcionalidade: **Azure** (avatar), **Mercado Pago** (assinatura), **SMTP** ou **Resend** (e-mails)

## Como rodar

```bash
cd Back
npm install

# copie e preencha as variáveis de ambiente
cp .env.example .env

# cria os usuários de teste (admin, normal e premium) a partir do .env
node src/seeds/createAdmin.js
node src/seeds/createNormalUser.js
node src/seeds/createPremium.js

npm run dev        # nodemon, servidor em http://localhost:3000
```

O servidor só sobe depois de conectar no banco (`Banco conectado` no console) e inicia o job de notificações.

## Variáveis de ambiente (`.env`)

| Bloco | Variáveis |
|---|---|
| Servidor | `PORT`, `NODE_ENV`, `FRONTEND_URL` |
| Banco | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` |
| Autenticação | `JWT_SECRET` |
| E-mail (SMTP) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| E-mail (Resend) | `RESEND_API_KEY` |
| Azure Blob (avatar) | `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER` |
| Mercado Pago | `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_TEST_PAYER_EMAIL` |
| Seeds de usuários | `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NORMAL_NAME`, `NORMAL_EMAIL`, `NORMAL_PASSWORD`, `NORMAL_CPF`, `PREMIUM_NAME`, `PREMIUM_EMAIL`, `PREMIUM_PASSWORD` |

Use `Back/.env.example` como referência.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor com `nodemon` (recarrega ao salvar) |
| `npm start` | Sobe o servidor com `node` |
| `npm run seed:classify` | Classifica os temas dos editais já cadastrados |
| `node src/seeds/<arquivo>.js` | Demais seeds (admin, usuário normal, premium, plano, favorito de teste) |

## Estrutura

```
Back/
├── data-source.js        # DataSource do TypeORM (MySQL)
├── Dockerfile
├── src/
│   ├── app.js            # Express: middlewares + rotas
│   ├── server.js         # conexão com o banco + listen
│   ├── routes/           # definição das rotas
│   ├── controllers/      # regras de negócio
│   ├── entities/         # entidades TypeORM (User, Notice, ...)
│   ├── services/         # Azure Blob, Mercado Pago, classificador de temas
│   ├── jobs/             # cron de notificações por e-mail
│   ├── middlewares/      # auth JWT + papéis
│   ├── utils/            # JWT, hash, CPF, e-mails, validadores
│   ├── seeds/            # dados iniciais (admin, premium, plano, ...)
│   └── config/           # config do upload (multer)
```

## Rotas principais

Base: `http://localhost:3000` — autenticação via `Authorization: Bearer <token>`.

| Método | Rota | Acesso |
|---|---|---|
| POST | `/login`, `/users` | público |
| GET/PUT/DELETE | `/users/:id` | autenticado (DELETE: admin) |
| PATCH | `/users/:id/activate`, `/disable`, `/promoteToAdmin`, `/demoteToUser`, `/promoteToPremium` | admin |
| PUT/DELETE | `/:id/avatar` | dono do cadastro |
| POST | `/auth/forgot-password`, `/auth/reset-password`, `/verify-email`, `/change-email`, `/confirm-email-change`, `/resend-verification` | público |
| GET | `/notices/user/:userId`, `/notices/area/:areaId`, `/notices/:id` | autenticado |
| PUT/DELETE | `/notices/:id` | admin |
| GET | `/search/:userId` | premium/admin |
| GET/POST/DELETE | `/favorites...` | premium/admin |
| GET/POST/PUT/DELETE | `/doubts...` (respostas em `/doubts/:id/answers`) | leitura pública / escrita autenticada (respostas: admin) |
| POST | `/api/subscriptions/:planId`, `/:id/cancel`, `/sync`, `/webhook` | autenticado (webhook: Mercado Pago) |
| GET/PUT | `/notifications/preferences` | autenticado |
| GET/PATCH | `/notifications`, `/notifications/read-all`, `/:id/read` | autenticado |
| POST | `/notifications/run` | admin |

Os editais (`notices`) são populados pelo scraper em [`../webscrapping`](../webscrapping).

## Docker (opcional)

```bash
cd Back
docker build -t ponte-backend .
docker run -p 3000:3000 --env-file .env ponte-backend
```
