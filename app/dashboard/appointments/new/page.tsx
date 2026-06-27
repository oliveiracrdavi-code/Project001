'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Client { id: string; name: string; phone: string }
interface Service { id: string; name: string; duration_minutes: number; price_cents: number }
interface Professional { id: string; name: string }

export default function NewAppointmentPage() {
  const router = useRouter()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])

  const [form, setForm] = useState({
    client_id: '',
    service_id: '',
    professional_id: '',
    date: '',
    time: '',
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('tenants').select('id').limit(1).single(),
      supabase.from('clients').select('id, name, phone').is('deleted_at', null).order('name'),
      supabase.from('services').select('id, name, duration_minutes, price_cents').eq('active', true).order('name'),
      supabase.from('professionals').select('id, name').eq('active', true).order('name'),
    ]).then(([t, c, s, p]) => {
      if (t.data) setTenantId((t.data as { id: string }).id)
      setClients((c.data ?? []) as Client[])
      setServices((s.data ?? []) as Service[])
      setProfessionals((p.data ?? []) as Professional[])
    })
  }, [])

  const selectedService = services.find((s) => s.id === form.service_id)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantId) { setError('Salão não carregado.'); return }
    if (!form.client_id || !form.service_id || !form.professional_id || !form.date || !form.time) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    setError(null)
    setLoading(true)

    const startTime = new Date(`${form.date}T${form.time}:00-03:00`).toISOString()
    const duration = selectedService?.duration_minutes ?? 60
    const endTime = new Date(new Date(startTime).getTime() + duration * 60000).toISOString()

    const supabase = createClient()

    const { error: insertError } = await supabase.from('appointments').insert({
      tenant_id: tenantId,
      client_id: form.client_id,
      service_id: form.service_id,
      professional_id: form.professional_id,
      start_time: startTime,
      end_time: endTime,
      notes: form.notes || null,
      status: 'scheduled',
    })

    if (insertError) {
      if (insertError.code === '23P01') {
        setError('Este profissional já tem um agendamento nesse horário. Escolha outro horário.')
      } else {
        setError(insertError.message)
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo agendamento</h1>
      </div>

      <div className="mt-6 max-w-lg">
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cliente *</label>
            <select name="client_id" value={form.client_id} onChange={handleChange} required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none">
              <option value="">Selecione um cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Serviço *</label>
            <select name="service_id" value={form.service_id} onChange={handleChange} required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none">
              <option value="">Selecione um serviço</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.duration_minutes}min — {formatCurrency(s.price_cents)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Profissional *</label>
            <select name="professional_id" value={form.professional_id} onChange={handleChange} required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none">
              <option value="">Selecione um profissional</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Data *</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} required
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Horário *</label>
              <input name="time" type="time" value={form.time} onChange={handleChange} required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" />
            </div>
          </div>

          {selectedService && form.time && form.date && (
            <p className="text-xs text-gray-500">
              Término previsto:{' '}
              {new Date(new Date(`${form.date}T${form.time}:00-03:00`).getTime() + selectedService.duration_minutes * 60000)
                .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              placeholder="Observações opcionais..." />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">
              {loading ? 'Salvando…' : 'Confirmar agendamento'}
            </button>
            <Link href="/dashboard"
              className="flex-1 rounded-md border border-gray-300 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
