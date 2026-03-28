import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const startedAt = Date.now()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const probe = searchParams.get('probe')

  // Liveness probe — just confirms the process is alive
  if (probe === 'liveness') {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - startedAt) / 1000),
    })
  }

  // Readiness probe — confirms dependencies are reachable
  const checks: Record<string, 'ok' | 'error'> = {}
  let healthy = true

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
    healthy = false
  }

  // Storage check (basic — just verifies env is set)
  const storageAdapter = process.env.STORAGE_ADAPTER || 'local'
  if (storageAdapter === 's3' && !process.env.S3_BUCKET) {
    checks.storage = 'error'
    healthy = false
  } else {
    checks.storage = 'ok'
  }

  const status = healthy ? 'ok' : 'degraded'
  const httpStatus = healthy ? 200 : 503

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - startedAt) / 1000),
      version: process.env.APP_VERSION || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
    },
    { status: httpStatus },
  )
}
