import type { MessageProvider } from './types'
import { EvolutionAPIProvider } from './evolution'

let _provider: MessageProvider | null = null

export function getMessageProvider(): MessageProvider {
  if (!_provider) {
    _provider = new EvolutionAPIProvider()
  }
  return _provider
}

export type { MessageProvider, SendMessageParams, MessageResult } from './types'
