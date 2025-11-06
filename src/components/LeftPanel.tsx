import { useState } from 'react'
import './LeftPanel.css'
import FileUpload from './FileUpload'
import TriageGroups from './TriageGroups'
import ChatBot from './ChatBot'
import { Referral, ChatMessage } from '../types'

interface LeftPanelProps {
  referrals: Referral[]
  onReferralSelect: (referral: Referral) => void
  selectedReferralId?: string
  onFileUpload: (file: File) => void
  chatMessages: ChatMessage[]
  onChatSend: (message: string) => void
  hasUploadedFile: boolean
}

const LeftPanel = ({
  referrals,
  onReferralSelect,
  selectedReferralId,
  onFileUpload,
  chatMessages,
  onChatSend,
  hasUploadedFile
}: LeftPanelProps) => {
  return (
    <div className="left-panel">
      <div className="scrollable-content">
        <FileUpload onFileUpload={onFileUpload} />
        {hasUploadedFile && (
          <TriageGroups
            referrals={referrals}
            onReferralSelect={onReferralSelect}
            selectedReferralId={selectedReferralId}
          />
        )}
      </div>
      <ChatBot
        messages={chatMessages}
        onSend={onChatSend}
        placeholder="Stil spørsmål om triageringen..."
      />
    </div>
  )
}

export default LeftPanel
