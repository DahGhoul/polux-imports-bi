import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 140 }) name: string;
  @Column({ length: 40 }) channel: string;
  @Column('decimal', { precision: 12, scale: 2, default: 0 }) spend: number;
  @Column('int', { default: 0 }) reach: number;
  @Column('int', { default: 0 }) clicks: number;
  @Column('int', { default: 0 }) interactions: number;
  @Column('int', { default: 0 }) formStarts: number;
  @Column('int', { default: 0 }) formCompletions: number;
  @Column('int', { default: 0 }) leadsGenerated: number;
  @Column({ length: 30, default: 'ACTIVE' }) status: string;
  @CreateDateColumn({ type: 'datetime2' }) createdAt: Date;
}
