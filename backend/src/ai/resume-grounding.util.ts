import { normalizeText } from '../ats/ats.utils';
import {
  buildDeterministicAnalysis,
  DeterministicAnalysisResult,
} from './resume-analysis.util';

const SECTION_PATTERNS: Array<{ key: ResumeSectionKey; patterns: string[] }> = [
  {
    key: 'summary',
    patterns: ['summary', 'profile', 'objective', 'professional summary'],
  },
  {
    key: 'experience',
    patterns: ['experience', 'work experience', 'employment', 'professional experience'],
  },
  {
    key: 'projects',
    patterns: ['projects', 'project experience', 'portfolio'],
  },
  {
    key: 'skills',
    patterns: ['skills', 'technical skills', 'core competencies', 'tooling'],
  },
  {
    key: 'education',
    patterns: ['education', 'academic background'],
  },
  {
    key: 'certifications',
    patterns: ['certifications', 'licenses', 'certificates'],
  },
];

type ResumeSectionKey =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'education'
  | 'certifications'
  | 'other';

export interface ResumeNarrativeBlock {
  title: string;
  bullets: string[];
  section: 'experience' | 'projects';
}

export interface ResumeGroundingResult {
  analysis: DeterministicAnalysisResult;
  candidateName: string;
  contactLine: string;
  headline: string;
  skills: string[];
  education: string[];
  certifications: string[];
  narrativeBlocks: ResumeNarrativeBlock[];
  sections: Record<ResumeSectionKey, string[]>;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function stripBullet(line: string) {
  return line.replace(/^[\s•*\-–]+/, '').trim();
}

function isBulletLine(line: string) {
  return /^[\s•*\-–]+/.test(line);
}

function detectSection(line: string): ResumeSectionKey | null {
  const normalized = normalizeText(line).replace(/[:|]/g, '').trim();

  for (const entry of SECTION_PATTERNS) {
    if (entry.patterns.some((pattern) => normalized === pattern)) {
      return entry.key;
    }
  }

  return null;
}

function emptySections(): Record<ResumeSectionKey, string[]> {
  return {
    summary: [],
    experience: [],
    projects: [],
    skills: [],
    education: [],
    certifications: [],
    other: [],
  };
}

function buildSections(resumeTextRaw: string): Record<ResumeSectionKey, string[]> {
  const sections = emptySections();
  const lines = resumeTextRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let currentSection: ResumeSectionKey = 'other';

  for (const line of lines) {
    const nextSection = detectSection(line);

    if (nextSection) {
      currentSection = nextSection;
      continue;
    }

    sections[currentSection].push(line);
  }

  return sections;
}

function pickCandidateName(sections: Record<ResumeSectionKey, string[]>, resumeTextRaw: string) {
  const topLines = resumeTextRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);

  const probableName = topLines.find(
    (line) =>
      !detectSection(line) &&
      line.length <= 60 &&
      /^[A-Za-z ,.'-]+$/.test(line) &&
      !/@/.test(line),
  );

  if (probableName) {
    return probableName;
  }

  const summaryFirstLine = sections.summary[0];
  return summaryFirstLine && summaryFirstLine.length <= 60
    ? summaryFirstLine
    : 'Candidate';
}

function pickContactLine(resumeTextRaw: string) {
  const matches = resumeTextRaw.match(
    /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{8,}|linkedin\.com\/[^\s]+)/gi,
  );

  if (!matches) {
    return 'Contact details available in resume';
  }

  return uniqueStrings(matches).slice(0, 3).join(' | ');
}

function pickHeadline(sections: Record<ResumeSectionKey, string[]>) {
  const summaryLines = sections.summary.slice(0, 2);
  if (summaryLines.length > 0) {
    return summaryLines.join(' ');
  }

  const otherLine = sections.other.find((line) => line.length > 30 && line.length < 180);
  return otherLine ?? 'Resume tailored for the target role.';
}

function extractSkills(sectionLines: string[]) {
  const tokens = sectionLines
    .flatMap((line) => line.split(/[|,;/•]/g))
    .map((token) => stripBullet(token))
    .filter((token) => token.length > 1 && token.length < 40);

  return uniqueStrings(tokens);
}

function extractFlatSection(sectionLines: string[]) {
  return uniqueStrings(sectionLines.map((line) => stripBullet(line))).slice(0, 8);
}

function buildNarrativeBlocks(
  section: 'experience' | 'projects',
  lines: string[],
): ResumeNarrativeBlock[] {
  const blocks: ResumeNarrativeBlock[] = [];
  let current: ResumeNarrativeBlock | null = null;

  for (const rawLine of lines) {
    const line = stripBullet(rawLine);
    if (!line) {
      continue;
    }

    const titleLike = !isBulletLine(rawLine) && line.length <= 100;

    if (titleLike) {
      if (current && current.bullets.length > 0) {
        blocks.push(current);
      }

      current = {
        title: line,
        bullets: [],
        section,
      };
      continue;
    }

    if (!current) {
      current = {
        title: section === 'experience' ? 'Professional Experience' : 'Project Work',
        bullets: [],
        section,
      };
    }

    current.bullets.push(line);
  }

  if (current && current.bullets.length > 0) {
    blocks.push(current);
  }

  return blocks.slice(0, 6);
}

export function buildResumeGrounding(
  resumeTextRaw: string,
  jobDescriptionRaw: string,
): ResumeGroundingResult {
  const sections = buildSections(resumeTextRaw);
  const analysis = buildDeterministicAnalysis(resumeTextRaw, jobDescriptionRaw);
  const candidateName = pickCandidateName(sections, resumeTextRaw);
  const contactLine = pickContactLine(resumeTextRaw);
  const headline = pickHeadline(sections);
  const narrativeBlocks = [
    ...buildNarrativeBlocks('experience', sections.experience),
    ...buildNarrativeBlocks('projects', sections.projects),
  ].slice(0, 8);

  return {
    analysis,
    candidateName,
    contactLine,
    headline,
    skills: extractSkills(sections.skills),
    education: extractFlatSection(sections.education),
    certifications: extractFlatSection(sections.certifications),
    narrativeBlocks,
    sections,
  };
}