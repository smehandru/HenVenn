import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import { Referral, ChatMessage } from './types'
import { mockReferrals } from './mockData'

function App() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    // TODO: Process PDF and extract referrals with AI
    // For now, we'll load mock data
    console.log('File uploaded:', file.name)

    // Simulate processing delay
    setTimeout(() => {
      setReferrals(mockReferrals)
    }, 1500)
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
        />
      </div>
    </div>
  )
}

export default App
