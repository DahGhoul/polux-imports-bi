import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Interaction } from './interaction.entity';
import { ProductView } from './product-view.entity';
import { Quote } from './quote.entity';
import { FunnelTransition } from './funnel-transition.entity';
import { AgentAction } from './agent-action.entity';

@Entity('persons')
export class Person {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 80 }) firstName: string;
  @Column({ length: 80 }) lastName: string;
  @Column({ unique: true, length: 180 }) email: string;
  @Column({ length: 30 }) phone: string;
  @Column('int') age: number;
  @Column({ length: 80 }) city: string;
  @Column({ length: 80, default: 'La Libertad' }) region: string;
  @Column({ length: 80, default: 'Trujillo' }) province: string;
  @Column({ length: 80, default: 'Trujillo' }) district: string;
  @Column({ length: 200, nullable: true }) address: string;
  @Column({ length: 20, default: 'DNI' }) documentType: string;
  @Column({ length: 30, nullable: true }) documentNumber: string;
  @Column({ length: 20, default: 'Hombre' }) gender: string;
  @Column({ length: 60, default: 'Comprador directo' }) decisionRole: string;
  @Column({ length: 80, default: 'iPhone 11' }) currentDevice: string;
  @Column({ length: 120, nullable: true }) occupation: string;
  @Column({ length: 120, nullable: true }) company: string;
  @Column({ length: 160, nullable: true }) university: string;
  @Column({ length: 160, nullable: true }) career: string;
  @Column({ length: 10, default: 'B' }) socioeconomicLevel: string;
  @Column('int', { default: 1800 }) monthlyIncomeMin: number;
  @Column('int', { default: 3500 }) monthlyIncomeMax: number;
  @Column({ length: 20, default: 'BUYER' }) stage: string;
  @Column({ length: 30, default: 'WhatsApp' }) preferredChannel: string;
  @Column({ length: 60, default: 'Instagram' }) acquisitionSource: string;
  @Column({ length: 140, nullable: true }) campaignName: string;
  @Column({ length: 140 }) mainProduct: string;
  @Column('simple-array', { nullable: true }) secondaryProducts: string[];
  @Column('simple-array', { nullable: true }) interests: string[];
  @Column('int', { default: 2500 }) budgetMin: number;
  @Column('int', { default: 4500 }) budgetMax: number;
  @Column({ length: 80, default: 'Contado' }) paymentPreference: string;
  @Column({ length: 30, default: 'Media' }) priceSensitivity: string;
  @Column('int', { default: 40 }) score: number;
  @Column({ length: 20, default: 'BAJA' }) priority: string;
  @Column('int', { default: 25 }) conversionProbability: number;
  @Column({ default: false }) quoteActive: boolean;
  @Column({ type: 'datetime2', nullable: true }) quoteStartDate: Date;
  @Column({ type: 'datetime2', nullable: true }) quoteEndDate: Date;
  @Column({ type: 'datetime2', nullable: true }) lastActivityAt: Date;
  @Column({ length: 500, nullable: true }) agentSummary: string;
  @Column({ length: 500, nullable: true }) nextBestAction: string;
  @Column({ default: false }) humanInterventionRequired: boolean;

  // Fase 3: PAYERS & Logística Internacional (Diego - 5.5)
  @Column({ length: 40, nullable: true }) paymentMethod: string;
  @Column('decimal', { precision: 10, scale: 2, default: 0 }) paidAmount: number;
  @Column({ length: 40, nullable: true }) receiptNumber: string;
  @Column({ type: 'datetime2', nullable: true }) paidAt: Date;
  @Column({ length: 50, nullable: true }) courierTrackingCode: string;
  @Column({ length: 40, default: 'MIAMI_WAREHOUSE' }) shippingStage: string;

  // Fase 4: CUSTOMERS & Fidelización Postventa CRM (Diego - 6.5)
  @Column({ length: 40, nullable: true }) deliveryType: string;
  @Column({ type: 'datetime2', nullable: true }) deliveredAt: Date;
  @Column({ length: 50, nullable: true }) appleSerialNumber: string;
  @Column({ length: 60, nullable: true }) warrantyCode: string;
  @Column({ type: 'datetime2', nullable: true }) warrantyExpiresAt: Date;
  @Column('int', { nullable: true }) npsScore: number;
  @Column({ length: 500, nullable: true }) npsFeedback: string;
  @Column({ type: 'datetime2', nullable: true }) npsSubmittedAt: Date;
  @Column({ default: false }) loyaltyRewardActive: boolean;

  @CreateDateColumn({ type: 'datetime2' }) createdAt: Date;
  @UpdateDateColumn({ type: 'datetime2' }) updatedAt: Date;

  @OneToMany(() => Interaction, i => i.person) interactions: Interaction[];
  @OneToMany(() => ProductView, v => v.person) productViews: ProductView[];
  @OneToMany(() => Quote, q => q.person) quotes: Quote[];
  @OneToMany(() => FunnelTransition, t => t.person) transitions: FunnelTransition[];
  @OneToMany(() => AgentAction, a => a.person) agentActions: AgentAction[];
}
