'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Tenant {
  id: string
  name: string
  phone: string | null
  address: string | null
  timezone: string
  whatsapp_consent_enabled: boolean
}

export default function SettingsForm({ tenant }: { tenant: Tenant }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: tenant.name,
    phone: tenant.phone ?? '',
    address: tenant.address ?? '',
    timezone: tenant.timezone,
    whatsapp_consent_enabled: tenant.whatsapp_consent_enabled,
  })
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        name: form.name,
        phone: form.phone || null,
        address: form.address || null,
        timezone: form.timezone,
        whatsapp_consent_enabled: form.whatsapp_consent_enabled,
      })
      .eq('id', tenant.id)

    setLoading(false)
    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Dados do salão</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">Nome do salão *</label>
        <input name="name" type="text" required value={form.name} onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Telefone</label>
        <input name="phone" type="tel" value={form.phone} onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          placeholder="(11) 99999-9999" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Endereço</label>
        <input name="address" type="text" value={form.address} onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          placeholder="Rua das Flores, 123 — São Paulo, SP" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Fuso horário</label>
        <select name="timezone" value={form.timezone} onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none">
          <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
          <option value="America/Manaus">Manaus (GMT-4)</option>
          <option value="America/Belem">Belém (GMT-3)</option>
          <option value="America/Fortaleza">Fortaleza (GMT-3)</option>
          <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
        </select>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h2 className="text-base font-semibold text-gray-900">WhatsApp</h2>
        <div className="mt-3 flex items-start gap-3">
          <input
            id="whatsapp_consent_enabled"
            name="whatsapp_consent_enabled"
            type="checkbox"
            checked={form.whatsapp_consent_enabled}
            onChange={handleChange}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900"
          />
          <label htmlFor="whatsapp_consent_enabled" className="text-sm text-gray-600">
            Habilitar envio de lembretes automáticos via WhatsApp. Só serão enviados para clientes com consentimento ativo.
          </label>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {success && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Configurações salvas!</p>}

      <button type="submit" disabled={loading}
        className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">
        {loading ? 'Salvando…' : 'Salvar configurações'}
      </button>
    </form>
  )
}
