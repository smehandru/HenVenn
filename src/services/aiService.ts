import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { AzureOpenAI } from 'openai'
import '@azure/openai/types' // Type extensions for Azure
import { ReferralAssessment } from '../types'

/**
 * AI Service Configuration
 *
 * For å bruke dette:
 * 1. Opprett en .env fil i root-mappen
 * 2. Legg til én av følgende:
 *    - VITE_ANTHROPIC_API_KEY=din-api-nøkkel (Claude)
 *    - VITE_OPENAI_API_KEY=din-api-nøkkel (OpenAI)
 *    - VITE_AZURE_OPENAI_API_KEY + VITE_AZURE_OPENAI_ENDPOINT (Azure/Microsoft Copilot)
 */

export type AIProvider = 'claude' | 'openai' | 'azure'

interface AIServiceConfig {
  provider: AIProvider
  apiKey: string
  model?: string
  endpoint?: string // For Azure OpenAI
  deploymentName?: string // For Azure OpenAI
}

/**
 * AI Service for assessing medical referrals
 */
export class AIService {
  private provider: AIProvider
  private anthropic?: Anthropic
  private openai?: OpenAI
  private azureOpenAI?: AzureOpenAI
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
      // Azure OpenAI konfiguration (Microsoft Copilot)
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
    const prompt = this.buildAssessmentPrompt(referralText, priorityGuidelines)

    let response: string

    if (this.provider === 'claude' && this.anthropic) {
      response = await this.callClaude(prompt)
    } else if (this.provider === 'azure' && this.azureOpenAI) {
      response = await this.callAzureOpenAI(prompt)
    } else if (this.provider === 'openai' && this.openai) {
      response = await this.callOpenAI(prompt)
    } else {
      throw new Error('AI provider not configured')
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
   * Call Azure OpenAI API (Microsoft Copilot)
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
  const claudeKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY
  const azureKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY
  const azureEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT
  const azureDeployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME

  // Prioriter Claude først (best for medisinsk bruk)
  if (claudeKey) {
    return new AIService({
      provider: 'claude',
      apiKey: claudeKey
    })
  }

  // Deretter Azure OpenAI (Microsoft Copilot - best for GDPR/norsk helsevesen)
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
