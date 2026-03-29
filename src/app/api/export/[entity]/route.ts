import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { requireAuth, isBackofficeRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { exportLimiter } from '@/lib/rate-limit'

// Limit chunk size and max rows for memory safety
const CHUNK_SIZE = 1000
const MAX_EXPORT_ROWS = 50_000

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const session = await requireAuth()
    
    // Solo roles backoffice o admin
    if (!isBackofficeRole(session.role)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { entity } = await params
    
    // Proteger contra spam de exportaciones
    const rateResult = await exportLimiter.check(session.userId)
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Too many export requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateResult.retryAfterMs / 1000)) } }
      )
    }

    // Config global where (aislamiento de datos)
    const officeWhere = { community: { officeId: session.officeId } }

    let headers = ''
    let getBatch: (skip: number) => Promise<any[]> = async () => []
    let formatRow: (row: any) => string = () => ''

    switch (entity) {
      case 'incidents':
        headers = ['ID', 'Titulo', 'Estado', 'Prioridad', 'Comunidad', 'Creado Por', 'Creado'].join(';')
        getBatch = (skip) => prisma.incident.findMany({
          where: officeWhere,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
            community: { select: { name: true } },
            createdBy: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: CHUNK_SIZE,
          skip
        })
        formatRow = (r) => [
          r.id,
          (r.title || '').replace(/;/g, ','),
          r.status,
          r.priority,
          (r.community?.name || '').replace(/;/g, ','),
          (r.createdBy?.name || '').replace(/;/g, ','),
          new Date(r.createdAt).toLocaleDateString()
        ].join(';')
        break

      case 'debts':
        headers = ['ID', 'Principal', 'Recargo', 'Estado', 'Comunidad', 'Propietario', 'Creado'].join(';')
        getBatch = (skip) => prisma.debt.findMany({
          where: officeWhere,
          select: {
            id: true,
            principal: true,
            surcharge: true,
            status: true,
            createdAt: true,
            community: { select: { name: true } },
            owner: { select: { fullName: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: CHUNK_SIZE,
          skip
        })
        formatRow = (r) => [
          r.id,
          Number(r.principal).toFixed(2),
          Number(r.surcharge).toFixed(2),
          r.status,
          (r.community?.name || '').replace(/;/g, ','),
          (r.owner?.fullName || '').replace(/;/g, ','),
          new Date(r.createdAt).toLocaleDateString()
        ].join(';')
        break

      default:
        return NextResponse.json({ error: 'Entity export not implemented' }, { status: 400 })
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode(headers + '\n'))

        let skip = 0
        let hasMore = true
        let totalProcessed = 0

        while (hasMore && totalProcessed < MAX_EXPORT_ROWS) {
          const rows = await getBatch(skip)

          if (rows.length === 0) {
            hasMore = false
            break
          }

          const csvContent = rows.map(formatRow).join('\n')
          controller.enqueue(encoder.encode(csvContent + '\n'))

          skip += rows.length
          totalProcessed += rows.length

          if (rows.length < CHUNK_SIZE) {
            hasMore = false
          }
        }
        controller.close()
      }
    })

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="export_${entity}_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error(`Export Error:`, error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    return new NextResponse('Internal Error', { status: 500 })
  }
}
