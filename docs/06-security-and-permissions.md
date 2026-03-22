# COMUNET — Seguridad y Permisos

## Autenticación

Sistema custom con:
- Hash de contraseña: bcrypt
- Sesión: cookie HTTP-only firmada con HMAC-SHA256
- Expiración configurable (por defecto 7 días)

### API de Auth

```typescript
getCurrentSession(): Promise<Session | null>
requireAuth(): Promise<Session>           // Throws si no autenticado
requireRole(...roles: UserRole[]): Promise<Session>  // Throws si rol no coincide
requirePermission(permission: string, context?: PermissionContext): Promise<Session>
```

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

## Helpers de Permisos

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

## Validación en Capas

1. **Middleware**: Redirige usuarios no autenticados (solo para UX).
2. **Layout**: Verifica sesión y carga contexto.
3. **Page**: Verifica permisos específicos antes de renderizar.
4. **Server Action**: Re-verifica sesión + permisos + validación de input.
5. **Query/Repository**: Filtra por officeId/communityId.

> **Regla**: Nunca confiar solo en middleware. La verificación real ocurre en servidor.

## Aislamiento de Datos

- Toda query incluye filtro por `officeId`.
- Las entidades sin `officeId` directo se filtran vía la comunidad padre.
- Los owners solo acceden a datos vinculados a su `linkedOwnerId`.
- Los providers solo acceden a incidencias con su `linkedProviderId`.

## Auditoría

Toda mutación importante registra:
- `userId`: Quién realizó la acción
- `officeId`: En qué despacho
- `entityType` + `entityId`: Sobre qué entidad
- `action`: Tipo de operación
- `metaJson`: Detalle adicional (valores anteriores, etc.)
- `createdAt`: Timestamp
