import './RightPanel.css'
import ChatBot from './ChatBot'
import FileUpload from './FileUpload'
import { Referral, ChatMessage } from '../types'

interface RightPanelProps {
  selectedReferral: Referral | null
  chatMessages: ChatMessage[]
  onChatSend: (message: string) => void
  onFileUpload: (file: File) => void
  hasUploadedFile: boolean
}

const RightPanel = ({ selectedReferral, chatMessages, onChatSend, onFileUpload, hasUploadedFile }: RightPanelProps) => {
  return (
    <div className="right-panel">
      <div className="scrollable-content">
        <FileUpload onFileUpload={onFileUpload} />

        {hasUploadedFile && (
          selectedReferral ? (
            <div className="referral-display">
              <h2>Henvisning #{selectedReferral.referralNumber}</h2>
              <div className="referral-text">
                <h3>Pasientinformasjon</h3>
                <p><strong>Navn:</strong> {selectedReferral.patientInfo.name}</p>
                <p><strong>Alder:</strong> {selectedReferral.patientInfo.age} år</p>
                <p><strong>Kjønn:</strong> {selectedReferral.patientInfo.gender}</p>

                <h3>Fullstendig henvisningstekst</h3>
                <div className="full-text">
                  {selectedReferral.fullText}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>Velg en henvisning fra venstre panel for å se detaljer</p>
            </div>
          )
        )}
      </div>
      <ChatBot
        messages={chatMessages}
        onSend={onChatSend}
        placeholder="Spør hvorfor AI vurderte slik..."
      />
    </div>
  )
}

export default RightPanel
