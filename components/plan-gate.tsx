import Link from 'next/link'
import type { PlanFeatureFlags } from '@/lib/plans/config'
import { planHasFeature, getPlanConfig } from '@/lib/plans/config'
import type { PlanKey } from '@/lib/plans/config'

interface PlanGateProps {
  currentPlan: PlanKey | null
  feature: keyof PlanFeatureFlags
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function PlanGate({
  currentPlan,
  feature,
  children,
  fallback,
}: PlanGateProps) {
  if (planHasFeature(currentPlan, feature)) {
    return <>{children}</>
  }

  if (fallback) return <>{fallback}</>

  const planConfig = getPlanConfig(currentPlan)

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
      <p className="text-sm font-medium text-gray-700">
        Recurso não disponível no plano {planConfig.displayName}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Faça upgrade para desbloquear este recurso.
      </p>
      <Link
        href="/dashboard/billing"
        className="mt-3 inline-block rounded-md bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
      >
        Ver planos
      </Link>
    </div>
  )
}
