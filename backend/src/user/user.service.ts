import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findOrCreate(firebaseUser: {
    uid: string;
    email?: string;
    name?: string;
    phoneNumber?: string;
  }) {
    let user = await this.repo.findOne({
      where: { firebaseUid: firebaseUser.uid },
    });

    if (!user) {
      user = this.repo.create({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        phoneNumber: firebaseUser.phoneNumber,
        name: firebaseUser.name,
        lastActiveAt: new Date(),
      });

      user = await this.repo.save(user);
      return user;
    }

    const nextEmail = firebaseUser.email ?? user.email;
    const nextPhoneNumber = firebaseUser.phoneNumber ?? user.phoneNumber;
    const nextName = firebaseUser.name ?? user.name;

    user.email = nextEmail;
    user.phoneNumber = nextPhoneNumber;
    user.name = nextName;
    user.lastActiveAt = new Date();

    user = await this.repo.save(user);

    return user;
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async getProfile(firebaseUid: string) {
    return this.repo.findOne({
      where: { firebaseUid },
    });
  }

  async searchUsers(search?: string) {
    if (!search) {
      return this.repo.find({
        order: { createdAt: 'DESC' },
      });
    }

    return this.repo
      .createQueryBuilder('u')
      .where('u.email ILIKE :search OR u.name ILIKE :search OR u.phoneNumber ILIKE :search', {
        search: `%${search}%`,
      })
      .orderBy('u.createdAt', 'DESC')
      .getMany();
  }

  async toggleSuspend(id: string) {
    const user = await this.repo.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.suspended = !user.suspended;

    return this.repo.save(user);
  }

  async toggleRole(id: string) {
    const user = await this.repo.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = user.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;

    return this.repo.save(user);
  }

  async getUsersWithFeedbackCount() {
    return this.repo
      .createQueryBuilder('u')
      .leftJoin('feedback', 'f', 'f.userId = u.id')
      .select([
        'u.id as id',
        'u.name as name',
        'u.email as email',
        'u.phoneNumber as "phoneNumber"',
        'u.role as role',
        'u.suspended as suspended',
        'COUNT(f.id) as "feedbackCount"',
      ])
      .groupBy('u.id')
      .orderBy('u.createdAt', 'DESC')
      .getRawMany();
  }
}
