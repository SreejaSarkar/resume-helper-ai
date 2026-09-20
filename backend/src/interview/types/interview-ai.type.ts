export interface InterviewReadinessResult {
  candidateName: string;
  readinessScore: number;
  roleFitSummary: string;
  strengthsToLead: string[];
  focusAreas: InterviewFocusArea[];
  generalQuestions: InterviewQuestion[];
  experiences: InterviewExperienceBlock[];
}

export interface InterviewFocusArea {
  area: string;
  reason: string;
  practicePrompt: string;
}

export interface InterviewQuestion {
  question: string;
  whyAsked: string;
  answerStrategy: string;
  supportingEvidence: string[];
}

export interface InterviewExperienceBlock {
  title: string;
  relevance: string;
  questions: InterviewQuestion[];
  talkingPoints: string[];
  evaluationFocus: string;
  followUpRisk: string;
}
