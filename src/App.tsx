import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import { Referral, ChatMessage } from './types'
import { mockReferrals } from './mockData'
import { processReferralPDF } from './services/referralProcessor'
import { createAIService } from './services/aiService'

function App() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState<string>('')
  const [useMockData, setUseMockData] = useState(false)

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

  const handleChatSend = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    }
    setChatMessages([...chatMessages, newMessage])

    // TODO: Send to AI and get response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Dette er en mock respons fra AI-assistenten om henvisningen.',
        sender: 'ai',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiResponse])
    }, 1000)
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
        />
        <div className="divider" />
        <RightPanel
          selectedReferral={selectedReferral}
          chatMessages={chatMessages}
          onChatSend={handleChatSend}
          onFileUpload={handleFileUpload}
          hasUploadedFile={!!uploadedFile}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  )
}

export default App
