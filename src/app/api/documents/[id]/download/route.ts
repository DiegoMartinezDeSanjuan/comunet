import { NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth'
import { canReadDocument } from '@/lib/permissions'
import { getDocumentDownloadPayload } from '@/modules/documents/server/services'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth()
    const { id } = await context.params

    const allowed = await canReadDocument(session, id)
    if (!allowed) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const { buffer, downloadName, document } = await getDocumentDownloadPayload(id)
    const body = new Uint8Array(buffer)

    return new NextResponse(body, {
      headers: {
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Length': String(body.byteLength),
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN'

    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (message === 'DOCUMENT_NOT_FOUND') {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
