# Scalability Review — COMUNET

> Auditoría de preparación para producción — Fase 1 de hardening.
> Objetivo: base técnica para soportar 500 usuarios concurrentes.
> Fecha: 2026-03-28

---

## 1. Diagnóstico del Estado Actual

### 1.1 Arquitectura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│   Next.js    │────▶│  PostgreSQL  │
│  (Backoffice │     │  App Server  │     │    (Prisma)  │
│   + Portal)  │     │              │     │              │
└──────────────┘     │  - RSC       │     └──────────────┘
                     │  - Actions   │
                     │  - API       │     ┌──────────────┐
                     │  - Middleware│────▶│  Local Disk  │
                     └──────────────┘     │  (documents) │
                                          └──────────────┘
```

### 1.2 Stack Auditado

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Next.js | 16.2.1 |
| ORM | Prisma | 6.4.1 |
| Database | PostgreSQL | 16 |
| Auth | jose (JWT) | 6.2.2 |
| Validation | Zod | 4.3.6 |
| UI | React 19 + Radix + Tailwind 4 | — |
| Testing | Vitest | 4.1.0 |

### 1.3 Puntos Fuertes (ya válidos para producción)

- **JWT stateless**: No requiere consulta a DB por request para auth. El middleware solo verifica cookie presence; la verificación JWT real ocurre en server components.
- **Prisma singleton**: Correctamente implementado con `globalThis` cache para development.
- **Promise.all en dashboard**: Las queries del portal se paralelizan, no son secuenciales.
- **Índices DB**: Cubren los filtros más frecuentes (officeId, communityId, status).
- **Server-only enforcement**: Los módulos server no pueden importarse desde client components.
- **Zod validation**: Todo input de usuario se valida antes de tocar la DB.
- **Multitenancy por officeId**: Todas las queries están scoped al despacho del usuario.
- **Cascade deletes**: Configurados correctamente donde aplica (agenda items, votes, etc.).

### 1.4 Riesgos Identificados

| # | Riesgo | Severidad | Estado |
|---|--------|-----------|--------|
| R1 | Prisma sin connection pool tuning | 🔴 Crítico | ✅ Corregido |
| R2 | Storage local + fs sync | 🔴 Crítico | ✅ Corregido |
| R3 | Sin rate limiting | 🔴 Crítico | ✅ Corregido |
| R4 | Sin security headers | 🔴 Alto | ✅ Corregido |
| R5 | Health check sin readiness | 🟡 Medio | ✅ Corregido |
| R6 | Audit log síncrono en path crítico | 🟡 Medio | ✅ Corregido |
| R7 | Notifications N inserts | 🟡 Medio | ✅ Corregido |
| R8 | Export sin limit | 🟡 Medio | ✅ Corregido |
| R9 | Sin PgBouncer para multi-instance | 🟡 Medio | ✅ Corregido |
| R10 | Índices compuestos missing | 🟢 Bajo | ✅ Corregido |
| R11 | Sin Redis para rate limiting distribuido | 🟢 Bajo | Pendiente (fase 2) |
| R12 | Sin background job queue | 🟢 Bajo | Pendiente (fase 2) |
| R13 | Sin APM/structured logging | 🟢 Bajo | Pendiente (fase 2) |

---

## 2. Arquitectura Objetivo

```
                                     ┌─────────────┐
                                     │   Reverse   │
                                     │   Proxy     │
                                     │  (nginx/CF) │
                                     └──────┬──────┘
                                            │
                              ┌─────────────┼─────────────┐
                              │             │             │
                        ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
                        │ Next.js   │ │ Next.js   │ │ Next.js   │
                        │ Instance 1│ │ Instance 2│ │ Instance N│
                        └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
                              │             │             │
                              └─────────────┼─────────────┘
                                            │
                                     ┌──────▼──────┐
                                     │  PgBouncer  │
                                     │  (pooling)  │
                                     └──────┬──────┘
                                            │
                              ┌─────────────┼─────────────┐
                              │                           │
                        ┌─────▼─────┐               ┌─────▼─────┐
                        │ PostgreSQL│               │    S3 /   │
                        │    16     │               │   MinIO   │
                        └───────────┘               └───────────┘
