# SLICE 2.7 — Portal Provider + Release Hardening

## Objetivo

Cerrar el MVP de COMUNET con:
1. Portal funcional para proveedores
2. Limpieza final del repositorio
3. Corrección de datos en seed
4. Resolución de todos los errores de lint y TypeScript
5. Documentación final de entrega

## Cambios Implementados

### Portal Provider

#### Dashboard (`/portal`)
- Nuevo dashboard para PROVIDER con KPIs: incidencias asignadas activas, en curso, resueltas/cerradas
- Lista de incidencias recientes asignadas al proveedor
- Links directos al detalle de cada incidencia

#### Incidencias (`/portal/incidents`)
- Lista filtrable de incidencias asignadas al proveedor logueado
- Filtros: búsqueda por texto, estado, prioridad
- KPIs contextuales: total, activas, resueltas
- Sin formulario de creación (proveedores no crean incidencias)

#### Detalle (`/portal/incidents/[id]`)
- Vista completa con context de comunidad, dirección, unidad
- **Transiciones de estado**: botones para cambiar estado dentro de las transiciones permitidas:
  - `ASSIGNED → IN_PROGRESS`
  - `IN_PROGRESS → WAITING_VENDOR | RESOLVED`
  - `WAITING_VENDOR → IN_PROGRESS | RESOLVED`
- **Comentarios**: solo SHARED visibles; formulario para añadir comentarios compartidos
- Provider no puede ver comentarios INTERNAL ni cambiar a CLOSED

### Arquitectura

#### Server Module: `src/modules/portal/server/provider.ts`
Módulo nuevo con:
- `getProviderDashboardData()` — KPIs y recientes
- `listProviderIncidents()` — Lista con filtros
- `getProviderIncidentDetail()` — Detalle con transiciones
- `changeProviderIncidentStatus()` — Cambio de estado validado
- `addProviderIncidentComment()` — Solo SHARED, delegado a incidents service

#### Server Actions: `src/modules/portal/server/actions.ts`
Nuevas actions:
- `addProviderCommentAction()` — Comentario compartido
- `changeProviderStatusAction()` — Cambio de estado

#### Sidebar: `src/components/layouts/portal-sidebar.tsx`
- Provider ve: Resumen + Incidencias
- No ve: Recibos, Mi Comunidad, Documentos, Reuniones
- Icono de llave inglesa (Wrench) en lugar de edificio
- Footer diferenciado por rol

### Limpieza del Repositorio

| Elemento | Acción |
|----------|--------|
| `check.log`, `check2.txt`, `tsc_final.log`, `typecheck_output.txt` | Eliminados |
| `playwright-report/`, `test-results/` | Eliminados y añadidos a .gitignore |
| `storage/` | Añadido a .gitignore |
| Duplicate seed users (SLICE 2.6) | Eliminados, audit logs rewired |
| `as any` en seed.ts | Reemplazado por `as const` |
| `as any` en user-dialogs.tsx | Tipado con interfaz `EditUserProps` |
| Unused imports (6 archivos) | Eliminados |
| Unused eslint-disable directive | Eliminado |

### Documentación
- README.md reescrito con stack, scripts, credenciales, rutas, arquitectura
- Documentación de slice creada

## Validación

```
✅ pnpm typecheck  — 0 errors
✅ pnpm lint       — 0 errors, 0 warnings
✅ pnpm build      — Compiled successfully
```

## Credenciales Provider

| Email | Proveedor vinculado |
|-------|-------------------|
| `proveedor.fontaneria@comunet.test` | Fontanería Rápida 24h |
| `proveedor.ascensores@comunet.test` | Ascensores Hispania |
| Contraseña: `Demo1234!` | |
