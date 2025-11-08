import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { AzureOpenAI } from 'openai'
import '@azure/openai/types' // Type extensions for Azure
import { DirectLine } from 'botframework-directlinejs'
import { ReferralAssessment } from '../types'

/**
 * AI Service Configuration
 *
 * For å bruke dette:
 * 1. Opprett en .env fil i root-mappen
 * 2. Legg til én av følgende:
 *    - VITE_ANTHROPIC_API_KEY=din-api-nøkkel (Claude)
 *    - VITE_OPENAI_API_KEY + VITE_OPENAI_ASSISTANT_ID (OpenAI Assistant med kunnskapsbase)
 *    - VITE_OPENAI_API_KEY=din-api-nøkkel (Standard OpenAI)
 *    - VITE_AZURE_OPENAI_API_KEY + VITE_AZURE_OPENAI_ENDPOINT (Azure OpenAI)
 *    - VITE_COPILOT_DIRECT_LINE_SECRET (Microsoft Copilot Studio)
 */

export type AIProvider = 'claude' | 'openai' | 'openai-assistant' | 'azure' | 'copilot'

interface AIServiceConfig {
  provider: AIProvider
  apiKey: string
  model?: string
  endpoint?: string // For Azure OpenAI
  deploymentName?: string // For Azure OpenAI
  directLineSecret?: string // For Copilot Studio
  assistantId?: string // For OpenAI Assistant
}

/**
 * AI Service for assessing medical referrals
 */
export class AIService {
  private provider: AIProvider
  private anthropic?: Anthropic
  private openai?: OpenAI
  private azureOpenAI?: AzureOpenAI
  private directLine?: DirectLine
  private model: string
  private deploymentName?: string
  private assistantId?: string

  constructor(config: AIServiceConfig) {
    this.provider = config.provider

    if (config.provider === 'claude') {
      this.anthropic = new Anthropic({
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true // For prototype - should use backend in production
      })
      this.model = config.model || 'claude-3-5-sonnet-20241022'
    } else if (config.provider === 'azure') {
      // Azure OpenAI konfiguration
      if (!config.endpoint) {
        throw new Error('Azure OpenAI krever endpoint URL')
      }
      this.azureOpenAI = new AzureOpenAI({
        apiKey: config.apiKey,
        endpoint: config.endpoint,
        apiVersion: '2024-10-21',
        dangerouslyAllowBrowser: true // For prototype - should use backend in production
      })
      this.deploymentName = config.deploymentName || 'gpt-4'
      this.model = config.model || 'gpt-4'
    } else if (config.provider === 'copilot') {
      // Microsoft Copilot Studio via DirectLine
      if (!config.directLineSecret) {
        throw new Error('Copilot Studio krever DirectLine secret')
      }
      this.directLine = new DirectLine({
        secret: config.directLineSecret
      })
      this.model = 'copilot-studio-agent'
    } else if (config.provider === 'openai-assistant') {
      // OpenAI Assistant with knowledge base
      if (!config.assistantId) {
        throw new Error('OpenAI Assistant krever Assistant ID')
      }
      this.openai = new OpenAI({
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true // For prototype - should use backend in production
      })
      this.assistantId = config.assistantId
      this.model = 'openai-assistant'
    } else {
      // Standard OpenAI
      this.openai = new OpenAI({
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true // For prototype - should use backend in production
      })
      this.model = config.model || 'gpt-4-turbo-preview'
    }
  }

