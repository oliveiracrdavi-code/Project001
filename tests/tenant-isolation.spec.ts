/**
 * CP2 — Tenant isolation test
 *
 * Verifies that Supabase RLS policies prevent cross-tenant data access.
 * These tests run against a live Supabase project (set INTEGRATION_TESTS=1).
 * Requires SUPABASE_TEST_* env vars in .env.test (not committed).
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const SKIP = !process.env.INTEGRATION_TESTS

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

test.describe('Tenant isolation (RLS)', () => {
  test.skip(SKIP, 'Set INTEGRATION_TESTS=1 to run integration tests')

  let tenantAId: string
  let tenantBId: string
  let userAId: string
  let userBId: string
  let clientAId: string

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  test.beforeAll(async () => {
    // Create two auth users
    const { data: userA } = await admin.auth.admin.createUser({
      email: `test-a-${Date.now()}@example.com`,
      password: 'password-a',
      email_confirm: true,
    })
    const { data: userB } = await admin.auth.admin.createUser({
      email: `test-b-${Date.now()}@example.com`,
      password: 'password-b',
      email_confirm: true,
    })
    userAId = userA.user!.id
    userBId = userB.user!.id

    // Create two tenants
    const { data: ta } = await admin.from('tenants').insert({ name: 'Tenant A', slug: `tenant-a-${Date.now()}` }).select('id').single()
    const { data: tb } = await admin.from('tenants').insert({ name: 'Tenant B', slug: `tenant-b-${Date.now()}` }).select('id').single()
    tenantAId = ta!.id
    tenantBId = tb!.id

    // Link users to their respective tenants
    await admin.from('tenant_members').insert({ tenant_id: tenantAId, user_id: userAId, role: 'owner' })
    await admin.from('tenant_members').insert({ tenant_id: tenantBId, user_id: userBId, role: 'owner' })

    // Create a client for tenant A
    const { data: client } = await admin.from('clients').insert({
      tenant_id: tenantAId, name: 'Client A', phone: '(11) 91111-0001',
      lgpd_consent: true, lgpd_consent_date: new Date().toISOString(),
    }).select('id').single()
    clientAId = client!.id
  })

  test.afterAll(async () => {
    // Cleanup in order (FK constraints)
    if (clientAId) await admin.from('clients').delete().eq('id', clientAId)
    if (tenantAId) await admin.from('tenants').delete().eq('id', tenantAId)
    if (tenantBId) await admin.from('tenants').delete().eq('id', tenantBId)
    if (userAId) await admin.auth.admin.deleteUser(userAId)
    if (userBId) await admin.auth.admin.deleteUser(userBId)
  })

  test('user B cannot read tenant A clients', async () => {
    // Sign in as user B
    const clientB = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    await clientB.auth.signInWithPassword({
      email: `test-b-${Date.now()}@example.com`,
      password: 'password-b',
    })

    // Attempt to read client A's record (belongs to tenant A)
    const { data, error } = await clientB
      .from('clients')
      .select('id')
      .eq('tenant_id', tenantAId)

    // RLS should return empty (not an error — filtered, not blocked with 403)
    expect(data).toEqual([])
    expect(error).toBeNull()
  })

  test('user A can read their own clients', async () => {
    const clientA = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    await clientA.auth.signInWithPassword({
      email: `test-a-${Date.now()}@example.com`,
      password: 'password-a',
    })

    const { data, error } = await clientA.from('clients').select('id').eq('tenant_id', tenantAId)
    expect(error).toBeNull()
    expect(data?.length).toBeGreaterThanOrEqual(1)
    expect(data?.map(c => c.id)).toContain(clientAId)
  })
})
