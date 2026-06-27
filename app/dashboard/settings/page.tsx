import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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
      <div className="mt-6 max-w-lg">
        <SettingsForm tenant={tenant} />
      </div>
    </div>
  )
}
