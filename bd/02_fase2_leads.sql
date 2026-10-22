-- ============================================================================
-- BASE DE DATOS: PoluxImportDB
-- MOTOR: Microsoft SQL Server 2022
-- FASE 2: LEADS (PERFILAMIENTO DE NECESIDADES, PROPUESTA Y COTIZACIÓN)
-- VERSIÓN: 2.0.0 (AUDITADA Y CORREGIDA)
-- ============================================================================

USE PoluxImportDB;
GO

-- ----------------------------------------------------------------------------
-- 1. TABLA: leads.lead
-- Reglas: RB-030 (Extensión 1:1 de persona), RB-031 (Estados del lead)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('leads.lead', 'U') IS NULL
BEGIN
    CREATE TABLE leads.lead (
        id_persona             BIGINT NOT NULL,
        fecha_ingreso_lead     DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        estado_lead            VARCHAR(20) NOT NULL DEFAULT 'ACTIVO', -- ACTIVO, CONVERTIDO, PERDIDO
        canal_conversion       VARCHAR(40) NOT NULL DEFAULT 'DIGITAL',
        prioridad_comercial    VARCHAR(20) NOT NULL DEFAULT 'MEDIA',  -- BAJA, MEDIA, ALTA, URGENTE
        nivel_intencion_actual VARCHAR(20) NOT NULL DEFAULT 'MEDIA',  -- BAJA, MEDIA, ALTA
        motivo_perdida         NVARCHAR(200) NULL,
        fecha_cierre           DATETIME2(7) NULL,
        CONSTRAINT PK_leads_lead PRIMARY KEY CLUSTERED (id_persona),
        CONSTRAINT FK_lead_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT CK_lead_estado CHECK (estado_lead IN ('ACTIVO', 'CONVERTIDO', 'PERDIDO')),
        CONSTRAINT CK_lead_prioridad CHECK (prioridad_comercial IN ('BAJA', 'MEDIA', 'ALTA', 'URGENTE')),
        CONSTRAINT CK_lead_intencion CHECK (nivel_intencion_actual IN ('BAJA', 'MEDIA', 'ALTA'))
    );

    CREATE NONCLUSTERED INDEX IX_lead_estado_intencion
    ON leads.lead (estado_lead, nivel_intencion_actual);
END
GO

-- ----------------------------------------------------------------------------
-- 2. TABLA: leads.senal_intencion
-- Reglas: RB-011 (Buyer -> Lead), RB-027 (Registro de señales explícitas)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('leads.senal_intencion', 'U') IS NULL
BEGIN
    CREATE TABLE leads.senal_intencion (
        id_senal               BIGINT IDENTITY(1,1) NOT NULL,
        id_persona             BIGINT NOT NULL,
        tipo_senal             VARCHAR(50) NOT NULL,        -- SOLICITUD_COTIZACION, CONSULTA_PRECIO, CONSULTA_STOCK, CONSULTA_TIEMPO_ENTREGA, CONSULTA_MODALIDAD_PAGO
        id_producto            INT NULL,
        cantidad_interes       INT NOT NULL DEFAULT 1,
        id_conversacion        BIGINT NULL,
        id_consulta            BIGINT NULL,
        produjo_transicion_lead BIT NOT NULL DEFAULT 0,
        fecha_senal            DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_leads_senal_intencion PRIMARY KEY CLUSTERED (id_senal),
        CONSTRAINT FK_senal_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT FK_senal_producto FOREIGN KEY (id_producto)
            REFERENCES core.producto_catalogo (id_producto) ON DELETE NO ACTION,
        CONSTRAINT FK_senal_conversacion FOREIGN KEY (id_conversacion)
            REFERENCES buyers.conversacion (id_conversacion) ON DELETE NO ACTION,
        CONSTRAINT FK_senal_consulta FOREIGN KEY (id_consulta)
            REFERENCES buyers.consulta (id_consulta) ON DELETE NO ACTION,
        CONSTRAINT CK_senal_tipo CHECK (tipo_senal IN ('SOLICITUD_COTIZACION', 'CONSULTA_PRECIO', 'CONSULTA_STOCK', 'CONSULTA_TIEMPO_ENTREGA', 'CONSULTA_MODALIDAD_PAGO', 'OTRO'))
    );

    CREATE NONCLUSTERED INDEX IX_senal_persona_fecha
    ON leads.senal_intencion (id_persona, fecha_senal DESC);
END
GO

