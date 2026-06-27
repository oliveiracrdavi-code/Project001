import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import ServiceActions from './service-actions'

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, duration_minutes, price_cents, active')
    .order('name')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <Link
          href="/dashboard/services/new"
          className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          Novo serviço
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Duração</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Valor</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!services || services.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  Nenhum serviço cadastrado.
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    {s.description && <p className="text-xs text-gray-400">{s.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{s.duration_minutes} min</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(s.price_cents)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ServiceActions serviceId={s.id} active={s.active} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
