import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Feedback } from '../feedback/feedback.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ unique: true })
  firebaseUid!: string;

  @Index()
  @Column({ nullable: true })
  email?: string;

  @Index()
  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Index()
  @Column({ default: false })
  suspended!: boolean;

  @Column({ default: 0 })
  resumeUploads!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastActiveAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Feedback, (f) => f.user)
  feedbacks!: Feedback[];
}
