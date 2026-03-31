# Deployment Guide — COMUNET

## Opciones de Despliegue

### Opción A: PC Local Windows + Cloudflare Tunnels (Arquitectura Actual Activa)

Infraestructura actual utilizada para alojar la aplicación in-house reduciendo costes y maximizando la privacidad, logrando seguridad perimetral Enterprise sin VPS externos.

#### Requisitos de Hardware (Servidor Local)

| Componente | Mínimo | Actual (Recomendado) |
|-----------|--------|-------------|
| CPU | 4 cores | Ryzen 9 / i7 moderno |
| RAM | 8 GB | 32 GB |
| OS | Windows 10/11 Pro | Windows 11 |

#### 1. Preparación del Sistema Host
- Instalar **Docker Desktop** con WSL2 activado.
- Instalar **Node.js 22 LTS**.
- Crear la instancia de túnel en Cloudflare Zero Trust.
- Instalar el servicio de `cloudflared` (Túnel de Windows) para comunicar de forma segura el exterior con nuestro localhost.

#### 2. Configurar infraestructura (Docker Compose)

```bash
# Crear .env producción basado en el example
cp .env.example .env

# MUY IMPORTANTE: Variables de red
# S3_PUBLIC_URL debe apuntar al "Public Hostname" del túnel de MinIo
# DATABASE_URL debe apuntar a PgBouncer (6432)
# DIRECT_DATABASE_URL debe apuntar directo a Postgres (5432)

# Arrancar el stack completo (Postgres, MinIO, Next.js, PgBouncer)
docker compose -f docker-compose.production.yml up -d --build

# Detener el stack completo de producción
docker compose -f docker-compose.production.yml down
```

#### 3. Configuración de Cloudflare Tunnels (Routing Externo)
En el panel de Zero Trust de Cloudflare, configurar los "Public Hostnames":

1. **Ruta Principal (Aplicación Web)**:
   - Dominio: `app.dominio.ext`
   - Servicio: `http://localhost:3000` (Redirige al contenedor Next.js)
   
2. **Ruta Secundaria (Almacenamiento S3)**:
   - Dominio: `s3.dominio.ext`
   - Servicio: `http://localhost:9000` (Redirige a la API de MinIO)

Esta arquitectura garantiza:
- **Cero NAT/Port Forwarding**: No se abre ningún puerto en el router de la operadora.
- **DDoS Protection**: El tráfico malicioso es filtrado por la CDN de Cloudflare antes de llegar a Windows.
- **SSL Automático**: Los certificados HTTPS (candado verde) los gestiona y renueva Cloudflare en el Edge.iona con multi-instance)

---

### Opción B: Docker Completo

Toda la app en containers.

#### Dockerfile

```dockerfile
# Crear un archivo Dockerfile en la raíz del proyecto:

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma:generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

> **Nota:** El proyecto ya tiene `output: 'standalone'` configurado en `next.config.ts`. El Dockerfile actual en la raíz del proyecto es más completo que este ejemplo (incluye migraciones, healthcheck y entrypoint).

---

### Opción C: Plataforma Managed (Vercel, Railway, Fly.io)

| Plataforma | Pros | Contras |
|-----------|------|---------|
| **Vercel** | Zero config para Next.js, edge network | Serverless frío, límites de duración |
| **Railway** | Docker nativo, PostgreSQL incluido | Sin edge, pricing puede crecer |
| **Fly.io** | Multi-región, Docker nativo | Config más compleja |

Para Vercel, considerar:
- `STORAGE_ADAPTER=s3` obligatorio (no hay disco persistente)
- Usar Vercel Postgres o Neon como DB con connection pooling
- Rate limiting in-memory NO funciona (serverless) → necesita Redis

---

## Variables de Entorno de Producción

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `DATABASE_URL` | ✅ | Connection string de PostgreSQL (via PgBouncer) |
| `DIRECT_DATABASE_URL` | ✅ | Connection directa a PG (para migraciones) |
| `AUTH_SECRET` | ✅ | JWT signing secret, min 32 chars |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL pública de la app |
| `NODE_ENV` | ✅ | Debe ser `production` |
| `CACHE_DRIVER` | ⬜ | `memory` (defecto), `upstash` o `redis` |
| `REDIS_URL` | si redis | URL de Redis/Valkey local (ej: `redis://redis:6379`) |
| `UPSTASH_REDIS_REST_URL` | si upstash | URL de Upstash Redis (HTTP/REST) |
| `UPSTASH_REDIS_REST_TOKEN` | si upstash | Token de Upstash Redis |
| `STORAGE_ADAPTER` | ✅ | `local` o `s3` |
| `S3_BUCKET` | si s3 | Nombre del bucket |
| `S3_REGION` | si s3 | Región AWS/compatible |
| `S3_ENDPOINT` | si MinIO | URL del endpoint |
| `APP_VERSION` | ⬜ | Versión para health endpoint |
| `RESEND_API_KEY` | ✅ | API Key de Resend para correos transaccionales |
| `RESEND_FROM` | ✅ | Remitente verificado en Resend (ej: COMUNET \<noreply@dominio\>) |

---

## Backup y Recuperación

### PostgreSQL

```bash
# Backup diario (cron)
0 3 * * * docker exec comunet-postgres pg_dump -U comunet comunet | gzip > /backups/comunet-$(date +\%Y\%m\%d).sql.gz

# Retención: 30 días
find /backups -name "comunet-*.sql.gz" -mtime +30 -delete

# Restaurar
gunzip < /backups/comunet-20260328.sql.gz | docker exec -i comunet-postgres psql -U comunet comunet
```

### S3 Documents

- Habilitar versionado en el bucket S3
- Configurar lifecycle policy para mover a Glacier después de 1 año

---

## Monitorización

### Health Checks

```bash
# Liveness (proceso vivo)
curl -f http://localhost:3000/api/health?probe=liveness

# Readiness (dependencies ok)
curl -f http://localhost:3000/api/health
```

### PM2

```bash
pm2 monit          # Dashboard en tiempo real
pm2 logs comunet   # Logs en tiempo real
pm2 status         # Estado de procesos
```

### PostgreSQL

```sql
-- Conexiones activas
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Queries lentas (>500ms)
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```
