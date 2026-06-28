'use client'

import { useState } from 'react'

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

interface HourRow {
  id: string
  tenant_id: string
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

interface BreakRow {
  id: string
  tenant_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface ClosureRow {
  id: string
  tenant_id: string
  date: string
  reason: string | null
}

interface Props {
  tenantId: string
  initialHours: HourRow[]
  initialBreaks: BreakRow[]
  initialClosures: ClosureRow[]
}

export default function BusinessHoursForm({ tenantId, initialHours, initialBreaks, initialClosures }: Props) {
  const [hours, setHours] = useState<HourRow[]>(
    Array.from({ length: 7 }, (_, i) => initialHours.find(h => h.day_of_week === i) ?? {
      id: '', tenant_id: tenantId, day_of_week: i, open_time: '09:00', close_time: '18:00', is_closed: i === 0,
    })
  )
  const [breaks, setBreaks] = useState<BreakRow[]>(initialBreaks)
  const [closures, setClosures] = useState<ClosureRow[]>(initialClosures)
  const [newClosure, setNewClosure] = useState({ date: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function updateHour(dayOfWeek: number, field: keyof HourRow, value: string | boolean) {
    setHours(prev => prev.map(h => h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h))
  }

  function addBreak(dayOfWeek: number) {
    setBreaks(prev => [...prev, { id: `new-${Date.now()}`, tenant_id: tenantId, day_of_week: dayOfWeek, start_time: '12:00', end_time: '13:00' }])
  }

  function updateBreak(id: string, field: keyof BreakRow, value: string) {
    setBreaks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  function removeBreak(id: string) {
    setBreaks(prev => prev.filter(b => b.id !== id))
  }

  function addClosure() {
    if (!newClosure.date) return
    setClosures(prev => [...prev, { id: `new-${Date.now()}`, tenant_id: tenantId, date: newClosure.date, reason: newClosure.reason || null }])
    setNewClosure({ date: '', reason: '' })
  }

  function removeClosure(id: string) {
    setClosures(prev => prev.filter(c => c.id !== id))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')

    const res = await fetch('/api/settings/business-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, hours, breaks, closures }),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao salvar.')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Business hours */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Dias e horários</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {hours.map((h) => {
            const dayBreaks = breaks.filter(b => b.day_of_week === h.day_of_week)
            return (
              <div key={h.day_of_week} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-24 text-sm font-medium text-gray-700">{DAY_NAMES[h.day_of_week]}</span>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={h.is_closed}
                      onChange={(e) => updateHour(h.day_of_week, 'is_closed', e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300"
                    />
                    Fechado
                  </label>
                  {!h.is_closed && (
                    <>
                      <input
                        type="time"
                        value={h.open_time}
                        onChange={(e) => updateHour(h.day_of_week, 'open_time', e.target.value)}
                        className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none"
                      />
                      <span className="text-gray-400 text-xs">–</span>
                      <input
                        type="time"
                        value={h.close_time}
                        onChange={(e) => updateHour(h.day_of_week, 'close_time', e.target.value)}
                        className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => addBreak(h.day_of_week)}
                        className="ml-auto text-xs text-gray-400 hover:text-gray-700"
                      >
                        + Intervalo
                      </button>
                    </>
                  )}
                </div>
                {dayBreaks.map((b) => (
                  <div key={b.id} className="mt-2 flex items-center gap-2 pl-28">
                    <span className="text-xs text-gray-400">Intervalo:</span>
                    <input
                      type="time"
                      value={b.start_time}
                      onChange={(e) => updateBreak(b.id, 'start_time', e.target.value)}
                      className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none"
                    />
                    <span className="text-gray-400 text-xs">–</span>
                    <input
                      type="time"
                      value={b.end_time}
                      onChange={(e) => updateBreak(b.id, 'end_time', e.target.value)}
                      className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none"
                    />
                    <button type="button" onClick={() => removeBreak(b.id)} className="text-xs text-red-400 hover:text-red-600">
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Closures */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Feriados e fechamentos</h2>
        </div>
        <div className="p-5 space-y-3">
          {closures.length === 0 && (
            <p className="text-sm text-gray-400">Nenhuma data de fechamento cadastrada.</p>
          )}
          {closures.map((c) => (
            <div key={c.id} className="flex items-center gap-3 text-sm">
              <span className="font-medium text-gray-900">{c.date}</span>
              <span className="text-gray-500">{c.reason ?? ''}</span>
              <button type="button" onClick={() => removeClosure(c.id)} className="ml-auto text-xs text-red-400 hover:text-red-600">
                Remover
              </button>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
              <input
                type="date"
                value={newClosure.date}
                onChange={(e) => setNewClosure(n => ({ ...n, date: e.target.value }))}
                className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Motivo (opcional)</label>
              <input
                type="text"
                value={newClosure.reason}
                onChange={(e) => setNewClosure(n => ({ ...n, reason: e.target.value }))}
                placeholder="Ex: Feriado"
                className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-gray-900 focus:outline-none w-40"
              />
            </div>
            <button
              type="button"
              onClick={addClosure}
              disabled={!newClosure.date}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar horários'}
        </button>
        {saved && <span className="text-sm text-green-600">Salvo!</span>}
      </div>
    </div>
  )
}
