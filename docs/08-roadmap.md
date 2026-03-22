# COMUNET — Roadmap

## MVP (Actual)

### Fase 0 — Documentación ✅
- PRD, arquitectura, modelo de datos, módulos, reglas, seguridad, testing

### Fase 1 — Bootstrap
- Next.js + TypeScript + pnpm
- Docker Compose + PostgreSQL
- Prisma schema + migraciones
- Tailwind + shadcn/ui
- Auth custom
- Layout base + navegación
- Seed demo
- Vitest + Playwright config

### Fase 2 — Módulos Core (vertical slices)
1. Communities
2. Owners / Tenants / Units
3. Finance (budgets, receipts, payments, debt)
4. Incidents
5. Portal owner básico
6. Meetings
7. Documents
8. Providers

### Fase 3 — Portales y Features
- Portal president (extensión del owner)
- Portal provider
- Reports, Settings, Audit
- CSV exports
- Mock adapters

### Fase 4 — Tests y Polish
- Unit tests
- E2E tests
- UX improvements
- Documentación final

## Post-MVP (Futuro)

### v1.1 — Integraciones financieras
- SEPA / remesas bancarias
- Conciliación bancaria automatizada
- Integración AEAT

### v1.2 — Comunicaciones
- Envío real de emails (SMTP/SendGrid)
- Correo certificado
- Notificaciones push

### v1.3 — Firmas y Legal
- Firma digital de actas
- Certificados digitales

### v1.4 — Cloud y Escalabilidad
- Almacenamiento S3
- CDN para documentos
- Multi-región
