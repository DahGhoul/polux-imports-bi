import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PeopleService {
  constructor(private readonly db: DataSource) {}

  private mapStageToUi(etapa: string): string {
    if (etapa === 'LEADS') return 'LEAD';
    return etapa || 'BUYER';
  }

  private mapStageToDb(stage?: string): string | undefined {
    if (!stage) return undefined;
    if (stage.toUpperCase() === 'LEAD' || stage.toUpperCase() === 'LEADS') return 'LEADS';
    return stage.toUpperCase();
  }

  private mapShippingStageToUi(estadoPedido?: string | null, etapaActual?: string): string {
    if (etapaActual === 'CUSTOMER' || etapaActual === 'TURNED' || estadoPedido === 'CERRADO' || estadoPedido === 'ENTREGADO') {
      return 'DELIVERED';
    }
    switch (estadoPedido) {
      case 'EN_COMPRA_USA':
        return 'MIAMI_WAREHOUSE';
      case 'EN_TRANSITO_INTERNACIONAL':
        return 'AIR_TRANSIT';
      case 'EN_ADUANA_PERU':
      case 'LIBERADO_ADUANA':
        return 'SUNAT_CUSTOMS';
      case 'INGRESADO_TRUJILLO':
      case 'EN_INSPECCION':
      case 'APROBADO_PARA_ENTREGA':
      case 'EN_REPARTO':
        return 'TRUJILLO_STORE';
      default:
        return 'MIAMI_WAREHOUSE';
    }
  }

  private mapRowToPerson(r: any) {
    const stageUi = this.mapStageToUi(r.etapa_actual);
    const id = Number(r.id_persona);
    const priceBase = Number(r.precio_base_pen || r.presupuesto_estimado_pen || 4690);
    const score = Number(
      r.puntaje_intencion ||
      (stageUi === 'TURNED' ? 96 : stageUi === 'CUSTOMER' ? 94 : stageUi === 'PAYER' ? 90 : stageUi === 'LEAD' ? 82 : 45 + (id % 42))
    );
    const priority = r.prioridad_comercial || (score >= 72 ? 'ALTA' : score >= 45 ? 'MEDIA' : 'BAJA');
    const conversionProbability =
      stageUi === 'PAYER' || stageUi === 'CUSTOMER' || stageUi === 'TURNED'
        ? 100
        : stageUi === 'LEAD'
        ? Math.min(95, Math.max(48, Math.round(score * 0.92)))
        : Math.min(68, Math.max(22, Math.round(score * 0.65)));

    const shippingStage = this.mapShippingStageToUi(r.estado_pedido, r.etapa_actual);

    let agentSummary = r.ultima_decision_ia;
    if (!agentSummary) {
      if (stageUi === 'BUYER') {
        agentSummary = 'Prospecto captado en PoluxImportDB (esquema buyers). Señales digitales y consultas registradas por el Agente FAQ/Marketing.';
      } else if (stageUi === 'LEAD') {
        agentSummary = `Lead calificado en PoluxImportDB (esquema leads) con intención ${r.nivel_intencion_actual || 'ALTA'} y necesidad vigente para ${r.main_product || 'iPhone 16 Pro 256 GB'}.`;
      } else if (stageUi === 'PAYER') {
        agentSummary =
          shippingStage === 'TRUJILLO_STORE'
            ? `¡ALERTA IMPULSORA (RB-013)! Pedido ${r.numero_pedido || ''} arribó a Sede Trujillo y aprobó inspección física Apple. Coordinar entrega.`
            : `Orden formalizada ${r.numero_orden || ''} en PoluxImportDB (esquema payers). Pago validado por PoluxPay y equipo en tránsito desde Miami.`;
      } else {
        agentSummary = `Servicio cerrado conforme en Trujillo (esquema customers/turned). Serie Apple verificada ${r.numero_serie_imei || ''} y garantía oficial activa.`;
      }
    }

    let nextBestAction = 'Personalizar contenido y monitorear nuevas señales de intención.';
    if (stageUi === 'BUYER') {
      nextBestAction = score >= 70
        ? 'Promover a LEADS y transferir contexto completo al Agente Negociador.'
        : 'Responder consultas de autenticidad/garantía y presentar cotización referencial.';
    } else if (stageUi === 'LEAD') {
      nextBestAction = 'Presentar las 3 alternativas de propuesta comercial (Recomendada, Ahorro Contado y Flexibilidad Cuotas) y activar link PoluxPay.';
    } else if (stageUi === 'PAYER') {
      nextBestAction = shippingStage === 'TRUJILLO_STORE'
        ? 'Ejecutar protocolo de entrega en Trujillo, verificar serie en checkcoverage.apple.com y liquidar saldo.'
        : 'Avanzar hito logístico Miami → SUNAT → Trujillo y enviar notificación proactiva por WhatsApp.';
    } else {
      nextBestAction = 'Gestionar encuesta NPS post-entrega, activar membresía Apple Club Polux (15% MagSafe) y consolidar referidos.';
    }

    return {
      id,
      firstName: r.nombres || 'Cliente',
      lastName: r.apellidos || 'Trujillo',
      email: r.correo_electronico || `cliente.${id}@poluxtrujillo.pe`,
      phone: r.telefono_movil || '+51 944 812 001',
      age: 22 + (id % 22),
      city: 'Trujillo',
      province: 'Trujillo',
      district: r.ciudad || 'Víctor Larco Herrera',
      address: r.direccion_entrega || `Av. Larco 840 — ${r.ciudad || 'Víctor Larco Herrera'}, Trujillo`,
      region: 'La Libertad',
      documentType: r.tipo_documento || 'DNI',
      documentNumber: r.numero_documento || String(70000000 + id),
      gender: id % 2 === 0 ? 'Hombre' : 'Mujer',
      decisionRole: r.rol_compra_principal === 'DECISOR' ? 'Decisor comercial' : r.rol_compra_principal === 'EMPRESA' ? 'Compra corporativa' : 'Comprador directo',
      currentDevice: id % 3 === 0 ? 'iPhone 13 128 GB' : id % 3 === 1 ? 'iPhone 14 Pro' : 'iPhone 12 128 GB',
      occupation: id <= 8 ? 'Especialista / Ejecutivo Trujillo' : id % 2 === 0 ? 'Ingeniero / Profesional' : 'Médico / Universitario',
      company: id % 2 === 0 ? 'Corporación Norte Trujillo' : 'Clínica San Pablo / UPAO',
      university: id % 2 === 0 ? 'Universidad Nacional de Trujillo (UNT)' : 'Universidad Privada Antenor Orrego (UPAO)',
      career: id % 2 === 0 ? 'Ingeniería de Sistemas' : 'Medicina / Arquitectura',
      socioeconomicLevel: id % 3 === 0 ? 'A' : 'B',
      monthlyIncomeMin: 3800 + (id % 5) * 600,
      monthlyIncomeMax: 6500 + (id % 5) * 900,
      stage: stageUi,
      preferredChannel: r.canal_comunicacion || r.canal_conversion || 'WhatsApp',
      acquisitionSource: r.canal_origen || 'Instagram',
      campaignName: 'Lanzamiento iPhone 16 Pro — Trujillo Premium',
      mainProduct: r.main_product || 'iPhone 16 Pro 256 GB',
      secondaryProducts: ['AirPods Pro 2 USB-C MagSafe', 'Cargador MagSafe Oficial 25W'],
      interests: ['Apple Original', 'Fotografía Pro', 'Importación Directa USA'],
      budgetMin: Math.round(priceBase * 0.9),
      budgetMax: Math.round(priceBase * 1.15),
      paymentPreference: r.modalidad_pago || r.modalidad_pago_interes || 'CUOTAS',
      priceSensitivity: 'Media',
      score: Math.round(score),
      priority,
      conversionProbability,
      quoteActive: Boolean(r.numero_cotizacion),
      quoteStartDate: r.cotizacion_emision || r.fecha_creacion,
      quoteEndDate: r.cotizacion_vencimiento || new Date(Date.now() + 7 * 86400000).toISOString(),
      lastActivityAt: r.fecha_actualizacion || r.fecha_creacion,
      agentSummary,
      nextBestAction,
      humanInterventionRequired: Boolean(r.derivada_a_humano),

      // Fase 3: PAYERS & Logística
      paymentMethod: r.medio_pago || (stageUi === 'PAYER' || stageUi === 'CUSTOMER' || stageUi === 'TURNED' ? 'YAPE' : undefined),
      paidAmount: Number(r.total_pagado_validado_pen || 0),
      receiptNumber: r.comprobante_numero || undefined,
      paidAt: r.fecha_pago_inicial_confirmado || undefined,
      courierTrackingCode: r.codigo_tracking_usa || (stageUi === 'PAYER' ? `US-MIA-${100000 + id}` : undefined),
      shippingStage,

      // Fase 4 & 5: CUSTOMERS & TURNED
      deliveryType: r.modalidad_entrega === 'DESPACHO_DOMICILIO_TRUJILLO' ? 'VERIFIED_DELIVERY' : 'STORE_PICKUP',
      deliveredAt: r.fecha_entrega_real || undefined,
      appleSerialNumber: r.numero_serie_imei || undefined,
      warrantyCode: r.id_pedido ? `POLUX-GAR-2025-${String(r.id_pedido).padStart(6, '0')}` : undefined,
      warrantyExpiresAt: r.fecha_entrega_real ? new Date(new Date(r.fecha_entrega_real).getTime() + 365 * 86400000).toISOString() : undefined,
      npsScore: r.puntaje_nps !== null && r.puntaje_nps !== undefined ? Number(r.puntaje_nps) : undefined,
      npsFeedback: r.comentario_cliente || undefined,
      npsSubmittedAt: r.fecha_encuesta || undefined,
      loyaltyRewardActive: r.etapa_actual === 'TURNED' || Number(r.puntaje_nps || 0) >= 9,
    };
  }

  async list(stage?: string, search?: string) {
    const dbStage = this.mapStageToDb(stage);
    const params: any[] = [];
    const whereClauses: string[] = ["p.estado_registro = 'ACTIVO'"];

    if (dbStage) {
      if (dbStage === 'CUSTOMER') {
        whereClauses.push("p.etapa_actual IN ('CUSTOMER', 'TURNED')");
      } else {
        params.push(dbStage);
        whereClauses.push(`p.etapa_actual = @${params.length - 1}`);
      }
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const idx = params.length - 1;
      whereClauses.push(
        `(p.nombres LIKE @${idx} OR p.apellidos LIKE @${idx} OR p.correo_electronico LIKE @${idx} OR p.numero_documento LIKE @${idx} OR p.ciudad LIKE @${idx} OR prod.linea_modelo LIKE @${idx})`
      );
    }

    const sql = `
      SELECT TOP (250)
        p.id_persona,
        p.codigo_cliente,
        p.tipo_documento,
        p.numero_documento,
        p.nombres,
        p.apellidos,
        p.correo_electronico,
        p.telefono_movil,
        p.ciudad,
        p.rol_compra_principal,
        p.etapa_actual,
        p.fecha_creacion,
        p.fecha_actualizacion,
        l.prioridad_comercial,
        l.nivel_intencion_actual,
        l.canal_conversion,
        nc.presupuesto_estimado_pen,
        nc.modalidad_pago_interes,
        prod.linea_modelo AS main_product,
        prod.precio_base_pen,
        ev.puntaje_intencion,
        cot.numero_cotizacion,
        cot.fecha_emision AS cotizacion_emision,
        cot.fecha_vencimiento AS cotizacion_vencimiento,
        ord.numero_orden,
        ord.modalidad_pago,
        ord.total_pagado_validado_pen,
        ord.fecha_pago_inicial_confirmado,
        pg.medio_pago,
        CONCAT(cpe.serie, '-', RIGHT('0000000' + CAST(cpe.numero_correlativo AS VARCHAR(10)), 7)) AS comprobante_numero,
        ped.id_pedido,
        ped.numero_pedido,
        ped.estado_pedido,
        ped.codigo_tracking_usa,
        ped.fecha_entrega_real,
        vc.numero_serie_imei,
        ent.modalidad_entrega,
        ent.direccion_entrega,
        enc.puntaje_nps,
        enc.comentario_cliente,
        enc.fecha_respuesta AS fecha_encuesta,
        act.decision_tomada AS ultima_decision_ia
      FROM core.persona p
      LEFT JOIN leads.lead l ON l.id_persona = p.id_persona
      LEFT JOIN leads.necesidad_compra nc ON nc.id_persona = p.id_persona AND nc.es_vigente = 1
      LEFT JOIN core.producto_catalogo prod ON prod.id_producto = ISNULL(nc.id_producto_interes, ((p.id_persona - 1) % 20) + 1)
      OUTER APPLY (
        SELECT TOP 1 puntaje_intencion FROM leads.evaluacion_intencion e WHERE e.id_persona = p.id_persona ORDER BY e.fecha_evaluacion DESC
      ) ev
      OUTER APPLY (
        SELECT TOP 1 numero_cotizacion, fecha_emision, fecha_vencimiento FROM leads.cotizacion c WHERE c.id_persona = p.id_persona ORDER BY c.id_cotizacion DESC
      ) cot
      OUTER APPLY (
        SELECT TOP 1 id_orden, numero_orden, modalidad_pago, total_pagado_validado_pen, fecha_pago_inicial_confirmado
        FROM payers.orden_contratacion o WHERE o.id_persona = p.id_persona ORDER BY o.id_orden DESC
      ) ord
      OUTER APPLY (
        SELECT TOP 1 id_pago, medio_pago FROM payers.pago pg WHERE pg.id_orden = ord.id_orden ORDER BY pg.id_pago DESC
      ) pg
      OUTER APPLY (
        SELECT TOP 1 serie, numero_correlativo FROM payers.comprobante_electronico cpe WHERE cpe.id_orden = ord.id_orden ORDER BY cpe.id_comprobante DESC
      ) cpe
      OUTER APPLY (
        SELECT TOP 1 id_pedido, numero_pedido, estado_pedido, codigo_tracking_usa, fecha_entrega_real
        FROM customers.pedido pd WHERE pd.id_persona = p.id_persona ORDER BY pd.id_pedido DESC
      ) ped
      OUTER APPLY (
        SELECT TOP 1 numero_serie_imei FROM customers.verificacion_cumplimiento vc WHERE vc.id_pedido = ped.id_pedido ORDER BY vc.id_verificacion DESC
      ) vc
      OUTER APPLY (
        SELECT TOP 1 modalidad_entrega, direccion_entrega FROM customers.entrega ent WHERE ent.id_pedido = ped.id_pedido ORDER BY ent.id_entrega DESC
      ) ent
      OUTER APPLY (
        SELECT TOP 1 puntaje_nps, comentario_cliente, fecha_respuesta FROM turned.encuesta_satisfaccion es WHERE es.id_persona = p.id_persona ORDER BY es.id_encuesta DESC
      ) enc
      OUTER APPLY (
        SELECT TOP 1 decision_tomada FROM core.accion_agente aa WHERE aa.id_persona = p.id_persona ORDER BY aa.fecha_ejecucion DESC
      ) act
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY CASE WHEN p.id_persona <= 12 THEN 0 ELSE 1 END, p.id_persona ASC;
    `;

    const rows = await this.db.query(sql, params);
    return rows.map((r: any) => this.mapRowToPerson(r));
  }

  async get(id: number) {
    const sql = `
      SELECT
        p.id_persona,
        p.codigo_cliente,
        p.tipo_documento,
        p.numero_documento,
        p.nombres,
        p.apellidos,
        p.correo_electronico,
        p.telefono_movil,
        p.ciudad,
        p.rol_compra_principal,
        p.etapa_actual,
        p.fecha_creacion,
        p.fecha_actualizacion,
        l.prioridad_comercial,
        l.nivel_intencion_actual,
        l.canal_conversion,
        nc.presupuesto_estimado_pen,
        nc.modalidad_pago_interes,
        prod.linea_modelo AS main_product,
        prod.precio_base_pen,
        ev.puntaje_intencion,
        cot.numero_cotizacion,
        cot.fecha_emision AS cotizacion_emision,
        cot.fecha_vencimiento AS cotizacion_vencimiento,
        ord.numero_orden,
        ord.modalidad_pago,
        ord.total_pagado_validado_pen,
        ord.fecha_pago_inicial_confirmado,
        pg.medio_pago,
        CONCAT(cpe.serie, '-', RIGHT('0000000' + CAST(cpe.numero_correlativo AS VARCHAR(10)), 7)) AS comprobante_numero,
        ped.id_pedido,
        ped.numero_pedido,
        ped.estado_pedido,
        ped.codigo_tracking_usa,
        ped.fecha_entrega_real,
        vc.numero_serie_imei,
        ent.modalidad_entrega,
        ent.direccion_entrega,
        enc.puntaje_nps,
        enc.comentario_cliente,
        enc.fecha_respuesta AS fecha_encuesta,
        act.decision_tomada AS ultima_decision_ia
      FROM core.persona p
      LEFT JOIN leads.lead l ON l.id_persona = p.id_persona
      LEFT JOIN leads.necesidad_compra nc ON nc.id_persona = p.id_persona AND nc.es_vigente = 1
      LEFT JOIN core.producto_catalogo prod ON prod.id_producto = ISNULL(nc.id_producto_interes, ((p.id_persona - 1) % 20) + 1)
      OUTER APPLY (
        SELECT TOP 1 puntaje_intencion FROM leads.evaluacion_intencion e WHERE e.id_persona = p.id_persona ORDER BY e.fecha_evaluacion DESC
      ) ev
      OUTER APPLY (
        SELECT TOP 1 numero_cotizacion, fecha_emision, fecha_vencimiento FROM leads.cotizacion c WHERE c.id_persona = p.id_persona ORDER BY c.id_cotizacion DESC
      ) cot
      OUTER APPLY (
        SELECT TOP 1 id_orden, numero_orden, modalidad_pago, total_pagado_validado_pen, fecha_pago_inicial_confirmado
        FROM payers.orden_contratacion o WHERE o.id_persona = p.id_persona ORDER BY o.id_orden DESC
      ) ord
      OUTER APPLY (
        SELECT TOP 1 id_pago, medio_pago FROM payers.pago pg WHERE pg.id_orden = ord.id_orden ORDER BY pg.id_pago DESC
      ) pg
      OUTER APPLY (
        SELECT TOP 1 serie, numero_correlativo FROM payers.comprobante_electronico cpe WHERE cpe.id_orden = ord.id_orden ORDER BY cpe.id_comprobante DESC
      ) cpe
      OUTER APPLY (
        SELECT TOP 1 id_pedido, numero_pedido, estado_pedido, codigo_tracking_usa, fecha_entrega_real
        FROM customers.pedido pd WHERE pd.id_persona = p.id_persona ORDER BY pd.id_pedido DESC
      ) ped
      OUTER APPLY (
        SELECT TOP 1 numero_serie_imei FROM customers.verificacion_cumplimiento vc WHERE vc.id_pedido = ped.id_pedido ORDER BY vc.id_verificacion DESC
      ) vc
      OUTER APPLY (
        SELECT TOP 1 modalidad_entrega, direccion_entrega FROM customers.entrega ent WHERE ent.id_pedido = ped.id_pedido ORDER BY ent.id_entrega DESC
      ) ent
      OUTER APPLY (
        SELECT TOP 1 puntaje_nps, comentario_cliente, fecha_respuesta FROM turned.encuesta_satisfaccion es WHERE es.id_persona = p.id_persona ORDER BY es.id_encuesta DESC
      ) enc
      OUTER APPLY (
        SELECT TOP 1 decision_tomada FROM core.accion_agente aa WHERE aa.id_persona = p.id_persona ORDER BY aa.fecha_ejecucion DESC
      ) act
      WHERE p.id_persona = @0;
    `;

    const rows = await this.db.query(sql, [id]);
    if (!rows.length) throw new NotFoundException('Persona no encontrada en PoluxImportDB');
    const person: any = this.mapRowToPerson(rows[0]);

    // Cargar relaciones desde las tablas reales de PoluxImportDB
    const [consultas, senales, eventosWeb, cotizaciones, transiciones, acciones] = await Promise.all([
      this.db.query(
        `SELECT TOP 20 c.id_consulta, conv.canal_comunicacion, c.tema_consulta, c.texto_pregunta, c.fecha_consulta
         FROM buyers.consulta c
         JOIN buyers.conversacion conv ON conv.id_conversacion = c.id_conversacion
         WHERE conv.id_persona = @0
         ORDER BY c.fecha_consulta DESC`,
        [id]
      ),
      this.db.query(
        `SELECT TOP 15 s.id_senal, s.tipo_senal, s.fecha_senal, pr.linea_modelo
         FROM leads.senal_intencion s
         LEFT JOIN core.producto_catalogo pr ON pr.id_producto = s.id_producto
         WHERE s.id_persona = @0
         ORDER BY s.fecha_senal DESC`,
        [id]
      ),
      this.db.query(
        `SELECT TOP 15 ew.id_evento_web, ew.tipo_evento, ew.fecha_evento, pr.linea_modelo
         FROM buyers.evento_web ew
         LEFT JOIN core.producto_catalogo pr ON pr.id_producto = ew.id_producto
         WHERE ew.id_persona = @0
         ORDER BY ew.fecha_evento DESC`,
        [id]
      ),
      this.db.query(
        `SELECT TOP 10 c.id_cotizacion, c.numero_cotizacion, c.total_pen, c.modalidad_pago, c.estado_cotizacion, c.fecha_emision, c.fecha_vencimiento, pr.linea_modelo
         FROM leads.cotizacion c
         LEFT JOIN leads.cotizacion_detalle cd ON cd.id_cotizacion = c.id_cotizacion
         LEFT JOIN core.producto_catalogo pr ON pr.id_producto = cd.id_producto
         WHERE c.id_persona = @0
         ORDER BY c.id_cotizacion DESC`,
        [id]
      ),
      this.db.query(
        `SELECT TOP 15 id_historial_etapa, etapa_anterior, etapa_nueva, motivo_transicion, registrado_por, fecha_transicion
         FROM core.historial_etapa
         WHERE id_persona = @0
         ORDER BY fecha_transicion DESC`,
        [id]
      ),
      this.db.query(
        `SELECT TOP 20 aa.id_accion_agente, ag.fase_principal, aa.tipo_accion, aa.decision_tomada, aa.datos_sustento_json, aa.resultado_ejecucion, aa.fecha_ejecucion
         FROM core.accion_agente aa
         JOIN core.agente_ia ag ON ag.id_agente = aa.id_agente
         WHERE aa.id_persona = @0
         ORDER BY aa.fecha_ejecucion DESC`,
        [id]
      ),
    ]);

    const mappedInteractions: any[] = [];
    for (const c of consultas) {
      const kindMap: Record<string, string> = {
        PRECIO: 'PRICE_FINAL',
        TIEMPO_ENTREGA: 'DELIVERY_QUERY',
        METODO_PAGO: 'PAYMENT_QUERY',
        GARANTIA: 'GUARANTEE_QUERY',
        AUTENTICIDAD: 'STOCK_QUERY',
      };
      mappedInteractions.push({
        id: Number(c.id_consulta),
        kind: kindMap[c.tema_consulta] || 'PRICE_FINAL',
        channel: c.canal_comunicacion || 'WhatsApp',
        topic: c.tema_consulta,
        content: c.texto_pregunta,
        intentPoints: 10,
        createdAt: c.fecha_consulta,
      });
    }
    for (const s of senales) {
      mappedInteractions.push({
        id: 100000 + Number(s.id_senal),
        kind: s.tipo_senal === 'SOLICITUD_COTIZACION' ? 'QUOTE_REQUEST' : 'PRICE_FINAL',
        channel: 'WhatsApp',
        topic: s.tipo_senal,
        content: `Señal explícita registrada en leads.senal_intencion (${s.tipo_senal}) para ${s.linea_modelo || person.mainProduct}.`,
        intentPoints: s.tipo_senal === 'SOLICITUD_COTIZACION' ? 25 : 12,
        createdAt: s.fecha_senal,
      });
    }

    person.interactions = mappedInteractions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    person.productViews = eventosWeb.map((e: any) => ({
      id: Number(e.id_evento_web),
      product: e.linea_modelo || person.mainProduct,
      secondsViewed: 65 + (Number(e.id_evento_web) % 140),
      createdAt: e.fecha_evento,
    }));

    person.quotes = cotizaciones.map((q: any) => ({
      id: Number(q.id_cotizacion),
      code: q.numero_cotizacion,
      product: q.linea_modelo || person.mainProduct,
      amount: Number(q.total_pen),
      status: q.estado_cotizacion === 'ENVIADA' || q.estado_cotizacion === 'ACEPTADA' ? 'ACTIVE' : q.estado_cotizacion,
      paymentPlan: q.modalidad_pago,
      expiresAt: q.fecha_vencimiento,
      createdAt: q.fecha_emision,
    }));

    person.transitions = transiciones.map((t: any) => ({
      id: Number(t.id_historial_etapa),
      fromStage: this.mapStageToUi(t.etapa_anterior),
      toStage: this.mapStageToUi(t.etapa_nueva),
      reason: t.motivo_transicion,
      source: t.registrado_por,
      createdAt: t.fecha_transicion,
    }));

    person.agentActions = acciones.map((a: any) => ({
      id: Number(a.id_accion_agente),
      agentType: a.fase_principal === 'BUYERS' ? 'MARKETING' : a.fase_principal === 'LEADS' ? 'NEGOTIATION' : a.fase_principal === 'PAYERS' ? 'PROCESSING' : 'LOYALTY',
      actionType: a.tipo_accion,
      title: `${a.tipo_accion.replace(/_/g, ' ')}`,
      detail: a.decision_tomada,
      reasoning: a.datos_sustento_json || 'Regla de negocio ejecutada sobre PoluxImportDB.',
      status: 'COMPLETED',
      createdAt: a.fecha_ejecucion,
    }));

    return person;
  }

  async create(dto: any) {
    const docNum = dto.documentNumber && /^\d{8}$/.test(String(dto.documentNumber))
      ? String(dto.documentNumber)
      : String(Math.floor(10000000 + Math.random() * 89999999));

    const seqRow = await this.db.query(`SELECT NEXT VALUE FOR core.seq_codigo_cliente AS next_code;`);
    const codigoCliente = String(seqRow[0]?.next_code || Math.floor(130000 + Math.random() * 60000)).slice(0, 6);

    const inserted = await this.db.query(
      `INSERT INTO core.persona
        (codigo_cliente, tipo_documento, numero_documento, nombres, apellidos, correo_electronico,
         telefono_movil, ciudad, pais, rol_compra_principal, consentimiento_datos, fecha_consentimiento,
         ip_consentimiento, version_politica_privacidad, etapa_actual, estado_registro)
       OUTPUT INSERTED.id_persona
       VALUES
        (@0, 'DNI', @1, @2, @3, @4, @5, @6, 'Perú', 'USUARIO_FINAL', 1, SYSDATETIME(), '190.236.44.99', 'v1.0', 'BUYER', 'ACTIVO');`,
      [
        codigoCliente,
        docNum,
        dto.firstName || 'Cliente',
        dto.lastName || 'Trujillo',
        dto.email || `lead.${Date.now()}@poluxtrujillo.pe`,
        dto.phone || '+51 944 620 118',
        dto.district || 'Víctor Larco Herrera',
      ]
    );

    const idPersona = Number(inserted[0].id_persona);

    // Registrar transición inicial en core.historial_etapa y formulario en buyers.envio_formulario
    await this.db.query(
      `INSERT INTO core.historial_etapa (id_persona, etapa_anterior, etapa_nueva, motivo_transicion, senal_origen, id_entidad_referencia, tipo_entidad_referencia, registrado_por)
       VALUES (@0, 'UNIVERSO', 'BUYER', 'Registro en Landing Page Oficial Polux Imports Trujillo', 'ENVIO_FORMULARIO_WEB', @0, 'persona', 'AGT_MARKETING');`,
      [idPersona]
    );

    await this.db.query(
      `INSERT INTO buyers.envio_formulario
        (identificador_visitante, canal_origen, nombres, apellidos, correo_electronico, telefono_movil, categoria_interes, id_producto_interes, mensaje_usuario, clasificacion_envio, id_persona)
       VALUES
        (CONCAT('VIS-WEB-', @0), 'LANDING_PAGE', @1, @2, @3, @4, 'iPhone', 3, @5, 'VALIDO', @0);`,
      [
        idPersona,
        dto.firstName || 'Cliente',
        dto.lastName || 'Trujillo',
        dto.email || `lead.${Date.now()}@poluxtrujillo.pe`,
        dto.phone || '+51 944 620 118',
        `Solicita cotización de ${dto.mainProduct || 'iPhone 16 Pro 256 GB'} en ${dto.district || 'Víctor Larco Herrera'}.`,
      ]
    );

    return this.get(idPersona);
  }
}
