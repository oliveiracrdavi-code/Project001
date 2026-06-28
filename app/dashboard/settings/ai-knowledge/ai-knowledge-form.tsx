'use client'

import { useState } from 'react'

interface Entry {
  id: string
  category: string
  key: string
  value: string
}

const CATEGORIES = ['geral', 'serviços', 'localização', 'pagamento', 'políticas', 'promoções']

export default function AIKnowledgeForm({
  tenantId,
  initialEntries,
}: {
  tenantId: string
  initialEntries: Entry[]
}) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function addEntry() {
    setEntries(prev => [...prev, { id: `new-${Date.now()}`, category: 'geral', key: '', value: '' }])
  }

  function update(id: string, field: keyof Entry, value: string) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  function remove(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function handleSave() {
    const invalid = entries.find(e => !e.key.trim() || !e.value.trim())
    if (invalid) {
      setError('Todos os campos precisam ser preenchidos.')
      return
    }

    setSaving(true)
    setSaved(false)
    setError('')

    const res = await fetch('/api/settings/ai-knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, entries }),
    })

    if (res.ok) {
      const { saved: savedEntries } = await res.json()
      setEntries(savedEntries)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao salvar.')
    }
    setSaving(false)
  }

  const grouped = CATEGORIES.reduce<Record<string, Entry[]>>((acc, cat) => {
    acc[cat] = entries.filter(e => e.category === cat)
    return acc
  }, {})
  const otherCategory = entries.filter(e => !CATEGORIES.includes(e.category))
  if (otherCategory.length > 0) grouped['outros'] = otherCategory

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Entradas</h2>
          <button
            type="button"
            onClick={addEntry}
            className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            + Adicionar
          </button>
        </div>

        {entries.length === 0 && (
          <div className="p-5 text-sm text-gray-400">
            Nenhuma informação cadastrada ainda. Adicione dados sobre o seu salão, serviços, localização e políticas.
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <div key={entry.id} className="grid grid-cols-[120px_1fr_1fr_auto] gap-2 px-4 py-2.5 items-start">
              <select
                value={entry.category}
                onChange={(e) => update(entry.id, 'category', e.target.value)}
                className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="text"
                value={entry.key}
                onChange={(e) => update(entry.id, 'key', e.target.value)}
                placeholder="Chave (ex: endereço)"
                className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none"
              />
              <input
                type="text"
                value={entry.value}
                onChange={(e) => update(entry.id, 'value', e.target.value)}
                placeholder="Valor"
                className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => remove(entry.id)}
                className="text-xs text-red-400 hover:text-red-600 pt-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar base de conhecimento'}
        </button>
        {saved && <span className="text-sm text-green-600">Salvo!</span>}
      </div>
    </div>
  )
}
