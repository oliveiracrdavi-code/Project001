import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tenantId, hours, breaks, closures } = await request.json()

  // Verify user belongs to this tenant
  const { data: member } = await supabase
    .from('tenant_members')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Upsert business hours (one row per day_of_week)
  const { error: hoursError } = await supabase
    .from('business_hours')
    .upsert(
      hours.map((h: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean }) => ({
        tenant_id: tenantId,
        day_of_week: h.day_of_week,
        open_time: h.open_time,
        close_time: h.close_time,
        is_closed: h.is_closed,
      })),
      { onConflict: 'tenant_id,day_of_week' }
    )

  if (hoursError) return NextResponse.json({ error: hoursError.message }, { status: 500 })

  // Replace breaks: delete all, then insert new ones
  await supabase.from('business_breaks').delete().eq('tenant_id', tenantId)

  if (breaks.length > 0) {
    const { error: breaksError } = await supabase.from('business_breaks').insert(
      breaks.map((b: { day_of_week: number; start_time: string; end_time: string }) => ({
        tenant_id: tenantId,
        day_of_week: b.day_of_week,
        start_time: b.start_time,
        end_time: b.end_time,
      }))
    )
    if (breaksError) return NextResponse.json({ error: breaksError.message }, { status: 500 })
  }

  // Replace closures: delete all, then insert new ones
  await supabase.from('business_closures').delete().eq('tenant_id', tenantId)

  if (closures.length > 0) {
    const { error: closuresError } = await supabase.from('business_closures').insert(
      closures.map((c: { date: string; reason: string | null }) => ({
        tenant_id: tenantId,
        date: c.date,
        reason: c.reason,
      }))
    )
    if (closuresError) return NextResponse.json({ error: closuresError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
