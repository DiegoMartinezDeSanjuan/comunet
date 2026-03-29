# COMUNET — SaaS de Gestión de Comunidades de Propietarios

Plataforma integral de administración de fincas desarrollada con Next.js 16, PostgreSQL, Prisma ORM y un sistema de autenticación propio basado en JWT.

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Base de datos | PostgreSQL 16 (Docker Compose + PgBouncer) |
| ORM | Prisma Client |
| Autenticación | JWT + bcrypt (custom, sin NextAuth) |
| UI | shadcn/ui + Lucide Icons + Recharts (lazy) |
| Estilos | Tailwind CSS 4 |
| Tests | Vitest (unit) + Playwright (e2e) + k6 (load) |
| Rate Limiting | Upstash Redis (prod) / In-memory (dev) |
| Storage | Local (dev) / S3-compatible (prod) |
| Runtime | Node.js 22+ |

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
pnpm install

# 2. Levantar PostgreSQL
docker compose up -d

# 3. Configurar entorno
cp .env.example .env   # Editar si es necesario

# 4. Ejecutar migraciones y seed
pnpm prisma:migrate
pnpm seed

# 5. Arrancar servidor de desarrollo
pnpm dev
```

El servidor estará disponible en **http://localhost:3000**.

> **Nota sobre Rate Limiting en desarrollo:** Las variables `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en `.env` deben estar vacías o comentadas para desarrollo local. El sistema usará automáticamente un rate limiter in-memory (sliding window).

## 📋 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Servidor de desarrollo (Turbopack) |
| `pnpm build` | Build de producción |
| `pnpm lint` | Linter (ESLint) |
| `pnpm typecheck` | Verificación de tipos (tsc --noEmit) |
| `pnpm test` | Tests unitarios (Vitest) |
| `pnpm test:e2e` | Tests end-to-end (Playwright) |
| `pnpm seed` | Seed de la base de datos con datos demo |
| `pnpm prisma:migrate` | Aplicar migraciones Prisma |
| `pnpm prisma:generate` | Regenerar Prisma Client |
| `pnpm prisma:studio` | Interfaz web de base de datos |

## 👤 Credenciales Demo

**Contraseña para todos los usuarios:** `Demo1234!`

### Backoffice (Despacho)

| Email | Rol | Descripción |
|-------|-----|-------------|
| `admin@fincasmartinez.es` | OFFICE_ADMIN | Administrador del despacho |
| `manager@fincasmartinez.es` | MANAGER | Gestión operativa |
| `accountant@fincasmartinez.es` | ACCOUNTANT | Finanzas y contabilidad |
| `viewer@fincasmartinez.es` | VIEWER | Solo lectura |

### Portal (Propietarios / Presidentes / Proveedores)

| Email | Rol | Descripción |
|-------|-----|-------------|
| `presidenta@comunet.test` | PRESIDENT | Presidenta de comunidad |
| `propietario@comunet.test` | OWNER | Propietaria por unidades |
| `proveedor.fontaneria@comunet.test` | PROVIDER | Proveedor de fontanería |
| `proveedor.ascensores@comunet.test` | PROVIDER | Proveedor de ascensores |

## 🗂️ Mapa de Rutas

### Backoffice (`/dashboard`, `/communities`, etc.)

| Ruta | Módulo |
|------|--------|
| `/dashboard` | Panel de control (con streaming Suspense) |
| `/communities` | Gestión de comunidades, unidades, juntas, cuotas |
| `/owners` | Propietarios y relaciones de titularidad |
| `/tenants` | Inquilinos |
| `/finance/receipts` | Recibos, pagos, deudas |
| `/finance/budgets` | Presupuestos |
| `/incidents` | Incidencias con timeline, asignación, comentarios |
| `/meetings` | Reuniones, actas, votaciones, asistencia |
| `/documents` | Documentos con descarga segura |
| `/providers` | Proveedores |
| `/reports` | Reportes y KPIs (gráficos lazy-loaded) |
| `/settings` | Configuración del despacho |
| `/settings/users` | Gestión de usuarios |
| `/settings/audit` | Auditoría |

### Portal (`/portal`)

| Ruta | Roles | Módulo |
|------|-------|--------|
| `/portal` | OWNER, PRESIDENT, PROVIDER | Dashboard con KPIs |
| `/portal/incidents` | OWNER, PRESIDENT, PROVIDER | Incidencias (vista por rol) |
| `/portal/incidents/[id]` | OWNER, PRESIDENT, PROVIDER | Detalle + comentarios SHARED |
| `/portal/receipts` | OWNER, PRESIDENT | Recibos y pagos |
| `/portal/community` | OWNER, PRESIDENT | Resumen de comunidad |
| `/portal/documents` | OWNER, PRESIDENT | Documentos publicados |
| `/portal/meetings` | OWNER, PRESIDENT | Reuniones y actas |

## 🏗️ Arquitectura

