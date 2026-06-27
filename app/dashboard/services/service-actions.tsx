'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ServiceActions({ serviceId, active }: { serviceId: string; active: boolean }) {
  const router = useRouter()

  async function toggleActive() {
    const supabase = createClient()
    await supabase.from('services').update({ active: !active }).eq('id', serviceId)
    router.refresh()
  }

  return (
    <button
      onClick={toggleActive}
      className="text-xs text-gray-500 hover:text-gray-900 underline"
    >
      {active ? 'Desativar' : 'Ativar'}
    </button>
  )
}