  /**
   * Assess a single referral using AI
   */
  async assessReferral(
    referralText: string,
    _referralNumber: number,
    priorityGuidelines: string
  ): Promise<ReferralAssessment> {
    let response: string

    if (this.provider === 'copilot' && this.directLine) {
      // For Copilot Studio: Send bare henvisningsteksten
      // Agenten har allerede prioriteringsveileder som kunnskapsbase
      response = await this.callCopilotStudio(referralText)
    } else if (this.provider === 'openai-assistant' && this.openai && this.assistantId) {
      // For OpenAI Assistant: Send bare henvisningsteksten
      // Assistenten har allerede prioriteringsveileder som kunnskapsbase
      response = await this.callOpenAIAssistant(referralText)
    } else {
      // For andre providers: Send full prompt med veileder
      const prompt = this.buildAssessmentPrompt(referralText, priorityGuidelines)

      if (this.provider === 'claude' && this.anthropic) {
        response = await this.callClaude(prompt)
      } else if (this.provider === 'azure' && this.azureOpenAI) {
        response = await this.callAzureOpenAI(prompt)
      } else if (this.provider === 'openai' && this.openai) {
        response = await this.callOpenAI(prompt)
      } else {
        throw new Error('AI provider not configured')
      }
    }

    return this.parseAssessmentResponse(response)
  }

  /**
   * Build the assessment prompt for AI
   */
  private buildAssessmentPrompt(referralText: string, priorityGuidelines: string): string {
    return `Du er en erfaren ortoped som skal vurdere en henvisning fra fastlege.

PRIORITERINGSVEILEDER:
${priorityGuidelines}

HENVISNING:
${referralText}

OPPGAVE:
Analyser henvisningen og gi en strukturert vurdering på norsk i følgende JSON-format:

For AKSEPTERTE henvisninger (red/orange/green):
{
  "keySummary": "Konsis oppsummering av nøkkelsymptomer og funn (2-3 setninger)",
  "tentativeDiagnosis": "Tentativ diagnose",
  "differentialDiagnoses": ["Diff.diagnose 1", "Diff.diagnose 2"],  // VALGFRITT - kun hvis relevant
  "recommendedDeadline": {
    "deadline": "4 uker",
    "reasoning": "Detaljert forklaring av hvorfor denne fristen anbefales",
    "guidelineReference": "Side X i prioriteringsveilederen"  // VALGFRITT - hvis relevant
  },
  "priorityGroup": "red|orange|green"
}

For AVVISTE henvisninger (rejected):
{
  "keySummary": "Konsis oppsummering av henvisningen",
  "tentativeDiagnosis": "Foreløpig vurdering",
  "priorityGroup": "rejected",
  "rejection": {
    "reason": "Klar forklaring på hvorfor henvisningen avvises",
    "missingInformation": ["Mangler bildediagnostikk", "Ingen beskrivelse av konservativ behandling"],
    "primaryCareActions": ["Prøv fysioterapi i 6-8 uker", "Ta røntgen av aktuelt område", "Prøv NSAID-behandling"]
  }
}

VIKTIGE REGLER:
1. differentialDiagnoses: Kun hvis det er klinisk relevant med flere diagnoser. Utelat feltet hvis diagnosen er klar.
2. recommendedDeadline: Alltid inkluder detaljert begrunnelse. Referer til sidetal hvis mulig.
3. rejection: Må være konstruktiv - si hva som mangler OG hva fastlegen kan gjøre.

KRITERIER FOR PRIORITERING:
- red (≤4 uker): Akutte tilstander, betydelige nevrologiske utfall, progredierende symptomer, røde flagg
- orange (5-12 uker): Betydelige symptomer, ikke respondert på konservativ behandling, moderat funksjonshemming
- green (>12 uker): Elektive tilstander, stabile symptomer, lav funksjonshemming
- rejected: Kan håndteres i primærhelsetjenesten, manglende utredning, utilstrekkelig informasjon, ingen klar indikasjon

Vurder alltid:
- Er det røde flagg?
- Er det gjort tilstrekkelig utredning i primærhelsetjenesten?
- Er det forsøkt relevant konservativ behandling?
- Er det tydelig indikasjon for spesialistvurdering?
- Hva mangler eventuelt for å kunne vurdere henvisningen?

Svar KUN med valid JSON, ingen annen tekst.`
  }

