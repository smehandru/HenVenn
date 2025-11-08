import './RightPanel.css'
import FileUpload from './FileUpload'
import ResourceLinks from './ResourceLinks'
import { Referral } from '../types'

interface RightPanelProps {
  selectedReferral: Referral | null
  onFileUpload: (file: File) => void
  hasUploadedFile: boolean
  isProcessing?: boolean
}

const RightPanel = ({ selectedReferral, onFileUpload, hasUploadedFile, isProcessing = false }: RightPanelProps) => {
  return (
    <div className="right-panel">
      <ResourceLinks />
      <div className="scrollable-content">
        <FileUpload onFileUpload={onFileUpload} disabled={isProcessing} />

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
    </div>
  )
}

export default RightPanel
