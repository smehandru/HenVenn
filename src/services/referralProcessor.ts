import type { Referral } from '../types'
import { extractReferralsFromPDF } from './pdfParser'
import { createAIService } from './aiService'
import { fetchPriorityGuidelines } from './priorityGuidelinesService'

/**
 * Process a PDF file containing referrals
 * 1. Extract text from PDF
 * 2. Split into individual referrals
 * 3. Assess each referral with AI
 * 4. Return structured referral objects
 */
export async function processReferralPDF(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<Referral[]> {
  try {
    // Step 1: Extract referral texts from PDF
    const referralTexts = await extractReferralsFromPDF(file)

    if (referralTexts.length === 0) {
      throw new Error('Ingen henvisninger funnet i PDF-filen')
    }

    // Step 2: Get priority guidelines
    const guidelines = await fetchPriorityGuidelines()
    const guidelinesText = formatGuidelinesForAI(guidelines)

    // Step 3: Initialize AI service
    const aiService = createAIService()

    if (!aiService) {
      // If no AI service, return referrals without assessment
      console.warn('AI service not available - returning referrals without assessment')
      return referralTexts.map((text, index) => createMockReferral(text, index + 1))
    }

    // Step 4: Process each referral with AI
    const referrals: Referral[] = []

    for (let i = 0; i < referralTexts.length; i++) {
      const text = referralTexts[i]

      if (onProgress) {
        onProgress(i + 1, referralTexts.length)
      }

      try {
        // Extract basic info (simple parsing)
        const basicInfo = extractBasicInfo(text)

        // Get AI assessment
        const assessment = await aiService.assessReferral(text, i + 1, guidelinesText)

        // Create referral object
        const referral: Referral = {
          id: `ref-${Date.now()}-${i}`,
          referralNumber: i + 1,
          patientInfo: basicInfo.patientInfo,
          symptoms: basicInfo.symptoms,
          duration: basicInfo.duration,
          redFlags: basicInfo.redFlags,
          fullText: text,
          assessment
        }

        referrals.push(referral)
      } catch (error) {
        console.error(`Error processing referral ${i + 1}:`, error)
        // Add referral without assessment on error
        referrals.push(createMockReferral(text, i + 1))
      }
    }

    return referrals
  } catch (error) {
    console.error('Error processing PDF:', error)
    throw error
  }
}

/**
 * Format priority guidelines for AI prompt
 */
function formatGuidelinesForAI(guidelines: any[]): string {
  return guidelines
    .map(g => {
      return `
TILSTAND: ${g.condition}
- Anbefalt frist: ${g.recommendedDeadlineWeeks} uker
- Kriterier: ${g.criteriaForPrioritization.join(', ')}
- Røde flagg: ${g.redFlags.join(', ')}
`
    })
    .join('\n---\n')
}

/**
 * Extract basic information from referral text
 * This is a simple heuristic-based extraction
 * AI will provide more detailed assessment
 */
function extractBasicInfo(text: string): {
  patientInfo: { name: string; age: number; gender: string }
  symptoms: string[]
  duration: string
  redFlags: string[]
} {
  // Try to extract patient name (looks for "Pasient:" or "Navn:")
  const nameMatch = text.match(/(?:Pasient|Navn):\s*([^\n,]+)/i)
  const name = nameMatch ? nameMatch[1].trim() : 'Ukjent'

  // Try to extract age
  const ageMatch = text.match(/(\d{1,3})\s*år/i)
  const age = ageMatch ? parseInt(ageMatch[1]) : 0

  // Try to extract gender
  const genderMatch = text.match(/(?:mann|kvinne|m|k)\b/i)
  const genderText = genderMatch ? genderMatch[0].toLowerCase() : ''
  const gender =
    genderText === 'mann' || genderText === 'm'
      ? 'Mann'
      : genderText === 'kvinne' || genderText === 'k'
      ? 'Kvinne'
      : 'Ukjent'

  // Extract symptoms (simplified - AI will do better)
  const symptoms: string[] = []
  if (text.match(/smerte/i)) symptoms.push('Smerte')
  if (text.match(/hevelse/i)) symptoms.push('Hevelse')
  if (text.match(/bevegelses|mobilitet/i)) symptoms.push('Bevegelsesreduksjon')

  // Extract duration (simplified)
  const durationMatch = text.match(/(\d+)\s*(dag|uke|måned|år)/i)
  const duration = durationMatch ? `${durationMatch[1]} ${durationMatch[2]}er` : 'Ukjent varighet'

  // Red flags (simplified - AI will provide better analysis)
  const redFlags: string[] = []
  if (text.match(/akutt|plutselig/i)) redFlags.push('Akutt debut')
  if (text.match(/nevrologisk|parese|lammelse/i)) redFlags.push('Nevrologiske utfall')

  return {
    patientInfo: { name, age, gender },
    symptoms,
    duration,
    redFlags
  }
}

/**
 * Create a mock referral when AI is not available
 */
function createMockReferral(text: string, referralNumber: number): Referral {
  const basicInfo = extractBasicInfo(text)

  return {
    id: `ref-mock-${Date.now()}-${referralNumber}`,
    referralNumber,
    patientInfo: basicInfo.patientInfo,
    symptoms: basicInfo.symptoms,
    duration: basicInfo.duration,
    redFlags: basicInfo.redFlags,
    fullText: text,
    assessment: {
      keySummary: 'AI-vurdering ikke tilgjengelig. Legg til API-nøkkel for automatisk triagering.',
      tentativeDiagnosis: 'Manuell vurdering nødvendig',
      differentialDiagnoses: [],
      recommendedDeadline: 'Ikke vurdert',
      priorityGroup: 'green'
    }
  }
}

export default {
  processReferralPDF
}
