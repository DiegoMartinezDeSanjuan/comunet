# COMUNET — SaaS de Gestión de Comunidades de Propietarios

Plataforma integral de administración de fincas desarrollada con Next.js 16, PostgreSQL, Prisma ORM y un sistema de autenticación propio basado en JWT.

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Base de datos | PostgreSQL 16 (Docker Compose) |
| ORM | Prisma Client |
| Autenticación | JWT + bcrypt (custom, sin NextAuth) |
| UI | shadcn/ui + Lucide Icons |
| Estilos | Tailwind CSS 4 |
| Tests | Vitest (unit) + Playwright (e2e) |
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
| `/dashboard` | Panel de control |
| `/communities` | Gestión de comunidades, unidades, juntas, cuotas |
| `/owners` | Propietarios y relaciones de titularidad |
| `/tenants` | Inquilinos |
| `/finance/receipts` | Recibos, pagos, deudas |
| `/finance/budgets` | Presupuestos |
| `/incidents` | Incidencias con timeline, asignación, comentarios |
| `/meetings` | Reuniones, actas, votaciones, asistencia |
| `/documents` | Documentos con descarga segura |
| `/providers` | Proveedores |
| `/reports` | Reportes y KPIs |
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
├── app/               # App Router (rutas, layouts, pages)
│   ├── (backoffice)/  # Rutas del backoffice
│   ├── (portal)/      # Rutas del portal
│   └── api/           # API routes
├── components/        # Componentes React
│   ├── layouts/       # Sidebars, headers
│   ├── portal/        # Componentes del portal
│   └── ui/            # shadcn/ui primitives
├── lib/               # Utilidades
│   ├── auth/          # Autenticación JWT
│   ├── db/            # Prisma Client
│   └── permissions/   # RBAC centralizado
└── modules/           # Módulos de dominio
    ├── audit/         # Auditoría
    ├── communities/   # Comunidades
    ├── documents/     # Documentos
    ├── finances/      # Finanzas
    ├── incidents/     # Incidencias
    ├── meetings/      # Reuniones
    ├── notifications/ # Notificaciones
    ├── portal/        # Lógica portal
    ├── providers/     # Proveedores
    ├── reports/       # Reportes
    └── users/         # Usuarios
```

## 📝 Documentación

Documentación técnica completa en la carpeta `docs/`:

- `01-architecture.md` — Arquitectura y decisiones técnicas
- `02-data-model.md` — Modelo de datos Prisma
- `03-auth-rbac.md` — Autenticación y control de acceso
- `04-finance.md` — Módulo financiero
- `05-incidents.md` — Incidencias y proveedores
- `06-portal.md` — Portal OWNER/PRESIDENT/PROVIDER
- `07-testing.md` — Estrategia de testing
- `08-roadmap.md` — Roadmap post-MVP
- `09-limitations.md` — Limitaciones conocidas

## ⚠️ Limitaciones MVP

- **Sin firma digital**: Actas y documentos no soportan firma electrónica.
- **Sin storage cloud**: Los documentos se almacenan en disco local (`/storage/`).
- **Sin notificaciones reales**: Email y push son mock; solo se generan registros IN_APP.
- **Sin multi-tenancy real**: Un único despacho (Office) por instancia.
- **Sin i18n**: Interfaz únicamente en castellano.
- **Sin SSO/OAuth**: Autenticación por email+contraseña solamente.

## 📄 Licencia

Proyecto privado — Todos los derechos reservados.
