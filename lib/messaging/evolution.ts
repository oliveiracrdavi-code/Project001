import type { MessageProvider, SendMessageParams, MessageResult } from './types'

export class EvolutionAPIProvider implements MessageProvider {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly instance: string

  constructor() {
    this.baseUrl = process.env.EVOLUTION_API_URL!
    this.apiKey = process.env.EVOLUTION_API_KEY!
    this.instance = process.env.EVOLUTION_INSTANCE_NAME!
  }

  async sendText({ to, text }: SendMessageParams): Promise<MessageResult> {
    // Normalize Brazilian phone number: strip non-digits, ensure country code 55
    const normalized = to.replace(/\D/g, '')
    const number = normalized.startsWith('55') ? normalized : `55${normalized}`

    try {
      const response = await fetch(
        `${this.baseUrl}/message/sendText/${this.instance}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
          },
          body: JSON.stringify({ number, text }),
        }
      )

      if (!response.ok) {
        const body = await response.text()
        return { success: false, error: `HTTP ${response.status}: ${body}` }
      }

      const data = await response.json()
      return { success: true, messageId: data?.key?.id }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/instance/fetchInstances`,
        {
          headers: { apikey: this.apiKey },
          signal: AbortSignal.timeout(5000),
        }
      )
      return response.ok
    } catch {
      return false
    }
  }
}
