# SupportGPT

SupportGPT is a portfolio-grade AI customer support SaaS built with:

- `Next.js 15` + `React 19` + `TypeScript`
- `Express.js` + `Node.js`
- `PostgreSQL` + `Prisma`
- `Redis` + `BullMQ`
- `OpenAI` + `pgvector`-ready knowledge retrieval
- `Docker` + `Docker Compose` + `GitHub Actions`

It demonstrates the core product flows a paying support team would expect: authentication, multi-tenant orgs, knowledge base ingestion, AI agent configuration, streaming chat, tickets, analytics, audit logs, and deployment-ready infrastructure.

## What’s Included

- `docs/project-overview.md` — product and feature summary
- `docs/architecture.md` — system architecture and runtime design
- `docs/database-design.md` — ERD and schema design
- `docs/api-design.md` — API contract and endpoint map
- `docs/interview-preparation.md` — detailed architecture decision walkthrough
- `docs/deployment-guide.md` — local, Docker, and production deployment notes

## Repository Layout

```text
SupportGPT/
├─ backend/      Express + Prisma API
├─ frontend/     Next.js application
├─ docs/         Architecture and implementation documentation
├─ docker/       PostgreSQL bootstrap SQL
└─ docker-compose.yml
```

## Feature Set

- Authentication: register, login, logout, password reset, Google OAuth
- Organizations: multi-tenant workspaces, invitations, RBAC
- Knowledge Base: PDF, DOCX, TXT uploads, chunking, embeddings, vector storage
- AI Agents: prompt configuration, knowledge source assignment
- AI Chat: streaming responses, citations, conversation history
- Tickets: creation, assignment, escalation, status tracking
- Real-Time: live chat, typing indicators, notifications
- Analytics: resolution rate, volume, performance, response accuracy
- Audit Logs: org-scoped activity trail
- Admin: system overview and governance controls

## Local Development

### Prerequisites

- Node.js 20+
- Docker Desktop
- npm 10+

### Backend

```bash
cd backend
npm install
cp .env.example .env.local
npm run build
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run build
npm run dev
```

### Full Stack with Docker

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Environment Variables

### Backend

See `backend/.env.example` for the full set of variables. The most important values are:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Frontend

See `frontend/.env.example`:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

## Scripts

### Backend

- `npm run dev`
- `npm run build`
- `npm test`
- `npm run type-check`
- `npm run db:migrate`
- `npm run db:seed`

### Frontend

- `npm run dev`
- `npm run build`
- `npm run type-check`

## Docker

- `backend/Dockerfile` builds the API image
- `frontend/Dockerfile` builds the web app image
- `docker/init-db.sql` enables PostgreSQL extensions
- `docker-compose.yml` wires the stack together for local development

## CI/CD

GitHub Actions workflows live in `.github/workflows/`:

- `ci.yml` runs backend and frontend builds
- `docker-build.yml` validates both Docker images

## Current Build Status

The repo currently contains:

- a functional backend scaffold with real routes and Prisma models
- a polished Next.js frontend shell and core SaaS pages
- deployment assets and smoke tests
- detailed docs for architecture, database, API, interview prep, and deployment

## Notes

- The knowledge retrieval layer is `pgvector`-ready and uses embeddings end-to-end in the backend.
- The frontend includes a production-style shell and demo data so the product feels complete even before wiring live auth/session storage.
- The API and docs are organized around organization-scoped routes to match a real multi-tenant SaaS design.
- Proof screenshots live in `docs/screenshots/` and are indexed in `docs/proof.md`.

## License

MIT