  /**
   * Call Claude API
   */
  private async callClaude(prompt: string): Promise<string> {
    if (!this.anthropic) throw new Error('Claude not configured')

    const message = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = message.content[0]
    if (content.type === 'text') {
      return content.text
    }

    throw new Error('Unexpected response format from Claude')
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not configured')

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'Du er en erfaren ortoped som vurderer medisinske henvisninger på norsk.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    return response.choices[0]?.message?.content || ''
  }

  /**
   * Call Azure OpenAI API
   */
  private async callAzureOpenAI(prompt: string): Promise<string> {
    if (!this.azureOpenAI) throw new Error('Azure OpenAI not configured')
    if (!this.deploymentName) throw new Error('Azure deployment name not configured')

    const response = await this.azureOpenAI.chat.completions.create({
      model: this.deploymentName, // Azure bruker deployment name i stedet for model
      messages: [
        {
          role: 'system',
          content: 'Du er en erfaren ortoped som vurderer medisinske henvisninger på norsk.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    return response.choices[0]?.message?.content || ''
  }

  /**
   * Call Microsoft Copilot Studio via DirectLine
   */
  private async callCopilotStudio(referralText: string): Promise<string> {
    if (!this.directLine) throw new Error('Copilot Studio not configured')

    const directLine = this.directLine // Local variable for TypeScript

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Copilot Studio timeout - ingen respons etter 60 sekunder'))
      }, 60000) // 60 sekunder timeout

      // Subscribe to bot messages
      directLine.activity$
        .filter((activity: any) => activity.type === 'message' && activity.from.id !== 'user')
        .subscribe({
          next: (activity: any) => {
            clearTimeout(timeout)
            const botMessage = activity.text || ''
            resolve(botMessage)
          },
          error: (error: any) => {
            clearTimeout(timeout)
            reject(new Error(`Copilot Studio error: ${error.message}`))
          }
        })

      // Send message to bot
      directLine
        .postActivity({
          from: { id: 'user', name: 'HenVenn User' },
          type: 'message',
          text: referralText
        })
        .subscribe({
          error: (error: any) => {
            clearTimeout(timeout)
            reject(new Error(`Failed to send message to Copilot: ${error.message}`))
          }
        })
    })
  }

  /**
   * Call OpenAI Assistant with knowledge base
   */
  private async callOpenAIAssistant(referralText: string): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not configured')
    if (!this.assistantId) throw new Error('Assistant ID not configured')

