import { NextResponse } from 'next/server'

// Mock email endpoint - logs emails instead of sending
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log('📧 [MOCK EMAIL]', {
      to: body.to,
      subject: body.subject,
      body: body.body?.substring(0, 200),
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Email logged (mock mode)',
      id: `mock-${Date.now()}`,
    })
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
  }
}
