/**
 * CP2 — Stripe webhook idempotency test
 *
 * Verifies that:
 * 1. Requests without a valid Stripe signature return 400
 * 2. Valid signed events are processed (200)
 * 3. Duplicate event IDs are silently skipped (200, skipped: true)
 *
 * Requires the dev server to be running and STRIPE_WEBHOOK_SECRET set.
 * Run with INTEGRATION_TESTS=1.
 */
import { test, expect } from '@playwright/test'
import crypto from 'crypto'

const SKIP = !process.env.INTEGRATION_TESTS

function signStripePayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${payload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')
  return `t=${timestamp},v1=${signature}`
}

test.describe('Stripe webhook', () => {
  test.skip(SKIP, 'Set INTEGRATION_TESTS=1 to run integration tests')

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
  const endpoint = `${baseUrl}/api/webhooks/stripe`

  test('rejects request without signature', async ({ request }) => {
    const res = await request.post(endpoint, {
      data: '{}',
      headers: { 'content-type': 'application/json' },
    })
    expect(res.status()).toBe(400)
  })

  test('accepts and processes a valid signed event', async ({ request }) => {
    const eventId = `evt_test_${Date.now()}`
    const payload = JSON.stringify({
      id: eventId,
      type: 'checkout.session.completed',
      object: 'event',
      data: {
        object: {
          object: 'checkout.session',
          metadata: {},
          customer: null,
        },
      },
    })

    const signature = signStripePayload(payload, webhookSecret)
    const res = await request.post(endpoint, {
      data: payload,
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signature,
      },
    })

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })

  test('silently skips duplicate event IDs', async ({ request }) => {
    const eventId = `evt_test_dedup_${Date.now()}`
    const payload = JSON.stringify({
      id: eventId,
      type: 'checkout.session.completed',
      object: 'event',
      data: {
        object: {
          object: 'checkout.session',
          metadata: {},
          customer: null,
        },
      },
    })

    const signature = signStripePayload(payload, webhookSecret)
    const headers = {
      'content-type': 'application/json',
      'stripe-signature': signature,
    }

    // First request — should process
    const res1 = await request.post(endpoint, { data: payload, headers })
    expect(res1.status()).toBe(200)

    // Re-sign with new timestamp (Stripe replays always get a fresh signature)
    const signature2 = signStripePayload(payload, webhookSecret)
    const res2 = await request.post(endpoint, { data: payload, headers: { ...headers, 'stripe-signature': signature2 } })
    expect(res2.status()).toBe(200)
    const body2 = await res2.json()
    expect(body2.skipped).toBe(true)
  })
})
