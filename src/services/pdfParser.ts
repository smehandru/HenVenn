import * as pdfjsLib from 'pdfjs-dist'

// Set up PDF.js worker - use local worker instead of CDN for Vite compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

/**
 * Extract text from a PDF file
 * @param file - The PDF file to parse
 * @returns Promise with extracted text
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    let fullText = ''

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Combine all text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')

      fullText += pageText + '\n\n'
    }

    return fullText.trim()
  } catch (error) {
    console.error('Error parsing PDF:', error)
    throw new Error('Kunne ikke lese PDF-filen. Sørg for at det er en gyldig PDF.')
  }
}

/**
 * Parse referrals from extracted PDF text
 * This assumes the PDF contains numbered referrals
 * @param text - Extracted text from PDF
 * @returns Array of referral texts
 */
export function parseReferralsFromText(text: string): string[] {
  // Split by common referral separators
  // This is a simplified version - you may need to adjust based on actual PDF format

  // Try to split by referral numbers (e.g., "Henvisning 1:", "1.", etc.)
  const referralPattern = /(?:Henvisning\s+\d+|^\d+[\.:)])/gim
  const matches = text.match(referralPattern)

  if (!matches || matches.length === 0) {
    // If no numbered pattern found, try to split by large gaps or page breaks
    return [text] // Return as single referral for now
  }

  // Split text into separate referrals
  const referrals: string[] = []
  let currentIndex = 0

  text.replace(referralPattern, (match, offset) => {
    if (currentIndex > 0) {
      referrals.push(text.substring(currentIndex, offset).trim())
    }
    currentIndex = offset
    return match
  })

  // Add the last referral
  if (currentIndex > 0) {
    referrals.push(text.substring(currentIndex).trim())
  }

  return referrals.filter(r => r.length > 50) // Filter out very short texts
}

/**
 * Extract and structure referrals from a PDF file
 * @param file - The PDF file containing referrals
 * @returns Promise with array of referral texts
 */
export async function extractReferralsFromPDF(file: File): Promise<string[]> {
  const text = await extractTextFromPDF(file)
  return parseReferralsFromText(text)
}

export default {
  extractTextFromPDF,
  parseReferralsFromText,
  extractReferralsFromPDF
}