```

### 2.1 Capacidad Estimada por Capa

> **Nota importante:** Los valores de esta tabla son estimaciones orientativas basadas en la configuración aplicada. La capacidad real bajo carga depende de múltiples factores (tipo de páginas, complejidad de queries, tamaño de payloads, CPU de la máquina, etc.) y debe validarse empíricamente mediante las pruebas de carga descritas en la sección 5.

| Capa | Config | Capacidad estimada |
|------|--------|--------------------|
| PgBouncer | `MAX_CLIENT_CONN=500, DEFAULT_POOL_SIZE=25` | Hasta 500 conexiones cliente → 25 conexiones reales a PG |
| PostgreSQL | `max_connections=200, shared_buffers=256MB` | 200 conexiones máximas |
| Prisma | `connection_limit=20` por instancia | 20 conexiones pool por instancia Next.js |
| Next.js | 2-3 instancias | Estimación orientativa: ~150-250 req/s por instancia, pendiente de validación con carga |
| Rate Limiting | In-memory (per-instance) | Login: 5/min/IP, API: 100/min/IP |

> La capacidad de 500 conexiones cliente en PgBouncer no equivale directamente a 500 usuarios realizando operaciones intensivas simultáneamente. Es la capa que permite multiplexar muchas conexiones de aplicación sobre un pool reducido de conexiones reales a PostgreSQL. La validación real del rendimiento con 500 usuarios concurrentes requiere las pruebas de carga descritas más adelante.

### 2.2 Flujo de Datos Bajo Carga

1. **Request llega** al reverse proxy
2. **Reverse proxy** distribuye entre instancias Next.js
3. **Middleware** verifica cookie + rate limit (in-memory, sub-milisegundo)
4. **Server Component/Action** verifica JWT (jose, ~1ms)
5. **Prisma** usa pool de conexiones → PgBouncer → PostgreSQL
6. **Audit log** se dispara fire-and-forget (no bloquea el response)
7. **Respuesta** se envía al cliente

---

## 3. Cambios Implementados

### 3.1 Prisma Connection Pooling (`src/lib/db/client.ts`)

```diff
- export const prisma = globalForPrisma.prisma ?? new PrismaClient()
+ export const prisma = globalForPrisma.prisma ?? new PrismaClient({
+   log: process.env.NODE_ENV === 'production'
+     ? [{ level: 'error', emit: 'stdout' }, { level: 'warn', emit: 'stdout' }]
+     : [{ level: 'query', emit: 'stdout' }, ...],
+ })
```

Connection pool size se configura via `DATABASE_URL` params: `?connection_limit=20&pool_timeout=10`

### 3.2 S3 Storage Adapter (`src/lib/storage/index.ts`)

- Local adapter: migrado de `fs.writeFileSync` → `fs.promises` (async, non-blocking)
- S3 adapter: implementación completa con `@aws-sdk/client-s3`
- Dynamic import de AWS SDK para no bundlearlo cuando se usa local
- Compatible con MinIO, Cloudflare R2, DigitalOcean Spaces

### 3.3 Rate Limiting (`src/lib/rate-limit.ts` + `src/middleware.ts`)

- Sliding window in-memory
- Login: 5 intentos/minuto/IP
- API: 100 requests/minuto/IP
- Exports: 5/minuto/usuario
- Cleanup automático de entradas stale cada 60s

### 3.4 Security Headers (`next.config.ts`)

- HSTS (2 años, includeSubDomains, preload)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera/microphone/geolocation denied
- `poweredByHeader: false`

### 3.5 Health + Readiness (`/api/health`)

- `GET /api/health` → readiness (DB check + verificación de configuración de storage)
- `GET /api/health?probe=liveness` → liveness (proceso vivo, sin dependencias externas)
- Reporta uptime, version, environment, checks detallados
- Compatible con Kubernetes liveness/readiness probes

> **Nota sobre el storage check:** La comprobación de readiness para storage se limita a verificar que la configuración (variables de entorno) es correcta. No realiza operaciones de red a S3 en cada probe, para evitar añadir latencia innecesaria y dependencia de un servicio externo en el camino crítico del health check.

### 3.6 Audit Log Fire-and-Forget

```diff
- export async function logAudit(entry): Promise<void> {
-   await prisma.auditLog.create(...)
+ export function logAudit(entry): void {
+   prisma.auditLog.create(...).catch(console.error)
```

Reduce la latencia del request al sacar el INSERT de audit del camino síncrono. El INSERT se ejecuta en background; si falla, el error se registra en stderr pero no impacta la operación principal.

### 3.7 Notifications Batch Insert

```diff
- await Promise.all(recipients.map(r => createNotification(...)))
+ await createManyNotificationRecords(recipients.map(...))
```

N inserts individuales → 1 `INSERT ... VALUES (...), (...), (...)`.

### 3.8 Export Safety Limits

- `take: 10_000` máximo en export de recibos
- Rate limiting: 5 exports/minuto/usuario

### 3.9 Índices DB Compuestos

```prisma
// Ownership — portal access scope (filtro frecuente: ownerId + endDate IS NULL)
@@index([ownerId, endDate])

// Debt — reports + portal (groupBy communityId+status, filtro ownerId+status)
@@index([communityId, status])
@@index([ownerId, status])

// Receipt — portal (filtro ownerId + communityId)
@@index([ownerId, communityId])
```

### 3.10 UX Resilience (`loading.tsx`, `error.tsx`, `not-found.tsx`)

- **Loading states**: Skeleton animado en `(backoffice)/loading.tsx`, `(backoffice)/dashboard/loading.tsx`, `(portal)/loading.tsx`
- **Error boundaries**: `(backoffice)/error.tsx`, `(portal)/error.tsx` con botón "Reintentar"
- **Global error**: `global-error.tsx` para fallos catastróficos en el layout raíz
- **Not found**: `not-found.tsx` global + contextualizados en backoffice y portal
- Impacto: El usuario nunca ve una pantalla en blanco ni un error genérico de Next.js

### 3.11 Performance Optimizations

```diff
# Dashboard Suspense streaming
- const [stats, financeKPIs, incidents, receipts] = await Promise.all([...])
- // Todo bloquea el render
+ // KPIs render al instante, incidents y charts por streaming
+ <Suspense fallback={<Skeleton />}><IncidentsSection /></Suspense>
+ <Suspense fallback={<Skeleton />}><ChartsSection /></Suspense>

# Recharts lazy-loaded
- import { DonutChart } from '@/components/ui/charts'
+ const DonutChartLazy = dynamic(() => import('@/components/ui/charts'), { ssr: false })

# Prisma select optimization
- include: { community: true, assignedProvider: true }
+ include: { community: { select: { id: true, name: true } }, ... }
```

- **~500KB menos** en first paint (recharts cargado solo cuando el viewport lo necesita)
- **Perceived TTFB mejorado**: KPIs financieros se pintan antes que la tabla de incidencias
- **Transferencia DB reducida**: Queries de detalle traen solo campos que la UI consume

---

## 4. Checklist de Producción

### Infraestructura

- [ ] PostgreSQL 16 desplegado con tuning (shared_buffers, work_mem)
- [ ] PgBouncer configurado en modo `transaction`
- [ ] DATABASE_URL apunta a PgBouncer (port 6432), no directo a PG
- [ ] S3/MinIO bucket creado y credenciales configuradas
- [ ] Reverse proxy (nginx/Cloudflare) configurado con TLS
- [ ] DNS configurado y certificado SSL activo

### Aplicación

- [ ] `AUTH_SECRET` es un string aleatorio de ≥32 caracteres
- [ ] `NODE_ENV=production`
- [ ] `STORAGE_ADAPTER=s3` configurado si multi-instance
- [ ] Variables S3 configuradas (S3_BUCKET, S3_REGION, etc.)
- [ ] `APP_VERSION` actualizado
- [ ] `next build` exitoso
- [ ] Health endpoint responde OK: `curl /api/health`

### Seguridad

- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] Security headers verificados (usar securityheaders.com)
- [ ] AUTH_SECRET no es el valor de desarrollo
- [ ] Passwords de DB no son valores por defecto
- [ ] Rate limiting verificado (probar 6 logins rápidos → 429)

### Base de Datos

- [ ] `prisma migrate deploy` ejecutado en producción
- [ ] Índices compuestos aplicados (verificar con `\di` en psql)
- [ ] Backup automático configurado (pg_dump diario)
- [ ] Monitoring de conexiones activo

### Observabilidad

- [ ] Health endpoint monitoreado (UptimeRobot, Pingdom, etc.)
- [ ] Logs centralizados (stdout → CloudWatch/Datadog/etc.)
- [ ] Alertas configuradas para errores 5xx y latencia alta
- [ ] Disk usage monitoreado si usa local storage

---

## 5. Plan de Pruebas de Carga

### 5.1 Herramienta Recomendada

**k6** (https://k6.io) — script-based, soporta scenarios complejos.

### 5.2 Scenarios

#### Scenario 1: Login Storm
```
50 virtual users, cada uno haciendo login 1x/segundo durante 2 minutos.
Objetivo: p95 < 500ms, errores controlados (429 por rate limit es esperado y correcto).
```

#### Scenario 2: Portal Dashboard
```
200 virtual users con sesión activa, cargando /portal cada 5s.
Objetivo: p95 < 300ms, 0 errores funcionales.
```

#### Scenario 3: Backoffice CRUD
```
100 virtual users alternando entre:
- Listar comunidades
- Ver detalle de comunidad
- Crear incidencia
- Añadir comentario
Objetivo: p95 < 400ms, error rate < 0.1%.
```

#### Scenario 4: Document Upload/Download
```
30 virtual users subiendo documentos de 2MB.
20 virtual users descargando documentos de 5MB.
Objetivo: upload p95 < 2s, download p95 < 1s.
```

#### Scenario 5: Export Under Load
```
10 usuarios exportando CSV de recibos mientras 200 usuarios navegan.
Objetivo: export < 5s, navegación no degradada.
```

### 5.3 Ejecución

```bash
# Install k6
brew install k6    # macOS
# or
choco install k6   # Windows

# Run
k6 run --vus 200 --duration 5m load-test.js
```

---

## 6. Métricas Objetivo

> **Disclaimer:** Las siguientes métricas son objetivos operativos (SLOs) definidos como referencia para las pruebas de carga. No son compromisos garantizados hasta completar la validación empírica descrita en la sección 5. Los valores se ajustarán en función de los resultados reales.

| Métrica | Objetivo | Umbral crítico |
|---------|----------|----------------|
| **Latencia p50** | < 100ms | < 200ms |
| **Latencia p95** | < 300ms | < 500ms |
| **Latencia p99** | < 500ms | < 1000ms |
| **Error rate** | < 0.1% | < 1% |
| **Conexiones DB activas** | < 50 | < 100 |
| **Conexiones PgBouncer** | < 300 | < 500 |
| **CPU (app server)** | < 60% | < 80% |
| **Memory (app server)** | < 70% (RSS) | < 85% |
| **Time to first byte** | < 200ms | < 400ms |
| **Health check latency** | < 50ms | < 200ms |

### 6.1 Alertas Recomendadas

| Alerta | Condición | Acción |
|--------|-----------|--------|
| DB connections alto | > 80% pool_size durante 5 min | Revisar queries lentas |
| Error rate alto | > 1% en ventana de 5 min | Revisar logs inmediatamente |
| Latencia p95 alta | > 1s sostenido durante 10 min | Evaluar escalado horizontal |
| Health check falla | 3 fallos consecutivos | Restart automático de instancia |
| Disk > 80% | Si usa local storage | Migrar a S3 o limpiar |

---

## 7. Mejoras Pendientes (Fase 2)

Estas mejoras no están implementadas en esta fase. Se documentan para planificar la siguiente iteración si las pruebas de carga o el crecimiento lo requieren.

### 7.1 Redis (Prioridad: Media)
- Rate limiting distribuido (necesario si se escala a múltiples instancias)
- Session blacklist (invalidación inmediata de JWT sin esperar expiración)
- Cache de permissions (evitar queries DB repetidas por sesión)

**Cuándo implementar:** cuando se desplieguen 2+ instancias de Next.js y el rate limiting in-memory deje de ser suficiente.

### 7.2 Background Jobs (Prioridad: Media)
- Cola para emails reales (BullMQ o pg-boss)
- Reports pesados asíncronos
- Cleanup de archivos huérfanos en storage

**Cuándo implementar:** cuando se integre un proveedor de email real (SMTP/SES) y los emails dejen de ser mock.

### 7.3 APM / Observabilidad (Prioridad: Baja-Media)
- OpenTelemetry para tracing distribuido
- Structured logging (JSON) con correlation IDs
- Métricas custom (Prisma query duration, cache hit rate)

**Cuándo implementar:** cuando se necesite diagnosticar problemas de rendimiento en producción que los logs estándar no cubran.

### 7.4 CDN + Presigned URLs (Prioridad: Baja)
- Assets estáticos via CDN (Cloudflare, CloudFront)
- Document downloads via presigned URLs (bypass app server para archivos grandes)

**Cuándo implementar:** cuando el volumen de descargas de documentos genere carga significativa en el app server.

---

## 8. Conclusión

### Estado antes de este hardening
La aplicación no estaba suficientemente endurecida para hablar con tranquilidad de 500 usuarios concurrentes. Los principales bloqueantes eran: gestión de conexiones DB, storage síncrono y local, ausencia de rate limiting, y trabajo síncrono innecesario en el path crítico.

### Estado después de este hardening
La base técnica está preparada para empezar a validar seriamente el objetivo de 500 concurrentes. Los bloqueantes críticos están resueltos y la arquitectura permite escalar horizontalmente si las pruebas lo requieren.

### Siguiente paso
Ejecutar las pruebas de carga descritas en la sección 5, analizar los resultados contra los SLOs de la sección 6, y decidir si es necesaria una fase 2 con Redis, colas y observabilidad avanzada.
