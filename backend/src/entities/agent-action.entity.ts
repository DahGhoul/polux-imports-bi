import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Person } from './person.entity';

@Entity('agent_actions')
export class AgentAction {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Person, p => p.agentActions, { nullable: true, onDelete: 'CASCADE' }) person: Person;
  @Column({ length: 30 }) agentType: string;
  @Column({ length: 50 }) actionType: string;
  @Column({ length: 180 }) title: string;
  @Column({ length: 900 }) detail: string;
  @Column({ length: 900, nullable: true }) reasoning: string;
  @Column({ length: 30, default: 'COMPLETED' }) status: string;
  @CreateDateColumn({ type: 'datetime2' }) createdAt: Date;
}
