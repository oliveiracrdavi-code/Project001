import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PLANS, PLAN_ORDER, getPlanConfig } from '@/lib/plans/config'
import { formatDateBR } from '@/lib/utils'
import BillingActions from './billing-actions'
import type { SubscriptionStatus } from '@/lib/supabase/types'
import type { PlanKey } from '@/lib/plans/config'

interface TenantBilling {
  id: string
  plan: PlanKey | null
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
    .select('id, plan, stripe_customer_id, stripe_price_id, subscription_status, subscription_period_end')
    .limit(1)
    .single()

  const tenant = tenantRaw as TenantBilling | null
  if (!tenant) redirect('/onboarding')

  const currentPlanConfig = getPlanConfig(tenant.plan)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Plano e cobrança</h1>

      <div className="mt-6 max-w-3xl space-y-6">
        {/* Current plan */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Assinatura atual</h2>

          {tenant.subscription_status ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Plano</span>
                <span className="text-sm font-semibold text-gray-900">{currentPlanConfig.displayName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  tenant.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                  tenant.subscription_status === 'trialing' ? 'bg-blue-100 text-blue-700' :
                  tenant.subscription_status === 'past_due' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {STATUS_LABELS[tenant.subscription_status]}
                </span>
              </div>
              {tenant.subscription_period_end && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Próxima cobrança</span>
                  <span className="text-sm text-gray-900">{formatDateBR(tenant.subscription_period_end)}</span>
                </div>
              )}

              {tenant.subscription_status === 'past_due' && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Há um problema com seu pagamento. Atualize o cartão para continuar usando todos os recursos.
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Você está usando o plano gratuito. Assine um plano para desbloquear mais recursos.
            </p>
          )}

          {tenant.stripe_customer_id && (
            <div className="mt-4">
              <BillingActions tenantId={tenant.id} hasSubscription={!!tenant.subscription_status} />
            </div>
          )}
        </div>

        {/* Plan comparison */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Todos os planos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PLAN_ORDER.map((key) => {
              const plan = PLANS[key]
              const isCurrent = tenant.plan === key
              const isRecommended = plan.recommended

              return (
                <div
                  key={key}
                  className={`relative rounded-xl border p-5 ${
                    isRecommended
                      ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-300'
                      : isCurrent
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {isRecommended && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-rose-500 px-3 py-0.5 text-xs font-semibold text-white">
                      Mais escolhido
                    </span>
                  )}
                  {plan.anchor && (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-gray-700 px-3 py-0.5 text-xs font-semibold text-white">
                      Premium
                    </span>
                  )}

                  <h3 className={`font-bold text-lg ${isCurrent && !isRecommended ? 'text-white' : 'text-gray-900'}`}>
                    {plan.displayName}
                  </h3>
                  <p className={`mt-1 text-sm ${isCurrent && !isRecommended ? 'text-gray-300' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${isCurrent && !isRecommended ? 'text-white' : 'text-gray-900'}`}>
                      R$ {(plan.priceCentsMonthly / 100).toFixed(0)}
                    </span>
                    <span className={`text-sm ${isCurrent && !isRecommended ? 'text-gray-400' : 'text-gray-400'}`}>/mês</span>
                  </div>

                  <ul className="mt-4 space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-start gap-2 text-sm ${isCurrent && !isRecommended ? 'text-gray-200' : 'text-gray-600'}`}>
                        <span className="mt-0.5 text-green-500 flex-shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <p className={`mt-4 text-center text-xs font-medium ${isRecommended ? 'text-rose-600' : 'text-gray-400'}`}>
                      Seu plano atual
                    </p>
                  ) : (
                    <BillingActions tenantId={tenant.id} targetPlanKey={key} hasSubscription={!!tenant.subscription_status} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
