import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Person } from './person.entity';

@Entity('funnel_transitions')
export class FunnelTransition {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Person, p => p.transitions, { onDelete: 'CASCADE' }) person: Person;
  @Column({ length: 20 }) fromStage: string;
  @Column({ length: 20 }) toStage: string;
  @Column({ length: 500 }) reason: string;
  @Column({ length: 30, default: 'AGENT' }) source: string;
  @CreateDateColumn({ type: 'datetime2' }) createdAt: Date;
}
