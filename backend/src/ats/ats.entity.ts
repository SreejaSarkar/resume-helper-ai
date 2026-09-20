import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ATSAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('int')
  atsScore!: number;

  @Column({ type: 'jsonb' })
  breakdown!: {
    keywordScore: number;
    formattingScore: number;
    sectionScore: number;
    readabilityScore: number;
    penalty: number;
  };

  @Column('text', { array: true })
  missingKeywords!: string[];

  @Column('text', { array: true })
  issues!: string[];

  @CreateDateColumn()
  createdAt!: Date;
}
