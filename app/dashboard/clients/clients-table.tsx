'use client'

import { useState } from 'react'
import { MessageCircle, CheckCircle2, XCircle } from 'lucide-react'

interface Client {
  id: string
  name: string
  phone: string
  email: string | null
  whatsapp_consent: boolean
  lgpd_consent: boolean
  created_at: string
}

export default function ClientsTable({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState('')

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  return (
    <div className="mt-6">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nome ou telefone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Telefone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Email</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">WhatsApp</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">LGPD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {c.whatsapp_consent ? (
                      <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="mx-auto h-4 w-4 text-gray-300" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.lgpd_consent ? (
                      <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="mx-auto h-4 w-4 text-gray-300" />
                    )}
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
