import './LeftPanel.css'
import TriageGroups from './TriageGroups'
import { Referral } from '../types'

interface LeftPanelProps {
  referrals: Referral[]
  onReferralSelect: (referral: Referral) => void
  selectedReferralId?: string
  hasUploadedFile?: boolean
}

const LeftPanel = ({
  referrals,
  onReferralSelect,
  selectedReferralId,
  hasUploadedFile = false
}: LeftPanelProps) => {
  return (
    <div className="left-panel">
      <div className="panel-header">
        <h2>Henvisningstriagering</h2>
      </div>
      <div className="scrollable-content">
        {!hasUploadedFile ? (
          <div className="left-instruction">
            <p>Henvisninger skal her triageres etter anbefalt inntaksfrist</p>
            <p>Trykk på nedtrekksmenyene for å se anbefalingene</p>
          </div>
        ) : (
          <TriageGroups
            referrals={referrals}
            onReferralSelect={onReferralSelect}
            selectedReferralId={selectedReferralId}
          />
        )}
      </div>
    </div>
  )
}

export default LeftPanel
