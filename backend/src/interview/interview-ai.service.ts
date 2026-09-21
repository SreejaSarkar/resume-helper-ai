// interview-ai.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { cohere } from '../config/cohere.config';
import {
  StarStory,
  StarStoryBuilderResult,
  StoryUseCase,
} from './types/interview-ai.type';
import { buildResumeGrounding } from '../ai/resume-grounding.util';

@Injectable()
export class InterviewAiService {
  async generate(
    resumeText: string,
    jobDescription: string,
  ): Promise<StarStoryBuilderResult> {
    const grounding = buildResumeGrounding(resumeText, jobDescription);
    const fallback = this.buildFallbackStories(grounding);

    if (!grounding.analysis.canUseAi) {
      return fallback;
    }

    const prompt = `
You are a senior interview coach and storytelling strategist.

Using ONLY the candidate's RESUME content:
- Do NOT invent experience
- Do NOT add new technologies
- Base all story building strictly on what is written
- Use the deterministic plan below as the source of truth

TASK:
Build a reusable STAR story bank from the candidate's real resume.

Return:
1. A short role summary for how the candidate should position themselves
2. A story strategy line telling them how to use the stories
3. 2-4 strengths they should lead with
4. 3-5 STAR stories based on real resume evidence

Each STAR story must include:
- title
- bestUse: behavioral | technical | leadership | ownership | impact | conflict
- relevance to the role
- situation
- task
- action
- result
- a short recruiterVersion
- a deeper deepDiveVersion
- proofPoints
- likelyFollowUps
- weakSpots

Return ONLY valid JSON.
No markdown. No explanations.

JSON format:
{
  "roleSummary": string,
  "storyStrategy": string,
  "strengthsToLead": string[],
  "practiceTips": string[],
  "stories": [
    {
      "title": string,
      "bestUse": "behavioral" | "technical" | "leadership" | "ownership" | "impact" | "conflict",
      "relevance": string,
      "situation": string,
      "task": string,
      "action": string,
      "result": string,
      "recruiterVersion": string,
      "deepDiveVersion": string,
      "proofPoints": string[],
      "likelyFollowUps": string[],
      "weakSpots": string[]
    }
  ]
}

Deterministic story plan:
${JSON.stringify(
      {
        candidateName: grounding.candidateName,
        summary: grounding.analysis.summary,
        matchedSkills: grounding.analysis.matchedSkills,
        missingSkills: grounding.analysis.missingSkills,
        strengths: grounding.analysis.strengths,
        improvements: grounding.analysis.improvements,
        keywordCoverage: grounding.analysis.keywordCoverage,
        narrativeBlocks: grounding.narrativeBlocks,
        fallbackPlan: fallback,
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
        temperature: 0.3,
      });

      if (!response?.text) {
        return fallback;
      }

      const parsed = this.safeParse(response.text);

      if (!this.isValid(parsed)) {
        return fallback;
      }

      return this.mergeWithFallback(parsed, fallback);
    } catch (error) {
      console.error('STAR story builder AI fallback:', error);
      return fallback;
    }
  }

  /* ------------------ HELPERS ------------------ */

  private safeParse(text: string): StarStoryBuilderResult {
    try {
      const cleaned = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON found');

      return JSON.parse(match[0]);
    } catch (e) {
      console.error('RAW AI RESPONSE:\n', text);
      throw new InternalServerErrorException('Malformed AI JSON');
    }
  }

  private isValid(data: unknown): data is StarStoryBuilderResult {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const result = data as Record<string, unknown>;

    return (
      typeof result.candidateName === 'string' &&
      typeof result.roleSummary === 'string' &&
      typeof result.storyStrategy === 'string' &&
      Array.isArray(result.strengthsToLead) &&
      result.strengthsToLead.every((entry) => typeof entry === 'string') &&
      Array.isArray(result.practiceTips) &&
      result.practiceTips.every((entry) => typeof entry === 'string') &&
      Array.isArray(result.stories) &&
      result.stories.every((entry) => this.isValidStory(entry))
    );
  }

  private buildFallbackStories(
    grounding: ReturnType<typeof buildResumeGrounding>,
  ): StarStoryBuilderResult {
    const stories = grounding.narrativeBlocks
      .slice(0, 5)
      .map((block, index) => this.buildStory(block.title, block.bullets.slice(0, 3), grounding, index));

    if (stories.length > 0) {
      return {
        candidateName: grounding.candidateName,
        roleSummary: this.buildRoleSummary(grounding),
        storyStrategy: this.buildStoryStrategy(grounding),
        strengthsToLead: grounding.analysis.strengths.slice(0, 4),
        practiceTips: this.buildPracticeTips(grounding),
        stories,
      };
    }

    return {
      candidateName: grounding.candidateName,
      roleSummary: this.buildRoleSummary(grounding),
      storyStrategy: this.buildStoryStrategy(grounding),
      strengthsToLead: grounding.analysis.strengths.slice(0, 4),
      practiceTips: this.buildPracticeTips(grounding),
      stories: [
        this.buildStory(
          'Core Resume Story',
          grounding.analysis.strengths.slice(0, 3),
          grounding,
          0,
        ),
      ],
    };
  }

  private buildStory(
    title: string,
    bullets: string[],
    grounding: ReturnType<typeof buildResumeGrounding>,
    index: number,
  ): StarStory {
    const evidence = bullets.length > 0 ? bullets : [`Explain the scope and outcomes of ${title}.`];
    const matchedSkill =
      grounding.analysis.matchedSkills.find((skill) =>
        evidence.some((bullet) => bullet.toLowerCase().includes(skill.toLowerCase())),
      ) ?? grounding.analysis.matchedSkills[index] ?? grounding.analysis.matchedSkills[0];
    const topGap = grounding.analysis.missingSkills[0];
    const bestUse = this.pickBestUse(title, evidence, matchedSkill, index);

    return {
      title,
      bestUse,
      relevance: matchedSkill
        ? `${title} is one of your strongest proof points for ${matchedSkill}.`
        : `${title} helps you show ownership, context, and execution.`,
      situation: `Set up the business or technical context for ${title} in one or two lines.`,
      task: matchedSkill
        ? `Explain the responsibility you personally owned, especially around ${matchedSkill}.`
        : 'Explain the responsibility, goal, or constraint you personally owned.',
      action: evidence.join(' '),
      result: matchedSkill
        ? `Close with the outcome, impact, and why your work on ${matchedSkill} mattered.`
        : 'Close with the outcome, impact, and what changed because of your work.',
      recruiterVersion: this.buildRecruiterVersion(title, evidence, matchedSkill),
      deepDiveVersion: this.buildDeepDiveVersion(title, evidence, matchedSkill),
      proofPoints: evidence,
      likelyFollowUps: this.buildFollowUps(title, matchedSkill, bestUse),
      weakSpots: [
        topGap
          ? `Be ready to explain how this story still supports the role even if ${topGap} is not deeply shown here.`
          : 'Be ready with metrics, scale, and tradeoffs if the result sounds too general.',
        'If you do not mention scope, ownership, or outcome clearly, the story will sound weaker than it is.',
      ],
    };
  }

  private isValidStory(data: unknown): data is StarStory {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const story = data as StarStory;

    return (
      typeof story.title === 'string' &&
      typeof story.bestUse === 'string' &&
      typeof story.relevance === 'string' &&
      typeof story.situation === 'string' &&
      typeof story.task === 'string' &&
      typeof story.action === 'string' &&
      typeof story.result === 'string' &&
      typeof story.recruiterVersion === 'string' &&
      typeof story.deepDiveVersion === 'string' &&
      Array.isArray(story.proofPoints) &&
      story.proofPoints.every((entry) => typeof entry === 'string') &&
      Array.isArray(story.likelyFollowUps) &&
      story.likelyFollowUps.every((entry) => typeof entry === 'string') &&
      Array.isArray(story.weakSpots) &&
      story.weakSpots.every((entry) => typeof entry === 'string')
    );
  }

  private buildRoleSummary(
    grounding: ReturnType<typeof buildResumeGrounding>,
  ) {
    const keywordCoverage = grounding.analysis.keywordCoverage;

    return [
      grounding.analysis.summary,
      keywordCoverage.total > 0
        ? `Frame yourself around the ${keywordCoverage.matched} tracked keywords you already cover well.`
        : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  private buildStoryStrategy(
    grounding: ReturnType<typeof buildResumeGrounding>,
  ) {
    const topGap = grounding.analysis.missingSkills[0];

    return [
      'Lead with the stories that show the clearest ownership and measurable outcomes.',
      topGap
        ? `Use your strongest stories to offset likely concern around ${topGap} without overstating experience.`
        : '',
      'Keep a short recruiter version ready first, then expand into a deeper technical version only when asked.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  private buildPracticeTips(
    grounding: ReturnType<typeof buildResumeGrounding>,
  ): string[] {
    return [
      'Say each story out loud once in under 45 seconds and once in under 2 minutes.',
      'Make sure every story states the problem, your ownership, the action you took, and the result.',
      grounding.analysis.missingSkills[0]
        ? `Prepare one honest bridge sentence for ${grounding.analysis.missingSkills[0]} so you can handle gap-related follow-up questions.`
        : 'Prepare one line explaining why your background is a direct fit for this role.',
    ];
  }

  private pickBestUse(
    title: string,
    bullets: string[],
    matchedSkill: string | undefined,
    index: number,
  ): StoryUseCase {
    const normalized = `${title} ${bullets.join(' ')}`.toLowerCase();

    if (/lead|mentor|manage|owner/.test(normalized)) {
      return 'leadership';
    }

    if (/conflict|issue|incident|blocker|stakeholder/.test(normalized)) {
      return 'conflict';
    }

    if (/impact|improve|increase|reduce|save|optimi/.test(normalized)) {
      return 'impact';
    }

    if (matchedSkill && index === 0) {
      return 'technical';
    }

    return index % 2 === 0 ? 'ownership' : 'behavioral';
  }

  private buildRecruiterVersion(
    title: string,
    bullets: string[],
    matchedSkill?: string,
  ) {
    const firstPoint = bullets[0] ?? `Delivered meaningful work in ${title}.`;
    return matchedSkill
      ? `I used ${title} to show practical ownership around ${matchedSkill}. ${firstPoint}`
      : `I use ${title} to show ownership, execution, and outcome. ${firstPoint}`;
  }

  private buildDeepDiveVersion(
    title: string,
    bullets: string[],
    matchedSkill?: string,
  ) {
    const evidence = bullets.join(' ');
    return matchedSkill
      ? `In ${title}, I can go deeper on how I approached ${matchedSkill}, the tradeoffs I handled, and the result that followed. ${evidence}`
      : `In ${title}, I can go deeper on the context, the decisions I made, and the result that followed. ${evidence}`;
  }

  private buildFollowUps(
    title: string,
    matchedSkill: string | undefined,
    bestUse: StoryUseCase,
  ) {
    return [
      `What was the hardest part of ${title}?`,
      matchedSkill
        ? `How confident are you with ${matchedSkill} beyond ${title}?`
        : `What tradeoffs did you make during ${title}?`,
      bestUse === 'leadership'
        ? 'How did you influence others or handle disagreement?'
        : 'How would you improve this work if you repeated it today?',
    ];
  }

  private mergeWithFallback(
    result: StarStoryBuilderResult,
    fallback: StarStoryBuilderResult,
  ): StarStoryBuilderResult {
    return {
      candidateName: fallback.candidateName,
      roleSummary: result.roleSummary || fallback.roleSummary,
      storyStrategy: result.storyStrategy || fallback.storyStrategy,
      strengthsToLead:
        result.strengthsToLead.length > 0 ? result.strengthsToLead : fallback.strengthsToLead,
      practiceTips: result.practiceTips.length > 0 ? result.practiceTips : fallback.practiceTips,
      stories: result.stories.length > 0 ? result.stories : fallback.stories,
    };
  }
}
