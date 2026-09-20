import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResumeAnalysis } from './entities/resume-analysis.entity';
import { AiService } from '../ai/ai.service';
import { parsePDF } from '../utils/pdf.util';
import { AutoOptimizeService } from '../auto-optimize/auto-optimize.service';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { InterviewAiService } from '../interview/interview-ai.service';
import { HistoryService } from '../history/history.service';
import { History } from '../history/entities/history.entity';

interface UploadedResumeFile {
  originalname: string;
  buffer: Buffer;
}

interface StoredKeywordCoverage {
  matched: number;
  total: number;
  percentage: number;
}

interface StoredSectionAnalysis {
  section: string;
  present: boolean;
  feedback: string;
}

@Injectable()
export class ResumeService {
  constructor(
    @InjectRepository(ResumeAnalysis)
    private repo: Repository<ResumeAnalysis>,
    private readonly historyService: HistoryService,
    private aiService: AiService,
    private autoOptimizeService: AutoOptimizeService,
    private readonly interviewAiService: InterviewAiService,
  ) {}

  private pickStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private pickKeywordCoverage(
    value: unknown,
  ): StoredKeywordCoverage | undefined {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }

    const entry = value as Record<string, unknown>;

    if (
      typeof entry.matched !== 'number' ||
      typeof entry.total !== 'number' ||
      typeof entry.percentage !== 'number'
    ) {
      return undefined;
    }

    return {
      matched: entry.matched,
      total: entry.total,
      percentage: entry.percentage,
    };
  }

  private pickSectionAnalysis(
    value: unknown,
  ): StoredSectionAnalysis[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const items = value
      .map((entry) => {
        if (typeof entry !== 'object' || entry === null) {
          return null;
        }

        const record = entry as Record<string, unknown>;

        if (
          typeof record.section !== 'string' ||
          typeof record.present !== 'boolean' ||
          typeof record.feedback !== 'string'
        ) {
          return null;
        }

        return {
          section: record.section,
          present: record.present,
          feedback: record.feedback,
        };
      })
      .filter((entry): entry is StoredSectionAnalysis => entry !== null);

    return items;
  }

  private buildAnalysisData(
    fileName: string,
    aiResult: unknown,
  ): Partial<ResumeAnalysis> {
    const result =
      typeof aiResult === 'object' && aiResult !== null
        ? (aiResult as Record<string, unknown>)
        : {};
    const summary = typeof result.summary === 'string' ? result.summary : '';
    const recommendation =
      typeof result.recommendation === 'string'
        ? result.recommendation
        : 'needs_work';
    const matchedSkills = this.pickStringArray(result.matchedSkills);
    const missingSkills = this.pickStringArray(result.missingSkills);
    const strengths = this.pickStringArray(result.strengths);
    const improvements = this.pickStringArray(result.improvements);
    const keywordCoverage = this.pickKeywordCoverage(result.keywordCoverage);
    const sectionAnalysis = this.pickSectionAnalysis(result.sectionAnalysis);
    const learningSuggestions = Array.isArray(result.learningSuggestions)
      ? result.learningSuggestions
      : [];
    const score =
      typeof result.score === 'number' && Number.isFinite(result.score)
        ? result.score
        : 0;

    return {
      fileName,
      score,
      summary,
      recommendation,
      matchedSkills,
      missingSkills,
      strengths,
      improvements,
      keywordCoverage,
      sectionAnalysis,
      learningSuggestions,
    };
  }

  async analyzeResume(
    file: UploadedResumeFile,
    jobDescription: string,
    userId: string,
  ) {
    if (!file) throw new Error('Resume file not uploaded');

    const resumeText = await parsePDF(file.buffer);
    const aiResult = await this.aiService.analyze(resumeText, jobDescription);

    const analysisData = this.buildAnalysisData(file.originalname, aiResult);

    const analysis = this.repo.create(analysisData);

    const saved: ResumeAnalysis = await this.repo.save(analysis);

    const fileId = uuid();

    const originalDir = path.join(process.cwd(), 'uploads/original');

    if (!fs.existsSync(originalDir)) {
      fs.mkdirSync(originalDir, { recursive: true });
    }

    const originalPath = path.join(originalDir, `${fileId}.pdf`);
    fs.writeFileSync(originalPath, file.buffer);

    const resumeUrl = `/files/original/${fileId}.pdf`;

    const historyData: Partial<History> = {
      userId,
      resumeName: file.originalname,
      aiScore: aiResult.score,
      jobSummary: jobDescription.substring(0, 600),
      resumeUrl,
      type: 'ai',
      aiAnalysisId: saved.id,
    };

    await this.historyService.add(historyData);

    return {
      resumeUrl,
      analysis: saved,
    };
  }

  getAnalysisById(id: string) {
    return this.repo.findOneBy({ id });
  }

  async generateSkillGapBridge(
    file: UploadedResumeFile,
    jobDescription: string,
  ) {
    if (!file) {
      throw new InternalServerErrorException('Resume file not uploaded');
    }

    const resumeText = await parsePDF(file.buffer);

    const bridge = await this.autoOptimizeService.generateSkillGapBridge(
      resumeText,
      jobDescription,
    );

    return {
      bridge,
    };
  }

  async generateInterviewReadiness(
    file: UploadedResumeFile,
    jobDescription: string,
  ) {
    if (!file) {
      throw new Error('Resume file not uploaded');
    }

    const resumeText = await parsePDF(file.buffer);

    const interviewReadiness = await this.interviewAiService.generate(
      resumeText,
      jobDescription,
    );

    return {
      interviewReadiness,
    };
  }
}
