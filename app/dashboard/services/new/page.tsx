'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewServicePage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', description: '', duration_minutes: '60', price_cents: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()
    if (!tenant) { setError('Salão não configurado.'); setLoading(false); return }

    // Convert BRL string "R$ 50,00" or "50" to cents
    const priceRaw = form.price_cents.replace(/[^\d,]/g, '').replace(',', '.')
    const priceCents = Math.round(parseFloat(priceRaw) * 100)

    const { error: insertError } = await supabase.from('services').insert({
      tenant_id: tenant.id,
      name: form.name,
      description: form.description || null,
      duration_minutes: parseInt(form.duration_minutes),
      price_cents: priceCents,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }

    router.push('/dashboard/services')
    router.refresh()
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/services" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo serviço</h1>
      </div>

      <div className="mt-6 max-w-lg">
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome *</label>
            <input name="name" type="text" required value={form.name} onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              placeholder="Corte feminino" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              placeholder="Opcional" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Duração (minutos) *</label>
              <input name="duration_minutes" type="number" required min="5" step="5" value={form.duration_minutes} onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor (R$) *</label>
              <input name="price_cents" type="text" required value={form.price_cents} onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="50,00" />
            </div>
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">
              {loading ? 'Salvando…' : 'Salvar serviço'}
            </button>
            <Link href="/dashboard/services"
              className="flex-1 rounded-md border border-gray-300 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
