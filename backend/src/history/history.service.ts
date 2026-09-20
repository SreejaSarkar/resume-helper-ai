import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History } from './entities/history.entity';
import { ATSAnalysis } from '../ats/ats.entity';
import { ResumeAnalysis } from '../resume/entities/resume-analysis.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private readonly repo: Repository<History>,
    @InjectRepository(ATSAnalysis)
    private readonly atsRepo: Repository<ATSAnalysis>,
    @InjectRepository(ResumeAnalysis)
    private readonly aiRepo: Repository<ResumeAnalysis>,
  ) {}

  async add(data: Partial<History>) {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }

  async getUserHistory(userId: string) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async delete(id: string, userId: string) {
    const history = await this.repo.findOne({ where: { id, userId } });

    if (!history) {
      throw new NotFoundException('History not found');
    }

    if (history.type === 'ats' && history.atsAnalysisId) {
      await this.atsRepo.delete(history.atsAnalysisId);
    }

    if (history.type === 'ai' && history.aiAnalysisId) {
      await this.aiRepo.delete(history.aiAnalysisId);
    }

    await this.repo.delete(id);

    return { success: true };
  }

  async getPlatformStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();

    const qb = this.repo.createQueryBuilder('h');

    const usersTodayResult = await qb
      .clone()
      .select('COUNT(DISTINCT h.userId)', 'count')
      .where('h.createdAt BETWEEN :today AND :now', { today, now })
      .getRawOne<{ count: string }>();

    const [aiCallsToday, atsScansToday, uploadsToday] = await Promise.all([
      qb
        .clone()
        .where('h.aiScore IS NOT NULL')
        .andWhere('h.createdAt BETWEEN :today AND :now', { today, now })
        .getCount(),

      qb
        .clone()
        .where('h.atsScore IS NOT NULL')
        .andWhere('h.createdAt BETWEEN :today AND :now', { today, now })
        .getCount(),

      qb
        .clone()
        .where('h.resumeUrl IS NOT NULL')
        .andWhere('h.createdAt BETWEEN :today AND :now', { today, now })
        .getCount(),

      qb
        .clone()
        .select('COUNT(DISTINCT h.userId)', 'count')
        .where('h.createdAt BETWEEN :today AND :now', { today, now })
        .getRawOne(),
    ]);

    return {
      usersToday: Number(usersTodayResult?.count),
      aiCallsToday,
      atsCallsToday: atsScansToday,
      uploadsToday,
    };
  }
}
