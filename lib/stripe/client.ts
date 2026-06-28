import Stripe from 'stripe'

// Lazy singleton — avoids module-level instantiation during Next.js build
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return _stripe
}

export const PLAN_PRICE_IDS = {
  comecar: process.env.STRIPE_PRICE_COMECAR!,
  profissional: process.env.STRIPE_PRICE_PROFISSIONAL!,
  inteligente: process.env.STRIPE_PRICE_INTELIGENTE!,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
} as const

export type PlanKey = keyof typeof PLAN_PRICE_IDS

export function getPlanFromPriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null
  const entry = Object.entries(PLAN_PRICE_IDS).find(([, id]) => id === priceId)
  return entry ? (entry[0] as PlanKey) : null
}

export async function createStripeCustomer(email: string, name: string) {
  return getStripe().customers.create({ email, name })
}

export async function createCheckoutSession({
  customerId,
  priceId,
  tenantId,
  successUrl,
  cancelUrl,
}: {
  customerId: string
  priceId: string
  tenantId: string
  successUrl: string
  cancelUrl: string
}) {
  return getStripe().checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { tenantId },
    subscription_data: { metadata: { tenantId } },
    locale: 'pt-BR',
    currency: 'brl',
    allow_promotion_codes: true,
  })
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
