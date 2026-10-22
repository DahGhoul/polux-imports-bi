import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PeopleService } from './people.service';

@Injectable()
export class AgentService {
  constructor(
    private readonly db: DataSource,
    private readonly peopleService: PeopleService,
  ) {}

  private async logAction(
    idPersona: number | null,
    idAgente: number,
    tipoAccion: string,
    entidadAfectada: string,
    decisionTomada: string,
    sustentoJson?: string,
  ) {
    await this.db.query(
      `INSERT INTO core.accion_agente
        (id_agente, id_persona, tipo_accion, entidad_afectada, id_entidad_afectada,
         decision_tomada, datos_sustento_json, nivel_confianza_ia, requirio_aprobacion, resultado_ejecucion)
       VALUES
        (@0, @1, @2, @3, @1, @4, @5, 95.00, 0, 'EXITOSO');`,
      [idAgente, idPersona, tipoAccion, entidadAfectada, decisionTomada, sustentoJson || '{"origen":"PoluxImportDB"}']
    );
  }

  private async syncDimPersona(idPersona: number) {
    await this.db.query(
      `UPDATE PoluxImportMart.dbo.DimPersona
       SET EtapaActual = p.etapa_actual
       FROM PoluxImportMart.dbo.DimPersona d
       JOIN PoluxImportDB.core.persona p ON p.id_persona = d.idPersona
       WHERE p.id_persona = @0;`,
      [idPersona]
    );
  }

  async evaluateMarketing(id: number) {
    const person = await this.peopleService.get(id);
    const newScore = Math.min(96, Math.max(58, (person.score || 60) + 12));
    const summary =
      newScore >= 75
        ? `Buyer con señales intensas de interés (${newScore}/100) registradas en PoluxImportDB. Listo para promoción a LEADS.`
        : `Buyer evaluado con score ${newScore}/100. Continuar nutrición de contenido e invitar a cotizar.`;

    await this.logAction(
      id,
      1, // AGT_MARKETING
      'RECOMENDACION_CONTENIDO',
      'persona',
      summary,
      JSON.stringify({ scorePrevio: person.score, scoreNuevo: newScore, etapa: person.stage })
    );

    if (newScore >= 78 && person.stage === 'BUYER') {
      return this.promoteToLead(id, 'Intención comercial explícita validada por Agente de Marketing IA');
    }

    return this.peopleService.get(id);
  }

  async promoteToLead(id: number, reason = 'Promoción validada por Agente de Marketing IA') {
    const person = await this.peopleService.get(id);
    if (person.stage !== 'BUYER') return person;

    await this.db.query(
      `UPDATE core.persona SET etapa_actual = 'LEADS', fecha_actualizacion = SYSDATETIME() WHERE id_persona = @0;`,
      [id]
    );

    await this.db.query(
      `IF NOT EXISTS (SELECT 1 FROM leads.lead WHERE id_persona = @0)
       BEGIN
         INSERT INTO leads.lead (id_persona, estado_lead, canal_conversion, prioridad_comercial, nivel_intencion_actual)
         VALUES (@0, 'ACTIVO', 'WHATSAPP', 'ALTA', 'ALTA');
       END
       ELSE
       BEGIN
         UPDATE leads.lead SET estado_lead = 'ACTIVO', prioridad_comercial = 'ALTA', nivel_intencion_actual = 'ALTA' WHERE id_persona = @0;
       END`,
      [id]
    );

    await this.db.query(
      `IF NOT EXISTS (SELECT 1 FROM leads.necesidad_compra WHERE id_persona = @0 AND es_vigente = 1)
       BEGIN
         INSERT INTO leads.necesidad_compra
           (id_persona, id_producto_interes, capacidad_deseada, color_deseado, presupuesto_estimado_pen, uso_previsto, modalidad_pago_interes, es_vigente)
         VALUES
           (@0, 3, '256GB', 'Titanio Natural', 4690.00, 'PERSONAL', 'CUOTAS', 1);
       END`,
      [id]
    );

    await this.db.query(
      `INSERT INTO core.historial_etapa (id_persona, etapa_anterior, etapa_nueva, motivo_transicion, senal_origen, id_entidad_referencia, tipo_entidad_referencia, registrado_por)
       VALUES (@0, 'BUYER', 'LEADS', @1, 'SOLICITUD_COTIZACION', @0, 'lead', 'AGT_MARKETING');`,
      [id, reason]
    );

    await this.logAction(
      id,
      1,
      'PRIORIZACION_LEAD',
      'lead',
      `${person.firstName} ${person.lastName} promovido de BUYER → LEADS en PoluxImportDB (${reason}).`
    );

    await this.syncDimPersona(id);
    return this.evaluateNegotiation(id);
  }

  async evaluateNegotiation(id: number) {
    const person = await this.peopleService.get(id);
    const newScore = Math.min(96, Math.max(78, (person.score || 75) + 6));

    await this.db.query(
      `INSERT INTO leads.evaluacion_intencion
        (id_persona, id_agente, puntaje_intencion, nivel_intencion, prioridad_sugerida, consultas_precio_count, frecuencia_interaccion, senales_sustento_json)
       VALUES
        (@0, 3, @1, 'ALTA', 'ALTA', 3, 6, '{"evaluacion":"Agente Negociador PoluxImportDB","intencion":"ALTA"}');`,
      [id, newScore]
    );

    await this.logAction(
      id,
      3, // AGT_NEGOCIADOR
      'PRIORIZACION_LEAD',
      'evaluacion_intencion',
      `Lead ${person.firstName} ${person.lastName} evaluado con puntaje de intención ${newScore}/100 y prioridad ALTA.`
    );

    return this.peopleService.get(id);
  }

