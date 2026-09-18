import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentAction, Campaign, FunnelTransition, Interaction, Person, ProductView, Quote } from '../entities';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private seed = 20260916;
  constructor(
    @InjectRepository(Person) private readonly people: Repository<Person>,
    @InjectRepository(Interaction) private readonly interactions: Repository<Interaction>,
    @InjectRepository(ProductView) private readonly views: Repository<ProductView>,
    @InjectRepository(Quote) private readonly quotes: Repository<Quote>,
    @InjectRepository(FunnelTransition) private readonly transitions: Repository<FunnelTransition>,
    @InjectRepository(AgentAction) private readonly actions: Repository<AgentAction>,
    @InjectRepository(Campaign) private readonly campaigns: Repository<Campaign>,
  ) {}

  private rnd() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
  private pick<T>(xs: T[]) { return xs[Math.floor(this.rnd() * xs.length)]; }
  private int(min: number, max: number) { return Math.floor(this.rnd() * (max - min + 1)) + min; }
  private dateAgo(daysMax: number) { return new Date(Date.now() - this.int(0, daysMax) * 86400000 - this.int(0, 22) * 3600000); }

  async onApplicationBootstrap() {
    const count = await this.people.count();
    if (count === 0) await this.seedAll();
  }

  async reset() {
    for (const repo of [this.actions, this.transitions, this.quotes, this.views, this.interactions, this.people, this.campaigns]) {
      await repo.createQueryBuilder().delete().execute();
    }
    this.seed = 20260916;
    await this.seedAll();
    return { ok: true };
  }

  private async seedAll() {
    await this.seedCampaigns();
    await this.seedSpecialProfiles();
    await this.seedPeople(148);
  }

  private async seedCampaigns() {
    const rows = [
      ['iPhone 16 Pro — Jóvenes tech', 'Instagram', 2840, 48200, 4180, 4960, 950, 702, 63],
      ['MacBook para universitarios', 'TikTok', 1980, 35400, 3620, 3270, 620, 471, 42],
      ['Compra segura Apple importado', 'Facebook', 2240, 28600, 1940, 2050, 410, 306, 27],
      ['Polux Empresas — Equipamiento', 'LinkedIn', 1760, 9200, 670, 710, 190, 132, 18],
      ['AirPods + productividad', 'Instagram', 1190, 22100, 1740, 2380, 350, 251, 21],
    ];
    for (const [name, channel, spend, reach, clicks, interactions, formStarts, formCompletions, leadsGenerated] of rows as any[]) {
      await this.campaigns.save(this.campaigns.create({ name, channel, spend, reach, clicks, interactions, formStarts, formCompletions, leadsGenerated, status: 'ACTIVE' }));
    }
  }

  private async seedSpecialProfiles() {
    const trujilloDistricts = ['Trujillo Centro', 'Víctor Larco Herrera', 'Huanchaco', 'El Porvenir', 'La Esperanza', 'Moche'];
    const diego = await this.people.save(this.people.create({
      firstName: 'Diego', lastName: 'Ramírez', email: 'diego.ramirez@gmail.com', phone: '+51 987 654 321', age: 28,
      documentType: 'DNI', documentNumber: '72841920', gender: 'Hombre', decisionRole: 'Comprador directo', currentDevice: 'iPhone 11 128GB',
      city: 'Trujillo', province: 'Trujillo', district: 'Víctor Larco Herrera', address: 'Av. Larco 1340, Urb. California', region: 'La Libertad',
      occupation: 'Ingeniero de Sistemas', company: 'TechNova SAC', university: 'Universidad Nacional de Trujillo', career: 'Ingeniería de Sistemas', socioeconomicLevel: 'B',
      monthlyIncomeMin: 4200, monthlyIncomeMax: 4800, stage: 'LEAD', preferredChannel: 'WhatsApp', acquisitionSource: 'Instagram', campaignName: 'iPhone 16 Pro — Jóvenes tech',
      mainProduct: 'iPhone 15 Pro Max 256 GB', secondaryProducts: ['AirPods Pro 2', 'Funda MagSafe'], interests: ['tecnología', 'fotografía', 'productividad'], budgetMin: 5500, budgetMax: 6500,
      paymentPreference: '3 cuotas sin intereses', priceSensitivity: 'Media', score: 78, priority: 'ALTA', conversionProbability: 75, quoteActive: true,
      quoteStartDate: new Date(Date.now() - 3 * 86400000), quoteEndDate: new Date(Date.now() + 4 * 86400000), lastActivityAt: new Date(Date.now() - 3 * 3600000),
      agentSummary: 'Lead activo con intención alta, recurrente en consultas de precio y modalidad de pago.', nextBestAction: 'Reforzar cuotas, garantía y disponibilidad; facilitar inicio del pago mediante pasarela.',
    }));
    await this.transitions.save(this.transitions.create({ person: diego, fromStage: 'BUYER', toStage: 'LEAD', reason: 'Solicitó precio final y disponibilidad de stock.', source: 'MARKETING_AGENT' }));
    for (const item of [
      ['FORM_SUBMIT', 'Web', 'Registro', 'Completó el formulario de contacto con DNI y distrito', 4],
      ['PRICE_FINAL', 'WhatsApp', 'Precio final', 'Consultó el precio final del iPhone 15 Pro Max', 10],
      ['PAYMENT_QUERY', 'WhatsApp', 'Modalidades de pago', 'Preguntó por 3 cuotas sin intereses y pago con Yape', 8],
      ['STOCK_QUERY', 'WhatsApp', 'Disponibilidad', 'Consultó stock disponible en almacén Miami', 10],
      ['GUARANTEE_QUERY', 'Chat IA', 'Garantía', 'Consultó cobertura oficial Apple y garantía local Polux', 4],
      ['DELIVERY_QUERY', 'Chat IA', 'Envío', 'Consultó tiempo estimado de importación y entrega en Trujillo', 6],
      ['PRICE_FINAL', 'WhatsApp', 'Precio final', 'Volvió a consultar precio final con IGV incluido', 10],
      ['PAYMENT_QUERY', 'WhatsApp', 'Modalidades de pago', 'Confirmó interés por pago mediante Yape / 3 cuotas', 8],
    ] as any[]) {
      await this.interactions.save(this.interactions.create({ person: diego, kind: item[0], channel: item[1], topic: item[2], content: item[3], direction: 'INBOUND', intentPoints: item[4] }));
    }
    for (let i = 0; i < 12; i++) await this.views.save(this.views.create({ person: diego, product: i < 9 ? 'iPhone 15 Pro Max 256 GB' : 'AirPods Pro 2', secondsViewed: this.int(60, 360) }));
    await this.quotes.save(this.quotes.create({ person: diego, code: 'POLUX-2026-DR-001', product: 'iPhone 15 Pro Max 256 GB', amount: 5990, status: 'ACTIVE', paymentPlan: '3 cuotas sin intereses', expiresAt: new Date(Date.now() + 4 * 86400000) }));
    await this.actions.save(this.actions.create({ person: diego, agentType: 'NEGOTIATION', actionType: 'EVALUATION', title: 'Lead priorizado automáticamente', detail: 'Diego fue clasificado con prioridad ALTA y 75% de probabilidad estimada.', reasoning: 'Consultas reiteradas de precio, cuotas, stock y cotización activa.' }));

    // Perfil en PAYER (Demostración de Logística Internacional y Pasarela - Tarea 5.5 de Diego)
    const carlos = await this.people.save(this.people.create({
      firstName: 'Carlos', lastName: 'Salazar Benites', email: 'carlos.salazar@novatech.pe', phone: '+51 976 431 820', age: 31,
      documentType: 'DNI', documentNumber: '46820194', gender: 'Hombre', decisionRole: 'Comprador directo', currentDevice: 'iPhone 12 Pro',
      city: 'Trujillo', province: 'Trujillo', district: 'Huanchaco', address: 'Av. La Ribera 420, Huanchaco', region: 'La Libertad',
      occupation: 'Gerente de Proyectos', company: 'NovaTech Perú', university: 'Universidad Privada del Norte', career: 'Ingeniería Civil', socioeconomicLevel: 'A',
      monthlyIncomeMin: 5500, monthlyIncomeMax: 7000, stage: 'PAYER', preferredChannel: 'WhatsApp', acquisitionSource: 'TikTok', campaignName: 'iPhone 16 Pro — Jóvenes tech',
      mainProduct: 'iPhone 16 Pro 256 GB', secondaryProducts: ['Funda MagSafe'], interests: ['tecnología', 'fotografía', 'viajes'], budgetMin: 5000, budgetMax: 6000,
      paymentPreference: 'Contado', priceSensitivity: 'Baja', score: 92, priority: 'ALTA', conversionProbability: 100, quoteActive: true,
      paidAmount: 5690, paymentMethod: 'YAPE', receiptNumber: 'B001-0003892', paidAt: new Date(Date.now() - 4 * 86400000),
      courierTrackingCode: 'POLUX-US-PE-88410', shippingStage: 'TRUJILLO_STORE', lastActivityAt: new Date(),
      agentSummary: '¡ALERTA IMPULSORA! Paquete arribó a la oficina de Trujillo y superó la inspección de calidad física. Coordinar entrega con Carlos.',
      nextBestAction: 'Coordinar protocolo de entrega, registrar número de serie oficial Apple y emitir póliza de garantía.',
    }));
    await this.transitions.save(this.transitions.create({ person: carlos, fromStage: 'LEAD', toStage: 'PAYER', reason: 'Pago de S/ 5,690.00 validado mediante Yape (Op: YAPE-891240).', source: 'POLUXPAY_GATEWAY' }));
    await this.actions.save(this.actions.create({ person: carlos, agentType: 'PROCESSING', actionType: 'LOGISTICS_UPDATE', title: 'Arribo a Sede Principal Trujillo', detail: 'El equipo superó la inspección física. Alerta de impulsamiento disparada.', reasoning: 'Criterio de transición PAYER → CUSTOMER cumplido.' }));

    // Perfil en CUSTOMER (Demostración de Entrega, Garantía y NPS - Tarea 6.5 de Diego)
    const camila = await this.people.save(this.people.create({
      firstName: 'Camila', lastName: 'Paredes Viteri', email: 'camila.paredes@upao.edu.pe', phone: '+51 948 219 045', age: 24,
      documentType: 'DNI', documentNumber: '74192830', gender: 'Mujer', decisionRole: 'Comprador directo', currentDevice: 'iPhone 13',
      city: 'Trujillo', province: 'Trujillo', district: 'Víctor Larco Herrera', address: 'Calle Los Jazmines 210, Urb. California', region: 'La Libertad',
      occupation: 'Médico Residente', company: 'Hospital Regional de Trujillo', university: 'Universidad Privada Antenor Orrego', career: 'Medicina Humana', socioeconomicLevel: 'A',
      monthlyIncomeMin: 4800, monthlyIncomeMax: 6200, stage: 'CUSTOMER', preferredChannel: 'WhatsApp', acquisitionSource: 'Instagram', campaignName: 'iPhone 16 Pro — Jóvenes tech',
      mainProduct: 'MacBook Air M3 13”', secondaryProducts: ['AirPods Pro 2'], interests: ['productividad', 'investigación', 'tecnología'], budgetMin: 4800, budgetMax: 5800,
      paymentPreference: 'Contado', priceSensitivity: 'Baja', score: 96, priority: 'ALTA', conversionProbability: 100, quoteActive: true,
      paidAmount: 5190, paymentMethod: 'CARD', receiptNumber: 'B001-0003102', paidAt: new Date(Date.now() - 15 * 86400000),
      courierTrackingCode: 'POLUX-US-PE-77210', shippingStage: 'DELIVERED', deliveryType: 'STORE_PICKUP', deliveredAt: new Date(Date.now() - 10 * 86400000),
      appleSerialNumber: 'F2LWR89X04M3', warrantyCode: 'POLUX-GAR-2026-9014', warrantyExpiresAt: new Date(Date.now() + 355 * 86400000),
      npsScore: 10, npsFeedback: 'Excelente atención. El equipo vino sellado con garantía de fábrica y me ayudaron a configurar mi cuenta de iCloud en tienda.',
      npsSubmittedAt: new Date(Date.now() - 8 * 86400000), loyaltyRewardActive: true, lastActivityAt: new Date(),
      agentSummary: 'Cliente VIP Promotor (NPS 10/10). Se activó beneficio exclusivo Apple Club Polux: 15% de descuento en accesorios MagSafe y bono de recompra.',
      nextBestAction: 'Enviar catálogo de accesorios y beneficios exclusivos por referidos.',
    }));
    await this.transitions.save(this.transitions.create({ person: camila, fromStage: 'PAYER', toStage: 'CUSTOMER', reason: 'Entrega física en tienda de Trujillo con desempaque verificado y garantía activada.', source: 'LOYALTY_AGENT' }));
    await this.actions.save(this.actions.create({ person: camila, agentType: 'LOYALTY', actionType: 'NPS_SURVEY', title: 'NPS Calificado: 10/10 (Promotor)', detail: 'Feedback: "Excelente atención...". Beneficio Apple Club activado.', reasoning: 'Criterio de transición CUSTOMER → TURNED cumplido.' }));

    const valeria = await this.people.save(this.people.create({
      firstName: 'Valeria', lastName: 'Mendoza', email: 'valeria.mendoza@outlook.com', phone: '+51 944 620 118', age: 23,
      documentType: 'DNI', documentNumber: '73910245', gender: 'Mujer', decisionRole: 'Comprador directo', currentDevice: 'Xiaomi Redmi Note 11',
      city: 'Trujillo', province: 'Trujillo', district: 'Trujillo Centro', address: 'Jr. Pizarro 650, Centro Histórico', region: 'La Libertad',
      occupation: 'Estudiante universitaria', company: '', university: 'Universidad Nacional de Trujillo', career: 'Ingeniería Industrial', socioeconomicLevel: 'B',
      monthlyIncomeMin: 1800, monthlyIncomeMax: 2800, stage: 'BUYER', preferredChannel: 'WhatsApp', acquisitionSource: 'Instagram', campaignName: 'iPhone 16 Pro — Jóvenes tech',
      mainProduct: 'iPhone 16 Pro 256 GB', secondaryProducts: ['AirPods Pro 2', 'Funda MagSafe'], interests: ['fotografía', 'redes sociales', 'tecnología'], budgetMin: 4200, budgetMax: 5200,
      paymentPreference: '6 cuotas', priceSensitivity: 'Media', score: 68, priority: 'MEDIA', conversionProbability: 38, quoteActive: false, lastActivityAt: new Date(Date.now() - 2 * 3600000),
      agentSummary: 'Buyer con interés creciente. Todavía no existe intención comercial explícita.', nextBestAction: 'Invitar a solicitar una cotización preferencial con opciones de cuotas.',
    }));
    for (let i = 0; i < 9; i++) await this.views.save(this.views.create({ person: valeria, product: i < 7 ? 'iPhone 16 Pro 256 GB' : 'AirPods Pro 2', secondsViewed: this.int(55, 260) }));
    for (const item of [
      ['FORM_SUBMIT', 'Web', 'Registro', 'Completó formulario desde Instagram', 4],
      ['CONTENT_INTERACTION', 'Instagram', 'Contenido', 'Guardó comparativa iPhone 16 Pro vs iPhone 16', 3],
      ['GUARANTEE_QUERY', 'Chat IA', 'Garantía', 'Preguntó si el equipo es original y cuenta con garantía', 4],
      ['PRODUCT_VIEW', 'Web', 'Producto', 'Volvió al iPhone 16 Pro por tercera vez', 2],
    ] as any[]) await this.interactions.save(this.interactions.create({ person: valeria, kind: item[0], channel: item[1], topic: item[2], content: item[3], direction: 'INBOUND', intentPoints: item[4] }));
    await this.actions.save(this.actions.create({ person: valeria, agentType: 'MARKETING', actionType: 'EVALUATION', title: 'Buyer con interés creciente', detail: 'Se recomienda cotización preferencial antes de escalar a negociación.', reasoning: 'Alta recurrencia de producto y consulta de garantía, sin señal explícita de compra todavía.' }));
  }

  private async seedPeople(n: number) {
    const firstNames = ['Lucía','Andrea','Mateo','Carlos','Fernanda','José','Camila','Sebastián','María','Renzo','Alessandra','Joaquín','Valentina','Bruno','Sofía','Luis','Daniela','Adrián','Paola','Mauricio','Natalia','Rodrigo','Fiorella','Álvaro'];
    const lastNames = ['Torres','Vega','Salazar','Castillo','Flores','Rojas','Paredes','Chávez','Mendoza','Cruz','García','Reyes','Campos','Silva','Aguilar','Núñez','Sánchez','Cabrera','Morales','Ruiz'];
    const trujilloDistricts = ['Trujillo Centro', 'Víctor Larco Herrera', 'Huanchaco', 'El Porvenir', 'La Esperanza', 'Moche'];
    const occupations = ['Desarrollador de software','Diseñador gráfico','Analista de datos','Arquitecta','Administradora','Contador','Emprendedor','Fotógrafa','Community Manager','Ingeniera industrial','Estudiante universitaria','Consultor independiente'];
    const universities = ['Universidad Nacional de Trujillo','Universidad Privada del Norte','Universidad César Vallejo','Universidad Privada Antenor Orrego'];
    const products = ['iPhone 16 Pro 256 GB','iPhone 16 Pro Max 256 GB','iPhone 15 128 GB','MacBook Air M3 13”','MacBook Air M4 13”','iPad Air M3','AirPods Pro 2','Apple Watch Series 10'];
    const interests = ['tecnología','fotografía','productividad','videojuegos','diseño','programación','creación de contenido','negocios'];
    const channels = ['WhatsApp','Email','Instagram'];
    const sources = ['Instagram','TikTok','Facebook','Referido','LinkedIn','Landing page'];
    const campaigns = ['iPhone 16 Pro — Jóvenes tech','MacBook para universitarios','Compra segura Apple importado','Polux Empresas — Equipamiento','AirPods + productividad'];
    const payments = ['Contado','3 cuotas sin intereses','6 cuotas','Adelanto + saldo contra entrega'];

    for (let i = 0; i < n; i++) {
      const firstName = this.pick(firstNames);
      const lastName = `${this.pick(lastNames)} ${this.pick(lastNames)}`;
      const age = this.int(22, 38);
      const product = this.pick(products);
      const isLead = i < 35;
      const isPayer = i >= 35 && i < 48;
      const isCustomer = i >= 48 && i < 60;
      const stage = isLead ? 'LEAD' : isPayer ? 'PAYER' : isCustomer ? 'CUSTOMER' : 'BUYER';
      const score = stage === 'BUYER' ? this.int(24, 82) : this.int(65, 96);
      const probability = stage === 'LEAD' ? this.int(48, 91) : ['PAYER','CUSTOMER'].includes(stage) ? 100 : this.int(18, 48);
      const priority = (stage === 'LEAD' ? probability : score) >= 72 ? 'ALTA' : (stage === 'LEAD' ? probability : score) >= 45 ? 'MEDIA' : 'BAJA';
      const budgetCenter = product.includes('MacBook') || product.includes('Pro Max') ? this.int(4500, 6800) : product.includes('iPad') ? this.int(2800, 4800) : this.int(1200, 4800);
      const quoteActive = stage !== 'BUYER' ? true : this.rnd() > 0.75;
      const quoteStart = quoteActive ? this.dateAgo(5) : null;
      const quoteEnd = quoteStart ? new Date(quoteStart.getTime() + 7 * 86400000) : null;

      const district = this.pick(trujilloDistricts);
      const shippingStages = ['MIAMI_WAREHOUSE', 'AIR_TRANSIT', 'SUNAT_CUSTOMS', 'TRUJILLO_STORE'];
      const person = await this.people.save(this.people.create({
        firstName, lastName, email: `${firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'')}.${i+10}@demo.polux.pe`, phone: `+51 9${this.int(10,99)} ${this.int(100,999)} ${this.int(100,999)}`,
        age, city: 'Trujillo', province: 'Trujillo', district, address: `Calle Principal ${this.int(100,990)}, ${district}`, region: 'La Libertad',
        documentType: 'DNI', documentNumber: `${this.int(71000000, 78999999)}`, gender: i % 2 === 0 ? 'Hombre' : 'Mujer',
        decisionRole: this.rnd() > 0.8 ? 'Padre/Madre' : 'Comprador directo', currentDevice: this.pick(['iPhone 11', 'iPhone 12', 'Samsung Galaxy S22', 'Motorola Edge']),
        occupation: this.pick(occupations), company: this.rnd() > 0.55 ? this.pick(['Nexa Studio','Andes Digital','Freelance','Kroma SAC','Innova Perú','']) : '',
        university: this.pick(universities), career: this.pick(['Ingeniería de Sistemas','Administración','Diseño','Marketing','Ingeniería Industrial','Comunicación','']), socioeconomicLevel: this.pick(['A','B','B']),
        monthlyIncomeMin: this.int(1800, 4800), monthlyIncomeMax: this.int(4900, 8500), stage, preferredChannel: this.pick(channels), acquisitionSource: this.pick(sources), campaignName: this.pick(campaigns),
        mainProduct: product, secondaryProducts: [this.pick(products.filter(p => p !== product))], interests: [this.pick(interests), this.pick(interests), this.pick(interests)],
        budgetMin: Math.max(900, budgetCenter - this.int(300, 900)), budgetMax: budgetCenter + this.int(250, 900), paymentPreference: this.pick(payments), priceSensitivity: this.pick(['Baja','Media','Media','Alta']),
        score, priority, conversionProbability: probability, quoteActive, quoteStartDate: quoteStart, quoteEndDate: quoteEnd, lastActivityAt: this.dateAgo(12),
        paidAmount: ['PAYER','CUSTOMER'].includes(stage) ? Math.round((budgetCenter + this.int(100, 400)) / 10) * 10 : 0,
        paymentMethod: ['PAYER','CUSTOMER'].includes(stage) ? this.pick(['YAPE', 'PLIN', 'CARD', 'TRANSFER']) : null,
        receiptNumber: ['PAYER','CUSTOMER'].includes(stage) ? `B001-${this.int(10000, 99999)}` : null,
        paidAt: ['PAYER','CUSTOMER'].includes(stage) ? this.dateAgo(this.int(3, 14)) : null,
        courierTrackingCode: ['PAYER','CUSTOMER'].includes(stage) ? `POLUX-US-PE-${this.int(10000, 89999)}` : null,
        shippingStage: stage === 'CUSTOMER' ? 'DELIVERED' : stage === 'PAYER' ? this.pick(shippingStages) : 'MIAMI_WAREHOUSE',
        deliveryType: stage === 'CUSTOMER' ? this.pick(['STORE_PICKUP', 'VERIFIED_DELIVERY']) : null,
        deliveredAt: stage === 'CUSTOMER' ? this.dateAgo(this.int(1, 5)) : null,
        appleSerialNumber: stage === 'CUSTOMER' ? `F2LWR${this.int(10000, 89999)}Y6` : null,
        warrantyCode: stage === 'CUSTOMER' ? `POLUX-GAR-2026-${this.int(1000, 9999)}` : null,
        warrantyExpiresAt: stage === 'CUSTOMER' ? new Date(Date.now() + 350 * 86400000) : null,
        npsScore: stage === 'CUSTOMER' ? this.pick([8, 9, 10, 10, 9, 7]) : null,
        npsFeedback: stage === 'CUSTOMER' ? this.pick(['Excelente equipo, 100% original.', 'Todo perfecto, la garantía me dio mucha confianza.', 'Muy buena atención en la entrega en Trujillo.']) : null,
        agentSummary: stage === 'BUYER' ? 'Perfil analizado por Agente de Marketing.' : stage === 'LEAD' ? 'Lead con intención alta analizado por Agente Negociador.' : stage === 'PAYER' ? 'Pago validado por pasarela. En tránsito logístico desde USA.' : 'Servicio prestado. Garantía de 12 meses activa.',
        nextBestAction: stage === 'BUYER' ? 'Personalizar contenido y enviar cotización.' : stage === 'LEAD' ? 'Presentar propuesta comercial y facilitar pasarela.' : stage === 'PAYER' ? 'Monitorear aduanas e inspección física en Trujillo.' : 'Fidelización postventa y programa Apple Club.',
      }));

      if (stage !== 'BUYER') await this.transitions.save(this.transitions.create({ person, fromStage: 'BUYER', toStage: 'LEAD', reason: this.pick(['Solicitó cotización formal','Preguntó por precio final','Consultó disponibilidad y modalidad de pago']), source: 'MARKETING_AGENT' }));
      if (['PAYER','CUSTOMER'].includes(stage)) await this.transitions.save(this.transitions.create({ person, fromStage: 'LEAD', toStage: 'PAYER', reason: `Pago de S/ ${person.paidAmount} confirmado mediante ${person.paymentMethod}`, source: 'POLUXPAY_GATEWAY' }));
      if (stage === 'CUSTOMER') await this.transitions.save(this.transitions.create({ person, fromStage: 'PAYER', toStage: 'CUSTOMER', reason: 'Producto entregado en Trujillo y garantía oficial activada.', source: 'LOYALTY_AGENT' }));

      const viewCount = this.int(2, stage === 'BUYER' ? 10 : 18);
      for (let v = 0; v < viewCount; v++) await this.views.save(this.views.create({ person, product: this.rnd() > 0.25 ? product : this.pick(products), secondsViewed: this.int(20, 380) }));

      const interactionKinds = stage === 'BUYER'
        ? ['FORM_SUBMIT','CONTENT_INTERACTION','GUARANTEE_QUERY','PRODUCT_VIEW']
        : ['PRICE_FINAL','PAYMENT_QUERY','STOCK_QUERY','GUARANTEE_QUERY','DELIVERY_QUERY','QUOTE_REQUEST','CONTENT_INTERACTION'];
      const interactionCount = this.int(2, stage === 'BUYER' ? 7 : 12);
      for (let k = 0; k < interactionCount; k++) {
        const kind = this.pick(interactionKinds);
        await this.interactions.save(this.interactions.create({ person, kind, channel: this.pick(['Web','WhatsApp','Chat IA','Instagram']), topic: kind.replaceAll('_',' '), content: `Interacción simulada: ${kind.replaceAll('_',' ').toLowerCase()} relacionada con ${product}.`, direction: 'INBOUND', intentPoints: this.int(1, 9) }));
      }

      if (quoteActive) await this.quotes.save(this.quotes.create({ person, code: `POLUX-2026-${String(person.id).padStart(4,'0')}`, product, amount: Math.round((person.budgetMin + person.budgetMax) / 2), status: 'ACTIVE', paymentPlan: person.paymentPreference, expiresAt: quoteEnd || new Date(Date.now() + 5 * 86400000) }));

      if (this.rnd() > 0.65) await this.actions.save(this.actions.create({ person, agentType: stage === 'BUYER' ? 'MARKETING' : stage === 'LEAD' ? 'NEGOTIATION' : stage === 'PAYER' ? 'PROCESSING' : 'LOYALTY', actionType: 'EVALUATION', title: `${stage} auditado por motor de reglas`, detail: `Score ${score}; prioridad ${priority}.`, reasoning: 'Datos sintéticos con demografía y ubicación en Trujillo.' }));
    }
  }
}
