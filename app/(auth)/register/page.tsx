'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', salonName: '', email: '', password: '' })
  const [lgpdConsent, setLgpdConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lgpdConsent) {
      setError('Você precisa aceitar a política de privacidade para continuar.')
      return
    }
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          salon_name: form.salonName,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Calendar className="h-8 w-8 text-gray-900" />
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Agenda Boa</h1>
          <p className="mt-1 text-sm text-gray-500">Crie sua conta — 14 dias grátis</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="name">
                Seu nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Maria Silva"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="salonName">
                Nome do salão
              </label>
              <input
                id="salonName"
                name="salonName"
                type="text"
                required
                value={form.salonName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Studio Maria Silva"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                id="lgpd"
                type="checkbox"
                checked={lgpdConsent}
                onChange={(e) => setLgpdConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <label htmlFor="lgpd" className="text-sm text-gray-600">
                Li e aceito a{' '}
                <Link href="/privacidade" className="font-medium text-gray-900 hover:underline" target="_blank">
                  Política de Privacidade
                </Link>
                . Consinto com o tratamento dos meus dados para prestação do serviço de agendamento.
              </label>
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Criando conta…' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Já tem conta?{' '}
            <Link href="/login" className="font-medium text-gray-900 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