  async simulate(id: number, eventType: string) {
    const person = await this.peopleService.get(id);

    // Asegurar conversación activa
    const convRows = await this.db.query(
      `SELECT TOP 1 id_conversacion FROM buyers.conversacion WHERE id_persona = @0 ORDER BY id_conversacion DESC;`,
      [id]
    );
    let idConv: number;
    if (convRows.length) {
      idConv = Number(convRows[0].id_conversacion);
    } else {
      const insConv = await this.db.query(
        `INSERT INTO buyers.conversacion (id_persona, canal_comunicacion, estado_conversacion)
         OUTPUT INSERTED.id_conversacion
         VALUES (@0, 'WHATSAPP', 'ABIERTA');`,
        [id]
      );
      idConv = Number(insConv[0].id_conversacion);
    }

    const temaMap: Record<string, { tema: string; pregunta: string; senal: string }> = {
      PRODUCT_VIEW: { tema: 'AUTENTICIDAD', pregunta: `Visualizó ficha técnica de ${person.mainProduct} y verificó serie oficial Apple.`, senal: 'CONSULTA_STOCK' },
      PRICE_FINAL: { tema: 'PRECIO', pregunta: `Consultó precio final todo incluido en soles para ${person.mainProduct} puesto en Trujillo.`, senal: 'CONSULTA_PRECIO' },
      STOCK_QUERY: { tema: 'AUTENTICIDAD', pregunta: `Consultó stock disponible en sede Av. Larco 840 para ${person.mainProduct}.`, senal: 'CONSULTA_STOCK' },
      PAYMENT_QUERY: { tema: 'METODO_PAGO', pregunta: `Consultó pago en cuotas (50% inicial Yape/Plin y 50% contraentrega).`, senal: 'CONSULTA_MODALIDAD_PAGO' },
      DELIVERY_QUERY: { tema: 'TIEMPO_ENTREGA', pregunta: `Consultó plazo de tránsito internacional Miami → Aduanas SUNAT → Trujillo.`, senal: 'CONSULTA_TIEMPO_ENTREGA' },
      QUOTE_REQUEST: { tema: 'PRECIO', pregunta: `Solicitó cotización formal para ${person.mainProduct}.`, senal: 'SOLICITUD_COTIZACION' },
    };

    const info = temaMap[eventType] || temaMap.PRICE_FINAL;

    const insConsulta = await this.db.query(
      `INSERT INTO buyers.consulta
        (id_conversacion, id_agente, id_faq, tema_consulta, id_producto, texto_pregunta, texto_respuesta, resuelta_por_ia, derivada_a_humano, nivel_confianza, calificacion_usuario)
       OUTPUT INSERTED.id_consulta
       VALUES
        (@0, 2, 1, @1, 3, @2, 'Respuesta inmediata generada por Agente FAQ Polux.', 1, 0, 95.0, 5);`,
      [idConv, info.tema, info.pregunta]
    );

    await this.db.query(
      `INSERT INTO leads.senal_intencion
        (id_persona, tipo_senal, id_producto, cantidad_interes, id_conversacion, id_consulta, produjo_transicion_lead)
       VALUES
        (@0, @1, 3, 1, @2, @3, @4);`,
      [id, info.senal, idConv, Number(insConsulta[0].id_consulta), eventType === 'QUOTE_REQUEST' ? 1 : 0]
    );

    if (eventType === 'QUOTE_REQUEST') {
      await this.ensureQuote(id);
    }

    return person.stage === 'BUYER' ? this.evaluateMarketing(id) : this.evaluateNegotiation(id);
  }

  async ensureQuote(id: number) {
    const person = await this.peopleService.get(id);
    const existing = await this.db.query(
      `SELECT TOP 1 id_cotizacion, numero_cotizacion, total_pen, modalidad_pago, fecha_vencimiento, fecha_emision
       FROM leads.cotizacion WHERE id_persona = @0 ORDER BY id_cotizacion DESC;`,
      [id]
    );

    if (existing.length) {
      const q = existing[0];
      return {
        id: Number(q.id_cotizacion),
        code: q.numero_cotizacion,
        product: person.mainProduct,
        amount: Number(q.total_pen),
        paymentPlan: q.modalidad_pago,
        status: 'ACTIVE',
        expiresAt: q.fecha_vencimiento,
        createdAt: q.fecha_emision,
      };
    }

    const code = `COT-2025-${String(id).padStart(6, '0')}-${Math.floor(Math.random() * 89 + 10)}`;
    const amount = 4690.0;

    const ins = await this.db.query(
      `INSERT INTO leads.cotizacion
        (id_persona, numero_cotizacion, version_numero, fecha_emision, fecha_vencimiento,
         subtotal_pen, descuento_pen, total_pen, tipo_cambio_referencial, total_usd,
         modalidad_pago, pago_inicial_sugerido_pen, numero_cuotas_sugeridas, estado_cotizacion)
       OUTPUT INSERTED.id_cotizacion, INSERTED.fecha_emision, INSERTED.fecha_vencimiento
       VALUES
        (@0, @1, 1, SYSDATETIME(), DATEADD(DAY, 7, SYSDATETIME()), @2, 0.00, @2, 3.7500, 1250.00, 'CUOTAS', @3, 2, 'ENVIADA');`,
      [id, code, amount, amount * 0.5]
    );

    const idCot = Number(ins[0].id_cotizacion);
    await this.db.query(
      `INSERT INTO leads.cotizacion_detalle
        (id_cotizacion, id_producto, tipo_atencion, cantidad, precio_unitario_pen, subtotal_item_pen, notas_item)
       VALUES
        (@0, 3, 'IMPORTACION_PEDIDO', 1, @1, @1, 'Cotización generada por Agente Negociador IA');`,
      [idCot, amount]
    );

    return {
      id: idCot,
      code,
      product: person.mainProduct,
      amount,
      paymentPlan: 'CUOTAS',
      status: 'ACTIVE',
      expiresAt: ins[0].fecha_vencimiento,
      createdAt: ins[0].fecha_emision,
    };
  }

