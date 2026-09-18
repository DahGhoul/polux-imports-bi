import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Person } from './person.entity';

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Person, p => p.quotes, { onDelete: 'CASCADE' }) person: Person;
  @Column({ length: 30 }) code: string;
  @Column({ length: 140 }) product: string;
  @Column('decimal', { precision: 12, scale: 2 }) amount: number;
  @Column({ length: 40, default: 'ACTIVE' }) status: string;
  @Column({ length: 80, default: 'Contado' }) paymentPlan: string;
  @Column({ type: 'datetime2' }) expiresAt: Date;
  @CreateDateColumn({ type: 'datetime2' }) createdAt: Date;
}
