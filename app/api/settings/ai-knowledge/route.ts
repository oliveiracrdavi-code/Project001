import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tenantId, entries } = await request.json()

  const { data: member } = await supabase
    .from('tenant_members')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Delete all existing entries for this tenant, then upsert new ones
  await supabase.from('ai_knowledge_base').delete().eq('tenant_id', tenantId)

  if (entries.length > 0) {
    const { data: saved, error: insertError } = await supabase
      .from('ai_knowledge_base')
      .insert(
        entries.map((e: { category: string; key: string; value: string }) => ({
          tenant_id: tenantId,
          category: e.category,
          key: e.key,
          value: e.value,
        }))
      )
      .select('id, category, key, value')

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    return NextResponse.json({ saved })
  }

  return NextResponse.json({ saved: [] })
}
