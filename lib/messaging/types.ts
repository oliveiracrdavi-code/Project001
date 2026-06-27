export interface SendMessageParams {
  to: string
  text: string
}

export interface MessageResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface MessageProvider {
  sendText(params: SendMessageParams): Promise<MessageResult>
  isAvailable(): Promise<boolean>
}
