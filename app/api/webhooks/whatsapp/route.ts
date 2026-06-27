import { NextResponse } from 'next/server'

// Evolution API webhook receiver
// Events: MESSAGES_UPSERT, CONNECTION_UPDATE, QRCODE_UPDATED, etc.
// This endpoint is intentionally minimal — extend with your automation logic.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const event = body.event as string | undefined
  const data = body.data

  // Log for debugging — remove in production
  console.log('[WhatsApp webhook]', event, JSON.stringify(data).slice(0, 200))

  switch (event) {
    case 'MESSAGES_UPSERT': {
      // Incoming client message — implement auto-reply logic here if needed
      break
    }
    case 'CONNECTION_UPDATE': {
      const state = data?.state
      if (state === 'open') {
        console.log('[WhatsApp] Instance connected')
      } else if (state === 'close') {
        console.warn('[WhatsApp] Instance disconnected — check Evolution API')
      }
      break
    }
    case 'QRCODE_UPDATED': {
      // Store QR code to display in settings if needed
      break
    }
  }

  return NextResponse.json({ ok: true })
}
