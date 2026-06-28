'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price_cents: number
}

interface Professional {
  id: string
  name: string
  specialties: string[]
}

interface Props {
  tenantId: string
  services: Service[]
  professionals: Professional[]
  requireCpf: boolean
}

type Step = 'service' | 'professional' | 'date' | 'time' | 'confirm' | 'done'

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function getNext30Days(): Date[] {
  const days: Date[] = []
  const today = new Date()
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }
  return days
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function BookingWizard({ tenantId, services, professionals, requireCpf }: Props) {
  const [step, setStep] = useState<Step>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const [form, setForm] = useState({
    name: '', phone: '', email: '', cpf: '', lgpdConsent: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function loadSlots(professionalId: string, date: string, serviceId: string) {
    setLoadingSlots(true)
    setSlots([])
    const res = await fetch(
      `/api/booking/slots?tenantId=${tenantId}&professionalId=${professionalId}&serviceId=${serviceId}&date=${date}`
    )
    const data = await res.json()
    setSlots(data.slots ?? [])
    setLoadingSlots(false)
  }

  function selectService(service: Service) {
    setSelectedService(service)
    if (professionals.length === 1) {
      setSelectedProfessional(professionals[0])
      setStep('date')
    } else {
      setStep('professional')
    }
  }

  function selectProfessional(pro: Professional) {
    setSelectedProfessional(pro)
    setStep('date')
  }

  function selectDate(date: string) {
    setSelectedDate(date)
    setStep('time')
    if (selectedProfessional && selectedService) {
      loadSlots(selectedProfessional.id, date, selectedService.id)
    }
  }

  function selectTime(time: string) {
    setSelectedTime(time)
    setStep('confirm')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.lgpdConsent) {
      setError('Você precisa aceitar os termos para agendar.')
      return
    }
    if (requireCpf && !form.cpf) {
      setError('CPF é obrigatório.')
      return
    }

    setSubmitting(true)
    setError('')

    const [datePart] = selectedDate.split('T')
    const startIso = `${datePart}T${selectedTime}:00`
    const durationMs = (selectedService?.duration_minutes ?? 60) * 60 * 1000
    const endIso = new Date(new Date(startIso).getTime() + durationMs).toISOString()

    const res = await fetch('/api/booking/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        serviceId: selectedService?.id,
        professionalId: selectedProfessional?.id,
        startTime: startIso,
        endTime: endIso,
        clientName: form.name,
        clientPhone: form.phone,
        clientEmail: form.email || undefined,
        clientCpf: form.cpf || undefined,
        lgpdConsent: form.lgpdConsent,
      }),
    })

    if (res.ok) {
      setStep('done')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao confirmar agendamento.')
    }
    setSubmitting(false)
  }

  if (step === 'done') {
    const [datePart] = selectedDate.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <div className="text-4xl mb-3">✓</div>
        <h2 className="text-xl font-bold text-gray-900">Agendamento confirmado!</h2>
        <p className="mt-2 text-sm text-gray-600">
          {selectedService?.name} com {selectedProfessional?.name}
        </p>
        <p className="mt-1 text-sm font-medium text-gray-900">
          {DAYS_PT[new Date(year, month - 1, day).getDay()]}, {day} de {MONTHS_PT[month - 1]} às {selectedTime}
        </p>
        <button
          onClick={() => {
            setStep('service')
            setSelectedService(null)
            setSelectedProfessional(null)
            setSelectedDate('')
            setSelectedTime('')
            setForm({ name: '', phone: '', email: '', cpf: '', lgpdConsent: false })
          }}
          className="mt-6 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Fazer novo agendamento
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Step: Service */}
      {step === 'service' && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Escolha o serviço</h2>
          {services.length === 0 && (
            <p className="text-sm text-gray-500">Nenhum serviço disponível no momento.</p>
          )}
          <div className="space-y-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => selectService(s)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{s.name}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(s.price_cents)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-3">
                  <span className="text-xs text-gray-500">{s.duration_minutes} min</span>
                  {s.description && <span className="text-xs text-gray-400">{s.description}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Professional */}
      {step === 'professional' && (
        <div>
          <button onClick={() => setStep('service')} className="mb-3 text-sm text-gray-500 hover:text-gray-700">
            ← Voltar
          </button>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Escolha o profissional</h2>
          <div className="space-y-2">
            {professionals.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProfessional(p)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-gray-400 transition-colors"
              >
                <span className="font-medium text-gray-900">{p.name}</span>
                {p.specialties.length > 0 && (
                  <p className="mt-0.5 text-xs text-gray-500">{p.specialties.join(' · ')}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Date */}
      {step === 'date' && (
        <div>
          <button onClick={() => setStep(professionals.length === 1 ? 'service' : 'professional')} className="mb-3 text-sm text-gray-500 hover:text-gray-700">
            ← Voltar
          </button>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Escolha a data</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {getNext30Days().map((d) => {
              const str = toLocalDateStr(d)
              return (
                <button
                  key={str}
                  onClick={() => selectDate(str)}
                  className="rounded-lg border border-gray-200 bg-white p-2 text-center hover:border-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-xs text-gray-500">{DAYS_PT[d.getDay()]}</div>
                  <div className="text-sm font-semibold text-gray-900">{d.getDate()}</div>
                  <div className="text-xs text-gray-400">{MONTHS_PT[d.getMonth()]}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step: Time */}
      {step === 'time' && (
        <div>
          <button onClick={() => setStep('date')} className="mb-3 text-sm text-gray-500 hover:text-gray-700">
            ← Voltar
          </button>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Escolha o horário</h2>
          {loadingSlots && <p className="text-sm text-gray-500">Carregando horários…</p>}
          {!loadingSlots && slots.length === 0 && (
            <p className="text-sm text-gray-500">Nenhum horário disponível nesta data.</p>
          )}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((t) => (
              <button
                key={t}
                onClick={() => selectTime(t)}
                className="rounded-lg border border-gray-200 bg-white py-3 text-sm font-medium text-gray-900 hover:border-gray-900 hover:bg-gray-50 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm space-y-4">
          <button type="button" onClick={() => setStep('time')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Voltar
          </button>
          <h2 className="text-base font-semibold text-gray-900">Seus dados</h2>

          <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
            <p><span className="text-gray-500">Serviço:</span> <span className="font-medium">{selectedService?.name}</span></p>
            <p><span className="text-gray-500">Profissional:</span> <span className="font-medium">{selectedProfessional?.name}</span></p>
            <p>
              <span className="text-gray-500">Data:</span>{' '}
              <span className="font-medium">
                {(() => {
                  const [y, m, d] = selectedDate.split('-').map(Number)
                  return `${DAYS_PT[new Date(y, m - 1, d).getDay()]}, ${d} de ${MONTHS_PT[m - 1]}`
                })()} às {selectedTime}
              </span>
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Telefone / WhatsApp *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">E-mail (opcional)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="seu@email.com"
              />
            </div>
            {requireCpf && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">CPF *</label>
                <input
                  type="text"
                  required={requireCpf}
                  value={form.cpf}
                  onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
            )}
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.lgpdConsent}
              onChange={(e) => setForm((f) => ({ ...f, lgpdConsent: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-gray-300"
            />
            <span className="text-xs text-gray-600">
              Concordo com o tratamento dos meus dados para agendamento, conforme a{' '}
              <a href="/privacidade" target="_blank" className="underline">Política de Privacidade</a>.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !form.lgpdConsent}
            className="w-full rounded-md bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? 'Confirmando…' : 'Confirmar agendamento'}
          </button>
        </form>
      )}
    </div>
  )
}