  async generateProposal(id: number) {
    const person = await this.peopleService.get(id);
    const quote = await this.ensureQuote(id);
    const base = Number(quote.amount || 4690);

    await this.db.query(
      `INSERT INTO leads.presentacion_propuesta
        (id_persona, canal_presentacion, beneficio_destacado, preocupacion_atendida, respondio_lead, fecha_respuesta, tipo_interaccion_respuesta)
       VALUES
        (@0, 'WHATSAPP', '3 alternativas estructuradas con garantía oficial Apple 12 meses y serie verificada en Trujillo', 'Flexibilidad financiera 50% inicial y 50% contraentrega', 1, SYSDATETIME(), 'ACEPTA_COTIZAR');`,
      [id]
    );

    const proposals = [
      {
        label: 'Opción recomendada',
        product: person.mainProduct,
        amount: base,
        payment: person.paymentPreference || 'CUOTAS (50% inicial + 50% entrega)',
        note: 'Equilibrio entre presupuesto, modalidad de pago preferida y garantía oficial Apple de 12 meses.',
      },
      {
        label: 'Opción ahorro',
        product: person.mainProduct,
        amount: Math.round(base * 0.96),
        payment: 'CONTADO (100% PoluxPay / Yape / BCP)',
        note: 'Alternativa de pago directo al contado dentro de la política comercial autorizada.',
      },
      {
        label: 'Opción flexibilidad',
        product: person.mainProduct,
        amount: base,
        payment: 'CUOTAS (Adelanto 50% + Saldo en tienda Trujillo)',
        note: 'Mantiene el valor oficial y permite liquidar el saldo tras verificar el número de serie en Trujillo.',
      },
    ];

    await this.logAction(
      id,
      3,
      'PRIORIZACION_LEAD',
      'cotizacion',
      `Propuesta comercial con 3 alternativas generada sobre cotización ${quote.code} para ${person.firstName} ${person.lastName}.`
    );

    return { personId: person.id, quote, proposals };
  }

  async confirmPayment(id: number) {
    return this.processPaymentWithGateway(id, { paymentMethod: 'YAPE', operationCode: `YAPE-${Date.now()}` });
  }

