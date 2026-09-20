export interface LearningResource {
  type: 'course' | 'youtube' | 'docs';
  title: string;
  platform: string;
  url: string;
}

export interface LearningSuggestion {
  skill: string;
  level: 'Beginner' | 'Intermediate';
  resources: LearningResource[];
}

export interface KeywordCoverage {
  matched: number;
  total: number;
  percentage: number;
}

export interface SectionAnalysis {
  section: string;
  present: boolean;
  feedback: string;
}

export type AnalysisRecommendation =
  | 'strong_match'
  | 'good_foundation'
  | 'needs_work'
  | 'weak_match';

export interface ResumeAnalysisAIResult {
  score: number;
  summary: string;
  recommendation: AnalysisRecommendation;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  learningSuggestions: LearningSuggestion[];
  keywordCoverage: KeywordCoverage;
  sectionAnalysis: SectionAnalysis[];
}
