import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { STRIPE_PLANS } from '@/lib/stripe/client'
import { formatDateBR } from '@/lib/utils'
import BillingActions from './billing-actions'
import type { SubscriptionStatus } from '@/lib/supabase/types'

interface TenantBilling {
  id: string
  stripe_customer_id: string | null
  stripe_price_id: string | null
  subscription_status: SubscriptionStatus | null
  subscription_period_end: string | null
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: 'Período de teste',
  active: 'Ativo',
  canceled: 'Cancelado',
  incomplete: 'Incompleto',
  incomplete_expired: 'Expirado',
  past_due: 'Pagamento pendente',
  unpaid: 'Inadimplente',
  paused: 'Pausado',
}

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenantRaw } = await supabase
    .from('tenants')
    .select('id, stripe_customer_id, stripe_price_id, subscription_status, subscription_period_end')
    .limit(1)
    .single()

  const tenant = tenantRaw as TenantBilling | null

  if (!tenant) redirect('/onboarding')

  const currentPlan = Object.entries(STRIPE_PLANS).find(
    ([, plan]) => plan.priceId === tenant.stripe_price_id
  )

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Plano e cobrança</h1>

      <div className="mt-6 max-w-2xl space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Assinatura atual</h2>

          {tenant.subscription_status ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Plano</span>
                <span className="text-sm font-medium text-gray-900">
                  {currentPlan ? currentPlan[1].name : 'Personalizado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  tenant.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                  tenant.subscription_status === 'trialing' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {STATUS_LABELS[tenant.subscription_status]}
                </span>
              </div>
              {tenant.subscription_period_end && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Próxima cobrança</span>
                  <span className="text-sm text-gray-900">
                    {formatDateBR(tenant.subscription_period_end)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Você está no período de avaliação. Escolha um plano abaixo.
            </p>
          )}

          {tenant.stripe_customer_id && (
            <div className="mt-4">
              <BillingActions
                tenantId={tenant.id}
                hasSubscription={!!tenant.subscription_status}
              />
            </div>
          )}
        </div>

        <h2 className="text-base font-semibold text-gray-900">Planos disponíveis</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(STRIPE_PLANS).map(([key, plan]) => (
            <div
              key={key}
              className={`rounded-lg border p-5 ${
                currentPlan?.[0] === key
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <h3 className="font-semibold">{plan.name}</h3>
              <p className={`mt-1 text-sm ${currentPlan?.[0] === key ? 'text-gray-300' : 'text-gray-500'}`}>
                {plan.description}
              </p>
              <ul className="mt-3 space-y-1">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${currentPlan?.[0] === key ? 'text-gray-200' : 'text-gray-600'}`}>
                    <span className="text-green-400">✓</span>{f}
                  </li>
                ))}
              </ul>
              {currentPlan?.[0] === key && (
                <p className="mt-3 text-xs text-gray-400">Plano atual</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
