import OpenAI from 'openai'

/**
 * Chat service for handling conversations with OpenAI Assistant
 * Uses the same assistant configured for triage, but for general orthopedic questions
 */
export class ChatService {
  private openai: OpenAI
  private assistantId: string
  private threadId: string | null = null

  constructor(apiKey: string, assistantId: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // For prototype - should use backend in production
    })
    this.assistantId = assistantId
  }

  /**
   * Initialize or get existing conversation thread
   */
  private async getThread(): Promise<string> {
    if (this.threadId) {
      return this.threadId
    }

    const thread = await this.openai.beta.threads.create()
    this.threadId = thread.id
    return thread.id
  }

  /**
   * Send a message to the assistant and get a response
   */
  async sendMessage(message: string): Promise<string> {
    try {
      const threadId = await this.getThread()

      // Add message to thread
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message
      })

      // Run the assistant
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId
      })

      // Wait for completion
      let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id)
      let attempts = 0
      const maxAttempts = 60

      while (runStatus.status !== 'completed' && attempts < maxAttempts) {
        if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
          throw new Error(`Assistant run failed with status: ${runStatus.status}`)
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
        runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id)
        attempts++
      }

      if (runStatus.status !== 'completed') {
        throw new Error('Timeout waiting for assistant response')
      }

      // Get the assistant's response
      const messages = await this.openai.beta.threads.messages.list(threadId)
      const lastMessage = messages.data[0]

      if (lastMessage.role !== 'assistant') {
        throw new Error('No assistant response found')
      }

      // Extract text from message content
      const textContent = lastMessage.content.find(content => content.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in assistant response')
      }

      return textContent.text.value
    } catch (error: any) {
      console.error('Chat service error:', error)
      throw new Error(`Kunne ikke få svar fra assistenten: ${error.message}`)
    }
  }

  /**
   * Clear the conversation thread (start fresh)
   */
  clearThread() {
    this.threadId = null
  }
}

/**
 * Create a chat service instance from environment variables
 */
export function createChatService(): ChatService | null {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY
  const assistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID

  if (openaiKey && assistantId) {
    return new ChatService(openaiKey, assistantId)
  }

  return null
}

export default ChatService
