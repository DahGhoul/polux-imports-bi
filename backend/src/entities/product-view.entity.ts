import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Person } from './person.entity';

@Entity('product_views')
export class ProductView {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Person, p => p.productViews, { onDelete: 'CASCADE' }) person: Person;
  @Column({ length: 140 }) product: string;
  @Column('int', { default: 1 }) secondsViewed: number;
  @CreateDateColumn({ type: 'datetime2' }) createdAt: Date;
}
