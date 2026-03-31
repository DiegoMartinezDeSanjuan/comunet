# Slice 2.3 — Incidents + Providers + Minimal Notifications

## Rutas implementadas

- `/incidents`
- `/incidents/[id]`
- `/providers`
- `/providers/[id]`
- `/notifications`
- `/api/mock/email`

## Decisiones técnicas

- El dominio de comentarios de incidencia usa `INTERNAL | SHARED`.
- La persistencia queda alineada con el schema Prisma después de la migración `CommentVisibility.PUBLIC -> SHARED`.
- Las transiciones de estado siguen centralizadas en `src/modules/incidents/policy.ts` y consumidas por `src/modules/incidents/server/services.ts`.
- La traza visible combina comentarios de incidencia con `AuditLog` para creación, cambio de estado y asignación/reasignación.
- Las notificaciones mínimas siguen una estrategia desacoplada: servicio de dominio + persistencia in-app + adaptador `sendMockEmail` sin SMTP real.

## Cambio de schema

Se renombra el valor del enum `CommentVisibility`:

- antes: `PUBLIC | INTERNAL`
- ahora: `INTERNAL | SHARED`

Además, el valor por defecto del comentario pasa a `INTERNAL`, que ya era el comportamiento por defecto del servicio de dominio.

## Política de permisos aplicada

- **SUPERADMIN / OFFICE_ADMIN (Administrador)**: lectura y gestión operativa de incidencias e industriales.
- **OWNER (Propietario) / PRESIDENT (Presidente) / PROVIDER (Industrial)**: sin acceso al backoffice de incidencias/proveedores; accesos disponibles desde sus portales respectivos.

## Datos demo

La seed deja:

- 2 comunidades activas
- 4 unidades
- 4 proveedores (uno archivado)
- usuarios de backoffice y portal
- incidencias en `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
- comentarios `INTERNAL` y `SHARED`
- notificaciones de ejemplo
- datos financieros mínimos de Slice 2.2

## Pendientes reales del siguiente slice

- portal provider completo
- portal owner/president completo
- adjuntos reales para incidencias
- automatizaciones avanzadas y SLA
- métricas y cuadros más sofisticados
