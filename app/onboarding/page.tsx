'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar } from 'lucide-react'
import { slugify } from '@/lib/utils'

export default function OnboardingPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    salonName: '',
    phone: '',
    address: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const baseSlug = slugify(form.salonName)
    const slug = `${baseSlug}-${Date.now().toString(36)}`

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: form.salonName,
        slug,
        phone: form.phone || null,
        address: form.address || null,
      })
      .select('id')
      .single()

    if (tenantError || !tenant) {
      setError(tenantError?.message ?? 'Erro ao criar salão.')
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase.from('tenant_members').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      role: 'owner',
    })

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Calendar className="h-8 w-8 text-gray-900" />
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Configure seu salão</h1>
          <p className="mt-1 text-sm text-gray-500">Quase pronto! Só precisamos de algumas informações.</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome do salão *</label>
              <input
                name="salonName"
                type="text"
                required
                value={form.salonName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="Studio Maria Silva"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Telefone do salão</label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Endereço</label>
              <input
                name="address"
                type="text"
                value={form.address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="Rua das Flores, 123 — São Paulo, SP"
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Criando salão…' : 'Criar meu salão'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
