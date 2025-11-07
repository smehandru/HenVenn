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
 *    - VITE_OPENAI_API_KEY=din-api-nøkkel (OpenAI)
 *    - VITE_AZURE_OPENAI_API_KEY + VITE_AZURE_OPENAI_ENDPOINT (Azure OpenAI)
 *    - VITE_COPILOT_DIRECT_LINE_SECRET (Microsoft Copilot Studio)
 */

export type AIProvider = 'claude' | 'openai' | 'azure' | 'copilot'

interface AIServiceConfig {
  provider: AIProvider
  apiKey: string
  model?: string
  endpoint?: string // For Azure OpenAI
  deploymentName?: string // For Azure OpenAI
  directLineSecret?: string // For Copilot Studio
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

{
  "keySummary": "Konsis oppsummering av nøkkelsymptomer og funn (2-3 setninger)",
  "tentativeDiagnosis": "Tentativ diagnose",
  "differentialDiagnoses": ["Diff.diagnose 1", "Diff.diagnose 2", "Diff.diagnose 3"],
  "recommendedDeadline": "Anbefalt inntaksfrist basert på prioriteringsveilederen",
  "priorityGroup": "red|orange|green|rejected",
  "rejectionReason": "Hvis rejected: detaljert forklaring på hvorfor"
}

KRITERIER FOR PRIORITERING:
- red (≤4 uker): Akutte tilstander, betydelige nevrologiske utfall, progredierende symptomer
- orange (5-12 uker): Betydelige symptomer, ikke respondert på konservativ behandling
- green (>12 uker): Elektive tilstander, stabile symptomer
- rejected: Kan håndteres i primærhelsetjenesten, manglende utredning, utilstrekkelig informasjon

Vurder også:
- Er det røde flagg?
- Er det gjort tilstrekkelig utredning i primærhelsetjenesten?
- Er det tydelig indikasjon for spesialistvurdering?

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

      return {
        keySummary: parsed.keySummary || '',
        tentativeDiagnosis: parsed.tentativeDiagnosis || '',
        differentialDiagnoses: parsed.differentialDiagnoses || [],
        recommendedDeadline: parsed.recommendedDeadline || '',
        priorityGroup: parsed.priorityGroup || 'green',
        rejectionReason: parsed.rejectionReason
      }
    } catch (error) {
      console.error('Error parsing AI response:', error)
      console.error('Response was:', response)

      // Return a fallback assessment
      return {
        keySummary: 'Kunne ikke analysere henvisningen automatisk.',
        tentativeDiagnosis: 'Ukjent',
        differentialDiagnoses: [],
        recommendedDeadline: 'Manuell vurdering nødvendig',
        priorityGroup: 'green',
        rejectionReason: undefined
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
  const azureKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY
  const azureEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT
  const azureDeployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME

  // Prioriter Copilot Studio først (best for norsk helsevesen med egendefinert agent)
  if (copilotSecret) {
    return new AIService({
      provider: 'copilot',
      apiKey: '', // Ikke brukt for Copilot
      directLineSecret: copilotSecret
    })
  }

  // Deretter Claude (best for medisinsk bruk)
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