    try {
      // Step 1: Create a thread
      const thread = await this.openai.beta.threads.create()

      // Step 2: Add message to thread
      await this.openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: referralText
      })

      // Step 3: Run the assistant
      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: this.assistantId
      })

      // Step 4: Wait for completion (with timeout)
      let runStatus = await this.openai.beta.threads.runs.retrieve(thread.id, run.id)
      let attempts = 0
      const maxAttempts = 60 // 60 attempts * 1 second = 60 seconds timeout

      while (runStatus.status !== 'completed' && attempts < maxAttempts) {
        if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
          throw new Error(`Assistant run failed with status: ${runStatus.status}`)
        }

        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        runStatus = await this.openai.beta.threads.runs.retrieve(thread.id, run.id)
        attempts++
      }

      if (runStatus.status !== 'completed') {
        throw new Error('OpenAI Assistant timeout - ingen respons etter 60 sekunder')
      }

      // Step 5: Get the assistant's response
      const messages = await this.openai.beta.threads.messages.list(thread.id)
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant')

      if (!assistantMessage) {
        throw new Error('Ingen svar fra OpenAI Assistant')
      }

      // Extract text from message content
      const textContent = assistantMessage.content.find(content => content.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('Ugyldig svarformat fra OpenAI Assistant')
      }

      return textContent.text.value
    } catch (error: any) {
      console.error('OpenAI Assistant error:', error)
      throw new Error(`OpenAI Assistant feil: ${error.message}`)
    }
  }

  /**
   * Parse AI response to ReferralAssessment
   */
  private parseAssessmentResponse(response: string): ReferralAssessment {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      const assessment: ReferralAssessment = {
        keySummary: parsed.keySummary || '',
        tentativeDiagnosis: parsed.tentativeDiagnosis || '',
        priorityGroup: parsed.priorityGroup || 'green'
      }

      // differentialDiagnoses er optional - bare hvis det finnes
      if (parsed.differentialDiagnoses && parsed.differentialDiagnoses.length > 0) {
        assessment.differentialDiagnoses = parsed.differentialDiagnoses
      }

      // recommendedDeadline med ny struktur (for aksepterte henvisninger)
      if (parsed.recommendedDeadline) {
        if (typeof parsed.recommendedDeadline === 'string') {
          // Gammel format - konverter til ny struktur
          assessment.recommendedDeadline = {
            deadline: parsed.recommendedDeadline,
            reasoning: 'Se prioriteringsveileder for detaljer'
          }
        } else {
          // Ny format - bruk direkte
          assessment.recommendedDeadline = {
            deadline: parsed.recommendedDeadline.deadline || '',
            reasoning: parsed.recommendedDeadline.reasoning || '',
            guidelineReference: parsed.recommendedDeadline.guidelineReference
          }
        }
      }

      // rejection objekt (for avviste henvisninger)
      if (parsed.rejection) {
        assessment.rejection = {
          reason: parsed.rejection.reason || '',
          missingInformation: parsed.rejection.missingInformation || [],
          primaryCareActions: parsed.rejection.primaryCareActions || []
        }
      } else if (parsed.rejectionReason) {
        // Gammel format - konverter til ny struktur
        assessment.rejection = {
          reason: parsed.rejectionReason,
          missingInformation: ['Se detaljer i begrunnelse'],
          primaryCareActions: ['Kontakt spesialist for veiledning']
        }
      }

      return assessment
    } catch (error) {
      console.error('Error parsing AI response:', error)
      console.error('Response was:', response)

      // Return a fallback assessment
      return {
        keySummary: 'Kunne ikke analysere henvisningen automatisk.',
        tentativeDiagnosis: 'Ukjent',
        priorityGroup: 'green',
        recommendedDeadline: {
          deadline: 'Manuell vurdering nødvendig',
          reasoning: 'AI-systemet kunne ikke prosessere responsen korrekt.'
        }
      }
    }
  }
}

/**
 * Create AI service instance from environment variables
 */
export function createAIService(): AIService | null {
  const copilotSecret = import.meta.env.VITE_COPILOT_DIRECT_LINE_SECRET
  const claudeKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY
  const openaiAssistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID
  const azureKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY
  const azureEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT
  const azureDeployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME

  // Prioriter OpenAI Assistant først (best for egendefinert agent med kunnskapsbase)
  if (openaiKey && openaiAssistantId) {
    return new AIService({
      provider: 'openai-assistant',
      apiKey: openaiKey,
      assistantId: openaiAssistantId
    })
  }

  // Deretter Copilot Studio (alternativ for egendefinert agent)
  else if (copilotSecret) {
    return new AIService({
      provider: 'copilot',
      apiKey: '', // Ikke brukt for Copilot
      directLineSecret: copilotSecret
    })
  }

  // Deretter Claude (best for medisinsk bruk uten kunnskapsbase)
  else if (claudeKey) {
    return new AIService({
      provider: 'claude',
      apiKey: claudeKey
    })
  }

  // Deretter Azure OpenAI (best for GDPR/norsk helsevesen)
  else if (azureKey && azureEndpoint) {
    return new AIService({
      provider: 'azure',
      apiKey: azureKey,
      endpoint: azureEndpoint,
      deploymentName: azureDeployment
    })
  }

  // Til slutt standard OpenAI
  else if (openaiKey) {
    return new AIService({
      provider: 'openai',
      apiKey: openaiKey
    })
  }

  console.warn('No AI API key found in environment variables')
  return null
}

export default AIService
