# COMUNET — Roadmap

## MVP (Actual) ✅

### Fase 0 — Documentación ✅
- PRD, arquitectura, modelo de datos, módulos, reglas, seguridad, testing

### Fase 1 — Bootstrap ✅
- Next.js 16 + TypeScript + pnpm
- Docker Compose + PostgreSQL
- Prisma schema + migraciones
- Tailwind CSS 4 + shadcn/ui
- Auth custom (JWT HS256 + bcrypt + cookie HTTP-only)
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
- Security headers (HSTS, CSP estática, X-Frame-Options, etc.)
- Rate limiting (login, API, exports) — Valkey/Redis vía ioredis + in-memory fallback
- PgBouncer configuration para connection pooling
- S3 storage adapter (compatible MinIO, R2, Spaces)
- Health endpoint (liveness + readiness)
- Audit log fire-and-forget
- Notificaciones batch insert
- Export safety limits
- Email transaccional (Resend cuando `RESEND_API_KEY` configurada; mock fallback sin key)
- MFA: flujo TOTP (`login/mfa/setup`, `login/mfa/verify`)
- Brute-force protection (bloqueo temporal + permanente con lockoutCount)
- `CACHE_DRIVER=memory` fatal en producción (escape: `ALLOW_INSECURE_MEMORY_CACHE=true`)

### Fase 5 — Performance y UX ✅
- Loading states (`loading.tsx`) en backoffice y portal
- Error boundaries (`error.tsx`) con opción de reintento
- Global error boundary (`global-error.tsx`)
- Not found pages (`not-found.tsx`) contextualizadas
- Recharts lazy-loaded via `next/dynamic` (~500KB menos en first load)
- Dashboard con Suspense streaming (KPIs instantáneos)
- Prisma queries optimizadas con `select:` (solo campos necesarios)
- Connection pool tuning
- Arquitectura page → queries → repository (separación de capas)

## Post-MVP (Futuro)

### v1.1 — Integraciones Financieras
- [ ] SEPA / remesas bancarias
- [ ] Conciliación bancaria automatizada
- [ ] Integración AEAT

### v1.2 — Comunicaciones Avanzadas
- [x] ~~Envío real de emails~~ → Implementado: Resend transaccional
- [ ] Correo certificado
- [ ] Notificaciones push

### v1.3 — Firmas y Legal
- [ ] Firma digital de actas
- [ ] Certificados digitales

### v1.4 — Infraestructura Avanzada
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] CSP con nonces criptográficos (PR dedicado; requiere render dinámico global)
- [ ] Revocación de tokens fail-closed (requiere Redis HA + observabilidad)
- [ ] Redis/Valkey distribuido con alta disponibilidad para multi-instancia
- [ ] Background job queue (BullMQ/pg-boss) para emails y reports pesados
- [ ] OpenTelemetry / APM / structured logging
- [ ] CDN + presigned URLs para documentos

### v1.5 — UX Avanzada
- [ ] PWA (Progressive Web App)
- [x] ~~Recuperación de contraseña~~ → Implementado: Flujo completo con tokens opacos (OWASP)
- [ ] i18n (internacionalización)

### Testing Pendiente
- [ ] E2E: completar los 12 escenarios definidos en `docs/07-testing.md` (3 de 12 implementados)
- [ ] Load: completar los 5 escenarios k6 definidos (1 de 5 implementado)
