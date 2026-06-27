import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import ProfessionalActions from './professional-actions'

export default async function ProfessionalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, name, phone, specialties, active')
    .order('name')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
        <Link
          href="/dashboard/professionals/new"
          className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          Novo profissional
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!professionals || professionals.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-gray-200 bg-white p-12 text-center">
            <p className="text-sm text-gray-400">Nenhum profissional cadastrado.</p>
          </div>
        ) : (
          professionals.map((p) => (
            <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  {p.phone && <p className="mt-0.5 text-sm text-gray-500">{p.phone}</p>}
                  {p.specialties.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.specialties.map((spec: string) => (
                        <span key={spec} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3">
                <ProfessionalActions professionalId={p.id} active={p.active} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
