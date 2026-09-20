import { Injectable } from '@nestjs/common';

const PAGE_HEIGHT = 1120; // px (A4 usable height)

@Injectable()
export class ResumeBudgetService {
  enforceOnePage(resume: {
    summary: string;
    experience: { original: string; optimized: string }[];
    skills: string[];
    education: string[];
    certifications: string[];
  }) {
    // 🔒 HARD LIMITS (REAL-WORLD)
    resume.summary = this.limitLines(resume.summary, 3);

    resume.experience = resume.experience.slice(0, 4);
    resume.skills = resume.skills.slice(0, 12);
    resume.education = resume.education.slice(0, 2);
    resume.certifications = resume.certifications.slice(0, 2);

    // 🧠 Compression ladder
    while (this.estimateHeight(resume) > PAGE_HEIGHT) {
      if (resume.experience.length > 3) {
        resume.experience.pop();
      } else if (resume.skills.length > 10) {
        resume.skills.pop();
      } else if (resume.summary.split(' ').length > 25) {
        resume.summary = this.limitWords(resume.summary, 20);
      } else {
        break; // stop aggressive trimming
      }
    }

    return resume;
  }

  private estimateHeight(resume: {
    summary: string;
    experience: { original: string; optimized: string }[];
    skills: string[];
    education: string[];
    certifications: string[];
  }): number {
    return (
      110 +
      resume.summary.length * 1.2 +
      resume.experience.length * 90 +
      resume.skills.length * 18 +
      resume.education.length * 40 +
      resume.certifications.length * 35
    );
  }

  private limitLines(text: string, maxLines: number): string {
    const sentences = text.split(/\. |\n/);
    return sentences.slice(0, maxLines).join('. ');
  }

  private limitWords(text: string, maxWords: number): string {
    return text.split(' ').slice(0, maxWords).join(' ') + '…';
  }
}
