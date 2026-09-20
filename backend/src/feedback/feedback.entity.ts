import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('feedback')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  userId!: string;

  @Index()
  @Column({ nullable: true })
  historyId?: string;

  @Column({
    type: 'enum',
    enum: ['ai', 'ats', 'general'],
  })
  type!: 'ai' | 'ats' | 'general';

  @Column({ type: 'int' })
  rating!: number; // 1–5

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (u) => u.feedbacks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
