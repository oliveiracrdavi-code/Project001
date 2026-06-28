'use client'

import { useState } from 'react'
import { PLAN_PRICE_IDS } from '@/lib/stripe/client'
import type { PlanKey } from '@/lib/plans/config'

export default function BillingActions({
  tenantId,
  hasSubscription,
  targetPlanKey,
}: {
  tenantId: string
  hasSubscription: boolean
  targetPlanKey?: PlanKey
}) {
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  async function startCheckout() {
    if (!targetPlanKey) return
    setLoading(true)
    const priceId = PLAN_PRICE_IDS[targetPlanKey]
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  // Manage existing subscription
  if (!targetPlanKey) {
    if (!hasSubscription) return null
    return (
      <button
        onClick={openPortal}
        disabled={loading}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? 'Abrindo portal…' : 'Gerenciar assinatura'}
      </button>
    )
  }

  // Upgrade / subscribe to target plan
  return (
    <button
      onClick={startCheckout}
      disabled={loading}
      className="mt-4 w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
    >
      {loading ? 'Redirecionando…' : hasSubscription ? 'Trocar plano' : 'Assinar'}
    </button>
  )
}
