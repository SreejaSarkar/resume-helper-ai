import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class History {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({ nullable: true })
  aiAnalysisId?: string;

  @Column({ nullable: true })
  atsAnalysisId?: string;

  @Column()
  resumeName!: string;

  @Column({ nullable: true })
  aiScore?: number;

  @Column({ nullable: true })
  atsScore?: number;

  @Column({ length: 600 })
  jobSummary!: string;

  @Column({ nullable: true })
  resumeUrl?: string;

  @Column({ nullable: true })
  type!: 'ai' | 'ats' | 'interview';

  @CreateDateColumn()
  createdAt!: Date;
}
