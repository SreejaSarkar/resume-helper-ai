import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './feedback.entity';
import { User } from '../user/user.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly repo: Repository<Feedback>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(firebaseUid: string, data: Partial<Feedback>) {
    const user = await this.userRepo.findOne({
      where: { firebaseUid },
    });

    if (!user) throw new Error('User not found');

    return this.repo.save({
      ...data,
      userId: user.id,
    });
  }

  async getUserFeedback(userId: string) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllFeedback() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }
}
