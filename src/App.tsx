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

    try {
      await chatService.sendMessageStreaming(
        message,
        // onChunk - called for each text chunk
        (chunk: string) => {
          accumulatedText += chunk
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
        }
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
          hasUploadedFile={!!uploadedFile}
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
      />
    </div>
  )
}

export default App
