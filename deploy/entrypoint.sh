#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "✅ Migrations complete."

# ─── MinIO bucket initialization ────────────────────────
# Only runs when STORAGE_ADAPTER=s3 and S3_ENDPOINT points to MinIO
if [ "$STORAGE_ADAPTER" = "s3" ] && [ -n "$S3_ENDPOINT" ]; then
  echo "🪣 Initializing MinIO bucket '${S3_BUCKET:-comunet-documents}'..."

  # Wait for MinIO to be ready (max 30s)
  i=0
  until wget -q --spider "${S3_ENDPOINT}/minio/health/ready" 2>/dev/null; do
    i=$((i+1))
    if [ $i -ge 30 ]; then
      echo "⚠️  MinIO not ready after 30s — skipping bucket init"
      break
    fi
    sleep 1
  done

  # Create bucket using mc (MinIO Client) if available
  if command -v mc >/dev/null 2>&1; then
    mc alias set minio "${S3_ENDPOINT}" "${AWS_ACCESS_KEY_ID}" "${AWS_SECRET_ACCESS_KEY}" --quiet || true
    mc mb --ignore-existing "minio/${S3_BUCKET:-comunet-documents}" || true
    echo "✅ MinIO bucket ready."
  else
    echo "ℹ️  mc not found — bucket must be created manually via MinIO console (:9001)"
  fi
fi

echo "🚀 Starting Next.js server..."
exec node server.js
