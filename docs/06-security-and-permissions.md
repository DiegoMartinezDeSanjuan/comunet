# COMUNET — Seguridad y Permisos

## Autenticación

Sistema custom con:
- Hash de contraseña: bcrypt (cost 12)
- Sesión: cookie HTTP-only firmada con HMAC-SHA256 (jose)
- Expiración configurable (por defecto 7 días)
- `AUTH_SECRET`: mínimo 32 caracteres (obligatorio en producción, fallback en desarrollo)

### API de Auth

```typescript
getCurrentSession(): Promise<Session | null>
requireAuth(): Promise<Session>           // Throws si no autenticado
requireRole(...roles: UserRole[]): Promise<Session>  // Throws si rol no coincide
requirePermission(session, permission): boolean       // Memoizado, sin queries DB
```

## Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| Login | 5 intentos | 1 minuto / IP |
| API general | 100 requests | 1 minuto / IP |
| Exports | 5 requests | 1 minuto / usuario |

### Implementación

- **Producción**: Upstash Redis (`@upstash/ratelimit`) — distribuido, funciona con multi-instance
- **Desarrollo**: Sliding window in-memory — sin dependencias externas
- El sistema detecta automáticamente `UPSTASH_REDIS_REST_URL`:
  - Si está configurado → usa Redis
  - Si está vacío/comentado → usa fallback in-memory

## Content Security Policy (CSP)

- **Nonces criptográficos** generados por request en el proxy
- Inyectados como header `x-csp-nonce` → leídos por el layout raíz
- Elimina la necesidad de `'unsafe-inline'` para scripts
- En desarrollo: `'unsafe-eval'` habilitado para Turbopack HMR

## Security Headers

| Header | Valor |
|--------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `X-Powered-By` | Deshabilitado |

## Roles

| Rol | Acceso |
|-----|--------|
| SUPERADMIN | Global |
| OFFICE_ADMIN | Administración completa del despacho |
| MANAGER | Gestión operativa de comunidades |
| ACCOUNTANT | Finanzas, recibos, pagos, presupuestos |
| PRESIDENT | Vista extendida de su comunidad |
| OWNER | Solo sus comunidades/unidades |
| PROVIDER | Solo incidencias asignadas |
| VIEWER | Solo lectura |

## Helpers de Permisos (Memoizados)

| Helper | Descripción |
|--------|-------------|
| `canReadCommunity` | Puede ver una comunidad específica |
| `canManageCommunity` | Puede editar una comunidad |
| `canReadUnit` | Puede ver una unidad específica |
| `canReadOwner` | Puede ver un propietario |
| `canManageFinance` | Puede gestionar finanzas |
| `canViewIncident` | Puede ver una incidencia |
| `canCommentIncident` | Puede comentar en incidencia |
| `canManageMeeting` | Puede gestionar reuniones |
| `canReadDocument` | Puede ver un documento |

> **Nota**: Los permisos se evalúan en memoria a partir de los datos del JWT (rol + linkedIds). No generan queries adicionales a la base de datos.

## Validación en Capas

1. **Proxy**: Rate limiting + CSP nonce injection + security headers.
2. **Layout**: Verifica sesión y carga contexto.
3. **Page**: Verifica permisos específicos antes de renderizar.
4. **Server Action**: Re-verifica sesión + permisos + validación de input (Zod).
5. **Query/Repository**: Filtra por officeId/communityId (scope de tenant).

> **Regla**: Nunca confiar solo en proxy/middleware. La verificación real ocurre en servidor.

## Aislamiento de Datos

- Toda query incluye filtro por `officeId`.
- Las entidades sin `officeId` directo se filtran vía la comunidad padre.
- Los owners solo acceden a datos vinculados a su `linkedOwnerId`.
- Los providers solo acceden a incidencias con su `linkedProviderId`.
- Las queries de detalle usan `select:` para transferir solo campos necesarios.

## Auditoría

Toda mutación importante registra (fire-and-forget, no bloquea el response):
- `userId`: Quién realizó la acción
- `officeId`: En qué despacho
- `entityType` + `entityId`: Sobre qué entidad
- `action`: Tipo de operación
- `metaJson`: Detalle adicional (valores anteriores, etc.)
- `createdAt`: Timestamp

## UX de Errores

| Archivo | Propósito |
|---------|-----------|
| `loading.tsx` (backoffice + portal) | Skeleton animado durante navegación |
| `error.tsx` (backoffice + portal) | Error boundary con botón "Reintentar" |
| `global-error.tsx` | Fallo catastrófico a nivel de layout raíz |
| `not-found.tsx` (global + por zona) | Páginas 404 contextualizadas |
