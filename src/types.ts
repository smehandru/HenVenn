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
  differentialDiagnoses?: string[]; // Optional - bare hvis relevant
  recommendedDeadline?: {
    deadline: string; // F.eks. "4 uker"
    reasoning: string; // Forklaring av hvorfor
    guidelineReference?: string; // F.eks. "Side 12 i prioriteringsveilederen"
  };
  priorityGroup: 'red' | 'orange' | 'green' | 'rejected';
  rejection?: {
    reason: string; // Hvorfor henvisningen avvises
    missingInformation: string[]; // Hva som mangler
    primaryCareActions: string[]; // Tiltak i primærhelsetjenesten
  };
}

export type PriorityGroup = 'red' | 'orange' | 'green' | 'rejected';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}