-- ----------------------------------------------------------------------------
-- 3. TABLA: leads.necesidad_compra
-- Reglas: RB-032, KPI-LEA-01 (Tasa de leads con necesidades identificadas)
-- Criterio de negocio: Registrada si id_producto_interes, presupuesto_estimado_pen y uso_previsto son NO NULOS.
-- ----------------------------------------------------------------------------
IF OBJECT_ID('leads.necesidad_compra', 'U') IS NULL
BEGIN
    CREATE TABLE leads.necesidad_compra (
        id_necesidad           BIGINT IDENTITY(1,1) NOT NULL,
        id_persona             BIGINT NOT NULL,
        id_producto_interes    INT NOT NULL,
        capacidad_deseada      VARCHAR(20) NULL,
        color_deseado          NVARCHAR(50) NULL,
        accesorios_requeridos  NVARCHAR(200) NULL,
        presupuesto_estimado_pen DECIMAL(12,2) NULL,
        uso_previsto           VARCHAR(30) NULL,            -- PERSONAL, LABORAL, REGALO, EMPRESA
        preocupaciones_expresadas NVARCHAR(300) NULL,       -- Autenticidad, tiempo espera, garantía, costo
        plazo_deseado_dias     INT NULL,
        modalidad_pago_interes VARCHAR(30) NULL,            -- CONTADO, CUOTAS
        es_vigente             BIT NOT NULL DEFAULT 1,
        fecha_registro         DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_leads_necesidad PRIMARY KEY CLUSTERED (id_necesidad),
        CONSTRAINT FK_necesidad_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT FK_necesidad_producto FOREIGN KEY (id_producto_interes)
            REFERENCES core.producto_catalogo (id_producto) ON DELETE NO ACTION,
        CONSTRAINT CK_necesidad_uso CHECK (uso_previsto IN ('PERSONAL', 'LABORAL', 'REGALO', 'EMPRESA') OR uso_previsto IS NULL),
        CONSTRAINT CK_necesidad_modalidad CHECK (modalidad_pago_interes IN ('CONTADO', 'CUOTAS') OR modalidad_pago_interes IS NULL)
    );

    -- Índice único filtrado para garantizar que solo exista una necesidad vigente por persona (evita duplicidad en KPI-LEA-01)
    CREATE UNIQUE NONCLUSTERED INDEX UQ_necesidad_persona_vigente
    ON leads.necesidad_compra (id_persona)
    WHERE es_vigente = 1;
END
GO

-- ----------------------------------------------------------------------------
-- 4. TABLA: leads.presentacion_propuesta
-- Reglas: RB-033, KPI-LEA-02 (Tasa de interacción con propuesta comercial)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('leads.presentacion_propuesta', 'U') IS NULL
BEGIN
    CREATE TABLE leads.presentacion_propuesta (
        id_propuesta           BIGINT IDENTITY(1,1) NOT NULL,
        id_persona             BIGINT NOT NULL,
        id_necesidad           BIGINT NULL,
        canal_presentacion     VARCHAR(30) NOT NULL DEFAULT 'WHATSAPP', -- WHATSAPP, CORREO, LLAMADA
        beneficio_destacado    NVARCHAR(200) NOT NULL,     -- Garantía oficial 1 año, ahorro vs tienda, entrega asegurada
        preocupacion_atendida  NVARCHAR(200) NULL,
        respondio_lead         BIT NOT NULL DEFAULT 0,
        fecha_presentacion     DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        fecha_respuesta        DATETIME2(7) NULL,
        tipo_interaccion_respuesta VARCHAR(30) NULL,        -- ACEPTA_COTIZAR, SOLICITA_AJUSTE, PREGUNTA_GARANTIA, SIN_RESPUESTA
        CONSTRAINT PK_leads_presentacion_propuesta PRIMARY KEY CLUSTERED (id_propuesta),
        CONSTRAINT FK_propuesta_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT FK_propuesta_necesidad FOREIGN KEY (id_necesidad)
            REFERENCES leads.necesidad_compra (id_necesidad) ON DELETE NO ACTION
    );

    CREATE NONCLUSTERED INDEX IX_propuesta_persona_respuesta
    ON leads.presentacion_propuesta (id_persona, respondio_lead, fecha_presentacion);
END
GO

