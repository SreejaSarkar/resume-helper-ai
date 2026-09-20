import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  ProofSuggestion,
  SectionPriorityAction,
  SkillGapBridgeResult,
  SkillGapItem,
  TransferableStrength,
} from './types/auto-optimize.type';
import { cohere } from '../config/cohere.config';
import { buildResumeGrounding } from '../ai/resume-grounding.util';

@Injectable()
export class AutoOptimizeService {
  async generateSkillGapBridge(
    resumeText: string,
    jobDescription: string,
  ): Promise<SkillGapBridgeResult> {
    const grounding = buildResumeGrounding(resumeText, jobDescription);
    const fallback = this.buildFallbackResult(grounding);

    if (!grounding.analysis.canUseAi) {
      return fallback;
    }

    const prompt = `
You are a resume strategist helping a candidate close skill gaps for a target role.

STRICT RULES:
- Do NOT invent new experience, companies, skills, or education
- Keep everything truthful
- Use the deterministic evidence below as the source of truth for job alignment and missing coverage
- Recommend truthful positioning and evidence-building steps only
- Return ONLY valid JSON, no markdown, no extra text

JSON format:
{
  "summary": string,
  "criticalGaps": [
    {
      "skill": string,
      "priority": "critical" | "important" | "nice_to_have",
      "whyItMatters": string,
      "actionPlan": string,
      "evidenceHints": string[]
    }
  ],
  "transferableStrengths": [
    {
      "title": string,
      "evidence": string[],
      "positioningTip": string
    }
  ],
  "proofSuggestions": [
    {
      "focus": string,
      "suggestions": string[]
    }
  ],
  "quickWins": string[]
}

Deterministic evidence:
${JSON.stringify(
      {
        score: grounding.analysis.score,
        summary: grounding.analysis.summary,
        matchedSkills: grounding.analysis.matchedSkills,
        missingSkills: grounding.analysis.missingSkills,
        strengths: grounding.analysis.strengths,
        improvements: grounding.analysis.improvements,
        keywordCoverage: grounding.analysis.keywordCoverage,
        sectionAnalysis: grounding.analysis.sectionAnalysis,
        candidateName: grounding.candidateName,
        headline: grounding.headline,
        skills: grounding.skills,
        education: grounding.education,
        certifications: grounding.certifications,
        narrativeBlocks: grounding.narrativeBlocks,
        learningPlan: grounding.analysis.learningSuggestions,
      },
      null,
      2,
    )}

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

    try {
      const response = await cohere.chat({
        model: 'command-r7b-12-2024',
        message: prompt,
        temperature: 0.2,
      });

      if (!response?.text) {
        return fallback;
      }

      const parsed = this.safeParseJson(response.text);

      if (!this.isValidResult(parsed)) {
        return fallback;
      }

      return this.mergeWithFallback(parsed, fallback);
    } catch (error) {
      console.error('Skill gap bridge AI fallback:', error);
      return fallback;
    }
  }

  private safeParseJson(text: string): unknown {
    try {
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();

      let depth = 0;
      let start = -1;
      let end = -1;

      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '{') {
          if (depth === 0) start = i;
          depth++;
        } else if (cleaned[i] === '}') {
          depth--;
          if (depth === 0) {
            end = i + 1;
            break;
          }
        }
      }

      if (start === -1 || end === -1) {
        throw new Error('No complete JSON object found');
      }

      return JSON.parse(cleaned.slice(start, end));
    } catch {
      console.error('AI RAW RESPONSE:\n', text);
      throw new InternalServerErrorException('AI returned malformed JSON');
    }
  }

  private isValidResult(data: unknown): data is SkillGapBridgeResult {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const result = data as Record<string, unknown>;

    return (
      typeof result.summary === 'string' &&
      Array.isArray(result.criticalGaps) &&
      Array.isArray(result.transferableStrengths) &&
      Array.isArray(result.proofSuggestions) &&
      Array.isArray(result.quickWins)
    );
  }

  private buildFallbackResult(
    grounding: ReturnType<typeof buildResumeGrounding>,
  ): SkillGapBridgeResult {
    const criticalGaps = grounding.analysis.missingSkills
      .slice(0, 4)
      .map((skill, index) => this.buildGapItem(skill, index, grounding));

    return {
      candidateName: grounding.candidateName,
      score: grounding.analysis.score,
      roleSummary: grounding.headline,
      summary: this.buildFallbackSummary(grounding),
      keywordCoverage: grounding.analysis.keywordCoverage,
      matchedSkills: grounding.analysis.matchedSkills,
      criticalGaps,
      transferableStrengths: this.buildTransferableStrengths(grounding),
      proofSuggestions: this.buildProofSuggestions(grounding, criticalGaps),
      sectionPriorities: this.buildSectionPriorities(grounding),
      quickWins: grounding.analysis.improvements.slice(0, 4),
      learningPlan: grounding.analysis.learningSuggestions,
      sectionAnalysis: grounding.analysis.sectionAnalysis,
    };
  }

  private buildFallbackSummary(
    grounding: ReturnType<typeof buildResumeGrounding>,
  ): string {
    const summaryParts = [
      grounding.analysis.summary,
      grounding.analysis.keywordCoverage.total > 0
        ? `You already match ${grounding.analysis.keywordCoverage.matched} of ${grounding.analysis.keywordCoverage.total} tracked job keywords.`
        : '',
      grounding.analysis.missingSkills[0]
        ? `Your highest-impact next step is to build credible evidence around ${grounding.analysis.missingSkills[0]}.`
        : '',
    ].filter(Boolean);

    return summaryParts.join(' ');
  }

  private buildGapItem(
    skill: string,
    index: number,
    grounding: ReturnType<typeof buildResumeGrounding>,
  ): SkillGapItem {
    const relatedBlock = grounding.narrativeBlocks.find((block) =>
      block.bullets.some((bullet) =>
        bullet.toLowerCase().includes(skill.toLowerCase()),
      ),
    );

    return {
      skill,
      priority: index === 0 ? 'critical' : index === 1 ? 'important' : 'nice_to_have',
      whyItMatters: `The job description calls out ${skill}, so recruiters will look for direct evidence or a credible path toward it.`,
      actionPlan: relatedBlock
        ? `Reframe ${relatedBlock.title} to emphasize adjacent work and measurable outcomes connected to ${skill}.`
        : `Add a truthful project, learning sprint, or impact bullet that shows progress toward ${skill}.`,
      evidenceHints: relatedBlock?.bullets.slice(0, 2) ?? [
        `Mention the workflow, tools, or deliverables most adjacent to ${skill}.`,
        `Add one quantified outcome that makes your experience around ${skill} believable.`,
      ],
    };
  }

  private buildTransferableStrengths(
    grounding: ReturnType<typeof buildResumeGrounding>,
  ): TransferableStrength[] {
    const matched = grounding.analysis.matchedSkills.slice(0, 3);

    if (matched.length === 0) {
      return grounding.narrativeBlocks.slice(0, 2).map((block) => ({
        title: block.title,
        evidence: block.bullets.slice(0, 2),
        positioningTip:
          'Use this experience to demonstrate ownership, scope, and measurable impact for the target role.',
      }));
    }

    return matched.map((skill) => {
      const evidence = grounding.narrativeBlocks
        .flatMap((block) => block.bullets)
        .filter((bullet) => bullet.toLowerCase().includes(skill.toLowerCase()))
        .slice(0, 2);

      return {
        title: skill,
        evidence:
          evidence.length > 0 ? evidence : grounding.analysis.strengths.slice(0, 2),
        positioningTip: `Move ${skill} closer to the top of the resume and connect it to outcomes, not just tool familiarity.`,
      };
    });
  }

  private buildProofSuggestions(
    grounding: ReturnType<typeof buildResumeGrounding>,
    criticalGaps: SkillGapItem[],
  ): ProofSuggestion[] {
    const skillSuggestions = criticalGaps.slice(0, 3).map((gap) => ({
      focus: gap.skill,
      suggestions: [
        `Add one bullet that ties ${gap.skill} to a deliverable, scope, or business result.`,
        `If ${gap.skill} is adjacent to your current stack, explain the workflow and impact so it reads as credible experience rather than keyword stuffing.`,
      ],
    }));

    const sectionSuggestions = grounding.analysis.sectionAnalysis
      .filter((section) => !section.present)
      .slice(0, 2)
      .map((section) => ({
        focus: `${section.section} section`,
        suggestions: [section.feedback],
      }));

    return [...skillSuggestions, ...sectionSuggestions].slice(0, 4);
  }

  private buildSectionPriorities(
    grounding: ReturnType<typeof buildResumeGrounding>,
  ): SectionPriorityAction[] {
    return grounding.analysis.sectionAnalysis.map((section) => ({
      section: section.section,
      status: section.present ? 'keep' : 'improve',
      action: section.present
        ? `Keep ${section.section}, but tailor the language more directly to the target role.`
        : section.feedback,
    }));
  }

  private mergeWithFallback(
    result: SkillGapBridgeResult,
    fallback: SkillGapBridgeResult,
  ): SkillGapBridgeResult {
    return {
      candidateName: fallback.candidateName,
      score: fallback.score,
      roleSummary: fallback.roleSummary,
      summary: result.summary || fallback.summary,
      keywordCoverage: fallback.keywordCoverage,
      matchedSkills:
        result.matchedSkills?.length > 0
          ? this.takeUnique(result.matchedSkills)
          : fallback.matchedSkills,
      criticalGaps:
        result.criticalGaps?.length > 0
          ? result.criticalGaps
          : fallback.criticalGaps,
      transferableStrengths:
        result.transferableStrengths?.length > 0
          ? result.transferableStrengths
          : fallback.transferableStrengths,
      proofSuggestions:
        result.proofSuggestions?.length > 0
          ? result.proofSuggestions
          : fallback.proofSuggestions,
      sectionPriorities: fallback.sectionPriorities,
      quickWins:
        result.quickWins?.length > 0
          ? this.takeUnique(result.quickWins)
          : fallback.quickWins,
      learningPlan: fallback.learningPlan,
      sectionAnalysis: fallback.sectionAnalysis,
    };
  }

  private takeUnique(values: string[]) {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  }
}
