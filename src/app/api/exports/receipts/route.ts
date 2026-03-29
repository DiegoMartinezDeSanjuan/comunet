import { Prisma, ReceiptStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/permissions'
import { exportLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** Safety limit to prevent OOM on large offices */
const MAX_EXPORT_ROWS = 10_000

export async function GET(request: Request) {
  try {
    const session = await requireAuth()

    if (!requirePermission(session, 'finances.read')) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')
    const status = searchParams.get('status')

    const where: Prisma.ReceiptWhereInput = {
      community: { officeId: session.officeId },
    }

    if (communityId) {
      where.communityId = communityId
    }

    if (
      status &&
      Object.values(ReceiptStatus).includes(status as ReceiptStatus)
    ) {
      where.status = status as ReceiptStatus
    }

    // Rate limit exports (heavy operation)
    const rateResult = await exportLimiter.check(session.userId)
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Too many export requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateResult.retryAfterMs / 1000)) },
        },
      )
    }

    const headers = [
      'ID Recibo',
      'Comunidad',
      'Unidad',
      'Propietario',
      'Fecha Emision',
      'Fecha Vencimiento',
      'Importe Total',
      'Importe Pagado',
      'Estado',
    ].join(';')

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode(headers + '\n'))

        const CHUNK_SIZE = 1000
        let skip = 0
        let hasMore = true
        let totalProcessed = 0

        while (hasMore && totalProcessed < MAX_EXPORT_ROWS) {
          const receipts = await prisma.receipt.findMany({
            where,
            include: {
              community: true,
              unit: true,
              owner: true,
            },
            orderBy: [{ issueDate: 'desc' }, { id: 'desc' }],
            take: CHUNK_SIZE,
            skip,
          })

          if (receipts.length === 0) {
            hasMore = false
            break
          }

          const rows = receipts
            .map((r) => {
              const ownerName = r.owner.fullName.replace(/;/g, ',')
              const communityName = r.community.name.replace(/;/g, ',')
              const unitName = r.unit.reference.replace(/;/g, ',')

              return [
                r.reference,
                communityName,
                unitName,
                ownerName,
                new Date(r.issueDate).toLocaleDateString(),
                new Date(r.dueDate).toLocaleDateString(),
                Number(r.amount).toFixed(2),
                Number(r.paidAmount).toFixed(2),
                r.status,
              ].join(';')
            })
            .join('\n')

          controller.enqueue(encoder.encode(rows + '\n'))

          skip += receipts.length
          totalProcessed += receipts.length

          if (receipts.length < CHUNK_SIZE) {
            hasMore = false
          }
        }
        controller.close()
      },
    })

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="recibos_${new Date()
          .toISOString()
          .split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
