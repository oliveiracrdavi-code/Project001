'use client'

import { useState } from 'react'

export default function BillingActions({
  tenantId,
  hasSubscription,
}: {
  tenantId: string
  hasSubscription: boolean
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
