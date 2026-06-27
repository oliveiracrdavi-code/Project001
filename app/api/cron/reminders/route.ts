import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getMessageProvider } from '@/lib/messaging'
import { formatInTimeZone } from 'date-fns-tz'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function verifySecret(request: Request): boolean {
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

export async function POST(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const messaging = getMessageProvider()

  const available = await messaging.isAvailable()
  if (!available) {
    console.warn('[Cron/reminders] Evolution API unavailable — skipping')
    return NextResponse.json({ skipped: true, reason: 'messaging_unavailable' })
  }

  const now = new Date()

  // --- Appointment reminders (24h before) ---
  const reminderWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const reminderWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  const { data: upcoming } = await supabase
    .from('appointments')
    .select(`
      id, start_time, tenant_id,
      clients(name, phone, whatsapp_consent),
      services(name),
      professionals(name),
      tenants(name, timezone, whatsapp_consent_enabled)
    `)
    .gte('start_time', reminderWindowStart.toISOString())
    .lte('start_time', reminderWindowEnd.toISOString())
    .in('status', ['scheduled', 'confirmed'])
    .eq('reminder_sent', false)

  let remindersSent = 0

  for (const apt of upcoming ?? []) {
    const raw = apt as Record<string, unknown>
    const client = (Array.isArray(raw.clients) ? raw.clients[0] : raw.clients) as { name: string; phone: string; whatsapp_consent: boolean } | null
    const service = (Array.isArray(raw.services) ? raw.services[0] : raw.services) as { name: string } | null
    const professional = (Array.isArray(raw.professionals) ? raw.professionals[0] : raw.professionals) as { name: string } | null
    const tenant = (Array.isArray(raw.tenants) ? raw.tenants[0] : raw.tenants) as { name: string; timezone: string; whatsapp_consent_enabled: boolean } | null

    if (!tenant?.whatsapp_consent_enabled) continue
    if (!client?.whatsapp_consent || !client.phone) continue

    const tz = tenant.timezone ?? 'America/Sao_Paulo'
    const timeStr = formatInTimeZone(new Date(raw.start_time as string), tz, "dd/MM 'às' HH:mm")

    const text =
      `Olá, ${client.name}! Lembrando do seu agendamento amanhã:\n\n` +
      `📅 ${timeStr}\n` +
      `💇 ${service?.name}\n` +
      `👤 ${professional?.name}\n` +
      `📍 ${tenant.name}\n\n` +
      `Responda SIM para confirmar ou NÃO para cancelar.\n\n` +
      `_Para não receber mais lembretes, informe ao salão._`

    const result = await messaging.sendText({ to: client.phone, text })

    if (result.success) {
      await supabase.from('appointments').update({ reminder_sent: true }).eq('id', raw.id as string)
      remindersSent++
    } else {
      console.error('[Cron/reminders] Failed to send to', client.phone, result.error)
    }
  }

  // --- Return reminders (30 days after last completed appointment) ---
  const returnWindowStart = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000)
  const returnWindowEnd = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)

  const { data: completedApts } = await supabase
    .from('appointments')
    .select(`
      id, start_time, tenant_id,
      clients(name, phone, whatsapp_consent),
      services(name),
      tenants(name, timezone, whatsapp_consent_enabled)
    `)
    .gte('start_time', returnWindowStart.toISOString())
    .lte('start_time', returnWindowEnd.toISOString())
    .eq('status', 'completed')
    .eq('return_reminder_sent', false)

  let returnsSent = 0

  for (const apt of completedApts ?? []) {
    const raw = apt as Record<string, unknown>
    const client = (Array.isArray(raw.clients) ? raw.clients[0] : raw.clients) as { name: string; phone: string; whatsapp_consent: boolean } | null
    const service = (Array.isArray(raw.services) ? raw.services[0] : raw.services) as { name: string } | null
    const tenant = (Array.isArray(raw.tenants) ? raw.tenants[0] : raw.tenants) as { name: string; timezone: string; whatsapp_consent_enabled: boolean } | null

    if (!tenant?.whatsapp_consent_enabled) continue
    if (!client?.whatsapp_consent || !client.phone) continue

    const text =
      `Oi, ${client.name}! Faz um mês desde o seu último ${service?.name} aqui no ${tenant.name}. 😊\n\n` +
      `Que tal marcar um horário? Estamos com agenda aberta!\n\n` +
      `_Para não receber mais mensagens, informe ao salão._`

    const result = await messaging.sendText({ to: client.phone, text })

    if (result.success) {
      await supabase.from('appointments').update({ return_reminder_sent: true }).eq('id', raw.id as string)
      returnsSent++
    }
  }

  return NextResponse.json({ ok: true, remindersSent, returnsSent, processedAt: now.toISOString() })
}

export async function GET(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