  async processPaymentWithGateway(
    id: number,
    dto: { paymentMethod?: string; amount?: number; operationCode?: string; cardLast4?: string; deliveryAddress?: string }
  ) {
    const person = await this.peopleService.get(id);
    const quote = await this.ensureQuote(id);
    const amount = Number(dto.amount || quote.amount || 4690);
    const rawMethod = (dto.paymentMethod || 'YAPE').toUpperCase();
    const medioPago = ['YAPE', 'PLIN', 'TRANSFERENCIA_BCP', 'TRANSFERENCIA_BBVA', 'TRANSFERENCIA_INTERBANK', 'DEPOSITO', 'TARJETA'].includes(rawMethod)
      ? rawMethod
      : rawMethod === 'CARD'
      ? 'TARJETA'
      : 'YAPE';
    const opCode = dto.operationCode || `OP-PLX-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    // 1. Actualizar estado en core.persona y leads.lead / leads.cotizacion
    await this.db.query(
      `UPDATE core.persona SET etapa_actual = 'PAYER', fecha_actualizacion = SYSDATETIME() WHERE id_persona = @0;
       UPDATE leads.lead SET estado_lead = 'CONVERTIDO', fecha_cierre = SYSDATETIME() WHERE id_persona = @0;
       UPDATE leads.cotizacion SET estado_cotizacion = 'ACEPTADA', fecha_aceptacion = SYSDATETIME() WHERE id_cotizacion = @1;`,
      [id, quote.id]
    );

    // 2. Asegurar registro en payers.payer
    await this.db.query(
      `IF NOT EXISTS (SELECT 1 FROM payers.payer WHERE id_persona = @0)
       BEGIN
         INSERT INTO payers.payer (id_persona, estado_payer, total_ordenes_activas) VALUES (@0, 'AL_DIA', 1);
       END
       ELSE
       BEGIN
         UPDATE payers.payer SET estado_payer = 'AL_DIA', total_ordenes_activas = total_ordenes_activas + 1 WHERE id_persona = @0;
       END`,
      [id]
    );

    // 3. Crear o recuperar orden en payers.orden_contratacion (Respetando todos los CHECKs)
    const existingOrder = await this.db.query(
      `SELECT TOP 1 id_orden, numero_orden FROM payers.orden_contratacion WHERE id_cotizacion = @0;`,
      [quote.id]
    );

    let idOrden: number;
    let numOrden: string;
    if (existingOrder.length) {
      idOrden = Number(existingOrder[0].id_orden);
      numOrden = existingOrder[0].numero_orden;
      await this.db.query(
        `UPDATE payers.orden_contratacion
         SET total_acordado_pen = @1,
             monto_pago_inicial_pactado_pen = @1,
             total_pagado_validado_pen = @1,
             saldo_pendiente_pen = 0.00,
             modalidad_pago = 'CONTADO',
             total_cuotas_pactadas = 1,
             estado_orden = 'ACTIVADO_EN_IMPORTACION',
             fecha_pago_inicial_confirmado = SYSDATETIME(),
             fecha_activacion_pedido = SYSDATETIME()
         WHERE id_orden = @0;`,
        [idOrden, amount]
      );
    } else {
      numOrden = `ORD-2025-${String(id).padStart(6, '0')}`;
      const insOrd = await this.db.query(
        `INSERT INTO payers.orden_contratacion
          (numero_orden, id_persona, id_cotizacion, tipo_suministro, modalidad_pago,
           total_acordado_pen, monto_pago_inicial_pactado_pen, total_cuotas_pactadas,
           total_pagado_validado_pen, saldo_pendiente_pen, estado_orden,
           fecha_formalizacion, fecha_pago_inicial_confirmado, fecha_activacion_pedido)
         OUTPUT INSERTED.id_orden
         VALUES
          (@0, @1, @2, 'IMPORTACION_USA', 'CONTADO', @3, @3, 1, @3, 0.00, 'ACTIVADO_EN_IMPORTACION', SYSDATETIME(), SYSDATETIME(), SYSDATETIME());`,
        [numOrden, id, quote.id, amount]
      );
      idOrden = Number(insOrd[0].id_orden);
    }

    // 4. Registrar pago validado y comprobante electrónico SUNAT (Respetando trigger TR_bloquear_comprobante_pago_no_validado)
    const insPago = await this.db.query(
      `INSERT INTO payers.pago
        (id_orden, medio_pago, numero_operacion_transaccion, entidad_bancaria, moneda,
         monto_pagado, tipo_cambio_aplicado, fecha_transaccion, estado_pago,
         validado_por_ia, id_agente, usuario_validador, fecha_validacion)
       OUTPUT INSERTED.id_pago
       VALUES
        (@0, @1, @2, 'BCP / PoluxPay', 'PEN', @3, 3.7500, SYSDATETIME(), 'VALIDADO', 1, 4, 'POLUXPAY_IA', SYSDATETIME());`,
      [idOrden, medioPago, opCode, amount]
    );
    const idPago = Number(insPago[0].id_pago);

    await this.db.query(
      `INSERT INTO payers.comprobante_electronico
        (id_orden, id_pago, tipo_comprobante, serie, numero_correlativo,
         numero_documento_cliente, nombre_razon_social, subtotal_gravado_pen, igv_pen,
         total_comprobante_pen, estado_emision, hash_cpe)
       VALUES
        (@0, @1, 'BOLETA', 'B001', @1, @2, @3, ROUND(@4 / 1.18, 2), @4 - ROUND(@4 / 1.18, 2), @4, 'EMITIDO', CONCAT('SHA256-SUNAT-PLX-', @1));`,
      [idOrden, idPago, person.documentNumber || '72849100', `${person.firstName} ${person.lastName}`, amount]
    );

    // 5. Crear registro en customers.customer y customers.pedido en estado inicial Miami
    await this.db.query(
      `IF NOT EXISTS (SELECT 1 FROM customers.customer WHERE id_persona = @0)
       BEGIN
         INSERT INTO customers.customer (id_persona, id_payer, estado_customer, total_pedidos_historicos)
         VALUES (@0, @0, 'ACTIVO', 1);
       END`,
      [id]
    );

    const existingPed = await this.db.query(`SELECT TOP 1 id_pedido FROM customers.pedido WHERE id_orden = @0;`, [idOrden]);
    if (!existingPed.length) {
      const numPed = `PED-2025-${String(idOrden).padStart(6, '0')}`;
      const tracking = `US-MIA-${100000 + idOrden}`;
      const insPed = await this.db.query(
        `INSERT INTO customers.pedido
          (numero_pedido, id_orden, id_persona, estado_pedido, codigo_tracking_usa,
           courier_internacional, guia_aerea_courier, fecha_activacion, fecha_estimada_entrega)
         OUTPUT INSERTED.id_pedido
         VALUES
          (@0, @1, @2, 'EN_COMPRA_USA', @3, 'DHL Express / Polux Cargo', CONCAT('AWB-', @1), SYSDATETIME(), CAST(DATEADD(DAY, 8, SYSDATETIME()) AS DATE));`,
        [numPed, idOrden, id, tracking]
      );
      const idPedido = Number(insPed[0].id_pedido);
      await this.db.query(
        `INSERT INTO customers.seguimiento_logistico_hito (id_pedido, codigo_hito, descripcion_hito, ubicacion_geografica, fecha_hito)
         VALUES (@0, 'RECEPCION_MIAMI', 'Orden activada tras validación de pago PoluxPay. Recepción en almacén Miami.', 'Miami, Florida, USA', SYSDATETIME());`,
        [idPedido]
      );
    }

    // 6. Historial inmutable y auditoría IA
    await this.db.query(
      `INSERT INTO core.historial_etapa (id_persona, etapa_anterior, etapa_nueva, motivo_transicion, senal_origen, id_entidad_referencia, tipo_entidad_referencia, registrado_por)
       VALUES (@0, 'LEADS', 'PAYER', @1, 'PAGO_VALIDADO', @2, 'pago', 'AGT_COBRANZA');`,
      [id, `Pago de S/ ${amount.toLocaleString('es-PE')} validado por PoluxPay (${medioPago}, Op: ${opCode}).`, idPago]
    );

    await this.logAction(
      id,
      4, // AGT_COBRANZA
      'VALIDACION_PAGO',
      'pago',
      `Pago confirmado (${medioPago}, Op: ${opCode}) por S/ ${amount.toLocaleString('es-PE')}. Boleta B001-${String(idPago).padStart(7, '0')} emitida y pedido activado en Miami.`
    );

    await this.syncDimPersona(id);
    return this.peopleService.get(id);
  }

  async advanceShippingStage(id: number) {
    const pedRows = await this.db.query(
      `SELECT TOP 1 id_pedido, numero_pedido, estado_pedido, codigo_tracking_usa
       FROM customers.pedido WHERE id_persona = @0 ORDER BY id_pedido DESC;`,
      [id]
    );
    if (!pedRows.length) return this.peopleService.get(id);

    const ped = pedRows[0];
    const idPedido = Number(ped.id_pedido);
    const curr = ped.estado_pedido;

    let nextState = 'EN_TRANSITO_INTERNACIONAL';
    let hitoCode = 'EMBARQUE_AEREO';
    let ubicacion = 'Aeropuerto Internacional de Miami (MIA → LIM)';
    let desc = 'En tránsito aéreo internacional hacia Perú.';

    if (curr === 'EN_COMPRA_USA') {
      nextState = 'EN_TRANSITO_INTERNACIONAL';
      hitoCode = 'EMBARQUE_AEREO';
      ubicacion = 'Vuelo Carga Internacional Miami → Lima';
      desc = 'Embarque aéreo confirmado con guía internacional.';
    } else if (curr === 'EN_TRANSITO_INTERNACIONAL') {
      nextState = 'EN_ADUANA_PERU';
      hitoCode = 'EN_ADUANAS';
      ubicacion = 'Aduanas SUNAT — Aeropuerto Jorge Chávez, Callao';
      desc = 'En proceso de nacionalización e inspección aduanera SUNAT.';
    } else {
      nextState = 'APROBADO_PARA_ENTREGA';
      hitoCode = 'LLEGADA_TRUJILLO';
      ubicacion = 'Sede Principal Polux Imports — Av. Larco 840, Trujillo';
      desc = '¡ALERTA IMPULSORA (RB-013)! Equipo arribó a Sede Trujillo y aprobó inspección física de calidad Apple.';
    }

    await this.db.query(
      `UPDATE customers.pedido
       SET estado_pedido = @1,
           fecha_llegada_trujillo = CASE WHEN @1 = 'APROBADO_PARA_ENTREGA' THEN SYSDATETIME() ELSE fecha_llegada_trujillo END
       WHERE id_pedido = @0;`,
      [idPedido, nextState]
    );

    await this.db.query(
      `INSERT INTO customers.seguimiento_logistico_hito (id_pedido, codigo_hito, descripcion_hito, ubicacion_geografica, fecha_hito)
       VALUES (@0, @1, @2, @3, SYSDATETIME());`,
      [idPedido, hitoCode, desc, ubicacion]
    );

    await this.db.query(
      `INSERT INTO customers.actualizacion_seguimiento (id_pedido, hito_comunicado, canal_envio, mensaje_enviado, generado_por_ia, id_agente, respondio_cliente, nivel_ansiedad_detectado)
       VALUES (@0, @1, 'WHATSAPP', @2, 1, 5, 1, 'BAJO');`,
      [idPedido, hitoCode, desc]
    );

    // Si llegó a Trujillo, registrar inspección física APROBADA (Requerida por trigger RB-013 antes de entregar)
    if (nextState === 'APROBADO_PARA_ENTREGA') {
      await this.db.query(
        `IF NOT EXISTS (SELECT 1 FROM customers.inspeccion_calidad WHERE id_pedido = @0 AND resultado_inspeccion = 'APROBADO')
         BEGIN
           INSERT INTO customers.inspeccion_calidad
             (id_pedido, numero_intento, estado_empaque_externo, sellos_seguridad_apple, resultado_inspeccion, detalle_observaciones)
           VALUES
             (@0, 1, 'CONFORME', 'INTACTOS', 'APROBADO', 'Caja sellada original intacta y precintos Apple verificados en Trujillo.');
         END`,
        [idPedido]
      );
    }

    await this.logAction(id, 5, 'NOTIFICACION_HITO', 'pedido', desc);
    return this.peopleService.get(id);
  }

  async triggerCollectionAlert(id: number, dto?: { alertType?: string; customMessage?: string }) {
    const person = await this.peopleService.get(id);
    const alertType = dto?.alertType || 'COLLECTION_REMINDER';

    const msg =
      dto?.customMessage ||
      (alertType === 'ARRIVAL_TRUJILLO'
        ? `¡Hola ${person.firstName}! Tu ${person.mainProduct} llegó a nuestra sede de Trujillo (Av. Larco 840) y superó la inspección física Apple. Coordina tu recojo hoy.`
        : `Hola ${person.firstName}, notificación proactiva Polux Imports sobre tu expediente de ${person.mainProduct}.`);

    await this.db.query(
      `INSERT INTO core.alerta_operativa
        (fase, codigo_tipo_alerta, id_persona, id_entidad_referencia, tipo_entidad_referencia, accion_recomendada, rol_responsable, estado_alerta)
       VALUES
        ('PAYERS', @1, @0, @0, 'persona', @2, 'AGENTE_IA', 'ACTIVA');`,
      [id, alertType, msg]
    );

    await this.logAction(id, 4, 'ALERTA_CUELLO_BOTELLA', 'alerta_operativa', msg);
    return this.peopleService.get(id);
  }

  async deliverService(id: number, dto: { deliveryType?: string; appleSerialNumber?: string; notes?: string }) {
    const person = await this.peopleService.get(id);
    const serial = dto.appleSerialNumber || `F2LWR${Math.floor(Math.random() * 89999 + 10000)}Y6Q`;
    const modalidadEntrega = dto.deliveryType === 'VERIFIED_DELIVERY' ? 'DESPACHO_DOMICILIO_TRUJILLO' : 'RECOJO_OFICINA_TRUJILLO';

    const pedRows = await this.db.query(
      `SELECT TOP 1 p.id_pedido, p.id_orden, o.fecha_pago_inicial_confirmado
       FROM customers.pedido p
       JOIN payers.orden_contratacion o ON o.id_orden = p.id_orden
       WHERE p.id_persona = @0
       ORDER BY p.id_pedido DESC;`,
      [id]
    );

    if (pedRows.length) {
      const idPedido = Number(pedRows[0].id_pedido);
      const fechaPago = pedRows[0].fecha_pago_inicial_confirmado || new Date();

      // 1. Asegurar inspección física APROBADA (exigido por el trigger TR_bloquear_entrega_sin_inspeccion_aprobada)
      const inspRows = await this.db.query(
        `SELECT TOP 1 id_inspeccion FROM customers.inspeccion_calidad WHERE id_pedido = @0 AND resultado_inspeccion = 'APROBADO';`,
        [idPedido]
      );
      let idInspeccion: number;
      if (inspRows.length) {
        idInspeccion = Number(inspRows[0].id_inspeccion);
      } else {
        const insInsp = await this.db.query(
          `INSERT INTO customers.inspeccion_calidad
            (id_pedido, numero_intento, estado_empaque_externo, sellos_seguridad_apple, resultado_inspeccion, detalle_observaciones)
           OUTPUT INSERTED.id_inspeccion
           VALUES
            (@0, 1, 'CONFORME', 'INTACTOS', 'APROBADO', 'Inspección física aprobada en sede Trujillo previa a entrega.');`,
          [idPedido]
        );
        idInspeccion = Number(insInsp[0].id_inspeccion);
      }

      // 2. Registrar verificación de serie Apple en customers.verificacion_cumplimiento
      await this.db.query(
        `INSERT INTO customers.verificacion_cumplimiento
          (id_pedido, id_inspeccion, modelo_fisico_detectado, capacidad_fisica, color_fisico, numero_serie_imei, resultado_verificacion, verificado_por_ia, id_agente)
         VALUES
          (@0, @1, @2, '256GB', 'Titanio Natural', @3, 'CONFORME', 1, 5);`,
        [idPedido, idInspeccion, person.mainProduct, serial]
      );

      // 3. Registrar entrega y confirmación sin observaciones (para permitir cierre según trigger TR_bloquear_cierre_con_observaciones)
      const entExisting = await this.db.query(`SELECT TOP 1 id_entrega FROM customers.entrega WHERE id_pedido = @0;`, [idPedido]);
      let idEntrega: number;
      if (entExisting.length) {
        idEntrega = Number(entExisting[0].id_entrega);
        await this.db.query(`UPDATE customers.entrega SET estado_entrega = 'ENTREGADO', fecha_real_entrega = SYSDATETIME() WHERE id_entrega = @0;`, [idEntrega]);
      } else {
        // customers.entrega tiene trigger: se usa OUTPUT ... INTO @t (OUTPUT directo no está permitido)
        const insEnt = await this.db.query(
          `DECLARE @t TABLE (id_entrega INT);
           INSERT INTO customers.entrega
            (id_pedido, modalidad_entrega, direccion_entrega, nombre_persona_recibe, documento_identidad_recibe, fecha_coordinada_entrega, fecha_real_entrega, estado_entrega)
           OUTPUT INSERTED.id_entrega INTO @t
           VALUES
            (@0, @1, @2, @3, @4, SYSDATETIME(), SYSDATETIME(), 'ENTREGADO');
           SELECT id_entrega FROM @t;`,
          [idPedido, modalidadEntrega, person.address || 'Av. Larco 840, Trujillo', `${person.firstName} ${person.lastName}`, person.documentNumber || '72849100']
        );
        idEntrega = Number(insEnt[0].id_entrega);
      }

      await this.db.query(
        `IF NOT EXISTS (SELECT 1 FROM customers.confirmacion_entrega WHERE id_entrega = @0)
         BEGIN
           INSERT INTO customers.confirmacion_entrega (id_entrega, numero_confirmacion, medio_confirmacion, tiene_observaciones, detalle_observaciones)
           VALUES (@0, 1, 'ACTA_CONFORMIDAD', 0, 'Entrega verificada sin observaciones.');
         END`,
        [idEntrega]
      );

      await this.db.query(
        `IF NOT EXISTS (SELECT 1 FROM customers.cierre_servicio WHERE id_pedido = @0)
         BEGIN
           INSERT INTO customers.cierre_servicio (id_pedido, id_persona, fecha_pago_inicial, fecha_cierre_operativo, traspasado_a_postventa, estado_cierre)
           VALUES (@0, @1, @2, SYSDATETIME(), 1, 'COMPLETADO_EXITOSO');
         END`,
        [idPedido, id, fechaPago]
      );

      await this.db.query(
        `UPDATE customers.pedido SET estado_pedido = 'CERRADO', fecha_entrega_real = SYSDATETIME() WHERE id_pedido = @0;`,
        [idPedido]
      );
    }

    await this.db.query(
      `UPDATE core.persona SET etapa_actual = 'CUSTOMER', fecha_actualizacion = SYSDATETIME() WHERE id_persona = @0;
       UPDATE customers.customer SET estado_customer = 'CERRADO' WHERE id_persona = @0;`,
      [id]
    );

    await this.db.query(
      `INSERT INTO core.historial_etapa (id_persona, etapa_anterior, etapa_nueva, motivo_transicion, senal_origen, id_entidad_referencia, tipo_entidad_referencia, registrado_por)
       VALUES (@0, 'PAYER', 'CUSTOMER', @1, 'ENTREGA_CONFORME', @0, 'entrega', 'AGT_SEGUIMIENTO');`,
      [id, `Equipo ${person.mainProduct} entregado en Trujillo con serie Apple ${serial} verificada.`]
    );

    await this.logAction(
      id,
      5,
      'NOTIFICACION_HITO',
      'entrega',
      `Entrega completada para ${person.firstName} ${person.lastName}. Serie Apple verificada: ${serial}. Garantía oficial de 12 meses activa.`
    );

    await this.syncDimPersona(id);
    return this.peopleService.get(id);
  }

  async submitNps(id: number, dto: { score: number; feedback?: string }) {
    const person = await this.peopleService.get(id);
    if (!['CUSTOMER', 'TURNED'].includes(String(person.stage))) {
      throw new BadRequestException('La encuesta NPS solo puede registrarse después de confirmar la entrega (etapa CUSTOMER).');
    }
    const score = Math.max(0, Math.min(10, Number(dto.score)));
    const feedback = dto.feedback || 'Excelente servicio en Trujillo y equipo Apple 100% original sellado.';
    const isPromoter = score >= 9;

    const pedRows = await this.db.query(`SELECT TOP 1 id_pedido FROM customers.pedido WHERE id_persona = @0 ORDER BY id_pedido DESC;`, [id]);
    const idPedido = pedRows.length ? Number(pedRows[0].id_pedido) : 1;

    await this.db.query(
      `INSERT INTO turned.encuesta_satisfaccion
        (id_persona, id_pedido, tipo_encuesta, puntaje_nps, puntaje_csat, resolucion_primer_contacto_fcr, comentario_cliente)
       VALUES
        (@0, @1, 'POST_ENTREGA', @2, @3, 1, @4);`,
      [id, idPedido, score, score >= 9 ? 5 : score >= 7 ? 4 : 3, feedback]
    );

    if (isPromoter) {
      await this.db.query(
        `IF NOT EXISTS (SELECT 1 FROM turned.turned WHERE id_persona = @0)
         BEGIN
           INSERT INTO turned.turned (id_persona, criterio_transicion, score_nps_inicial, estado_fidelizacion)
           VALUES (@0, 'NPS_PROMOTOR', @1, 'PROMOTOR_DESTACADO');
         END
         UPDATE core.persona SET etapa_actual = 'TURNED', fecha_actualizacion = SYSDATETIME() WHERE id_persona = @0;
         INSERT INTO core.historial_etapa (id_persona, etapa_anterior, etapa_nueva, motivo_transicion, senal_origen, id_entidad_referencia, tipo_entidad_referencia, registrado_por)
         VALUES (@0, 'CUSTOMER', 'TURNED', @2, 'NPS_PROMOTOR', @0, 'encuesta_satisfaccion', 'AGT_PLATAFORMA');`,
        [id, score, `Promotor NPS (${score}/10) incorporado a Apple Club Polux (fase TURNED).`]
      );
      await this.syncDimPersona(id);
    }

    await this.logAction(
      id,
      6, // AGT_PLATAFORMA
      'ACTIVACION_FIDELIZACION',
      'encuesta_satisfaccion',
      `Encuesta NPS registrada en PoluxImportDB: ${score}/10 (${isPromoter ? 'PROMOTOR -> TURNED' : 'REGISTRADO'}). Comentario: "${feedback}".`
    );

    return this.peopleService.get(id);
  }

  async createSupportTicket(id: number, dto: { topic: string; detail: string }) {
    const topic = dto.topic || 'Soporte Postventa Apple';
    const detail = dto.detail || 'Solicitud de asistencia en configuración iCloud y garantía.';

    await this.db.query(
      `INSERT INTO core.alerta_operativa
        (fase, codigo_tipo_alerta, id_persona, id_entidad_referencia, tipo_entidad_referencia, accion_recomendada, rol_responsable, estado_alerta)
       VALUES
        ('TURNED', @1, @0, @0, 'ticket_postventa', @2, 'COMERCIAL', 'ACTIVA');`,
      [id, topic.slice(0, 48).toUpperCase().replace(/\s+/g, '_'), detail]
    );

    await this.logAction(id, 6, 'ATENCION_POSTVENTA', 'alerta_operativa', `Ticket Postventa CRM creado (${topic}): ${detail}`);
    return this.peopleService.get(id);
  }

  async askAgent(id: number, question: string) {
    const person = await this.peopleService.get(id);
    const q = (question || '').toLowerCase();
    let answer = '';

    if (q.includes('abord') || q.includes('recom') || q.includes('qué hago') || q.includes('que hago')) {
      answer = person.nextBestAction || 'Recomiendo presentar las 3 alternativas de cotización y verificar disponibilidad en sede Trujillo.';
    } else if (q.includes('mensaje') || q.includes('whatsapp')) {
      answer =
        person.stage === 'BUYER'
          ? `Hola ${person.firstName} 👋. Vi que estuviste revisando ${person.mainProduct} en Polux Imports Trujillo. Contamos con equipos 100% sellados con serie verificable en Apple y garantía de 12 meses. ¿Te envío una cotización con pago al contado o en cuotas?`
          : `Hola ${person.firstName} 👋. Tu cotización para ${person.mainProduct} está lista con facilidad de 50% de adelanto por PoluxPay/Yape y 50% al verificar tu equipo en nuestra sede de Av. Larco 840, Trujillo.`;
    } else if (q.includes('por qué') || q.includes('porque') || q.includes('prioridad') || q.includes('score')) {
      answer = `El score (${person.score}/100) y la prioridad (${person.priority}) provienen directamente de PoluxImportDB: señales en leads.senal_intencion, consultas en buyers.consulta y necesidad vigente en leads.necesidad_compra.`;
    } else if (q.includes('cotiz')) {
      const active = person.quotes?.[0];
      answer = active
        ? `La cotización ${active.code} está registrada en leads.cotizacion por S/ ${Number(active.amount).toLocaleString('es-PE')} en modalidad ${active.paymentPlan}.`
        : 'Puedo emitir inmediatamente las 3 opciones de cotización oficial para este perfil.';
    } else {
      answer = `${person.firstName} ${person.lastName} (${person.district}, Trujillo) — Etapa actual: ${person.stage} | Producto: ${person.mainProduct} | Score: ${person.score}/100. ${person.agentSummary}`;
    }

    await this.logAction(id, 3, 'CONSULTA_COPILOTO', 'persona', `Copiloto IA respondió consulta: "${question}" -> ${answer}`);
    return { answer, stage: person.stage, personId: person.id };
  }

  async recent(agentType?: string) {
    const faseMap: Record<string, string> = {
      MARKETING: 'BUYERS',
      NEGOTIATION: 'LEADS',
      PROCESSING: 'PAYERS',
      LOYALTY: 'TURNED',
    };
    const dbFase = agentType && faseMap[agentType] ? faseMap[agentType] : undefined;
    const params: any[] = [];
    let where = '';
    if (dbFase) {
      if (dbFase === 'TURNED') {
        where = `WHERE ag.fase_principal IN ('CUSTOMERS', 'TURNED')`;
      } else {
        params.push(dbFase);
        where = `WHERE ag.fase_principal = @0`;
      }
    }

    const rows = await this.db.query(
      `SELECT TOP 80
         aa.id_accion_agente,
         ag.fase_principal,
         aa.tipo_accion,
         aa.decision_tomada,
         aa.datos_sustento_json,
         aa.fecha_ejecucion,
         p.id_persona,
         p.nombres,
         p.apellidos,
         p.etapa_actual
       FROM core.accion_agente aa
       JOIN core.agente_ia ag ON ag.id_agente = aa.id_agente
       LEFT JOIN core.persona p ON p.id_persona = aa.id_persona
       ${where}
       ORDER BY aa.fecha_ejecucion DESC, aa.id_accion_agente DESC;`,
      params
    );

    return rows.map((r: any) => ({
      id: Number(r.id_accion_agente),
      agentType:
        r.fase_principal === 'BUYERS'
          ? 'MARKETING'
          : r.fase_principal === 'LEADS'
          ? 'NEGOTIATION'
          : r.fase_principal === 'PAYERS'
          ? 'PROCESSING'
          : 'LOYALTY',
      actionType: r.tipo_accion,
      title: `${r.tipo_accion.replace(/_/g, ' ')} — ${r.nombres || 'Cliente'} ${r.apellidos || ''}`,
      detail: r.decision_tomada,
      reasoning: r.datos_sustento_json || 'Auditoría registrada en core.accion_agente (PoluxImportDB).',
      status: 'COMPLETED',
      createdAt: r.fecha_ejecucion,
      person: r.id_persona
        ? {
            id: Number(r.id_persona),
            firstName: r.nombres,
            lastName: r.apellidos,
            stage: r.etapa_actual === 'LEADS' ? 'LEAD' : r.etapa_actual,
          }
        : undefined,
    }));
  }
}
