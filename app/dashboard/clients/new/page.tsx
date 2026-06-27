'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const POLICY_VERSION = '1.0'

export default function NewClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const [lgpdConsent, setLgpdConsent] = useState(false)
  const [whatsappConsent, setWhatsappConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lgpdConsent) {
      setError('O consentimento LGPD é obrigatório para cadastrar um cliente.')
      return
    }
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { data: tenantRaw } = await supabase.from('tenants').select('id').limit(1).single()
    const tenant = tenantRaw as { id: string } | null

    if (!tenant) {
      setError('Salão não configurado.')
      setLoading(false)
      return
    }

    const now = new Date().toISOString()

    const { data: clientRaw, error: clientError } = await supabase
      .from('clients')
      .insert({
        tenant_id: tenant.id,
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        notes: form.notes || null,
        lgpd_consent: true,
        lgpd_consent_date: now,
        whatsapp_consent: whatsappConsent,
        whatsapp_consent_date: whatsappConsent ? now : null,
      })
      .select('id')
      .single()

    const clientData = clientRaw as { id: string } | null

    if (clientError || !clientData) {
      setError(clientError?.message ?? 'Erro ao cadastrar cliente.')
      setLoading(false)
      return
    }

    const consentsToInsert = [
      {
        client_id: clientData.id,
        tenant_id: tenant.id,
        consent_type: 'data_processing',
        granted: true,
        policy_version: POLICY_VERSION,
      },
    ]

    if (whatsappConsent) {
      consentsToInsert.push({
        client_id: clientData.id,
        tenant_id: tenant.id,
        consent_type: 'whatsapp_marketing',
        granted: true,
        policy_version: POLICY_VERSION,
      })
    }

    await supabase.from('lgpd_consents').insert(consentsToInsert)

    router.push('/dashboard/clients')
    router.refresh()
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/clients" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo cliente</h1>
      </div>

      <div className="mt-6 max-w-lg">
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome completo *</label>
            <input name="name" type="text" required value={form.name} onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              placeholder="Maria da Silva" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">WhatsApp / Telefone *</label>
            <input name="phone" type="tel" required value={form.phone} onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              placeholder="(11) 99999-9999" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              placeholder="cliente@email.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              placeholder="Preferências, alergias, observações…" />
          </div>

          <div className="rounded-md border border-blue-100 bg-blue-50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Consentimentos (LGPD)</p>

            <div className="flex items-start gap-3">
              <input id="lgpd" type="checkbox" checked={lgpdConsent} onChange={(e) => setLgpdConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900" />
              <label htmlFor="lgpd" className="text-sm text-gray-700">
                * Cliente autoriza o tratamento dos seus dados pessoais para fins de agendamento, conforme a{' '}
                <Link href="/privacidade" className="font-medium underline" target="_blank">Política de Privacidade</Link>.
                (Obrigatório)
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input id="whatsapp" type="checkbox" checked={whatsappConsent} onChange={(e) => setWhatsappConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900" />
              <label htmlFor="whatsapp" className="text-sm text-gray-700">
                Cliente autoriza receber lembretes via WhatsApp. (Opcional — pode ser revogado a qualquer momento)
              </label>
            </div>
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">
              {loading ? 'Cadastrando…' : 'Cadastrar cliente'}
            </button>
            <Link href="/dashboard/clients"
              className="flex-1 rounded-md border border-gray-300 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
