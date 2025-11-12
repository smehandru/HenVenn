import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import FloatingChatBot from './components/FloatingChatBot'
import { Referral, ChatMessage } from './types'
import { mockReferrals } from './mockData'
import { processReferralPDF } from './services/referralProcessor'
import { createAIService } from './services/aiService'
import { createChatService } from './services/chatService'

function App() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState<string>('')
  const [useMockData, setUseMockData] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Initialize chat service for the floating chatbot
  const chatService = createChatService()

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    setIsProcessing(true)
    setProcessingProgress('Behandler PDF...')

    try {
      // Check if AI is configured
      const aiService = createAIService()

      if (!aiService && !useMockData) {
        // Ask user if they want to use mock data
        const useMock = window.confirm(
          'Ingen AI API-nøkkel funnet.\n\n' +
            'For å bruke AI-triagering, legg til VITE_ANTHROPIC_API_KEY eller VITE_OPENAI_API_KEY i .env-filen.\n\n' +
            'Vil du bruke mock-data for testing?'
        )

        if (useMock) {
          setUseMockData(true)
          setProcessingProgress('Laster mock-data...')
          setTimeout(() => {
            setReferrals(mockReferrals)
            setIsProcessing(false)
            setProcessingProgress('')
          }, 1000)
          return
        } else {
          setIsProcessing(false)
          setProcessingProgress('')
          alert('Vennligst konfigurer AI API-nøkkel for å fortsette.')
          return
        }
      }

      if (useMockData) {
        // Use mock data
        setProcessingProgress('Laster mock-data...')
        setTimeout(() => {
          setReferrals(mockReferrals)
          setIsProcessing(false)
          setProcessingProgress('')
        }, 1000)
        return
      }

      // Process PDF with AI
      setProcessingProgress('Ekstraherer tekst fra PDF...')

      const processedReferrals = await processReferralPDF(file, (current, total) => {
        setProcessingProgress(`Vurderer henvisning ${current} av ${total}...`)
      })

      setReferrals(processedReferrals)
      setProcessingProgress('Ferdig!')

      setTimeout(() => {
        setIsProcessing(false)
        setProcessingProgress('')
      }, 1000)
    } catch (error) {
      console.error('Error processing PDF:', error)
      alert(
        'Feil ved prosessering av PDF:\n' +
          (error instanceof Error ? error.message : 'Ukjent feil')
      )
      setIsProcessing(false)
      setProcessingProgress('')
    }
  }

  const handleReferralSelect = (referral: Referral) => {
    setSelectedReferral(referral)
  }

  const handleChatSend = async (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    }
    setChatMessages([...chatMessages, newMessage])

    // Check if chat service is available
    if (!chatService) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Chat-bot er ikke konfigurert. Vennligst legg til VITE_OPENAI_API_KEY og VITE_OPENAI_ASSISTANT_ID i .env-filen.',
        sender: 'ai',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
      return
    }

    // Send to OpenAI Assistant with streaming
    setIsChatLoading(true)

    // Create a placeholder AI message that will be updated as chunks arrive
    const aiMessageId = (Date.now() + 1).toString()
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, aiMessage])

    let accumulatedText = ''

    // Build referral context if referrals are available
    let referralContext = ''
    if (referrals.length > 0) {
      referralContext = referrals.map((ref, idx) => {
        let contextStr = `Henvisning ${idx + 1} (${ref.referralNumber}):
Oppsummering: ${ref.assessment?.keySummary || 'Ikke vurdert ennå'}
Tentativ diagnose: ${ref.assessment?.tentativeDiagnosis || 'Ukjent'}
Prioritetsgruppe: ${ref.assessment?.priorityGroup || 'Ikke vurdert'}`

        if (ref.assessment?.guidelineDescription) {
          contextStr += `\nOmtale i prioriteringsveileder: ${ref.assessment.guidelineDescription.conditions.map(c => c.name).join(', ')}`
        }

        contextStr += `\n\nFullstendig tekst:\n${ref.fullText.substring(0, 500)}...\n---`
        return contextStr
      }).join('\n\n')
    }

    try {
      await chatService.sendMessageStreaming(
        message,
        // onChunk - called for each text chunk
        (chunk: string, shouldReplace?: boolean) => {
          if (shouldReplace) {
            // Replace entire text (used for citation cleaning)
            accumulatedText = chunk
          } else {
            // Append chunk
            accumulatedText += chunk
          }
          setChatMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg
            )
          )
        },
        // onComplete - called when streaming is done
        () => {
          setIsChatLoading(false)
        },
        // onError - called if an error occurs
        (error: Error) => {
          console.error('Chat error:', error)
          setChatMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    text: error.message || 'Beklager, det oppstod en feil. Prøv igjen.'
                  }
                : msg
            )
          )
          setIsChatLoading(false)
        },
        // referralContext - pass referral information for context
        referralContext || undefined
      )
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text:
                  error instanceof Error
                    ? error.message
                    : 'Beklager, det oppstod en feil. Prøv igjen.'
              }
            : msg
        )
      )
      setIsChatLoading(false)
    }
  }

  const handleRequestRejectionLetter = (referral: Referral) => {
    // Open chatbot
    setIsChatOpen(true)

    // Check if this is a wrong specialty rejection
    const isWrongSpecialty = referral.assessment?.rejection?.wrongSpecialty
    const correctSpecialty = referral.assessment?.rejection?.correctSpecialty

    let message: string

    if (isWrongSpecialty) {
      // Generate letter for wrong specialty
      message = `Skriv et forslag til avslagsbrev for Henvisning #${referral.referralNumber} som er rettet til feil fagfelt.

Bruk følgende informasjon:
- Tentativ diagnose: ${referral.assessment?.tentativeDiagnosis || 'Ukjent'}
- Nøkkeloppsummering: ${referral.assessment?.keySummary || 'Ingen oppsummering'}
- Riktig fagfelt: ${correctSpecialty || 'et annet fagfelt'}

Brevet skal:
1. Være høflig og profesjonelt
2. Forklare at problemstillingen faller utenfor ortopedisk avdelings ansvarsområde
3. Angi at henvisningen tilhører ${correctSpecialty || 'et annet fagfelt'}
4. Anbefale at fastlegen sender en ny henvisning til riktig fagavdeling
5. Være konstruktivt og veiledende (ikke kritiserende)
6. Nevne at pasienten kan kontakte fastlegen for videre oppfølging

Eksempel på struktur:
- Takk for henvisningen
- Forklare at vi har vurdert saken
- Klargjøre at dette er utenfor vårt fagområde
- Anbefale korrekt fagavdeling
- Oppfordre til ny henvisning til rett instans`
    } else {
      // Generate letter for regular rejection (missing info, primary care actions)
      message = `Skriv et forslag til avslagsbrev for Henvisning #${referral.referralNumber}.

Bruk følgende informasjon:
- Tentativ diagnose: ${referral.assessment?.tentativeDiagnosis || 'Ukjent'}
- Nøkkeloppsummering: ${referral.assessment?.keySummary || 'Ingen oppsummering'}

${referral.assessment?.rejection?.missingInformation && referral.assessment.rejection.missingInformation.length > 0
  ? `Manglende informasjon:
${referral.assessment.rejection.missingInformation.map(info => `- ${info}`).join('\n')}`
  : ''}

${referral.assessment?.rejection?.expectedPrimaryCareActions && referral.assessment.rejection.expectedPrimaryCareActions.length > 0
  ? `Forventet tiltak i primærhelsetjenesten:
${referral.assessment.rejection.expectedPrimaryCareActions.map(action => `- ${action}`).join('\n')}`
  : ''}

Brevet skal:
1. Være høflig og profesjonelt
2. Forklare hvorfor henvisningen ikke kan tas til følge for øyeblikket
3. Liste opp hva som mangler
4. Gi klare anbefalinger til fastlegen om tiltak som bør gjøres først
5. Oppfordre til ny henvisning når anbefalte tiltak er gjennomført`
    }

    // Send the message
    handleChatSend(message)
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
  }

  return (
    <div className="app">
      <Header />
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-message">
            <div className="spinner"></div>
            <p>{processingProgress}</p>
          </div>
        </div>
      )}
      <div className="main-content">
        <LeftPanel
          referrals={referrals}
          onReferralSelect={handleReferralSelect}
          selectedReferralId={selectedReferral?.id}
          onRequestRejectionLetter={handleRequestRejectionLetter}
        />
        <div className="divider" />
        <RightPanel
          selectedReferral={selectedReferral}
          onFileUpload={handleFileUpload}
          hasUploadedFile={!!uploadedFile}
          isProcessing={isProcessing}
        />
      </div>
      <FloatingChatBot
        messages={chatMessages}
        onSend={handleChatSend}
        isLoading={isChatLoading}
        isOpen={isChatOpen}
        onToggle={toggleChat}
      />
    </div>
  )
}

export default App