-- ----------------------------------------------------------------------------
-- 5. TABLA: leads.evaluacion_intencion
-- Reglas: RB-034, KPI-LEA-03 (Índice de leads con intención alta)
-- Evaluada periódicamente por el Agente Negociador de IA
-- ----------------------------------------------------------------------------
IF OBJECT_ID('leads.evaluacion_intencion', 'U') IS NULL
BEGIN
    CREATE TABLE leads.evaluacion_intencion (
        id_evaluacion          BIGINT IDENTITY(1,1) NOT NULL,
        id_persona             BIGINT NOT NULL,
        id_agente              SMALLINT NULL,
        puntaje_intencion      DECIMAL(5,2) NOT NULL,       -- 0.00 a 100.00
        nivel_intencion        VARCHAR(20) NOT NULL,        -- BAJA, MEDIA, ALTA
        prioridad_sugerida     VARCHAR(20) NOT NULL,        -- BAJA, MEDIA, ALTA, URGENTE
        consultas_precio_count INT NOT NULL DEFAULT 0,
        frecuencia_interaccion INT NOT NULL DEFAULT 0,
        senales_sustento_json  NVARCHAR(MAX) NULL,
        fecha_evaluacion       DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_leads_evaluacion_intencion PRIMARY KEY CLUSTERED (id_evaluacion),
        CONSTRAINT FK_eval_intencion_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT FK_eval_intencion_agente FOREIGN KEY (id_agente)
            REFERENCES core.agente_ia (id_agente) ON DELETE NO ACTION,
        CONSTRAINT CK_eval_puntaje CHECK (puntaje_intencion BETWEEN 0 AND 100),
        CONSTRAINT CK_eval_nivel CHECK (nivel_intencion IN ('BAJA', 'MEDIA', 'ALTA'))
    );

    CREATE NONCLUSTERED INDEX IX_evaluacion_persona_fecha
    ON leads.evaluacion_intencion (id_persona, fecha_evaluacion DESC);
END
GO

-- ----------------------------------------------------------------------------
-- 6. TABLA: leads.cotizacion
-- Reglas: RB-035 (Múltiples cotizaciones), RB-036 (Versionado y reemplazo), RB-037
-- ----------------------------------------------------------------------------
IF OBJECT_ID('leads.cotizacion', 'U') IS NULL
BEGIN
    CREATE TABLE leads.cotizacion (
        id_cotizacion          BIGINT IDENTITY(1,1) NOT NULL,
        id_persona             BIGINT NOT NULL,
        numero_cotizacion      VARCHAR(30) NOT NULL,        -- Ej: COT-2026-0001
        id_cotizacion_previa   BIGINT NULL,                 -- Autorreferencia a cotización sustituida
        version_numero         INT NOT NULL DEFAULT 1,
        fecha_emision          DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        fecha_vencimiento      DATETIME2(7) NOT NULL,
        subtotal_pen           DECIMAL(12,2) NOT NULL,
        descuento_pen          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        total_pen              DECIMAL(12,2) NOT NULL,
        tipo_cambio_referencial DECIMAL(6,4) NOT NULL DEFAULT 3.7500, -- Tipo de cambio fijado al cotizar
        total_usd              DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        modalidad_pago         VARCHAR(20) NOT NULL DEFAULT 'CONTADO', -- CONTADO, CUOTAS
        pago_inicial_sugerido_pen DECIMAL(12,2) NOT NULL,
        numero_cuotas_sugeridas INT NOT NULL DEFAULT 1,
        estado_cotizacion      VARCHAR(20) NOT NULL DEFAULT 'ENVIADA', -- BORRADOR, ENVIADA, ACEPTADA, RECHAZADA, REEMPLAZADA, VENCIDA
        motivo_reemplazo       NVARCHAR(200) NULL,
        fecha_aceptacion       DATETIME2(7) NULL,
        CONSTRAINT PK_leads_cotizacion PRIMARY KEY CLUSTERED (id_cotizacion),
        CONSTRAINT FK_cotizacion_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT FK_cotizacion_previa FOREIGN KEY (id_cotizacion_previa)
            REFERENCES leads.cotizacion (id_cotizacion) ON DELETE NO ACTION,
        CONSTRAINT UQ_cotizacion_persona_numero UNIQUE NONCLUSTERED (id_persona, numero_cotizacion),
        CONSTRAINT CK_cotizacion_no_autorreferencia CHECK (id_cotizacion_previa <> id_cotizacion OR id_cotizacion_previa IS NULL),
        CONSTRAINT CK_cotizacion_totales CHECK (total_pen >= 0 AND total_pen = subtotal_pen - descuento_pen),
        CONSTRAINT CK_cotizacion_estado CHECK (estado_cotizacion IN ('BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA', 'REEMPLAZADA', 'VENCIDA')),
        CONSTRAINT CK_cotizacion_modalidad CHECK (modalidad_pago IN ('CONTADO', 'CUOTAS'))
    );

    CREATE NONCLUSTERED INDEX IX_cotizacion_estado_fecha
    ON leads.cotizacion (estado_cotizacion, fecha_emision);

    CREATE NONCLUSTERED INDEX IX_cotizacion_previa
    ON leads.cotizacion (id_cotizacion_previa);
