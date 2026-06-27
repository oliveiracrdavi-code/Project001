import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

export const STRIPE_PLANS = {
  starter: {
    name: 'Starter',
    description: 'Ideal para salões pequenos com 1 profissional',
    priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
    features: [
      'Até 100 agendamentos/mês',
      '1 profissional',
      'Lembretes via WhatsApp',
      'Gestão de clientes',
    ],
  },
  professional: {
    name: 'Profissional',
    description: 'Para salões em crescimento com múltiplos profissionais',
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!,
    features: [
      'Agendamentos ilimitados',
      'Até 5 profissionais',
      'Lembretes via WhatsApp',
      'Gestão de clientes e pacotes',
      'Relatórios avançados',
    ],
  },
} as const

export async function createStripeCustomer(email: string, name: string) {
  return stripe.customers.create({ email, name })
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
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { tenantId },
    subscription_data: {
      metadata: { tenantId },
    },
    locale: 'pt-BR',
    currency: 'brl',
  })
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
