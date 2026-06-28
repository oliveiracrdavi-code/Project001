import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getMessageProvider } from '@/lib/messaging'
import { maskCpf } from '@/lib/utils'

function getClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const POLICY_VERSION = '1.0'

export async function POST(request: Request) {
  const body = await request.json()
  const {
    tenantId,
    serviceId,
    professionalId,
    startTime,       // ISO string
    endTime,         // ISO string
    clientName,
    clientPhone,
    clientEmail,
    clientCpf,
    lgpdConsent,     // must be true
  } = body

  if (!tenantId || !serviceId || !professionalId || !startTime || !endTime
      || !clientName || !clientPhone || !lgpdConsent) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const supabase = getClient()

  // Validate booking page is active
  const { data: bookingPage } = await supabase
    .from('booking_pages')
    .select('is_active, require_cpf')
    .eq('tenant_id', tenantId)
    .single()

  if (!bookingPage?.is_active) {
    return NextResponse.json({ error: 'Agendamento online não disponível' }, { status: 403 })
  }

  if (bookingPage.require_cpf && !clientCpf) {
    return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 })
  }

  // Upsert client
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('phone', clientPhone)
    .is('deleted_at', null)
    .maybeSingle()

  let clientId: string

  if (existingClient) {
    clientId = existingClient.id
    await supabase
      .from('clients')
      .update({
        name: clientName,
        email: clientEmail ?? null,
        cpf: clientCpf ? maskCpf(clientCpf) : undefined,
      })
      .eq('id', clientId)
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        tenant_id: tenantId,
        name: clientName,
        phone: clientPhone,
        email: clientEmail ?? null,
        cpf: clientCpf ? maskCpf(clientCpf) : null,
        lgpd_consent: true,
        lgpd_consent_date: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (clientError || !newClient) {
      return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
    }
    clientId = newClient.id
  }

  // Record LGPD consent (append-only)
  await supabase.from('lgpd_consents').insert({
    client_id: clientId,
    tenant_id: tenantId,
    consent_type: 'data_processing',
    granted: true,
    policy_version: POLICY_VERSION,
    ip_address: request.headers.get('x-forwarded-for') ?? null,
  })

  // Insert appointment — EXCLUSION CONSTRAINT prevents double-booking
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      professional_id: professionalId,
      service_id: serviceId,
      start_time: startTime,
      end_time: endTime,
    })
    .select('id')
    .single()

  if (apptError) {
    // 23P01 = exclusion_violation (double-booking)
    if (apptError.code === '23P01') {
      return NextResponse.json(
        { error: 'Este horário acabou de ser reservado. Escolha outro.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 })
  }

  // Send confirmation message (best-effort)
  try {
    const messaging = getMessageProvider()
    const dateStr = new Date(startTime).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    const to = clientEmail ?? clientPhone
    await messaging.sendText({
      to,
      text: `Olá ${clientName}! Seu agendamento foi confirmado para ${dateStr}. Até lá!`,
    })
  } catch {
    // Non-fatal: appointment is created, message failure is logged but not returned
  }

  return NextResponse.json({ appointmentId: appointment.id, clientId })
}
