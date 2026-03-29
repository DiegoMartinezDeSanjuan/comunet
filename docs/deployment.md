# Deployment Guide — COMUNET

## Opciones de Despliegue

### Opción A: VPS / Bare Metal (Recomendado para empezar)

Infraestructura mínima para 500 usuarios concurrentes.

#### Requisitos de Hardware

| Componente | Mínimo | Recomendado |
|-----------|--------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |
| OS | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 |

#### 1. Instalar dependencias

```bash
# Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm
npm install -g pnpm

# nginx (reverse proxy)
sudo apt install -y nginx certbot python3-certbot-nginx
```

#### 2. Configurar infraestructura

```bash
# Clonar repositorio
git clone https://github.com/DiegoMartinezDeSanjuan/comunet.git
cd comunet

# Crear .env producción
cp .env.example .env
# Editar .env con valores de producción:
# - DATABASE_URL apuntar a PgBouncer (port 6432)
# - AUTH_SECRET con valor aleatorio de 32+ chars
# - STORAGE_ADAPTER=s3 si multi-instance
# - S3_BUCKET, S3_REGION, etc.

# Levantar PostgreSQL + PgBouncer + MinIO
docker compose -f docker-compose.production.yml up -d

# Esperar a que PostgreSQL esté listo
docker compose -f docker-compose.production.yml logs -f postgres
# Ctrl+C cuando vea "database system is ready to accept connections"
```

> **⚠️ IMPORTANTE: PgBouncer y Prisma CLI**
>
> PgBouncer en modo `transaction` es incompatible con prepared statements,
> que Prisma CLI usa internamente para migraciones y `prisma studio`.
>
> - **Aplicación (runtime):** Usa PgBouncer → `DATABASE_URL` apunta al port 6432
> - **Migraciones y CLI:** Usa conexión directa → port 5432
>
> Prisma soporta esto con la variable `DIRECT_DATABASE_URL` en `schema.prisma`:
>
> ```prisma
> datasource db {
>   provider  = "postgresql"
>   url       = env("DATABASE_URL")       // PgBouncer (port 6432) para runtime
>   directUrl = env("DIRECT_DATABASE_URL") // Directo (port 5432) para migraciones
> }
> ```
>
> En `.env` de producción:
> ```
> DATABASE_URL="postgresql://comunet:PASSWORD@localhost:6432/comunet?schema=public"
> DIRECT_DATABASE_URL="postgresql://comunet:PASSWORD@localhost:5432/comunet?schema=public"
> ```
>
> Con esto, `prisma migrate deploy` y `prisma studio` usan la conexión directa
> automáticamente, mientras que la aplicación usa el pool de PgBouncer.

#### 3. Build y deploy

```bash
# Instalar dependencias
pnpm install --frozen-lockfile

# Generar Prisma client
pnpm prisma:generate

# Aplicar migraciones
npx prisma migrate deploy

# Seed (solo primera vez)
pnpm seed

# Build producción
pnpm build

# Start (con PM2 para process management)
npm install -g pm2
pm2 start npm --name comunet -- start
pm2 save
pm2 startup
```

#### 4. Configurar nginx

```nginx
# /etc/nginx/sites-available/comunet
upstream comunet {
    server 127.0.0.1:3000;
    # Para múltiples instancias:
    # server 127.0.0.1:3001;
    # server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name app.comunet.es;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.comunet.es;

    # SSL (certbot lo configura automáticamente)
    ssl_certificate /etc/letsencrypt/live/app.comunet.es/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.comunet.es/privkey.pem;

    # Proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # File upload limit (8MB matches Document service limit)
    client_max_body_size 10M;

    location / {
        proxy_pass http://comunet;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Health check (no logging)
    location /api/health {
        proxy_pass http://comunet;
        access_log off;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/comunet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL con Let's Encrypt
sudo certbot --nginx -d app.comunet.es
```

#### 5. Escalar horizontalmente

```bash
# Abrir instancias adicionales en puertos diferentes
PORT=3001 pm2 start npm --name comunet-2 -- start
PORT=3002 pm2 start npm --name comunet-3 -- start

# Actualizar nginx upstream
# Y asegurar STORAGE_ADAPTER=s3 (local disk no funciona con multi-instance)
```

---

### Opción B: Docker Completo

Toda la app en containers.

#### Dockerfile

```dockerfile
# Crear un archivo Dockerfile en la raíz del proyecto:

FROM node:20-alpine AS base
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

> **Nota:** Para usar standalone output, añadir `output: 'standalone'` en `next.config.ts`.

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
| `AUTH_SECRET` | ✅ | JWT signing secret, min 32 chars |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL pública de la app |
| `NODE_ENV` | ✅ | Debe ser `production` |
| `STORAGE_ADAPTER` | ✅ | `local` o `s3` |
| `S3_BUCKET` | si s3 | Nombre del bucket |
| `S3_REGION` | si s3 | Región AWS/compatible |
| `S3_ENDPOINT` | si MinIO | URL del endpoint |
| `APP_VERSION` | ⬜ | Versión para health endpoint |

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
