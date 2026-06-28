import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, '0')
  const min = (m % 60).toString().padStart(2, '0')
  return `${h}:${min}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  const professionalId = searchParams.get('professionalId')
  const serviceId = searchParams.get('serviceId')
  const date = searchParams.get('date') // YYYY-MM-DD

  if (!tenantId || !professionalId || !serviceId || !date) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Validate booking page is active
  const { data: bookingPage } = await supabase
    .from('booking_pages')
    .select('is_active')
    .eq('tenant_id', tenantId)
    .single()

  if (!bookingPage?.is_active) {
    return NextResponse.json({ slots: [] })
  }

  // Get service duration
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', serviceId)
    .eq('tenant_id', tenantId)
    .single()

  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  // Get day of week (0 = Sunday)
  const dateObj = new Date(`${date}T12:00:00Z`)
  const dayOfWeek = dateObj.getUTCDay()

  // Get business hours for this day
  const { data: hours } = await supabase
    .from('business_hours')
    .select('open_time, close_time, is_closed')
    .eq('tenant_id', tenantId)
    .eq('day_of_week', dayOfWeek)
    .single()

  if (!hours || hours.is_closed) {
    return NextResponse.json({ slots: [] })
  }

  // Check for closure on this date
  const { data: closure } = await supabase
    .from('business_closures')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('date', date)
    .single()

  if (closure) {
    return NextResponse.json({ slots: [] })
  }

  // Get breaks for this day
  const { data: breaks } = await supabase
    .from('business_breaks')
    .select('start_time, end_time')
    .eq('tenant_id', tenantId)
    .eq('day_of_week', dayOfWeek)

  // Get existing appointments for this professional on this date
  const startOfDay = `${date}T00:00:00Z`
  const endOfDay = `${date}T23:59:59Z`
  const { data: appointments } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('professional_id', professionalId)
    .neq('status', 'cancelled')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)

  const openMinutes = timeToMinutes(hours.open_time)
  const closeMinutes = timeToMinutes(hours.close_time)
  const duration = service.duration_minutes
  const slotInterval = 30

  const slots: string[] = []

  for (let start = openMinutes; start + duration <= closeMinutes; start += slotInterval) {
    const end = start + duration

    // Check overlap with breaks
    const overlapsBreak = (breaks ?? []).some((b) => {
      const bs = timeToMinutes(b.start_time)
      const be = timeToMinutes(b.end_time)
      return start < be && end > bs
    })
    if (overlapsBreak) continue

    // Check overlap with existing appointments
    const slotStartIso = `${date}T${minutesToTime(start)}:00`
    const slotEndIso = `${date}T${minutesToTime(end)}:00`
    const overlapsAppointment = (appointments ?? []).some((a) => {
      const as_ = new Date(a.start_time).getTime()
      const ae = new Date(a.end_time).getTime()
      const ss = new Date(slotStartIso).getTime()
      const se = new Date(slotEndIso).getTime()
      return ss < ae && se > as_
    })
    if (overlapsAppointment) continue

    slots.push(minutesToTime(start))
  }

  return NextResponse.json({ slots })
}
