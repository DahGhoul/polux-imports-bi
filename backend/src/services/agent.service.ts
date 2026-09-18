import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentAction, FunnelTransition, Interaction, Person, ProductView, Quote } from '../entities';
import { PeopleService } from './people.service';

const explicitLeadKinds = ['PRICE_FINAL', 'STOCK_QUERY', 'PAYMENT_QUERY', 'DELIVERY_QUERY', 'QUOTE_REQUEST'];

@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(Person) private readonly people: Repository<Person>,
    @InjectRepository(Interaction) private readonly interactions: Repository<Interaction>,
    @InjectRepository(ProductView) private readonly views: Repository<ProductView>,
    @InjectRepository(Quote) private readonly quotes: Repository<Quote>,
    @InjectRepository(FunnelTransition) private readonly transitions: Repository<FunnelTransition>,
    @InjectRepository(AgentAction) private readonly actions: Repository<AgentAction>,
    private readonly peopleService: PeopleService,
  ) {}

  private async logAction(person: Person | null, agentType: string, actionType: string, title: string, detail: string, reasoning?: string) {
    return this.actions.save(this.actions.create({ person: person || undefined, agentType, actionType, title, detail, reasoning, status: 'COMPLETED' }));
  }

  private marketingScore(person: Person) {
    const interactions = person.interactions || [];
    const views = person.productViews || [];
    const count = (kind: string) => interactions.filter(i => i.kind === kind).length;
    const daysInactive = person.lastActivityAt ? (Date.now() - new Date(person.lastActivityAt).getTime()) / 86400000 : 30;

    let score = 12;
    score += Math.min(views.length * 2, 16);
    score += Math.min(count('PRICE_FINAL') * 10, 20);
    score += Math.min(count('STOCK_QUERY') * 10, 20);
    score += Math.min(count('PAYMENT_QUERY') * 8, 16);
    score += Math.min(count('DELIVERY_QUERY') * 6, 12);
    score += Math.min(count('QUOTE_REQUEST') * 25, 25);
    score += person.quoteActive ? 8 : 0;
    score += daysInactive <= 1 ? 8 : daysInactive <= 3 ? 5 : daysInactive > 10 ? -8 : 0;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  async evaluateMarketing(id: number) {
    let person = await this.peopleService.get(id);
    const score = this.marketingScore(person);
    const interactions = person.interactions || [];
    const explicit = interactions.find(i => explicitLeadKinds.includes(i.kind));
    const previousScore = person.score;

    let priority = score >= 75 ? 'ALTA' : score >= 45 ? 'MEDIA' : 'BAJA';
    let summary = '';
    let next = '';

    if (explicit && person.stage === 'BUYER') {
      summary = `Intención comercial explícita detectada mediante ${this.kindLabel(explicit.kind)}.`;
      next = 'Transferir el contexto completo al Agente Negociador y priorizar contacto comercial.';
    } else if (score >= 75) {
      summary = 'Buyer con señales intensas de interés: actividad reciente, consultas comerciales y recurrencia de producto.';
      next = 'Invitar a solicitar cotización preferencial y realizar seguimiento por el canal preferido.';
    } else if (score >= 45) {
      summary = 'Buyer con interés intermedio. Aún requiere más evidencia antes de iniciar negociación.';
      next = 'Enviar contenido del producto principal, resolver objeciones frecuentes y monitorear nueva actividad.';
    } else {
      summary = 'Buyer en etapa temprana o con actividad limitada.';
      next = 'Mantener nutrición de contenido y evitar presión comercial excesiva.';
    }

    await this.people.update(id, { score, priority, agentSummary: summary, nextBestAction: next, lastActivityAt: person.lastActivityAt || new Date() });
    person = await this.peopleService.get(id);

    await this.logAction(
      person,
      'MARKETING',
      'EVALUATION',
      `Perfil evaluado: ${person.firstName} ${person.lastName}`,
      `Score ${previousScore} → ${score}. Prioridad ${priority}. ${summary}`,
      `Se analizaron ${person.productViews?.length || 0} vistas de producto y ${person.interactions?.length || 0} interacciones.`,
    );

    if (explicit && person.stage === 'BUYER') {
      return this.promoteToLead(id, `Intención explícita: ${this.kindLabel(explicit.kind)}`, 'MARKETING_AGENT');
    }

    return this.peopleService.get(id);
  }

  async promoteToLead(id: number, reason = 'Promoción manual validada por el agente', source = 'MANUAL') {
    const person = await this.peopleService.get(id);
    if (person.stage !== 'BUYER') return person;

    await this.people.update(id, {
      stage: 'LEAD',
      priority: person.score >= 70 ? 'ALTA' : person.score >= 45 ? 'MEDIA' : 'BAJA',
      conversionProbability: Math.min(92, Math.max(42, Math.round(person.score * 0.72 + 22))),
      agentSummary: 'Contexto transferido desde BUYERS. El lead ya presenta intención comercial y debe ser acompañado hasta el primer pago.',
      nextBestAction: 'Revisar perfil 360°, validar necesidades, presentar condiciones vigentes y mantener seguimiento de la cotización.',
    });
    await this.transitions.save(this.transitions.create({ person, fromStage: 'BUYER', toStage: 'LEAD', reason, source }));
    await this.logAction(
      person,
      'MARKETING',
      'STAGE_TRANSITION',
      `${person.firstName} pasó de BUYER → LEAD`,
      reason,
      'La transición conserva el historial completo y habilita el Agente Negociador.',
    );
    return this.evaluateNegotiation(id);
  }

  async evaluateNegotiation(id: number) {
    const person = await this.peopleService.get(id);
    if (!['LEAD', 'PAYER'].includes(person.stage)) return person;

    const interactions = person.interactions || [];
    const count = (kind: string) => interactions.filter(i => i.kind === kind).length;
    const completenessFields = [person.phone, person.email, person.occupation, person.mainProduct, person.budgetMin, person.paymentPreference, person.preferredChannel];
    const completeness = Math.round((completenessFields.filter(Boolean).length / completenessFields.length) * 100);

    let probability = 34 + Math.round(person.score * 0.35);
    probability += Math.min(count('PRICE_FINAL') * 4, 8);
    probability += Math.min(count('PAYMENT_QUERY') * 7, 14);
    probability += Math.min(count('STOCK_QUERY') * 5, 10);
    probability += person.quoteActive ? 8 : 0;
    probability += completeness >= 90 ? 5 : 0;
    probability = Math.max(25, Math.min(96, probability));

    const specialDiscount = count('SPECIAL_DISCOUNT') > 0;
    const complaint = count('COMPLAINT') > 0;
    const human = specialDiscount || complaint;
    const priority = probability >= 72 ? 'ALTA' : probability >= 48 ? 'MEDIA' : 'BAJA';

    let summary = `Perfil ${completeness}% completo; probabilidad estimada de conversión ${probability}%.`;
    let next = '';
    if (human) {
      next = specialDiscount
        ? 'Derivar a una persona para revisar el descuento solicitado. El agente no debe modificar precios ni condiciones comerciales.'
        : 'Derivar el caso a soporte humano por presencia de reclamo o incidencia.';
    } else if (probability >= 72) {
      next = `Contactar por ${person.preferredChannel}, reforzar ${person.paymentPreference.toLowerCase()} y vigencia de la cotización; facilitar inicio del pago.`;
    } else if (probability >= 48) {
      next = 'Resolver objeciones principales, presentar garantía y trazabilidad, y programar seguimiento antes del vencimiento de la cotización.';
    } else {
      next = 'Mantener seguimiento moderado y completar información faltante antes de presionar por cierre.';
    }

    await this.people.update(id, { conversionProbability: probability, priority, humanInterventionRequired: human, agentSummary: summary, nextBestAction: next });
    const updated = await this.peopleService.get(id);
    await this.logAction(
      updated,
      'NEGOTIATION',
      'EVALUATION',
      `Lead evaluado: ${updated.firstName} ${updated.lastName}`,
      `${summary} Prioridad ${priority}.`,
      `Se usaron score previo, consultas comerciales, estado de cotización, modalidad de pago y completitud del perfil.`,
    );
    return this.peopleService.get(id);
  }

  async simulate(id: number, eventType: string) {
    const person = await this.peopleService.get(id);
    const defs: Record<string, { kind: string; channel: string; topic: string; content: string; points: number }> = {
      PRODUCT_VIEW: { kind: 'PRODUCT_VIEW', channel: 'Web', topic: 'Producto', content: `Visualizó ${person.mainProduct}`, points: 2 },
      PRICE_FINAL: { kind: 'PRICE_FINAL', channel: person.preferredChannel, topic: 'Precio final', content: `Consultó el precio final de ${person.mainProduct}`, points: 10 },
      STOCK_QUERY: { kind: 'STOCK_QUERY', channel: person.preferredChannel, topic: 'Disponibilidad', content: `Consultó disponibilidad de ${person.mainProduct}`, points: 10 },
      PAYMENT_QUERY: { kind: 'PAYMENT_QUERY', channel: person.preferredChannel, topic: 'Modalidades de pago', content: `Preguntó por ${person.paymentPreference}`, points: 8 },
      DELIVERY_QUERY: { kind: 'DELIVERY_QUERY', channel: person.preferredChannel, topic: 'Tiempo de entrega', content: 'Consultó el tiempo estimado de importación y entrega', points: 6 },
      QUOTE_REQUEST: { kind: 'QUOTE_REQUEST', channel: person.preferredChannel, topic: 'Cotización', content: `Solicitó cotización formal para ${person.mainProduct}`, points: 25 },
      SPECIAL_DISCOUNT: { kind: 'SPECIAL_DISCOUNT', channel: person.preferredChannel, topic: 'Descuento especial', content: 'Solicitó un descuento fuera de la política automática', points: 2 },
      COMPLAINT: { kind: 'COMPLAINT', channel: person.preferredChannel, topic: 'Reclamo', content: 'Reportó una incidencia que requiere revisión humana', points: -2 },
    };
    const def = defs[eventType] || defs.PRODUCT_VIEW;

    if (eventType === 'PRODUCT_VIEW') {
      await this.views.save(this.views.create({ person, product: person.mainProduct, secondsViewed: 45 + Math.round(Math.random() * 180) }));
    }
    await this.interactions.save(this.interactions.create({ person, ...def, direction: 'INBOUND', intentPoints: def.points }));
    await this.people.update(id, { lastActivityAt: new Date() });

    if (eventType === 'QUOTE_REQUEST') await this.ensureQuote(id);

    return person.stage === 'BUYER' ? this.evaluateMarketing(id) : this.evaluateNegotiation(id);
  }

  async ensureQuote(id: number) {
    const person = await this.peopleService.get(id);
    const active = person.quotes?.find(q => q.status === 'ACTIVE' && new Date(q.expiresAt) > new Date());
    if (active) return active;

    const amount = Math.max(person.budgetMin, Math.round((person.budgetMin + person.budgetMax) / 2 / 10) * 10);
    const expiresAt = new Date(Date.now() + 7 * 86400000);
    const quote = await this.quotes.save(this.quotes.create({
      person,
      code: `POLUX-${new Date().getFullYear()}-${String(person.id).padStart(4, '0')}-${Math.floor(Math.random() * 90 + 10)}`,
      product: person.mainProduct,
      amount,
      paymentPlan: person.paymentPreference,
      expiresAt,
      status: 'ACTIVE',
    }));
    await this.people.update(id, { quoteActive: true, quoteStartDate: new Date(), quoteEndDate: expiresAt });
    await this.logAction(person, person.stage === 'BUYER' ? 'MARKETING' : 'NEGOTIATION', 'QUOTE', 'Cotización generada', `${quote.code} por S/ ${amount.toLocaleString('es-PE')}, vigente 7 días.`, 'La cotización usa el producto de interés, presupuesto y modalidad de pago registrados.');
    return quote;
  }

  async generateProposal(id: number) {
    const person = await this.peopleService.get(id);
    const quote = await this.ensureQuote(id);
    const base = Number(quote.amount);
    const proposals = [
      { label: 'Opción recomendada', product: person.mainProduct, amount: base, payment: person.paymentPreference, note: 'Equilibrio entre presupuesto, preferencia de pago y producto principal.' },
      { label: 'Opción ahorro', product: person.mainProduct, amount: Math.round(base * 0.96), payment: 'Contado', note: 'Alternativa de pago directo sin modificar políticas ni aprobar descuentos especiales.' },
      { label: 'Opción flexibilidad', product: person.mainProduct, amount: base, payment: '3 cuotas', note: 'Mantiene el valor de referencia y prioriza facilidad de pago.' },
    ];
    await this.logAction(person, 'NEGOTIATION', 'PROPOSAL', 'Propuesta comercial preparada', `Se generaron ${proposals.length} alternativas para revisión del agente humano.`, 'Ninguna alternativa altera condiciones no autorizadas; los descuentos especiales requieren intervención humana.');
    return { personId: person.id, quote, proposals };
  }

  async confirmPayment(id: number) {
    return this.processPaymentWithGateway(id, { paymentMethod: 'YAPE', operationCode: 'YAPE-DEMO-001' });
  }

  // =========================================================================
  // FASE 3: Agente de Procesamiento Financiero y Logística (Diego Joel - 5.5)
  // =========================================================================

  async processPaymentWithGateway(id: number, dto: { paymentMethod?: string; amount?: number; operationCode?: string; cardLast4?: string; deliveryAddress?: string }) {
    const person = await this.peopleService.get(id);
    const activeQuote = person.quotes?.find(q => q.status === 'ACTIVE') || person.quotes?.[0];
    const amount = Number(dto.amount || activeQuote?.amount || Math.round((person.budgetMin + person.budgetMax) / 2));
    const method = (dto.paymentMethod || 'YAPE').toUpperCase();
    const receiptNum = `B001-${String(Math.floor(Math.random() * 90000 + 10000))}`;
    const tracking = `POLUX-US-PE-${Math.floor(Math.random() * 89999 + 10000)}`;
    const opCode = dto.operationCode || `${method}-${Math.floor(Math.random() * 900000 + 100000)}`;

    await this.people.update(id, {
      stage: 'PAYER',
      priority: 'ALTA',
      conversionProbability: 100,
      paymentMethod: method,
      paidAmount: amount,
      receiptNumber: receiptNum,
      paidAt: new Date(),
      courierTrackingCode: tracking,
      shippingStage: 'MIAMI_WAREHOUSE',
      address: dto.deliveryAddress || person.address || `${person.district}, Trujillo`,
      agentSummary: `Pago validado exitosamente mediante pasarela (${method}, Op: ${opCode}, S/ ${amount.toLocaleString('es-PE')}). Boleta ${receiptNum} emitida. Orden enviada a proveedor Apple en Miami con guía ${tracking}.`,
      nextBestAction: 'Monitorear despacho logístico internacional desde Miami y preparar trámite de aduanas SUNAT.',
      humanInterventionRequired: false,
    });

    await this.transitions.save(this.transitions.create({
      person,
      fromStage: person.stage,
      toStage: 'PAYER',
      reason: `Pago de S/ ${amount.toLocaleString('es-PE')} validado por pasarela ${method} (Código de operación: ${opCode}).`,
      source: 'POLUXPAY_GATEWAY',
    }));

    await this.logAction(
      person,
      'PROCESSING',
      'PAYMENT_VALIDATED',
      `Pago confirmado: ${method} — ${receiptNum}`,
      `Se validó la transacción de S/ ${amount.toLocaleString('es-PE')}. Boleta electrónica generada y orden de adquisición creada para ${person.mainProduct}.`,
      `Pasarela de pagos PoluxPay confirmó la transacción. Se generó guía de importación ${tracking}.`,
    );

    await this.interactions.save(this.interactions.create({
      person,
      kind: 'PAYMENT_CONFIRMED',
      channel: method === 'YAPE' ? 'Yape' : method === 'PLIN' ? 'Plin' : 'Pasarela Web',
      topic: 'Confirmación de Pago',
      content: `Pago de S/ ${amount.toLocaleString('es-PE')} recibido mediante ${method}. Comprobante: ${receiptNum}.`,
      direction: 'INBOUND',
      intentPoints: 50,
    }));

    return this.peopleService.get(id);
  }

  async advanceShippingStage(id: number) {
    const person = await this.peopleService.get(id);
    const stages = ['MIAMI_WAREHOUSE', 'AIR_TRANSIT', 'SUNAT_CUSTOMS', 'TRUJILLO_STORE'];
    const currentIdx = stages.indexOf(person.shippingStage || 'MIAMI_WAREHOUSE');
    const nextIdx = Math.min(currentIdx + 1, stages.length - 1);
    const nextStage = stages[nextIdx];

    const stageTitles: Record<string, string> = {
      MIAMI_WAREHOUSE: 'Recepción en Almacén Miami (USA)',
      AIR_TRANSIT: 'En Tránsito Aéreo Internacional (Miami → Lima)',
      SUNAT_CUSTOMS: 'Inspección Aduanera SUNAT (Aeropuerto Jorge Chávez, Lima)',
      TRUJILLO_STORE: 'Arribo a Sede Principal Trujillo (Superó Inspección Física)',
    };

    const isArrived = nextStage === 'TRUJILLO_STORE';
    const summary = isArrived
      ? `¡ALERTA IMPULSORA! El paquete ${person.courierTrackingCode} llegó a la oficina de Trujillo y superó la inspección de calidad física. Notificar al cliente para coordinar entrega presencial o delivery.`
      : `Actualización logística: ${stageTitles[nextStage]}. Guía internacional ${person.courierTrackingCode}.`;
    const next = isArrived
      ? 'Coordinar protocolo de entrega, verificar desempaque y registrar número de serie oficial Apple.'
      : 'Continuar monitoreo del itinerario aduanero y logístico.';

    await this.people.update(id, {
      shippingStage: nextStage,
      agentSummary: summary,
      nextBestAction: next,
    });

    await this.logAction(
      person,
      'PROCESSING',
      'LOGISTICS_UPDATE',
      `Logística: ${stageTitles[nextStage]}`,
      summary,
      `Guía ${person.courierTrackingCode}. Proveedor de carga internacional actualizó el estado de la importación.`,
    );

    return this.peopleService.get(id);
  }

  async triggerCollectionAlert(id: number, dto?: { alertType?: string; customMessage?: string }) {
    const person = await this.peopleService.get(id);
    const alertType = dto?.alertType || 'COLLECTION_REMINDER';

    let topic = 'Alerta Impulsora de Cobranza';
    let alertMsg = dto?.customMessage || '';

    if (alertType === 'PAYMENT_INCONSISTENCY') {
      topic = 'Alerta: Comprobante Observado / Inconsistencia';
      alertMsg = `Hola ${person.firstName}, nuestro sistema detectó una observación en la validación de tu comprobante de pago. El Agente de Cobranza se comunicará para regularizar el abono y evitar retrasos en el despacho.`;
    } else if (alertType === 'CUSTOMS_UPDATE') {
      topic = 'Alerta Aduanera: Ingreso a Territorio Peruano';
      alertMsg = `Hola ${person.firstName}, tu pedido ${person.mainProduct} con guía ${person.courierTrackingCode || 'POLUX-US'} ha ingresado a Aduanas SUNAT en el Aeropuerto Jorge Chávez (Lima). Se encuentra en proceso de nacionalización.`;
    } else if (alertType === 'ARRIVAL_TRUJILLO') {
      topic = 'Alerta: Arribo a Sede Trujillo & Coordinación de Saldo';
      alertMsg = `¡Excelente noticia ${person.firstName}! Tu ${person.mainProduct} llegó a nuestra sede de Trujillo (Av. Larco 840) y superó la inspección física de calidad. Puedes coordinar tu recojo y cancelar el saldo pendiente (50%) en efectivo o tarjeta.`;
    } else {
      alertMsg = alertMsg || `Hola ${person.firstName}, te recordamos desde Polux Imports que tu cotización preferencial para ${person.mainProduct} tiene vigencia limitada. Si deseas asegurar el stock de importación, puedes completar tu pago mediante Yape, Plin o tarjeta bancaria.`;
    }

    await this.interactions.save(this.interactions.create({
      person,
      kind: 'COLLECTION_ALERT',
      channel: person.preferredChannel || 'WhatsApp',
      topic,
      content: alertMsg,
      direction: 'OUTBOUND',
      intentPoints: 5,
    }));

    await this.logAction(
      person,
      'PROCESSING',
      'ALERT_SENT',
      topic,
      alertMsg,
      `Alerta impulsora según la matriz de actividades de la fase PAYERS (Tabla 8 del informe).`,
    );

    return this.peopleService.get(id);
  }

  // =========================================================================
  // FASE 4: Agente de Fidelización y Soporte Postventa CRM (Diego Joel - 6.5)
  // =========================================================================

  async deliverService(id: number, dto: { deliveryType?: string; appleSerialNumber?: string; notes?: string }) {
    const person = await this.peopleService.get(id);
    const delType = dto.deliveryType || 'STORE_PICKUP';
    const serial = dto.appleSerialNumber || `F2LWR${Math.floor(Math.random() * 89999 + 10000)}Y6Q`;
    const warrantyCode = `POLUX-GAR-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const warrantyExp = new Date(Date.now() + 365 * 86400000); // 1 año de garantía oficial

    await this.people.update(id, {
      stage: 'CUSTOMER',
      deliveryType: delType,
      deliveredAt: new Date(),
      appleSerialNumber: serial,
      warrantyCode: warrantyCode,
      warrantyExpiresAt: warrantyExp,
      shippingStage: 'DELIVERED',
      agentSummary: `Servicio prestado y registrado exitosamente. Equipo ${person.mainProduct} entregado (${delType === 'STORE_PICKUP' ? 'Retiro en Tienda Trujillo' : 'Delivery verificado'}). Número de serie Apple verificado: ${serial}. Póliza de garantía de 12 meses: ${warrantyCode}.`,
      nextBestAction: 'Enviar encuesta de satisfacción NPS y recomendar accesorios originales complementarios.',
    });

    await this.transitions.save(this.transitions.create({
      person,
      fromStage: 'PAYER',
      toStage: 'CUSTOMER',
      reason: `Producto entregado y verificado en Trujillo. Número de serie Apple ${serial} validado. Garantía emitida.`,
      source: 'LOYALTY_AGENT',
    }));

    await this.logAction(
      person,
      'LOYALTY',
      'SERVICE_DELIVERY',
      `Entrega completada: ${person.firstName} ${person.lastName}`,
      `Se registró la entrega de ${person.mainProduct} y se activó la garantía ${warrantyCode} válida hasta ${warrantyExp.toLocaleDateString('es-PE')}.`,
      `Protocolo de entrega completado. Serial oficial Apple: ${serial}.`,
    );

    await this.interactions.save(this.interactions.create({
      person,
      kind: 'SERVICE_DELIVERED',
      channel: 'Presencial / Logística',
      topic: 'Atención del Servicio',
      content: `Entrega formal de ${person.mainProduct}. Serie: ${serial}. Garantía: ${warrantyCode}.`,
      direction: 'OUTBOUND',
      intentPoints: 40,
    }));

    return this.peopleService.get(id);
  }

  async submitNps(id: number, dto: { score: number; feedback?: string }) {
    const person = await this.peopleService.get(id);
    const score = Math.max(0, Math.min(10, Number(dto.score)));
    const feedback = dto.feedback || 'Excelente servicio y rapidez en la importación.';
    const isPromoter = score >= 9;
    const isPassive = score >= 7 && score < 9;
    const category = isPromoter ? 'PROMOTOR' : isPassive ? 'PASIVO' : 'DETRACTOR';

    const rewardActive = isPromoter;
    const summary = isPromoter
      ? `¡ALERTA IMPULSORA A FIDELIZACIÓN CONTINUA (CUSTOMER → TURNED)! Cliente clasificado como Promotor (${score}/10). Se activó beneficio exclusivo Apple Club Polux: 15% de descuento en accesorios MagSafe y programa de referidos.`
      : `Encuesta NPS registrada: ${score}/10 (${category}). Comentario: "${feedback}".`;

    await this.people.update(id, {
      npsScore: score,
      npsFeedback: feedback,
      npsSubmittedAt: new Date(),
      loyaltyRewardActive: rewardActive,
      agentSummary: summary,
      nextBestAction: isPromoter
        ? 'Enviar credencial Apple Club Polux y catálogo de renovación de equipos.'
        : 'Realizar seguimiento de soporte postventa para garantizar satisfacción 100%.',
    });

    await this.logAction(
      person,
      'LOYALTY',
      'NPS_SURVEY',
      `NPS Calificado: ${score}/10 (${category})`,
      `Feedback del cliente: "${feedback}". ${rewardActive ? 'Beneficio de lealtad activado.' : ''}`,
      'Evaluación de satisfacción postventa registrada en el CRM analítico.',
    );

    if (isPromoter) {
      await this.transitions.save(this.transitions.create({
        person,
        fromStage: 'CUSTOMER',
        toStage: 'TURNED',
        reason: `Cliente promotor con puntaje NPS ${score}/10. Incorporado a programa de lealtad continua (TURNED).`,
        source: 'LOYALTY_AGENT',
      }));
    }

    return this.peopleService.get(id);
  }

  async createSupportTicket(id: number, dto: { topic: string; detail: string }) {
    const person = await this.peopleService.get(id);
    const topic = dto.topic || 'Soporte Técnico Apple';
    const detail = dto.detail || 'Consulta sobre configuración inicial y garantía.';

    await this.interactions.save(this.interactions.create({
      person,
      kind: 'SUPPORT_TICKET',
      channel: 'CRM Postventa',
      topic,
      content: detail,
      direction: 'INBOUND',
      intentPoints: 0,
    }));

    await this.logAction(
      person,
      'LOYALTY',
      'TICKET_CREATED',
      `Ticket Postventa: ${topic}`,
      detail,
      'Registrado en la mesa de ayuda CRM de Polux Imports.',
    );

    return this.peopleService.get(id);
  }


  async askAgent(id: number, question: string) {
    const person = await this.peopleService.get(id);
    const q = (question || '').toLowerCase();
    const interactions = person.interactions || [];
    const count = (kind: string) => interactions.filter(i => i.kind === kind).length;
    let answer = '';

    if (q.includes('abord') || q.includes('recom') || q.includes('qué hago') || q.includes('que hago')) {
      answer = person.nextBestAction || 'Ejecuta primero la evaluación del agente para generar una recomendación contextual.';
    } else if (q.includes('mensaje') || q.includes('whatsapp')) {
      answer = person.stage === 'BUYER'
        ? `Hola ${person.firstName} 👋. Vi que estuviste revisando ${person.mainProduct}. Si deseas, puedo ayudarte con disponibilidad, garantía y una cotización preferencial adaptada a tu presupuesto de ${person.budgetMin} a ${person.budgetMax} soles.`
        : `Hola ${person.firstName} 👋. Sobre ${person.mainProduct}: tengo registrado que prefieres ${person.paymentPreference}. Puedo explicarte las condiciones vigentes, la garantía y la disponibilidad para que evalúes el siguiente paso con toda la información clara.`;
    } else if (q.includes('por qué') || q.includes('porque') || q.includes('prioridad') || q.includes('score')) {
      answer = `La clasificación se apoya en señales observables: ${person.productViews?.length || 0} vistas de producto, ${count('PRICE_FINAL')} consulta(s) de precio final, ${count('STOCK_QUERY')} de stock, ${count('PAYMENT_QUERY')} de pago y ${person.quoteActive ? 'una cotización activa' : 'sin cotización activa'}. El sistema no usa una intuición oculta; estas señales alimentan el score y la prioridad.`;
    } else if (q.includes('descuento')) {
      answer = 'Puedo identificar si el perfil cumple criterios predefinidos, pero no autorizar ni inventar un descuento especial. Si la solicitud excede las condiciones vigentes, debo derivarla a una persona para aprobación.';
    } else if (q.includes('cotiz')) {
      const active = person.quotes?.find(x => x.status === 'ACTIVE');
      answer = active
        ? `La cotización ${active.code} está registrada por ${Number(active.amount).toLocaleString('es-PE')} soles y usa la modalidad ${active.paymentPlan}. Antes de enviarla conviene verificar su vigencia.`
        : 'No existe una cotización activa. Puedo generar una usando el producto, presupuesto y modalidad de pago registrados.';
    } else if (q.includes('resumen') || q.includes('perfil')) {
      answer = `${person.firstName} ${person.lastName}, ${person.age} años, ${person.city}. Interés principal: ${person.mainProduct}. Presupuesto estimado: S/ ${person.budgetMin.toLocaleString('es-PE')}–${person.budgetMax.toLocaleString('es-PE')}. Canal preferido: ${person.preferredChannel}. Estado: ${person.stage}, prioridad ${person.priority}. ${person.agentSummary || ''}`;
    } else {
      answer = `Puedo ayudarte a interpretar el perfil de ${person.firstName}: pregúntame por la estrategia de abordaje, el score, la prioridad, la cotización o pídeme un mensaje de WhatsApp.`;
    }

    await this.logAction(person, person.stage === 'BUYER' ? 'MARKETING' : 'NEGOTIATION', 'AGENT_CHAT', 'Consulta al copiloto', question || 'Consulta vacía', `Respuesta generada usando únicamente datos persistidos del perfil y reglas de negocio de la demo.`);
    return { answer, stage: person.stage, personId: person.id };
  }

  async recent(agentType?: string) {
    return this.actions.find({
      where: agentType ? { agentType } : {},
      relations: { person: true },
      order: { createdAt: 'DESC' },
      take: 80,
    });
  }

  private kindLabel(kind: string) {
    const labels: Record<string, string> = {
      PRICE_FINAL: 'consulta de precio final',
      STOCK_QUERY: 'consulta de disponibilidad',
      PAYMENT_QUERY: 'consulta de modalidad de pago',
      DELIVERY_QUERY: 'consulta de tiempo de entrega',
      QUOTE_REQUEST: 'solicitud de cotización formal',
    };
    return labels[kind] || kind;
  }
}
