/**
 * CP2 — Double-booking prevention test
 *
 * Verifies that the EXCLUSION CONSTRAINT on appointments prevents
 * overlapping appointments for the same professional.
 * Run with INTEGRATION_TESTS=1.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const SKIP = !process.env.INTEGRATION_TESTS

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

test.describe('Double-booking prevention', () => {
  test.skip(SKIP, 'Set INTEGRATION_TESTS=1 to run integration tests')

  let tenantId: string
  let professionalId: string
  let clientId: string
  let serviceId: string
  let appt1Id: string

  test.beforeAll(async () => {
    const { data: t } = await supabase
      .from('tenants')
      .insert({ name: 'Double Booking Test', slug: `dbt-${Date.now()}` })
      .select('id')
      .single()
    tenantId = t!.id

    const { data: p } = await supabase
      .from('professionals')
      .insert({ tenant_id: tenantId, name: 'Test Pro', specialties: [] })
      .select('id')
      .single()
    professionalId = p!.id

    const { data: c } = await supabase
      .from('clients')
      .insert({ tenant_id: tenantId, name: 'Test Client', phone: '(11) 99000-0001', lgpd_consent: true, lgpd_consent_date: new Date().toISOString() })
      .select('id')
      .single()
    clientId = c!.id

    const { data: s } = await supabase
      .from('services')
      .insert({ tenant_id: tenantId, name: 'Test Service', duration_minutes: 60, price_cents: 5000 })
      .select('id')
      .single()
    serviceId = s!.id
  })

  test.afterAll(async () => {
    await supabase.from('appointments').delete().eq('tenant_id', tenantId)
    await supabase.from('clients').delete().eq('id', clientId)
    await supabase.from('professionals').delete().eq('id', professionalId)
    await supabase.from('services').delete().eq('id', serviceId)
    await supabase.from('tenants').delete().eq('id', tenantId)
  })

  test('first appointment is created successfully', async () => {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        tenant_id: tenantId,
        client_id: clientId,
        professional_id: professionalId,
        service_id: serviceId,
        start_time: '2030-01-15T10:00:00Z',
        end_time: '2030-01-15T11:00:00Z',
      })
      .select('id')
      .single()

    expect(error).toBeNull()
    expect(data?.id).toBeTruthy()
    appt1Id = data!.id
  })

  test('overlapping appointment is rejected with exclusion violation', async () => {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        tenant_id: tenantId,
        client_id: clientId,
        professional_id: professionalId,
        service_id: serviceId,
        start_time: '2030-01-15T10:30:00Z', // overlaps with first appointment
        end_time: '2030-01-15T11:30:00Z',
      })
      .select('id')
      .single()

    expect(data).toBeNull()
    expect(error).toBeTruthy()
    expect(error?.code).toBe('23P01') // exclusion_violation
  })

  test('non-overlapping appointment for same professional is allowed', async () => {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        tenant_id: tenantId,
        client_id: clientId,
        professional_id: professionalId,
        service_id: serviceId,
        start_time: '2030-01-15T11:00:00Z', // starts exactly when first ends
        end_time: '2030-01-15T12:00:00Z',
      })
      .select('id')
      .single()

    expect(error).toBeNull()
    expect(data?.id).toBeTruthy()
  })
})
