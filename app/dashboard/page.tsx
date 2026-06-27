import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Plus } from 'lucide-react'
import type { AppointmentStatus } from '@/lib/supabase/types'

interface AppointmentRow {
  id: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  clients: { name: string; phone: string } | null
  services: { name: string; duration_minutes: number; price_cents: number } | null
  professionals: { name: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenantRaw } = await supabase
    .from('tenants')
    .select('id, name, subscription_status')
    .limit(1)
    .single()

  const tenant = tenantRaw as { id: string; name: string; subscription_status: string | null } | null

  if (!tenant) redirect('/onboarding')

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const { data: appointmentsRaw } = await supabase
    .from('appointments')
    .select(`
      id, start_time, end_time, status,
      clients(name, phone),
      services(name, duration_minutes, price_cents),
      professionals(name)
    `)
    .gte('start_time', todayStart.toISOString())
    .lte('start_time', todayEnd.toISOString())
    .neq('status', 'cancelled')
    .order('start_time')

  const appointments = (appointmentsRaw ?? []) as unknown as AppointmentRow[]

  const { count: totalClients } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)

  const { count: monthAppointments } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .gte('start_time', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
    .neq('status', 'cancelled')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="mt-1 text-sm text-gray-500">
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          Novo agendamento
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Hoje', value: appointments.length, suffix: 'agendamentos' },
          { label: 'Este mês', value: monthAppointments ?? 0, suffix: 'agendamentos' },
          { label: 'Clientes', value: totalClients ?? 0, suffix: 'cadastrados' },
        ].map(({ label, value, suffix }) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-400">{suffix}</p>
          </div>
        ))}
      </div>

      {/* Today's appointments */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Agendamentos de hoje</h2>

        {appointments.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-lg border border-dashed border-gray-200 bg-white py-12">
            <Calendar className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">Nenhum agendamento hoje</p>
            <Link
              href="/dashboard/appointments/new"
              className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Adicionar agendamento
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {appointments.map((apt) => {
              const start = new Date(apt.start_time)
              const end = new Date(apt.end_time)
              const timeStr = `${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

              const statusColors: Record<AppointmentStatus, string> = {
                scheduled: 'bg-blue-100 text-blue-700',
                confirmed: 'bg-green-100 text-green-700',
                completed: 'bg-gray-100 text-gray-700',
                cancelled: 'bg-gray-100 text-gray-400',
                no_show: 'bg-red-100 text-red-700',
              }

              const statusLabels: Record<AppointmentStatus, string> = {
                scheduled: 'Agendado',
                confirmed: 'Confirmado',
                completed: 'Concluído',
                cancelled: 'Cancelado',
                no_show: 'Faltou',
              }

              return (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{timeStr}</p>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{apt.clients?.name}</p>
                      <p className="text-xs text-gray-500">
                        {apt.services?.name} · {apt.professionals?.name}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[apt.status]}`}>
                    {statusLabels[apt.status]}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
