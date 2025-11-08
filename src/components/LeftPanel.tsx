import './LeftPanel.css'
import TriageGroups from './TriageGroups'
import { Referral } from '../types'

interface LeftPanelProps {
  referrals: Referral[]
  onReferralSelect: (referral: Referral) => void
  selectedReferralId?: string
}

const LeftPanel = ({
  referrals,
  onReferralSelect,
  selectedReferralId
}: LeftPanelProps) => {
  return (
    <div className="left-panel">
      <div className="scrollable-content">
        <TriageGroups
          referrals={referrals}
          onReferralSelect={onReferralSelect}
          selectedReferralId={selectedReferralId}
        />
      </div>
    </div>
  )
}

export default LeftPanel
