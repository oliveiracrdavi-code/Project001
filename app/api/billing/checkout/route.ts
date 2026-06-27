import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, createStripeCustomer } from '@/lib/stripe/client'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceId } = await request.json()
  if (!priceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 })

  const { data: tenantRaw } = await supabase
    .from('tenants')
    .select('id, stripe_customer_id, name')
    .limit(1)
    .single()

  const tenant = tenantRaw as { id: string; stripe_customer_id: string | null; name: string } | null

  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  let customerId = tenant.stripe_customer_id

  if (!customerId) {
    const customer = await createStripeCustomer(user.email!, tenant.name)
    customerId = customer.id

    await supabase
      .from('tenants')
      .update({ stripe_customer_id: customerId })
      .eq('id', tenant.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await createCheckoutSession({
    customerId,
    priceId,
    tenantId: tenant.id,
    successUrl: `${appUrl}/dashboard/billing?success=true`,
    cancelUrl: `${appUrl}/dashboard/billing`,
  })

  return NextResponse.json({ url: session.url })
}
