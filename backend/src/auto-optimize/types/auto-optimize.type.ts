import {
  KeywordCoverage,
  LearningSuggestion,
  SectionAnalysis,
} from '../../ai/types/resume-analysis.type';

export type GapPriority = 'critical' | 'important' | 'nice_to_have';

export interface SkillGapItem {
  skill: string;
  priority: GapPriority;
  whyItMatters: string;
  actionPlan: string;
  evidenceHints: string[];
}

export interface TransferableStrength {
  title: string;
  evidence: string[];
  positioningTip: string;
}

export interface ProofSuggestion {
  focus: string;
  suggestions: string[];
}

export interface SectionPriorityAction {
  section: string;
  status: 'keep' | 'improve';
  action: string;
}

export interface SkillGapBridgeResult {
  candidateName: string;
  score: number;
  roleSummary: string;
  summary: string;
  keywordCoverage: KeywordCoverage;
  matchedSkills: string[];
  criticalGaps: SkillGapItem[];
  transferableStrengths: TransferableStrength[];
  proofSuggestions: ProofSuggestion[];
  sectionPriorities: SectionPriorityAction[];
  quickWins: string[];
  learningPlan: LearningSuggestion[];
  sectionAnalysis: SectionAnalysis[];
}

