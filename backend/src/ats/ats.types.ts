export interface ATSScoreResult {
  atsScore: number;
  breakdown: {
    keywordScore: number;
    formattingScore: number;
    sectionScore: number;
    readabilityScore: number;
    penalty: number;
  };
  missingKeywords: string[];
  issues: string[];
}
