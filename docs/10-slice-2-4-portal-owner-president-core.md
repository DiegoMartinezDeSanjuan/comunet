# Slice 2.4 — Portal OWNER / PRESIDENT core

## Estado

Slice orientado a convertir `/portal` en una experiencia real para `OWNER` y `PRESIDENT`, reutilizando dominios ya existentes de auth, communities, contacts, finance e incidents.

Este slice **no** convierte el portal en mini backoffice. Prioriza lectura operativa, creación básica de incidencias y aislamiento estricto de datos.

## Rutas implementadas

### Obligatorias
- `/portal`
- `/portal/receipts`
- `/portal/receipts/[id]`
- `/portal/incidents`
- `/portal/incidents/[id]`

### Opcionales incluidas en modo limpio
- `/portal/documents` → lectura honesta / catálogo visible si existe documentación apta para portal
- `/portal/meetings` → lectura de reuniones no borrador dentro del alcance portal

## Helpers y servicios nuevos o ajustados

### `src/modules/portal/server/policy.ts`
Helpers específicos de portal para no mezclar reglas del backoffice:
- `isActivePresidentForCommunity`
- `canReadPortalCommunitySummary`
- `canReadPortalReceipt`
- `canReadPortalIncident`
- `canCreatePortalIncident`
- `filterPortalVisibleComments`
- `getPortalAccessScope`

### `src/modules/portal/server/receipts.ts`
- listado de recibos del portal con filtros por comunidad, unidad, estado y periodo
- detalle de recibo con pagos, deuda y saldo pendiente
- validación server-side de alcance por `linkedOwnerId`

### `src/modules/portal/server/incidents.ts`
- listado de incidencias visibles en portal
- detalle con comentarios filtrados a `SHARED`
- alta de incidencia desde portal
- comentario compartido desde portal
- composer options para unidades propias y comunidades con presidencia activa

### `src/modules/portal/server/dashboard.ts`
- KPIs y resúmenes de comunidades propias
- capa agregada para presidencia activa
- últimos recibos, incidencias activas y reuniones visibles

### `src/modules/portal/server/content.ts`
- lectura de reuniones y documentos dentro del alcance portal

### `src/modules/portal/server/actions.ts`
- acciones server-side para alta de incidencia y comentario compartido
- mensajes de error honestos y redirects limpios

## Decisiones de visibilidad

### OWNER
Puede ver únicamente:
- comunidades donde tiene ownership activo
- unidades propias activas
- recibos cuyo `ownerId` coincide con el `linkedOwnerId` del usuario
- incidencias de unidades propias
- comentarios `SHARED` de incidencias autorizadas

No puede ver:
- recibos individuales de otros propietarios
- incidencias comunitarias sin unidad propia asociada
- comentarios `INTERNAL`

### PRESIDENT
Sigue siendo un owner, pero con una capa extra cuando existe `BoardPosition(role = PRESIDENT)` activa:
- resumen agregado de comunidad
- incidencias de la comunidad donde ostenta presidencia activa
- deuda agregada básica de esa comunidad cuando puede calcularse con seguridad
- reuniones y documentos visibles dentro del alcance de la comunidad

No puede ver:
- comentarios `INTERNAL`
- detalle indiscriminado de recibos ajenos
- capacidades de edición propias del backoffice

### Comentarios de incidencias
- `INTERNAL` → nunca visible en portal
- `SHARED` → visible en portal
- legado `PUBLIC` → se normaliza como `SHARED` para lectura portal

## UX / layout del portal

- shell visual diferenciada del backoffice
- sidebar para desktop
- navegación móvil simple en cabecera
- cabecera con rol y sesión
- tarjetas KPI sobrias
- tablas y listados legibles
- empty states honestos
- UI en español
- validación sensible siempre en servidor

## Seed del portal

Se amplía el seed para dejar el portal utilizable de forma real:
- `propietario@comunet.test` con varias unidades y varias comunidades visibles
- `presidenta@comunet.test` con cargo activo de presidencia
- recibos propios en distintos estados (`PARTIALLY_PAID`, `ISSUED`)
- incidencias visibles para owner y president
- comentarios `SHARED` e `INTERNAL` diferenciados
- reuniones visibles en dashboard / meetings

### Credenciales demo
- `presidenta@comunet.test`
- `propietario@comunet.test`
- contraseña común: `Demo1234!`

## Tests añadidos

### Unit
Archivo: `tests/portal/access.test.ts`

Cobertura mínima:
- alcance OWNER en recibos
- alcance OWNER en incidencias
- permisos PRESIDENT para resumen comunitario
- exclusión de comentarios `INTERNAL` en portal
- validación de presidencia activa

### E2E
Archivo: `tests/e2e/portal.spec.ts`

Cobertura mínima:
1. login owner
2. dashboard real
3. recibos propios
4. detalle de recibo
5. consulta y alta de incidencia propia
6. ausencia de datos ajenos
7. login president
8. dashboard con capa agregada
9. incidencias comunitarias según política
10. ausencia de comentarios `INTERNAL`

## Qué queda pendiente para el siguiente slice

### Documents
- descarga directa y flujo documental final
- publicación más madura desde backoffice
- versionado / storage final

### Meetings
- experiencia ampliada de actas, asistencia y votaciones
- edición y workflows completos fuera del portal

### Provider portal
- carril específico de proveedor
- vistas operativas y acciones propias del proveedor

## Verificación prevista al cerrar el slice

- `pnpm seed`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`
