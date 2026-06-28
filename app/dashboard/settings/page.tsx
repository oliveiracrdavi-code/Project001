import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SettingsForm from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, phone, address, timezone, whatsapp_consent_enabled')
    .limit(1)
    .single()

  if (!tenant) redirect('/onboarding')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      <div className="mt-6 max-w-lg space-y-8">
        <SettingsForm tenant={tenant} />

        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Configurações avançadas</h2>
          <Link
            href="/dashboard/settings/business-hours"
            className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3 hover:bg-gray-50"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">Horários de funcionamento</p>
              <p className="text-xs text-gray-500">Dias, horários, intervalos e feriados</p>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link
            href="/dashboard/settings/ai-knowledge"
            className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3 hover:bg-gray-50"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">Base de conhecimento (IA)</p>
              <p className="text-xs text-gray-500">Informações para o agente de WhatsApp</p>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
