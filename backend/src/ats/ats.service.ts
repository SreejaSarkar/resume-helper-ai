import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ATSScoreResult } from '../ats/ats.types';
import { extractKeywords, normalizeText } from '../ats/ats.utils';
import { HistoryService } from '../history/history.service';
import { ATSAnalysis } from './ats.entity';
import { parsePDF } from '../utils/pdf.util';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AtsService {
  constructor(
    @InjectRepository(ATSAnalysis)
    private repo: Repository<ATSAnalysis>,
    private readonly historyService: HistoryService,
  ) {}

  async analyzeAndStore(
    file: Express.Multer.File,
    jobDescription: string,
    resumeName: string,
    userId: string,
  ) {
    const resumeText = await parsePDF(file.buffer);
    const atsResult = this.calculateATSScore(resumeText, jobDescription);

    const fileId = uuid();

    const originalDir = path.join(process.cwd(), 'uploads/original');

    if (!fs.existsSync(originalDir)) {
      fs.mkdirSync(originalDir, { recursive: true });
    }

    const originalPath = path.join(originalDir, `${fileId}.pdf`);
    fs.writeFileSync(originalPath, file.buffer);

    const resumeUrl = `/files/original/${fileId}.pdf`;

    // 1️⃣ Save ATS analysis
    const atsEntity = this.repo.create(atsResult);
    const saved = await this.repo.save(atsEntity);

    // 2️⃣ Save history
    await this.historyService.add({
      userId,
      resumeName,
      atsScore: atsResult.atsScore,
      jobSummary: jobDescription.substring(0, 600),
      resumeUrl,
      type: 'ats',
      atsAnalysisId: saved.id,
    });

    return atsResult;
  }

  async getATSReport(id: string) {
    const report = await this.repo.findOne({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('ATS report not found');
    }

    return report;
  }

  calculateATSScore(
    resumeTextRaw: string,
    jobDescription: string,
  ): ATSScoreResult {
    const resumeText = normalizeText(resumeTextRaw);
    const jdText = normalizeText(jobDescription);

    const issues: string[] = [];

    const keywords = extractKeywords(jdText);
    const matchedKeywords = keywords.filter((k) => resumeText.includes(k));

    const keywordScore =
      keywords.length === 0
        ? 0
        : Math.min(40, (matchedKeywords.length / keywords.length) * 40);

    const missingKeywords = keywords.filter((k) => !resumeText.includes(k));

    let formattingScore = 25;

    if (resumeTextRaw.includes('|')) {
      formattingScore -= 5;
      issues.push('Possible table-based layout detected');
    }

    if (resumeTextRaw.match(/\t+/)) {
      formattingScore -= 5;
      issues.push('Tab-based formatting detected');
    }

    if (!resumeTextRaw.includes('•') && !resumeTextRaw.includes('-')) {
      formattingScore -= 3;
      issues.push('Bullet points not detected');
    }

    formattingScore = Math.max(0, formattingScore);

    const requiredSections = ['experience', 'education', 'skills'];

    const foundSections = requiredSections.filter((section) =>
      resumeText.includes(section),
    );

    const sectionScore = (foundSections.length / requiredSections.length) * 15;

    if (sectionScore < 10) {
      issues.push('Missing standard ATS section headings');
    }

    let readabilityScore = 10;

    if (resumeText.length < 500) {
      readabilityScore -= 5;
      issues.push('Resume content too short');
    }

    if (!resumeText.match(/[a-z]/)) {
      readabilityScore = 0;
      issues.push('Resume text unreadable by ATS');
    }

    readabilityScore = Math.max(0, readabilityScore);

    let penalty = 0;

    if (!resumeText.match(/\b\d{10}\b/)) {
      penalty += 3;
      issues.push('Phone number not detected');
    }

    if (!resumeText.includes('@')) {
      penalty += 3;
      issues.push('Email address not detected');
    }

    if (!resumeText.includes('skills')) {
      penalty += 4;
      issues.push('Skills section missing');
    }

    penalty = Math.min(10, penalty);

    const atsScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          keywordScore +
            formattingScore +
            sectionScore +
            readabilityScore -
            penalty,
        ),
      ),
    );

    return {
      atsScore,
      breakdown: {
        keywordScore: Math.round(keywordScore),
        formattingScore,
        sectionScore: Math.round(sectionScore),
        readabilityScore,
        penalty,
      },
      missingKeywords: missingKeywords.slice(0, 15),
      issues,
    };
  }
}