```
src/
├── app/                  # App Router — solo rutas, layouts, pages
│   ├── (backoffice)/     # Rutas del backoffice (loading + error + not-found)
│   │   └── dashboard/
│   │       └── _components/  # UI local de página
│   ├── (portal)/         # Rutas del portal (loading + error + not-found)
│   ├── (public)/         # Login
│   ├── api/              # API routes (health, exports, mock)
│   ├── global-error.tsx  # Error boundary global
│   └── not-found.tsx     # 404 global
├── components/           # Shared UI únicamente
│   ├── layouts/          # Sidebars, headers
│   └── ui/               # shadcn/ui primitives + KPIs + badges + charts
├── lib/                  # Infraestructura y utilidades
│   ├── auth/             # JWT + bcrypt
│   ├── cache/            # request-cache (React cache wrapper)
│   ├── db/               # Prisma Client (singleton + pool config)
│   ├── formatters/       # Formateo de moneda, fechas, etc.
│   ├── permissions/      # RBAC centralizado (memoizado)
│   ├── storage/          # Local + S3 adapter (async)
│   ├── utils/            # cn(), helpers genéricos
│   └── rate-limit.ts     # Upstash Redis / in-memory fallback
├── modules/              # Módulos de dominio — dueños de lógica + UI de feature
│   ├── communities/
│   │   ├── server/       # actions.ts, repository.ts, service.ts
│   │   └── schema.ts
│   ├── incidents/
│   │   ├── components/   # incident-create-dialog, form
│   │   ├── server/       # actions, queries, repository, services
│   │   ├── schema.ts
│   │   └── policy.ts
│   ├── portal/
│   │   ├── components/   # ui.tsx (badges, labels, empty states)
│   │   └── server/       # dashboard, incidents, receipts, provider, policy
│   ├── reports/
│   │   ├── components/   # reports-charts.tsx
│   │   └── server/       # queries.ts
│   ├── settings/
│   │   ├── components/   # settings-nav, settings-profile-form
│   │   └── server/       # actions, queries
│   └── ...               # audit, auth, contacts, documents, finances,
│                         # meetings, notifications, providers, units, users
├── proxy.ts              # CSP nonces, rate limiting, auth check, mock protection
tests/
├── e2e/                  # Playwright tests
├── load/                 # k6 load tests
├── mocks/                # server-only mock, etc.
├── modules/              # Unit tests espejando src/modules/
│   ├── finances/
│   ├── incidents/
│   ├── meetings/
│   ├── notifications/
│   ├── portal/
│   ├── providers/
│   ├── reports/
│   └── settings/
└── setup.ts
```

## 🔒 Seguridad y Rendimiento

### Seguridad
- **CSP dinámica** con nonces criptográficos inyectados via proxy
- **Security headers**: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Rate limiting**: Login (5/min/IP), API (100/min/IP), Exports (5/min/usuario)
- **Validación en 4 capas**: Proxy → Layout → Page/Action → Repository

### Rendimiento
- **Recharts lazy-loaded** via `next/dynamic` con `ssr: false` (~500KB menos en first load)
- **Dashboard con Suspense streaming**: KPIs al instante, tabla y charts por streaming
- **Prisma queries optimizadas**: `select:` en listados y detalles (solo campos necesarios)
- **Audit log fire-and-forget**: INSERT asíncrono fuera del path crítico
- **Notificaciones batch**: N inserts → 1 `INSERT ... VALUES`
- **Connection pooling**: PgBouncer en producción

## 📝 Documentación

Documentación técnica completa en la carpeta `docs/`:

| Doc | Contenido |
|-----|-----------|
| `01-prd.md` | Producto y requisitos |
| `02-architecture.md` | Arquitectura y decisiones técnicas |
| `03-data-model.md` | Modelo de datos Prisma |
| `04-modules-and-routes.md` | Módulos y rutas |
| `05-business-rules.md` | Reglas de negocio |
| `06-incidents-providers-notifications.md` | Incidencias, proveedores, notificaciones |
| `06-security-and-permissions.md` | Seguridad, RBAC y permisos |
| `07-testing.md` | Estrategia de testing |
| `08-roadmap.md` | Roadmap y fases |
| `09-limitations.md` | Limitaciones conocidas |
| `deployment.md` | Guía de despliegue (VPS, Docker, Managed) |
| `scalability-review.md` | Auditoría de escalabilidad y hardening |

## ⚠️ Limitaciones MVP

- **Sin firma digital**: Actas y documentos no soportan firma electrónica.
- **Sin notificaciones reales**: Email y push son mock; solo se generan registros IN_APP.
- **Sin multi-tenancy real**: Un único despacho (Office) por instancia.
- **Sin i18n**: Interfaz únicamente en castellano.
- **Sin SSO/OAuth**: Autenticación por email+contraseña solamente.
- **Sin CI/CD**: Pipeline de despliegue no configurado aún.
- **Sin recuperación de contraseña**: Pendiente post-MVP.

## 📄 Licencia

Proyecto privado — Todos los derechos reservados.
