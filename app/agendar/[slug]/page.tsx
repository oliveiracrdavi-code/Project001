import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import BookingWizard from './booking-wizard'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function AgendarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = getServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, logo_url')
    .eq('slug', slug)
    .single()

  if (!tenant) notFound()

  const { data: bookingPage } = await supabase
    .from('booking_pages')
    .select('is_active, custom_message, require_cpf')
    .eq('tenant_id', tenant.id)
    .single()

  if (!bookingPage?.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
          <p className="mt-2 text-sm text-gray-500">
            Agendamento online não disponível no momento.
          </p>
        </div>
      </div>
    )
  }

  const [{ data: services }, { data: professionals }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, description, duration_minutes, price_cents')
      .eq('tenant_id', tenant.id)
      .eq('active', true)
      .order('name'),
    supabase
      .from('professionals')
      .select('id, name, specialties')
      .eq('tenant_id', tenant.id)
      .eq('active', true)
      .order('name'),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="mx-auto max-w-lg">
          {tenant.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt={tenant.name} className="h-10 object-contain" />
          )}
          <h1 className="text-lg font-bold text-gray-900">{tenant.name}</h1>
          {bookingPage.custom_message && (
            <p className="mt-1 text-sm text-gray-500">{bookingPage.custom_message}</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        <BookingWizard
          tenantId={tenant.id}
          services={services ?? []}
          professionals={professionals ?? []}
          requireCpf={bookingPage.require_cpf}
        />
      </main>
    </div>
  )
}
