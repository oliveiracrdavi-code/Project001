import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import ClientsTable from './clients-table'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, phone, email, whatsapp_consent, lgpd_consent, created_at')
    .is('deleted_at', null)
    .order('name')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-1 text-sm text-gray-500">{clients?.length ?? 0} clientes cadastrados</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </Link>
      </div>

      <ClientsTable clients={clients ?? []} />
    </div>
  )
}
