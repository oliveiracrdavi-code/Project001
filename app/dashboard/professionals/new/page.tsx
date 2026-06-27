'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'

export default function NewProfessionalPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '' })
  const [specialties, setSpecialties] = useState<string[]>([])
  const [specialtyInput, setSpecialtyInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function addSpecialty() {
    const s = specialtyInput.trim()
    if (s && !specialties.includes(s)) {
      setSpecialties((prev) => [...prev, s])
    }
    setSpecialtyInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()
    if (!tenant) { setError('Salão não configurado.'); setLoading(false); return }

    const { error: insertError } = await supabase.from('professionals').insert({
      tenant_id: tenant.id,
      name: form.name,
      phone: form.phone || null,
      specialties,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }

    router.push('/dashboard/professionals')
    router.refresh()
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/professionals" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo profissional</h1>
      </div>

      <div className="mt-6 max-w-lg">
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome *</label>
            <input name="name" type="text" required value={form.name} onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              placeholder="Ana Paula" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              placeholder="(11) 99999-9999" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Especialidades</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSpecialty() } }}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="Coloração, corte, manicure…"
              />
              <button type="button" onClick={addSpecialty}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                +
              </button>
            </div>
            {specialties.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {specialties.map((s) => (
                  <span key={s} className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    {s}
                    <button type="button" onClick={() => setSpecialties((prev) => prev.filter((x) => x !== s))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">
              {loading ? 'Salvando…' : 'Salvar profissional'}
            </button>
            <Link href="/dashboard/professionals"
              className="flex-1 rounded-md border border-gray-300 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
