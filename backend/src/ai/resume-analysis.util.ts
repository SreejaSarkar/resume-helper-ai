import {
  KeywordCoverage,
  LearningSuggestion,
  ResumeAnalysisAIResult,
  SectionAnalysis,
} from './types/resume-analysis.type';
import { extractKeywords, normalizeText } from '../ats/ats.utils';

const REQUIRED_SECTIONS = [
  {
    section: 'experience',
    patterns: ['experience', 'employment', 'work history', 'professional experience'],
    missingFeedback: 'Add a clearer experience section with role, company, impact, and measurable outcomes.',
  },
  {
    section: 'skills',
    patterns: ['skills', 'technical skills', 'core competencies', 'tooling'],
    missingFeedback: 'Add a dedicated skills section so recruiters and ATS systems can find core technologies quickly.',
  },
  {
    section: 'education',
    patterns: ['education', 'academic', 'degree', 'university', 'college'],
    missingFeedback: 'Add education details to strengthen completeness and screening confidence.',
  },
  {
    section: 'projects',
    patterns: ['projects', 'project experience', 'portfolio', 'case study'],
    missingFeedback: 'Add project highlights to show practical application of your skills.',
  },
  {
    section: 'summary',
    patterns: ['summary', 'profile', 'objective', 'professional summary'],
    missingFeedback: 'Add a short summary tailored to the target role for faster recruiter context.',
  },
];

const GENERIC_JOB_TERMS = new Set([
  'ability',
  'across',
  'candidate',
  'communication',
  'company',
  'customer',
  'deliver',
  'development',
  'environment',
  'experience',
  'including',
  'knowledge',
  'looking',
  'manage',
  'preferred',
  'requirements',
  'responsibilities',
  'responsible',
  'strong',
  'support',
  'team',
  'understanding',
  'using',
  'work',
  'working',
  'years',
]);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildResourceLink(
  type: 'course' | 'youtube' | 'docs',
  title: string,
  platform: string,
): string {
  const query = encodeURIComponent(`${title} ${platform}`);

  switch (platform.toLowerCase()) {
    case 'youtube':
      return `https://www.youtube.com/results?search_query=${query}`;
    case 'freecodecamp':
      return `https://www.freecodecamp.org/news/search/?query=${query}`;
    case 'coursera':
      return `https://www.coursera.org/search?query=${query}`;
    case 'mdn':
    case 'mozilla':
      return `https://developer.mozilla.org/en-US/search?q=${query}`;
    default:
      return `https://www.google.com/search?q=${query}`;
  }
}

function buildLearningSuggestions(missingSkills: string[]): LearningSuggestion[] {
  return missingSkills.slice(0, 3).map((skill) => ({
    skill,
    level: 'Beginner',
    resources: [
      {
        type: 'docs',
        title: `${skill} official documentation`,
        platform: 'Docs',
        url: buildResourceLink('docs', `${skill} official documentation`, 'docs'),
      },
      {
        type: 'youtube',
        title: `${skill} beginner tutorial`,
        platform: 'YouTube',
        url: buildResourceLink('youtube', `${skill} beginner tutorial`, 'youtube'),
      },
      {
        type: 'course',
        title: `${skill} practical fundamentals`,
        platform: 'freeCodeCamp',
        url: buildResourceLink('course', `${skill} practical fundamentals`, 'freecodecamp'),
      },
    ],
  }));
}

export interface DeterministicAnalysisResult extends ResumeAnalysisAIResult {
  canUseAi: boolean;
}

