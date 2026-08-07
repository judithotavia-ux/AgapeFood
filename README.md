# AgapeFood

ERP + Delivery + SaaS multiempresa para restaurantes e lanchonetes.

## Status do projeto

- ✅ **Fase 1 — Fundação**: estrutura, autenticação JWT, layout, dashboard, banco de dados inicial.
- ⏳ **Fase 2**: Cardápio, categorias, produtos, upload de imagens, QR Code.
- ⏳ **Fase 3**: Pedidos, delivery, cozinha, salão, caixa.
- ⏳ **Fase 4**: Financeiro, estoque, marketing, relatórios.
- ⏳ **Fase 5**: Ágape IA, aplicativo PWA, multiempresa completo, painel SaaS.

## Estrutura

```
AgapeFood/
├── frontend/   React + Vite (painel administrativo)
└── backend/    Node.js + Express + Prisma (API)
```

## Como rodar

### Backend

```bash
cd backend
npm install
cp .env.example .env   # preencha DATABASE_URL com um MySQL válido
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

A API sobe em `http://localhost:3333`.

Login de teste criado pelo seed: `admin@agapefood.com` / `agape123`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O painel sobe em `http://localhost:5173`.

## Arquitetura multiempresa (SaaS)

Cada restaurante/lanchonete é uma **Empresa** no banco de dados. Cada **Usuário**
pertence a uma Empresa (exceto usuários `SUPER_ADMIN`, que enxergam o sistema
todo — usado pelo futuro Painel SaaS da Fase 5). O token JWT carrega o
`empresaId` e o `papel` do usuário, e todas as rotas da API filtram os dados
pela empresa do usuário autenticado.
