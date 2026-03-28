import { NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth'
import { canReadDocument } from '@/lib/permissions'
import {
  getDocumentDownloadStream,
  getDocumentPresignedUrl,
} from '@/modules/documents/server/services'

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

    // Strategy 1: Presigned URL redirect (S3 only — bypasses app server entirely)
    const presignedUrl = await getDocumentPresignedUrl(id)
    if (presignedUrl) {
      return NextResponse.redirect(presignedUrl, 302)
    }

    // Strategy 2: Stream through app server (local storage or S3 fallback)
    const { stream, downloadName, document, size } = await getDocumentDownloadStream(id)

    const headers: Record<string, string> = {
      'Content-Type': document.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
      'Cache-Control': 'private, no-store',
    }

    // Include Content-Length if we know the size (helps clients show progress)
    if (size && size > 0) {
      headers['Content-Length'] = String(size)
    }

    return new NextResponse(stream, { headers })
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
