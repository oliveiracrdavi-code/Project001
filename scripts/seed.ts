/**
 * Seed script — cria dados de demonstração na Agenda Boa
 * Uso: npx tsx scripts/seed.ts
 * Pré-requisito: .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  console.log('Iniciando seed...')

  // 1. Criar tenant de demonstração
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: 'Salão Demo',
      slug: `demo-${Date.now().toString(36)}`,
      timezone: 'America/Sao_Paulo',
      phone: '(11) 99999-0000',
      address: 'Rua das Flores, 123 — São Paulo, SP',
    })
    .select('id')
    .single()

  if (tenantError) throw tenantError
  console.log(`Tenant criado: ${tenant.id}`)

  // 2. Serviços
  const { data: services } = await supabase
    .from('services')
    .insert([
      { tenant_id: tenant.id, name: 'Corte', duration_minutes: 45, price_cents: 5000 },
      { tenant_id: tenant.id, name: 'Coloração', duration_minutes: 120, price_cents: 15000 },
      { tenant_id: tenant.id, name: 'Hidratação', duration_minutes: 60, price_cents: 8000 },
      { tenant_id: tenant.id, name: 'Manicure', duration_minutes: 45, price_cents: 3500 },
    ])
    .select('id, name')

  console.log(`${services?.length ?? 0} serviços criados`)

  // 3. Profissionais
  const { data: professionals } = await supabase
    .from('professionals')
    .insert([
      { tenant_id: tenant.id, name: 'Ana Silva', specialties: ['Corte', 'Coloração'] },
      { tenant_id: tenant.id, name: 'Bruno Costa', specialties: ['Corte', 'Hidratação'] },
    ])
    .select('id, name')

  console.log(`${professionals?.length ?? 0} profissionais criados`)

  // 4. Horários de funcionamento (Seg-Sex 09-18, Sáb 09-13, Dom fechado)
  await supabase.from('business_hours').insert([
    { tenant_id: tenant.id, day_of_week: 0, open_time: '09:00', close_time: '18:00', is_closed: true },
    { tenant_id: tenant.id, day_of_week: 1, open_time: '09:00', close_time: '18:00', is_closed: false },
    { tenant_id: tenant.id, day_of_week: 2, open_time: '09:00', close_time: '18:00', is_closed: false },
    { tenant_id: tenant.id, day_of_week: 3, open_time: '09:00', close_time: '18:00', is_closed: false },
    { tenant_id: tenant.id, day_of_week: 4, open_time: '09:00', close_time: '18:00', is_closed: false },
    { tenant_id: tenant.id, day_of_week: 5, open_time: '09:00', close_time: '18:00', is_closed: false },
    { tenant_id: tenant.id, day_of_week: 6, open_time: '09:00', close_time: '13:00', is_closed: false },
  ])

  // 5. Intervalo de almoço (Seg-Sex)
  await supabase.from('business_breaks').insert(
    [1, 2, 3, 4, 5].map(day => ({
      tenant_id: tenant.id, day_of_week: day, start_time: '12:00', end_time: '13:00',
    }))
  )

  // 6. Clientes
  const { data: clients } = await supabase
    .from('clients')
    .insert([
      { tenant_id: tenant.id, name: 'Maria Fernanda', phone: '(11) 91111-1111', email: 'maria@exemplo.com', lgpd_consent: true, lgpd_consent_date: new Date().toISOString() },
      { tenant_id: tenant.id, name: 'João Pereira', phone: '(11) 92222-2222', lgpd_consent: true, lgpd_consent_date: new Date().toISOString() },
      { tenant_id: tenant.id, name: 'Camila Rocha', phone: '(11) 93333-3333', email: 'camila@exemplo.com', lgpd_consent: true, lgpd_consent_date: new Date().toISOString() },
    ])
    .select('id, name')

  console.log(`${clients?.length ?? 0} clientes criados`)

  // 7. Agendamentos futuros (próximos 3 dias úteis)
  if (services && professionals && clients) {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)

    const appts = [
      {
        tenant_id: tenant.id,
        client_id: clients[0].id,
        professional_id: professionals[0].id,
        service_id: services[0].id,
        start_time: new Date(tomorrow).toISOString(),
        end_time: new Date(tomorrow.getTime() + 45 * 60000).toISOString(),
      },
      {
        tenant_id: tenant.id,
        client_id: clients[1].id,
        professional_id: professionals[1].id,
        service_id: services[2].id,
        start_time: new Date(tomorrow.getTime() + 2 * 60 * 60000).toISOString(),
        end_time: new Date(tomorrow.getTime() + (2 * 60 + 60) * 60000).toISOString(),
      },
    ]

    await supabase.from('appointments').insert(appts)
    console.log(`${appts.length} agendamentos criados`)
  }

  // 8. Página de agendamento pública
  await supabase.from('booking_pages').insert({
    tenant_id: tenant.id,
    is_active: true,
    custom_message: 'Agende seu horário de forma rápida e fácil!',
    require_cpf: false,
  })

  console.log('\n✓ Seed concluído!')
  console.log(`Página de agendamento: /agendar/${(await supabase.from('tenants').select('slug').eq('id', tenant.id).single()).data?.slug}`)
}

main().catch((err) => {
  console.error('Erro no seed:', err)
  process.exit(1)
})
