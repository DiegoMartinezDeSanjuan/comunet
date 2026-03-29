# COMUNET — Roadmap

## MVP (Actual) ✅

### Fase 0 — Documentación ✅
- PRD, arquitectura, modelo de datos, módulos, reglas, seguridad, testing

### Fase 1 — Bootstrap ✅
- Next.js 16 + TypeScript + pnpm
- Docker Compose + PostgreSQL
- Prisma schema + migraciones
- Tailwind CSS 4 + shadcn/ui
- Auth custom (JWT + bcrypt)
- Layout base + navegación glassmorphism
- Seed demo
- Vitest + Playwright config

### Fase 2 — Módulos Core (vertical slices) ✅
1. Communities
2. Owners / Tenants / Units
3. Finance (budgets, receipts, payments, debt)
4. Incidents
5. Portal owner básico
6. Meetings
7. Documents
8. Providers

### Fase 3 — Portales y Features ✅
- Portal president (extensión del owner)
- Portal provider
- Reports, Settings, Audit
- CSV exports
- Mock adapters

### Fase 4 — Hardening y Producción ✅
- Security headers (HSTS, CSP con nonces, X-Frame-Options, etc.)
- Rate limiting (login, API, exports) — Upstash Redis + in-memory fallback
- PgBouncer configuration para connection pooling
- S3 storage adapter (compatible MinIO, R2, Spaces)
- Health endpoint (liveness + readiness)
- Audit log fire-and-forget
- Notificaciones batch insert
- Export safety limits

### Fase 5 — Performance y UX ✅
- Loading states (`loading.tsx`) en backoffice y portal
- Error boundaries (`error.tsx`) con opción de reintento
- Global error boundary (`global-error.tsx`)
- Not found pages (`not-found.tsx`) contextualizadas
- Recharts lazy-loaded via `next/dynamic` (~500KB menos en first load)
- Dashboard con Suspense streaming (KPIs instantáneos)
- Prisma queries optimizadas con `select:` (solo campos necesarios)
- Connection pool tuning

## Post-MVP (Futuro)

### v1.1 — Integraciones Financieras
- [ ] SEPA / remesas bancarias
- [ ] Conciliación bancaria automatizada
- [ ] Integración AEAT

### v1.2 — Comunicaciones
- [ ] Envío real de emails (SMTP/SendGrid)
- [ ] Correo certificado
- [ ] Notificaciones push

### v1.3 — Firmas y Legal
- [ ] Firma digital de actas
- [ ] Certificados digitales

### v1.4 — Infraestructura Avanzada
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Redis distribuido para rate limiting multi-instance
- [ ] Background job queue (BullMQ/pg-boss) para emails y reports pesados
- [ ] OpenTelemetry / APM / structured logging
- [ ] CDN + presigned URLs para documentos

### v1.5 — UX Avanzada
- [ ] PWA (Progressive Web App)
- [ ] Recuperación de contraseña
- [ ] 2FA (autenticación de dos factores)
- [ ] i18n (internacionalización)
