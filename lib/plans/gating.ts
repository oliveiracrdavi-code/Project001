import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanKey, type PlanFeatureFlags, type PlanConfig } from './config'
import { NextResponse } from 'next/server'

export async function getTenantPlan(tenantId: string): Promise<PlanKey> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', tenantId)
    .single()
  return (data?.plan as PlanKey | undefined) ?? 'comecar'
}

export async function checkFeature(
  tenantId: string,
  feature: keyof PlanFeatureFlags
): Promise<{ allowed: boolean; plan: PlanKey }> {
  const plan = await getTenantPlan(tenantId)
  return { allowed: PLANS[plan].flags[feature], plan }
}

export async function requireFeatureOrFail(
  tenantId: string,
  feature: keyof PlanFeatureFlags
): Promise<NextResponse | null> {
  const { allowed, plan } = await checkFeature(tenantId, feature)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Recurso não disponível no plano atual', plan },
      { status: 403 }
    )
  }
  return null
}

export function planWithinLimit(
  plan: PlanKey,
  limitKey: keyof PlanConfig['limits'],
  currentValue: number
): boolean {
  const limit = PLANS[plan].limits[limitKey]
  return limit === -1 || currentValue < limit
}
