import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe/client'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenantRaw } = await supabase
    .from('tenants')
    .select('id, stripe_customer_id')
    .limit(1)
    .single()

  const tenant = tenantRaw as { id: string; stripe_customer_id: string | null } | null

  if (!tenant?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const session = await createPortalSession(
    tenant.stripe_customer_id,
    `${appUrl}/dashboard/billing`
  )

  return NextResponse.json({ url: session.url })
}