END
GO

-- ----------------------------------------------------------------------------
-- 7. TABLA: leads.cotizacion_detalle
-- Detalle de ítems cotizados vinculados al catálogo y al stock local o importación
-- ----------------------------------------------------------------------------
IF OBJECT_ID('leads.cotizacion_detalle', 'U') IS NULL
BEGIN
    CREATE TABLE leads.cotizacion_detalle (
        id_cotizacion_detalle  BIGINT IDENTITY(1,1) NOT NULL,
        id_cotizacion          BIGINT NOT NULL,
        id_producto            INT NOT NULL,
        id_necesidad           BIGINT NULL,
        tipo_atencion          VARCHAR(30) NOT NULL DEFAULT 'IMPORTACION_PEDIDO', -- STOCK_TRUJILLO, IMPORTACION_PEDIDO
        cantidad               INT NOT NULL DEFAULT 1,
        precio_unitario_pen    DECIMAL(12,2) NOT NULL,
        subtotal_item_pen      DECIMAL(12,2) NOT NULL,
        notas_item             NVARCHAR(200) NULL,
        CONSTRAINT PK_leads_cotizacion_detalle PRIMARY KEY CLUSTERED (id_cotizacion_detalle),
        CONSTRAINT FK_cotiz_detalle_cotizacion FOREIGN KEY (id_cotizacion)
            REFERENCES leads.cotizacion (id_cotizacion) ON DELETE CASCADE,
        CONSTRAINT FK_cotiz_detalle_producto FOREIGN KEY (id_producto)
            REFERENCES core.producto_catalogo (id_producto) ON DELETE NO ACTION,
        CONSTRAINT FK_cotiz_detalle_necesidad FOREIGN KEY (id_necesidad)
            REFERENCES leads.necesidad_compra (id_necesidad) ON DELETE NO ACTION,
        CONSTRAINT CK_cotiz_detalle_tipo_atencion CHECK (tipo_atencion IN ('STOCK_TRUJILLO', 'IMPORTACION_PEDIDO')),
        CONSTRAINT CK_cotiz_detalle_cantidad CHECK (cantidad > 0),
        CONSTRAINT CK_cotiz_detalle_subtotal CHECK (subtotal_item_pen = cantidad * precio_unitario_pen)
    );

    CREATE NONCLUSTERED INDEX IX_cotiz_detalle_cotizacion
    ON leads.cotizacion_detalle (id_cotizacion, id_producto);
END
GO

-- ----------------------------------------------------------------------------
-- 8. PROCEDIMIENTO ALMACENADO: leads.sp_depurar_leads_inactivos
-- Reglas: RB-031 (Transición a PERDIDO tras 1 semana de inactividad sin respuesta)
-- ----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE leads.sp_depurar_leads_inactivos
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @dias_inactividad INT = 7;
    
    SELECT @dias_inactividad = CAST(valor_numerico AS INT)
    FROM core.configuracion_parametro
    WHERE codigo_parametro = 'UMBRAL_INACTIVIDAD_LEAD_PERDIDO_DIAS';

    IF @dias_inactividad IS NULL SET @dias_inactividad = 7;

    UPDATE l
    SET l.estado_lead = 'PERDIDO',
        l.motivo_perdida = 'INACTIVIDAD_COMERCIAL_1_SEMANA',
        l.fecha_cierre = SYSDATETIME()
    FROM leads.lead l
    WHERE l.estado_lead = 'ACTIVO'
      AND l.fecha_ingreso_lead < DATEADD(day, -@dias_inactividad, SYSDATETIME())
      AND NOT EXISTS (
          SELECT 1 FROM leads.presentacion_propuesta pp
          WHERE pp.id_persona = l.id_persona
            AND (pp.fecha_respuesta >= DATEADD(day, -@dias_inactividad, SYSDATETIME())
                 OR (pp.respondio_lead = 1 AND pp.fecha_presentacion >= DATEADD(day, -@dias_inactividad, SYSDATETIME())))
      )
      AND NOT EXISTS (
          SELECT 1 FROM leads.cotizacion c
          WHERE c.id_persona = l.id_persona
            AND c.fecha_emision >= DATEADD(day, -@dias_inactividad, SYSDATETIME())
      );
END;
GO
