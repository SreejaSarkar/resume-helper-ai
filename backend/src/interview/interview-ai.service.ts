// interview-ai.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { cohere } from '../config/cohere.config';
import {
  InterviewFocusArea,
  InterviewQuestion,
  InterviewReadinessResult,
  InterviewExperienceBlock,
} from './types/interview-ai.type';
import { buildResumeGrounding } from '../ai/resume-grounding.util';

@Injectable()
export class InterviewAiService {
  async generate(
    resumeText: string,
    jobDescription: string,
  ): Promise<InterviewReadinessResult> {
    const grounding = buildResumeGrounding(resumeText, jobDescription);
    const fallback = this.buildFallbackReadiness(grounding);

    if (!grounding.analysis.canUseAi) {
      return fallback;
    }

    const prompt = `
You are a senior technical interviewer.

Using ONLY the candidate's RESUME content:
- Do NOT invent experience
- Do NOT add new technologies
- Base all questions strictly on what is written
- Use the deterministic plan below as the source of truth

TASK:
Build a practical interview prep kit from the candidate's real resume.

Return:
1. A short role-fit summary
2. 2-4 strengths the candidate should lead with
3. 2-4 focus areas where the candidate may get challenged
4. 2-3 general opening questions the candidate should prepare for
5. For each major experience or project: realistic questions, why each is asked, how to answer it, supporting evidence to mention, and likely follow-up risk

Return ONLY valid JSON.
No markdown. No explanations.

JSON format:
{
  "roleFitSummary": string,
  "strengthsToLead": string[],
  "focusAreas": [
    {
      "area": string,
      "reason": string,
      "practicePrompt": string
    }
  ],
  "generalQuestions": [
    {
      "question": string,
      "whyAsked": string,
      "answerStrategy": string,
      "supportingEvidence": string[]
    }
  ],
  "experiences": [
    {
      "title": string,
      "relevance": string,
      "questions": [
        {
          "question": string,
          "whyAsked": string,
          "answerStrategy": string,
          "supportingEvidence": string[]
        }
      ],
      "talkingPoints": string[],
      "evaluationFocus": string,
      "followUpRisk": string
    }
  ]
}

Deterministic interview plan:
${JSON.stringify(
      {
        matchedSkills: grounding.analysis.matchedSkills,
        missingSkills: grounding.analysis.missingSkills,
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
      console.error('Interview readiness AI fallback:', error);
      return fallback;
    }
  }

  /* ------------------ HELPERS ------------------ */

  private safeParse(text: string): InterviewReadinessResult {
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

  private isValid(data: unknown): data is InterviewReadinessResult {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const result = data as Record<string, unknown>;

    return (
      typeof result.candidateName === 'string' &&
      typeof result.readinessScore === 'number' &&
      typeof result.roleFitSummary === 'string' &&
      Array.isArray(result.strengthsToLead) &&
      result.strengthsToLead.every((entry) => typeof entry === 'string') &&
      Array.isArray(result.focusAreas) &&
      result.focusAreas.every((entry) => this.isValidFocusArea(entry)) &&
      Array.isArray(result.generalQuestions) &&
      result.generalQuestions.every((entry) => this.isValidQuestion(entry)) &&
      Array.isArray(result.experiences) &&
      result.experiences.every((entry) => {
        if (typeof entry !== 'object' || entry === null) {
          return false;
        }

        const experience = entry as InterviewExperienceBlock;

        return (
          typeof experience.title === 'string' &&
          typeof experience.relevance === 'string' &&
          Array.isArray(experience.questions) &&
          experience.questions.every((q) => this.isValidQuestion(q)) &&
          Array.isArray(experience.talkingPoints) &&
          experience.talkingPoints.every((t) => typeof t === 'string') &&
          typeof experience.evaluationFocus === 'string' &&
          typeof experience.followUpRisk === 'string'
        );
      })
    );
  }

  private buildFallbackReadiness(
    grounding: ReturnType<typeof buildResumeGrounding>,
  ): InterviewReadinessResult {
    const experiences = grounding.narrativeBlocks.slice(0, 5).map((block) => {
      const focusSkill =
        grounding.analysis.matchedSkills.find((skill) =>
          block.bullets.some((bullet) => bullet.toLowerCase().includes(skill.toLowerCase())),
        ) ?? grounding.analysis.matchedSkills[0];
      const bullets = block.bullets.slice(0, 3);

      return {
        title: block.title,
        relevance: focusSkill
          ? `${block.title} gives you the best evidence for ${focusSkill}.`
          : `${block.title} is useful to show ownership and technical judgment.`,
        questions: this.buildQuestions(block.title, focusSkill, bullets),
        talkingPoints:
          bullets.length > 0
            ? bullets
            : [
                `Explain the scope of ${block.title}.`,
                'Describe the actions you took and the result you achieved.',
              ],
        evaluationFocus: focusSkill
          ? `${focusSkill}, ownership, and measurable impact`
          : 'ownership, technical judgment, and measurable impact',
        followUpRisk: focusSkill
          ? `Be ready to prove depth in ${focusSkill} with concrete decisions, tradeoffs, and outcomes.`
          : 'Be ready for follow-up questions on technical decisions, tradeoffs, and measurable results.',
      };
    });

    if (experiences.length > 0) {
      return {
        candidateName: grounding.candidateName,
        readinessScore: grounding.analysis.score,
        roleFitSummary: this.buildRoleFitSummary(grounding),
        strengthsToLead: grounding.analysis.strengths.slice(0, 4),
        focusAreas: this.buildFocusAreas(grounding),
        generalQuestions: this.buildGeneralQuestions(grounding),
        experiences,
      };
    }

    return {
      candidateName: grounding.candidateName,
      readinessScore: grounding.analysis.score,
      roleFitSummary: this.buildRoleFitSummary(grounding),
      strengthsToLead: grounding.analysis.strengths.slice(0, 4),
      focusAreas: this.buildFocusAreas(grounding),
      generalQuestions: this.buildGeneralQuestions(grounding),
      experiences: [
        {
          title: 'Resume Overview',
          relevance: 'Use this to connect your background to the target role in a clear first impression.',
          questions: [
            {
              question:
                'Walk me through your resume and the most relevant experience for this role.',
              whyAsked: 'The interviewer wants a concise story that shows relevance and prioritization.',
              answerStrategy:
                'Start with your current level, then cover 2-3 role-relevant experiences, and end with why this role is the logical next step.',
              supportingEvidence: grounding.analysis.strengths.slice(0, 3),
            },
            {
              question:
                'Which part of your background best matches this job description?',
              whyAsked: 'The interviewer is testing whether you understand the role and can position yourself clearly.',
              answerStrategy:
                'Pick one strong overlap area, describe what you owned, and connect it to the job requirements using outcomes.',
              supportingEvidence: grounding.analysis.matchedSkills.slice(0, 3),
            },
          ],
          talkingPoints: grounding.analysis.improvements.slice(0, 3),
          evaluationFocus: 'communication, prioritization, and role alignment',
          followUpRisk:
            'If your story is too broad, expect follow-ups asking for specifics, metrics, and direct relevance to the role.',
        },
      ],
    };
  }

  private buildQuestions(
    title: string,
    focusSkill: string | undefined,
    bullets: string[],
  ): InterviewQuestion[] {
    const evidence = bullets.length > 0 ? bullets : [`Explain the scope and outcomes of ${title}.`];

    return [
      {
        question: `Walk me through ${title} and the problem you were solving.`,
        whyAsked: 'The interviewer wants to hear your ownership, scope, and ability to explain context clearly.',
        answerStrategy:
          'Use a short STAR structure: set the context, explain your responsibility, describe your actions, and end with the result.',
        supportingEvidence: evidence.slice(0, 2),
      },
      {
        question: focusSkill
          ? `How did you apply ${focusSkill} during ${title}?`
          : `What technical decisions did you make during ${title}?`,
        whyAsked: focusSkill
          ? `The interviewer is checking whether your resume claims around ${focusSkill} are real and role-relevant.`
          : 'The interviewer is checking your technical judgment and decision-making.',
        answerStrategy: focusSkill
          ? `Explain where ${focusSkill} fit into the workflow, why you used it, what tradeoffs you handled, and what outcome it influenced.`
          : 'Describe the options you considered, the tradeoffs you weighed, and why your final approach made sense.',
        supportingEvidence: evidence.slice(0, 2),
      },
      {
        question: `What would you improve if you were doing ${title} again?`,
        whyAsked: 'The interviewer wants to see reflection, maturity, and your ability to improve systems over time.',
        answerStrategy:
          'Be honest about one limitation, then explain the concrete improvement you would make and why it matters.',
        supportingEvidence: evidence.slice(0, 1),
      },
    ];
  }

  private isValidQuestion(data: unknown): data is InterviewQuestion {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const question = data as InterviewQuestion;

    return (
      typeof question.question === 'string' &&
      typeof question.whyAsked === 'string' &&
      typeof question.answerStrategy === 'string' &&
      Array.isArray(question.supportingEvidence) &&
      question.supportingEvidence.every((entry) => typeof entry === 'string')
    );
  }

  private isValidFocusArea(data: unknown): data is InterviewFocusArea {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const focusArea = data as InterviewFocusArea;

    return (
      typeof focusArea.area === 'string' &&
      typeof focusArea.reason === 'string' &&
      typeof focusArea.practicePrompt === 'string'
    );
  }

  private buildRoleFitSummary(
    grounding: ReturnType<typeof buildResumeGrounding>,
  ) {
    const keywordCoverage = grounding.analysis.keywordCoverage;
    const topGap = grounding.analysis.missingSkills[0];

    return [
      grounding.analysis.summary,
      keywordCoverage.total > 0
        ? `You currently match ${keywordCoverage.matched} of ${keywordCoverage.total} tracked job keywords.`
        : '',
      topGap ? `Expect deeper probing around ${topGap}.` : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  private buildFocusAreas(
    grounding: ReturnType<typeof buildResumeGrounding>,
  ): InterviewFocusArea[] {
    const missing = grounding.analysis.missingSkills.slice(0, 3).map((skill) => ({
      area: skill,
      reason: `This skill appears important in the job description but has limited direct evidence in your resume.`,
      practicePrompt: `Prepare a truthful answer that connects adjacent experience, learning effort, and how you would ramp up on ${skill}.`,
    }));

    const sectionGaps = grounding.analysis.sectionAnalysis
      .filter((section) => !section.present)
      .slice(0, 1)
      .map((section) => ({
        area: `${section.section} clarity`,
        reason: section.feedback,
        practicePrompt: `Be ready to explain this area verbally since the resume does not make it obvious yet.`,
      }));

    return [...missing, ...sectionGaps].slice(0, 4);
  }

  private buildGeneralQuestions(
    grounding: ReturnType<typeof buildResumeGrounding>,
  ): InterviewQuestion[] {
    return [
      {
        question: 'Tell me about yourself and why this role makes sense for you now.',
        whyAsked: 'This sets the tone for the interview and tests whether you can frame your background around the role.',
        answerStrategy:
          'Keep it to 60-90 seconds: who you are, the most relevant experience, the value you bring, and why this role is the next fit.',
        supportingEvidence: grounding.analysis.strengths.slice(0, 3),
      },
      {
        question: 'Which project or experience best shows your fit for this job?',
        whyAsked: 'The interviewer wants you to prioritize the strongest role-relevant evidence instead of listing everything.',
        answerStrategy:
          'Choose one experience, explain the problem, your contribution, and the outcome, then tie it directly to the job description.',
        supportingEvidence: grounding.narrativeBlocks[0]?.bullets.slice(0, 2) ?? grounding.analysis.matchedSkills.slice(0, 2),
      },
      {
        question: 'What is one area from this role where you would need to ramp up quickly?',
        whyAsked: 'Interviewers often test self-awareness and coachability, especially when some required skills are not deeply proven.',
        answerStrategy:
          'Pick one real gap, show related experience, describe how you learn, and give a concrete ramp-up plan.',
        supportingEvidence: grounding.analysis.missingSkills.slice(0, 2),
      },
    ];
  }

  private mergeWithFallback(
    result: InterviewReadinessResult,
    fallback: InterviewReadinessResult,
  ): InterviewReadinessResult {
    return {
      candidateName: fallback.candidateName,
      readinessScore: fallback.readinessScore,
      roleFitSummary: result.roleFitSummary || fallback.roleFitSummary,
      strengthsToLead:
        result.strengthsToLead.length > 0 ? result.strengthsToLead : fallback.strengthsToLead,
      focusAreas: result.focusAreas.length > 0 ? result.focusAreas : fallback.focusAreas,
      generalQuestions:
        result.generalQuestions.length > 0 ? result.generalQuestions : fallback.generalQuestions,
      experiences: result.experiences.length > 0 ? result.experiences : fallback.experiences,
    };
  }
}
