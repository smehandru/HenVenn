export interface Referral {
  id: string;
  referralNumber: number;
  patientInfo: {
    name: string;
    age: number;
    gender: string;
  };
  symptoms: string[];
  duration: string;
  redFlags: string[];
  fullText: string;
  assessment?: ReferralAssessment;
}

export interface ReferralAssessment {
  keySummary: string;
  tentativeDiagnosis: string;
  differentialDiagnoses: string[];
  recommendedDeadline: string;
  priorityGroup: 'red' | 'orange' | 'green' | 'rejected';
  rejectionReason?: string;
}

export type PriorityGroup = 'red' | 'orange' | 'green' | 'rejected';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}
