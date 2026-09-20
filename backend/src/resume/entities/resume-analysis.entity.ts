import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ResumeAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fileName!: string;

  @Column('int')
  score!: number;

  @Column('text', { array: true })
  missingSkills!: string[];

  @Column('text', { array: true, default: '{}' })
  matchedSkills!: string[];

  @Column('text', { array: true, default: '{}' })
  strengths!: string[];

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'text', nullable: true })
  recommendation?: string;

  @Column('text', { array: true })
  improvements!: string[];

  @Column({ type: 'jsonb', nullable: true })
  keywordCoverage?: {
    matched: number;
    total: number;
    percentage: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  sectionAnalysis?: {
    section: string;
    present: boolean;
    feedback: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  learningSuggestions!: {
    skill: string;
    level: string;
    resources: {
      type: 'course' | 'youtube' | 'docs';
      title: string;
      platform: string;
      url: string;
    }[];
  }[];

  @CreateDateColumn()
  createdAt!: Date;
}
