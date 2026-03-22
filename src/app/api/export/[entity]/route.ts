import { NextResponse } from 'next/server'
import { requireAuth, isBackofficeRole } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entity: string }> } // Note: params is a promise in Next.js 15
) {
  try {
    const session = await requireAuth()
    
    if (!isBackofficeRole(session.role)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { entity } = await params
    
    // TODO: Phase 3 - Implement real exports
    return NextResponse.json(
      { 
        error: 'Not Implemented', 
        message: `CSV export for ${entity} is not yet implemented (Phase 3)` 
      },
      { status: 501 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    return new NextResponse('Internal Error', { status: 500 })
  }
}
