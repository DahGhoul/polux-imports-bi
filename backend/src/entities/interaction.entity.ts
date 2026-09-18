import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Person } from './person.entity';

@Entity('interactions')
export class Interaction {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Person, p => p.interactions, { onDelete: 'CASCADE' }) person: Person;
  @Column({ length: 50 }) kind: string;
  @Column({ length: 40, default: 'Web' }) channel: string;
  @Column({ length: 120, nullable: true }) topic: string;
  @Column({ length: 800, nullable: true }) content: string;
  @Column({ length: 20, default: 'INBOUND' }) direction: string;
  @Column('int', { default: 0 }) intentPoints: number;
  @CreateDateColumn({ type: 'datetime2' }) createdAt: Date;
}
