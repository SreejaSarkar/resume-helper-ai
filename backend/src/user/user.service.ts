import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, normalizeUserRole } from './user.entity';

type AdminUserFilters = {
  search?: string;
  role?: string;
  status?: string;
  sort?: string;
};

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

  async findByFirebaseUid(firebaseUid: string) {
    return this.repo.findOne({ where: { firebaseUid } });
  }

  async getProfile(firebaseUid: string) {
    const user = await this.repo.findOne({
      where: { firebaseUid },
    });

    if (!user) {
      return user;
    }

    return {
      ...user,
      role: normalizeUserRole(user.role),
    };
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

    user.role = normalizeUserRole(user.role) === UserRole.ADMIN
      ? UserRole.USER
      : UserRole.ADMIN;

    return this.repo.save(user);
  }

  async getUsersWithFeedbackCount() {
    return this.repo
      .createQueryBuilder('u')
      .leftJoin('feedback', 'f', '"f"."userId"::text = "u"."id"::text')
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

  async getAdminOverview() {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [
      totalUsers,
      suspendedUsers,
      adminUsers,
      superAdminUsers,
      usersCreatedLast7Days,
      activeUsersLast7Days,
    ] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { suspended: true } }),
      this.repo.count({ where: { role: UserRole.ADMIN } }),
      this.repo.count({ where: { role: UserRole.SUPER_ADMIN } }),
      this.repo
        .createQueryBuilder('u')
        .where('u.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
        .getCount(),
      this.repo
        .createQueryBuilder('u')
        .where('u.lastActiveAt IS NOT NULL')
        .andWhere('u.lastActiveAt >= :sevenDaysAgo', { sevenDaysAgo })
        .getCount(),
    ]);

    return {
      totalUsers,
      suspendedUsers,
      adminUsers: adminUsers + superAdminUsers,
      standardUsers: totalUsers - adminUsers - superAdminUsers,
      usersCreatedLast7Days,
      activeUsersLast7Days,
    };
  }

  async getAdminUsers(filters: AdminUserFilters = {}) {
    const query = this.repo
      .createQueryBuilder('u')
      .leftJoin('feedback', 'f', '"f"."userId"::text = "u"."id"::text')
      .leftJoin('history', 'h', '"h"."userId"::text = "u"."id"::text')
      .select([
        'u.id as id',
        'u.name as name',
        'u.email as email',
        'u.phoneNumber as "phoneNumber"',
        `CASE WHEN u.role = '${UserRole.SUPER_ADMIN}' THEN '${UserRole.ADMIN}' ELSE u.role END as role`,
        'u.suspended as suspended',
        'u.resumeUploads as "resumeUploads"',
        'u.createdAt as "createdAt"',
        'u.lastActiveAt as "lastActiveAt"',
        'COUNT(DISTINCT f.id) as "feedbackCount"',
        'COALESCE(ROUND(AVG(f.rating)::numeric, 1), 0) as "avgFeedbackRating"',
        'COUNT(DISTINCT h.id) as "historyCount"',
        'COUNT(DISTINCT CASE WHEN h.aiScore IS NOT NULL THEN h.id END) as "aiAnalysisCount"',
        'COUNT(DISTINCT CASE WHEN h.atsScore IS NOT NULL THEN h.id END) as "atsAnalysisCount"',
        'MAX(h.createdAt) as "lastAnalysisAt"',
      ])
      .groupBy('u.id');

    if (filters.search?.trim()) {
      query.andWhere(
        '(u.email ILIKE :search OR u.name ILIKE :search OR u.phoneNumber ILIKE :search)',
        { search: `%${filters.search.trim()}%` },
      );
    }

    if (filters.role && filters.role !== 'all') {
      if (filters.role === UserRole.ADMIN) {
        query.andWhere('u.role IN (:...roles)', {
          roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        });
      } else {
        query.andWhere('u.role = :role', { role: filters.role });
      }
    }

    if (filters.status === 'active') {
      query.andWhere('u.suspended = false');
    }

    if (filters.status === 'suspended') {
      query.andWhere('u.suspended = true');
    }

    switch (filters.sort) {
      case 'name':
        query.orderBy('u.name', 'ASC', 'NULLS LAST');
        break;
      case 'lastActive':
        query.orderBy('u.lastActiveAt', 'DESC', 'NULLS LAST');
        break;
      case 'feedback':
        query.orderBy('"feedbackCount"', 'DESC');
        break;
      case 'usage':
        query.orderBy('"historyCount"', 'DESC');
        break;
      default:
        query.orderBy('u.createdAt', 'DESC');
        break;
    }

    return query.getRawMany();
  }
}
