import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Users, Scissors, UserCheck, Settings, CreditCard, LogOut } from 'lucide-react'

async function signOut() {
  'use server'
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1)
    .single()

  const nav = [
    { href: '/dashboard', label: 'Agenda', icon: Calendar },
    { href: '/dashboard/clients', label: 'Clientes', icon: Users },
    { href: '/dashboard/services', label: 'Serviços', icon: Scissors },
    { href: '/dashboard/professionals', label: 'Profissionais', icon: UserCheck },
    { href: '/dashboard/billing', label: 'Plano', icon: CreditCard },
    { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-4">
          <Calendar className="h-5 w-5 text-gray-900" />
          <div className="overflow-hidden">
            <p className="truncate text-sm font-semibold text-gray-900">Agenda Boa</p>
            {tenant && <p className="truncate text-xs text-gray-500">{tenant.name}</p>}
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-2">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {!tenant && (
          <div className="m-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Configure seu salão em{' '}
            <Link href="/onboarding" className="font-medium underline">
              onboarding
            </Link>
            .
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
