import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { cohere } from '../config/cohere.config';
import {
  LearningSuggestion,
  ResumeAnalysisAIResult,
} from './types/resume-analysis.type';
import { buildDeterministicAnalysis } from './resume-analysis.util';

interface CohereChatResponse {
  text: string;
}

interface ResumeAnalysisCoachResponse {
  summary: string;
  strengths: string[];
  improvements: string[];
  learningSuggestions: LearningSuggestion[];
}

@Injectable()
export class AiService {
  async analyze(
    resumeText: string,
    jobDescription: string,
  ): Promise<ResumeAnalysisAIResult> {
    const MAX_CHARS = 12000;

    resumeText = resumeText.slice(0, MAX_CHARS);
    jobDescription = jobDescription.slice(0, 2000);

    const deterministic = buildDeterministicAnalysis(resumeText, jobDescription);

    if (!deterministic.canUseAi) {
      return deterministic;
    }

    const prompt = `You are an elite resume coach.

You are given:
1. A parsed resume
2. A job description
3. Deterministic ATS evidence already computed by the system

Your task is NOT to rescore the resume from scratch.
Your task is to produce concise, evidence-based coaching that stays strictly grounded in the provided evidence.

RULES:
- Do not invent experience, projects, tools, or certifications.
- Do not mention skills that are not present in the evidence lists.
- Keep language practical, recruiter-friendly, and actionable.
- Return ONLY valid JSON.

Required JSON:
{
  "summary": string,
  "strengths": string[],
  "improvements": string[],
  "learningSuggestions": [
    {
      "skill": string,
      "level": "Beginner" | "Intermediate",
      "resources": [
        {
          "type": "course" | "youtube" | "docs",
          "title": string,
          "platform": string
        }
      ]
    }
  ]
}

Deterministic evidence:
${JSON.stringify(
      {
        score: deterministic.score,
        recommendation: deterministic.recommendation,
        matchedSkills: deterministic.matchedSkills,
        missingSkills: deterministic.missingSkills,
        keywordCoverage: deterministic.keywordCoverage,
        sectionAnalysis: deterministic.sectionAnalysis,
        strengths: deterministic.strengths,
      },
      null,
      2,
    )}

Resume:
${resumeText}

Job Description:
${jobDescription}`;

    try {
      const response = await this.callCohere(prompt);
      const content = response.text;

      if (!content) {
        return deterministic;
      }

      const raw: unknown = JSON.parse(this.extractJson(content));

      if (!this.isValidCoachResult(raw)) {
        return deterministic;
      }

      return {
        ...deterministic,
        summary: raw.summary || deterministic.summary,
        strengths: this.takeUniqueStrings([
          ...deterministic.strengths,
          ...raw.strengths,
        ], 5),
        improvements: this.takeUniqueStrings([
          ...raw.improvements,
          ...deterministic.improvements,
        ], 6),
        learningSuggestions:
          raw.learningSuggestions.length > 0
            ? this.attachResourceUrls(raw.learningSuggestions)
            : deterministic.learningSuggestions,
      };
    } catch (e) {
      console.error('AI enrichment fallback:', e);
      return deterministic;
    }
  }

  /* ---------------- VALIDATION ---------------- */

  private isValidCoachResult(data: unknown): data is ResumeAnalysisCoachResponse {
    if (typeof data !== 'object' || data === null) return false;

    const obj = data as Record<string, unknown>;

    return (
      typeof obj.summary === 'string' &&
      Array.isArray(obj.strengths) &&
      obj.strengths.every((s) => typeof s === 'string') &&
      Array.isArray(obj.improvements) &&
      obj.improvements.every((i) => typeof i === 'string') &&
      Array.isArray(obj.learningSuggestions) &&
      obj.learningSuggestions.every((ls) => this.isValidLearningSuggestion(ls))
    );
  }

  private isValidLearningSuggestion(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) return false;

    const ls = data as Record<string, unknown>;

    return (
      typeof ls.skill === 'string' &&
      (ls.level === 'Beginner' || ls.level === 'Intermediate') &&
      Array.isArray(ls.resources) &&
      ls.resources.every((r) => this.isValidLearningResource(r))
    );
  }

  /* ---------------- HELPERS ---------------- */

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private extractJson(text: string): string {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new InternalServerErrorException('No JSON found in AI response');
    }
    return match[0];
  }

  private takeUniqueStrings(values: string[], limit: number): string[] {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(
      0,
      limit,
    );
  }

  private attachResourceUrls(
    suggestions: LearningSuggestion[],
  ): LearningSuggestion[] {
    return suggestions.map((ls) => ({
      ...ls,
      resources: ls.resources.map((resource) => ({
        ...resource,
        url: this.buildResourceLink(
          resource.type,
          resource.title,
          resource.platform,
        ),
      })),
    }));
  }

  private buildResourceLink(
    type: 'course' | 'youtube' | 'docs',
    title: string,
    platform: string,
  ): string {
    const query = encodeURIComponent(`${title} ${platform}`);

    switch (platform.toLowerCase()) {
      case 'youtube':
        return `https://www.youtube.com/results?search_query=${query}`;

      case 'coursera':
        return `https://www.coursera.org/search?query=${query}`;

      case 'udemy':
        return `https://www.udemy.com/courses/search/?q=${query}`;

      case 'freecodecamp':
        return `https://www.freecodecamp.org/news/search/?query=${query}`;

      case 'mdn':
      case 'mozilla':
        return `https://developer.mozilla.org/en-US/search?q=${query}`;

      default:
        return `https://www.google.com/search?q=${query}`;
    }
  }

  private isValidLearningResource(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) return false;

    const r = data as Record<string, unknown>;

    return (
      (r.type === 'course' || r.type === 'youtube' || r.type === 'docs') &&
      typeof r.title === 'string' &&
      typeof r.platform === 'string'
    );
  }

  async callCohere(prompt: string, retries = 2): Promise<CohereChatResponse> {
    try {
      const res = await cohere.chat({
        model: 'command-r7b-12-2024',
        message: prompt,
        temperature: 0.2,
      });

      return {
        text: res.text,
      };
    } catch (err) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 800));
        return this.callCohere(prompt, retries - 1);
      }
      throw err;
    }
  }
}
