import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AIKnowledgeForm from './ai-knowledge-form'

export default async function AIKnowledgePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenantRaw } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single()

  const tenant = tenantRaw as { id: string } | null
  if (!tenant) redirect('/onboarding')

  const { data: entries } = await supabase
    .from('ai_knowledge_base')
    .select('id, category, key, value')
    .eq('tenant_id', tenant.id)
    .order('category')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Base de conhecimento</h1>
        <p className="mt-1 text-sm text-gray-500">
          Informações que o agente de IA usará para atender seus clientes no WhatsApp.
        </p>
      </div>
      <AIKnowledgeForm
        tenantId={tenant.id}
        initialEntries={(entries ?? []) as Parameters<typeof AIKnowledgeForm>[0]['initialEntries']}
      />
    </div>
  )
}
