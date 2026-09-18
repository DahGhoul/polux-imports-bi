import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { AgentAction, FunnelTransition, Interaction, Person } from '../entities';

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(Person) private readonly people: Repository<Person>,
    @InjectRepository(Interaction) private readonly interactions: Repository<Interaction>,
    @InjectRepository(FunnelTransition) private readonly transitions: Repository<FunnelTransition>,
  ) {}

  async create(dto: Partial<Person>) {
    const person = this.people.create({
      firstName: dto.firstName || 'Cliente',
      lastName: dto.lastName || 'Trujillo',
      email: dto.email || `lead.${Date.now()}@polux.pe`,
      phone: dto.phone || '+51 944 620 118',
      age: Number(dto.age) || 24,
      city: 'Trujillo',
      region: 'La Libertad',
      province: 'Trujillo',
      district: dto.district || 'Víctor Larco Herrera',
      address: dto.address || 'Av. Larco 840, Víctor Larco',
      documentType: dto.documentType || 'DNI',
      documentNumber: dto.documentNumber || `${Math.floor(10000000 + Math.random() * 89999999)}`,
      gender: dto.gender || 'Hombre',
      decisionRole: 'Comprador directo',
      currentDevice: dto.currentDevice || 'iPhone 11',
      occupation: dto.occupation || 'Profesional / Estudiante',
      company: dto.company || 'Trujillo Tech',
      university: dto.university || 'Universidad Nacional de Trujillo',
      career: dto.career || 'Ingeniería',
      socioeconomicLevel: dto.socioeconomicLevel || 'B',
      monthlyIncomeMin: dto.monthlyIncomeMin || 3200,
      monthlyIncomeMax: dto.monthlyIncomeMax || 6500,
      stage: dto.stage || 'BUYER',
      preferredChannel: dto.preferredChannel || 'WhatsApp',
      acquisitionSource: dto.acquisitionSource || 'Landing page web',
      campaignName: 'Captación Web Inbound — Trujillo',
      mainProduct: dto.mainProduct || 'iPhone 16 Pro 256 GB',
      secondaryProducts: dto.secondaryProducts || ['AirPods Pro 2'],
      interests: dto.interests || ['fotografía', 'productividad', 'apple'],
      budgetMin: dto.budgetMin || 4200,
      budgetMax: dto.budgetMax || 6800,
      paymentPreference: dto.paymentPreference || 'Yape / Plin',
      priceSensitivity: 'Media',
      score: dto.score || 45,
      priority: dto.priority || 'ALTA',
      conversionProbability: dto.conversionProbability || 60,
      quoteActive: false,
      lastActivityAt: new Date(),
      agentSummary: 'Perfil captado a través de la Landing Page Oficial de Polux Imports.',
      nextBestAction: 'Contactar vía WhatsApp para validación técnica y emisión de cotización.',
      humanInterventionRequired: false,
    });

    const saved = await this.people.save(person);

    await this.interactions.save(this.interactions.create({
      person: saved,
      kind: 'FORM_SUBMIT',
      channel: 'Web Landing',
      topic: 'Solicitud de Cotización Apple',
      content: `Cliente registró formulario en la Landing Page solicitando cotización de ${saved.mainProduct} en ${saved.district}, Trujillo.`,
      direction: 'INBOUND',
      intentPoints: 20,
    }));

    return saved;
  }

  async list(stage?: string, search?: string) {
    const where: any[] = [];
    if (search) {
      const pattern = `%${search}%`;
      where.push(
        { ...(stage ? { stage } : {}), firstName: Like(pattern) },
        { ...(stage ? { stage } : {}), lastName: Like(pattern) },
        { ...(stage ? { stage } : {}), email: Like(pattern) },
        { ...(stage ? { stage } : {}), mainProduct: Like(pattern) },
      );
    }

    return this.people.find({
      where: search ? where : stage ? { stage } : {},
      order: { score: 'DESC', lastActivityAt: 'DESC' },
      take: 500,
    });
  }

  async get(id: number) {
    const person = await this.people.findOne({
      where: { id },
      relations: {
        interactions: true,
        productViews: true,
        quotes: true,
        transitions: true,
        agentActions: true,
      },
      order: {
        interactions: { createdAt: 'DESC' },
        productViews: { createdAt: 'DESC' },
        quotes: { createdAt: 'DESC' },
        transitions: { createdAt: 'DESC' },
        agentActions: { createdAt: 'DESC' },
      },
    });
    if (!person) throw new NotFoundException('Persona no encontrada');
    return person;
  }
}
