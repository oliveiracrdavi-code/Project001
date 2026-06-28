import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BusinessHoursForm from './business-hours-form'

const DEFAULT_HOURS = [
  { day_of_week: 0, open_time: '09:00', close_time: '18:00', is_closed: true },  // Dom
  { day_of_week: 1, open_time: '09:00', close_time: '18:00', is_closed: false }, // Seg
  { day_of_week: 2, open_time: '09:00', close_time: '18:00', is_closed: false }, // Ter
  { day_of_week: 3, open_time: '09:00', close_time: '18:00', is_closed: false }, // Qua
  { day_of_week: 4, open_time: '09:00', close_time: '18:00', is_closed: false }, // Qui
  { day_of_week: 5, open_time: '09:00', close_time: '18:00', is_closed: false }, // Sex
  { day_of_week: 6, open_time: '09:00', close_time: '13:00', is_closed: false }, // Sáb
]

export default async function BusinessHoursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenantRaw } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single()

  const tenant = tenantRaw as { id: string } | null
  if (!tenant) redirect('/onboarding')

  const [{ data: hours }, { data: breaks }, { data: closures }] = await Promise.all([
    supabase.from('business_hours').select('*').eq('tenant_id', tenant.id).order('day_of_week'),
    supabase.from('business_breaks').select('*').eq('tenant_id', tenant.id).order('day_of_week'),
    supabase.from('business_closures').select('*').eq('tenant_id', tenant.id).order('date'),
  ])

  const hoursData = hours && hours.length > 0 ? hours : DEFAULT_HOURS.map(d => ({ ...d, id: '', tenant_id: tenant.id }))

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Horários de funcionamento</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure os horários de atendimento e feriados do seu estabelecimento.
        </p>
      </div>

      <BusinessHoursForm
        tenantId={tenant.id}
        initialHours={hoursData as Parameters<typeof BusinessHoursForm>[0]['initialHours']}
        initialBreaks={(breaks ?? []) as Parameters<typeof BusinessHoursForm>[0]['initialBreaks']}
        initialClosures={(closures ?? []) as Parameters<typeof BusinessHoursForm>[0]['initialClosures']}
      />
    </div>
  )
}
