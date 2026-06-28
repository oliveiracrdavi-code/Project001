import { NextResponse } from 'next/server'
import { getStripe, getPlanFromPriceId } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import type { SubscriptionStatus } from '@/lib/supabase/types'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Idempotency guard — skip already-processed events
  const { error: idempotencyError } = await supabase
    .from('processed_stripe_events')
    .insert({ event_id: event.id })

  if (idempotencyError?.code === '23505') {
    // Duplicate event — already processed
    return NextResponse.json({ received: true, skipped: true })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const tenantId = sub.metadata.tenantId
      if (!tenantId) break

      const priceId = sub.items.data[0]?.price.id ?? null
      const plan = getPlanFromPriceId(priceId) ?? 'comecar'

      await supabase.from('tenants').update({
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        subscription_status: sub.status as SubscriptionStatus,
        subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        plan,
      }).eq('id', tenantId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const tenantId = sub.metadata.tenantId
      if (!tenantId) break

      await supabase.from('tenants').update({
        subscription_status: 'canceled' as SubscriptionStatus,
        stripe_subscription_id: null,
        stripe_price_id: null,
        subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        plan: 'comecar',
      }).eq('id', tenantId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      await supabase.from('tenants').update({
        subscription_status: 'past_due' as SubscriptionStatus,
      }).eq('stripe_customer_id', customerId)
      break
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const tenantId = session.metadata?.tenantId
      if (!tenantId || !session.customer) break

      await supabase.from('tenants').update({
        stripe_customer_id: session.customer as string,
      }).eq('id', tenantId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