export function buildDeterministicAnalysis(
  resumeTextRaw: string,
  jobDescriptionRaw: string,
): DeterministicAnalysisResult {
  const resumeText = normalizeText(resumeTextRaw);
  const jobDescription = normalizeText(jobDescriptionRaw);

  const sectionAnalysis: SectionAnalysis[] = REQUIRED_SECTIONS.map((entry) => {
    const present = entry.patterns.some((pattern) => resumeText.includes(pattern));

    return {
      section: entry.section,
      present,
      feedback: present
        ? `Good ${entry.section} coverage detected.`
        : entry.missingFeedback,
    };
  });

  const presentSections = sectionAnalysis.filter((section) => section.present).length;
  const likelyResume = presentSections >= 2 && /experience|education|skills|projects/.test(resumeText);

  const extractedKeywords = uniqueStrings(
    extractKeywords(jobDescriptionRaw).filter(
      (keyword) => keyword.length > 2 && !GENERIC_JOB_TERMS.has(keyword),
    ),
  ).slice(0, 30);

  const validJobDescription =
    jobDescriptionRaw.trim().length >= 80 && extractedKeywords.length >= 4;

  if (!likelyResume) {
    return {
      score: 0,
      summary:
        'The uploaded file does not look like a structured resume. Upload a resume with clear experience, skills, and education sections.',
      recommendation: 'weak_match',
      matchedSkills: [],
      missingSkills: [],
      strengths: [],
      improvements: ['Upload a valid resume or CV in PDF format with clear professional sections.'],
      learningSuggestions: [],
      keywordCoverage: {
        matched: 0,
        total: 0,
        percentage: 0,
      },
      sectionAnalysis,
      canUseAi: false,
    };
  }

  if (!validJobDescription) {
    return {
      score: 0,
      summary:
        'The job description is too short or too generic to produce a useful AI assessment. Paste the full role description with responsibilities and required skills.',
      recommendation: 'needs_work',
      matchedSkills: [],
      missingSkills: [],
      strengths: ['Resume parsing succeeded, but the job description needs more detail.'],
      improvements: [
        'Paste the full job description, not only the title or a short summary.',
        'Include responsibilities, required skills, and tools from the target role.',
        'Provide enough role context so the analyzer can score the resume accurately.',
      ],
      learningSuggestions: [],
      keywordCoverage: {
        matched: 0,
        total: extractedKeywords.length,
        percentage: 0,
      },
      sectionAnalysis,
      canUseAi: false,
    };
  }

  const matchedSkills = extractedKeywords.filter((keyword) => resumeText.includes(keyword));
  const missingSkills = extractedKeywords.filter((keyword) => !resumeText.includes(keyword));

  const keywordCoverage: KeywordCoverage = {
    matched: matchedSkills.length,
    total: extractedKeywords.length,
    percentage:
      extractedKeywords.length === 0
        ? 0
        : Math.round((matchedSkills.length / extractedKeywords.length) * 100),
  };

  const hasBulletPoints = /•|-\s|\*\s/.test(resumeTextRaw);
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(resumeTextRaw);
  const hasPhone = /\+?\d[\d\s().-]{8,}/.test(resumeTextRaw);
  const readableLength = resumeTextRaw.trim().length >= 500;

  const keywordScore = Math.round((keywordCoverage.percentage / 100) * 65);
  const sectionScore = Math.round((presentSections / sectionAnalysis.length) * 20);
  let formattingScore = 15;

  if (!hasBulletPoints) {
    formattingScore -= 4;
  }

  if (!hasEmail) {
    formattingScore -= 3;
  }

  if (!hasPhone) {
    formattingScore -= 3;
  }

  if (!readableLength) {
    formattingScore -= 5;
  }

  formattingScore = clamp(formattingScore, 0, 15);

  let score = keywordScore + sectionScore + formattingScore;

  if (keywordCoverage.percentage < 25 && extractedKeywords.length >= 6) {
    score = Math.min(score, 45);
  }

  if (matchedSkills.length === 0 && extractedKeywords.length > 0) {
    score = Math.min(score, 20);
  }

  score = clamp(Math.round(score), 0, 100);

  const recommendation =
    score >= 80
      ? 'strong_match'
      : score >= 60
        ? 'good_foundation'
        : score >= 40
          ? 'needs_work'
          : 'weak_match';

  const strengths = uniqueStrings([
    keywordCoverage.percentage >= 60
      ? `Strong alignment with ${matchedSkills.length} required job keywords.`
      : '',
    presentSections >= 4 ? 'Resume includes most core ATS-friendly sections.' : '',
    hasBulletPoints ? 'Bullet formatting makes the resume easier to scan.' : '',
    hasEmail && hasPhone ? 'Contact information is clearly detectable.' : '',
  ]).slice(0, 4);

  const improvements = uniqueStrings([
    missingSkills[0]
      ? `Add direct evidence of ${missingSkills[0]} through projects, tools, or measurable outcomes.`
      : '',
    missingSkills[1]
      ? `Tailor the resume to mention ${missingSkills[1]} where you have real experience.`
      : '',
    ...sectionAnalysis.filter((section) => !section.present).map((section) => section.feedback),
    !hasBulletPoints
      ? 'Use bullet points for achievements so recruiters and ATS systems can scan impact faster.'
      : '',
    !readableLength
      ? 'Expand the resume with clearer project impact, technologies, and quantified achievements.'
      : '',
  ]).slice(0, 6);

  const summary =
    score >= 75
      ? `This resume is a credible fit for the role, matching ${keywordCoverage.matched} of ${keywordCoverage.total} tracked job keywords with solid section coverage.`
      : `This resume needs more tailoring for the target role. It matches ${keywordCoverage.matched} of ${keywordCoverage.total} tracked job keywords and still has clear coverage gaps.`;

  return {
    score,
    summary,
    recommendation,
    matchedSkills: matchedSkills.slice(0, 12),
    missingSkills: missingSkills.slice(0, 12),
    strengths,
    improvements:
      improvements.length > 0
        ? improvements
        : ['Tailor the resume more directly to the target role and responsibilities.'],
    learningSuggestions: buildLearningSuggestions(missingSkills),
    keywordCoverage,
    sectionAnalysis,
    canUseAi: true,
  };
}