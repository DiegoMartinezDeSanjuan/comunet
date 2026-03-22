import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await requireAuth()

    if (!requirePermission(session, 'finances.read')) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')

    const where: any = { community: { officeId: session.officeId } }
    if (communityId) where.communityId = communityId

    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        community: true,
        unit: true,
        owner: true,
      },
      orderBy: { issueDate: 'desc' },
    })

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

    const rows = receipts
      .map((r: any) => {
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

    const csvContent = `${headers}\n${rows}`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="recibos_${new Date().toISOString().substring(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
