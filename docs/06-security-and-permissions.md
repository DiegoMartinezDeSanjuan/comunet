# COMUNET — Seguridad y Permisos

## Autenticación

Sistema custom con:
- Hash de contraseña: bcrypt (cost 12)
- Sesión: JWT firmado con HS256 (biblioteca `jose`), almacenado en cookie HTTP-only
- Expiración configurable (por defecto 7 días)
- `AUTH_SECRET`: mínimo 32 caracteres (obligatorio en producción, fallback en desarrollo)
- MFA: flujo TOTP implementado en `login/mfa/setup` y `login/mfa/verify`

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
| Login / MFA | Bloqueo temporal tras 5 intentos fallidos | 1 minuto / IP (y penalizaciones en DB) |
| API general | 100 requests | 1 minuto / IP |
| Exports | 5 requests | 1 minuto / usuario |

### Implementación

- **Producción**: Valkey/Redis vía `ioredis` (`CACHE_DRIVER=redis`) — distribuido, funciona con multi-instance. Driver `upstash` disponible como alternativa.
- **Desarrollo**: Sliding window in-memory — sin dependencias externas.
- **Producción con memory**: **Fatal por defecto**. `CACHE_DRIVER=memory` lanza un error fatal en producción para evitar que un reinicio borre la blocklist JWT y los rate limits. Válvula de escape: `ALLOW_INSECURE_MEMORY_CACHE=true` solo para pruebas controladas.
- El sistema utiliza la caché para throttling rápido, pero la **fuente de verdad de bloqueos de seguridad reside en la base de datos** (campos `failedAttempts`, `lockoutCount`, `lockedUntil`).
- **Despliegue multi-instancia/HA**: pendiente de fase 2; requiere Redis con alta disponibilidad y observabilidad (APM).

## Bloqueos de Cuenta (Brute-Force Protection)

El sistema incluye una protección estricta a nivel de Base de Datos contra ataques de fuerza bruta en cuentas específicas:

1. **Bloqueo Temporal (15 mins)**: 
   - Se activa si un usuario (por contraseña errónea o código MFA incorrecto) alcanza un total acumulado de **5 `failedAttempts`**.
   - Durante este bloqueo, `lockedUntil` marca en la DB la hora exacta de liberación.
2. **Bloqueo Permanente (Status `BLOCKED`)**: 
   - Cada vez que salta el bloqueo temporal, el sistema incrementa el campo **`lockoutCount`**.
   - Si un usuario sufre 5 bloqueos temporales (`lockoutCount` llega a 5), se le expulsa definitivamente del sistema y el campo `status` pasa a `BLOCKED`.
3. **Liberación Administrativa**:
   - Para recuperar una cuenta permanentemente bloqueada, un usuario Superadmin o Administrador debe cambiar explícitamente su estado a `ACTIVE` desde el Backoffice / Panel de control. Al hacerlo, el sistema resetea transparentemente a cero todos sus contadores de penalización.

## Content Security Policy (CSP)

- **Estado actual**: CSP estática con `script-src 'self' 'unsafe-inline'` y `style-src 'self' 'unsafe-inline'`.
- En desarrollo: `'unsafe-eval'` habilitado para Turbopack HMR.
- **Nonces criptográficos**: planificados para un PR aparte. Next.js 16 soporta nonces vía proxy + `x-nonce`, pero requiere render dinámico global, lo que desactiva static optimization, ISR y el caching de CDN por defecto.

> **Nota trade-off**: se mantiene `'unsafe-inline'` hasta que se implemente el PR de nonces para evitar un cambio de estrategia de renderizado en una consolidación de documentación.

## Revocación de Tokens — Trade-off Fail-Open

El check de revocación JWT (`isTokenRevoked`) opera en modo **fail-open**:
- Si la caché (Redis) está caída, la función devuelve `false` (token no revocado) en vez de bloquear el acceso.
- **Razón**: una caída de caché no debe convertirse en una caída total de autenticación.
- **Mitigación**: la fuente de verdad para bloqueos permanentes está en la base de datos (`status: BLOCKED`), que sí es resiliente.
- **Evolución**: cambiar a fail-closed cuando se disponga de Redis/Valkey con alta disponibilidad y observabilidad (APM, alertas).

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

| Rol (enum) | Nombre en UI | Acceso |
|---|---|---|
| `SUPERADMIN` | Superadmin | Global — acceso total a todas las funciones |
| `OFFICE_ADMIN` | Administrador | Administración completa del despacho |
| `PRESIDENT` | Presidente | Vista extendida de su comunidad |
| `OWNER` | Propietario | Solo sus comunidades/unidades |
| `PROVIDER` | Industrial | Solo incidencias asignadas |

> **Nota**: Los roles `MANAGER`, `ACCOUNTANT` y `VIEWER` fueron eliminados en la simplificación de roles (abril 2026). Sus funciones fueron absorbidas por `OFFICE_ADMIN`.

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

1. **Proxy**: Rate limiting + CSP headers + security headers.
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
