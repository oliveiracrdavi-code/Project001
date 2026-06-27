import Link from 'next/link'
import { Calendar, MessageCircle, Users, BarChart3, Shield, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-gray-900" />
            <span className="text-xl font-semibold text-gray-900">Agenda Boa</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Começar grátis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Agendamento que faz o cliente voltar
          </h1>
          <p className="mt-6 text-xl text-gray-500">
            Gerencie agendamentos, envie lembretes automáticos no WhatsApp e mantenha seu salão sempre cheio.
            Simples, rápido e feito para o Brasil.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-md bg-gray-900 px-8 py-3 text-base font-medium text-white hover:bg-gray-700"
            >
              Começar grátis — 14 dias
            </Link>
            <Link
              href="#como-funciona"
              className="rounded-md border border-gray-300 px-8 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Como funciona
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">Tudo que seu salão precisa</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Calendar,
                title: 'Agendamento online',
                desc: 'Calendário visual por profissional. Sem conflitos — verificação em tempo real.',
              },
              {
                icon: MessageCircle,
                title: 'Lembretes no WhatsApp',
                desc: 'Confirmações e lembretes automáticos. Reduza faltas e no-shows.',
              },
              {
                icon: Users,
                title: 'Gestão de clientes',
                desc: 'Histórico completo, notas e preferências de cada cliente.',
              },
              {
                icon: Zap,
                title: 'Lembretes de retorno',
                desc: 'Avise automaticamente quando o cliente deve voltar para manutenção.',
              },
              {
                icon: BarChart3,
                title: 'Visão do negócio',
                desc: 'Taxa de ocupação, serviços mais vendidos e receita por período.',
              },
              {
                icon: Shield,
                title: 'LGPD incluída',
                desc: 'Consentimentos registrados, dados protegidos e exclusão facilitada.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-gray-200 bg-white p-6">
                <Icon className="h-8 w-8 text-gray-900" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">Planos simples, sem surpresa</h2>
          <p className="mt-3 text-center text-gray-500">Cobrado em BRL. Cancele quando quiser.</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {[
              {
                name: 'Starter',
                price: 'R$ 89',
                per: '/mês',
                desc: 'Para salões pequenos',
                features: ['1 profissional', 'Até 100 agendamentos/mês', 'Lembretes WhatsApp', 'Suporte por email'],
              },
              {
                name: 'Profissional',
                price: 'R$ 179',
                per: '/mês',
                desc: 'Para salões em crescimento',
                features: ['Até 5 profissionais', 'Agendamentos ilimitados', 'Lembretes WhatsApp', 'Relatórios avançados', 'Suporte prioritário'],
                highlight: true,
              },
            ].map(({ name, price, per, desc, features, highlight }) => (
              <div
                key={name}
                className={`rounded-lg border p-8 ${
                  highlight
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <h3 className={`text-xl font-semibold ${highlight ? 'text-white' : 'text-gray-900'}`}>
                  {name}
                </h3>
                <p className={`mt-1 text-sm ${highlight ? 'text-gray-300' : 'text-gray-500'}`}>{desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>
                    {price}
                  </span>
                  <span className={`text-sm ${highlight ? 'text-gray-300' : 'text-gray-500'}`}>{per}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${highlight ? 'text-gray-200' : 'text-gray-600'}`}>
                      <span className="text-green-400">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block rounded-md px-6 py-3 text-center text-sm font-medium ${
                    highlight
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-700'
                  }`}
                >
                  Começar grátis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm text-gray-500">
          <span>© 2026 Agenda Boa</span>
          <div className="flex gap-6">
            <Link href="/privacidade" className="hover:text-gray-900">Política de privacidade</Link>
            <Link href="/termos" className="hover:text-gray-900">Termos de uso</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
