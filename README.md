# COMUNET

SaaS platform for community property management in Spain, built with Next.js 15 App Router, Prisma, PostgreSQL, and Tailwind CSS v4.

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Setup Environment
1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy `.env.example` to `.env` and adjust if necessary:
   ```bash
   cp .env.example .env
   ```

### Database & Seed
Start the local PostgreSQL database using Docker:
```bash
pnpm db:up
```

Run migrations to create the schema:
```bash
pnpm prisma:migrate
```

Populate the database with realistic demo data:
```bash
pnpm seed
```

### Run Application
Start the development server:
```bash
pnpm dev
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

## Demo Users

The seed script creates the following users (Password for all: `Demo1234!`):

- **Office Admin (Backoffice):** `admin@fincasmartinez.es`
- **President (Portal):** `propietario@comunet.test`

## Key Scripts

- `pnpm dev`: Start Next.js dev server
- `pnpm build`: Build for production
- `pnpm lint`: Run ESLint
- `pnpm typecheck`: Run TypeScript type checking
- `pnpm test`: Run Vitest unit tests
- `pnpm test:e2e`: Run Playwright E2E tests
- `pnpm db:up` / `pnpm db:down`: Manage PostgreSQL Docker container
- `pnpm prisma:studio`: Open Prisma Studio UI to explore data

## Architecture Notes
- Modular structure by default in `src/modules`
- Authentication handled securely with signed HTTP-only cookies
- Role-based permissions across Backoffice (`SUPERADMIN`, `OFFICE_ADMIN`, `MANAGER`, `ACCOUNTANT`, `VIEWER`) and Portal (`PRESIDENT`, `OWNER`, `PROVIDER`).
- Full API layer provided using Next.js route handlers.
