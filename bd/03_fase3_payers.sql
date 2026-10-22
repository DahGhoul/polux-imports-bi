-- ============================================================================
-- BASE DE DATOS: PoluxImportDB
-- MOTOR: Microsoft SQL Server 2022
-- FASE 3: PAYERS (FORMALIZACIÓN, CRONOGRAMA, VALIDACIÓN Y CONCILIACIÓN DE PAGOS)
-- VERSIÓN: 2.0.0 (AUDITADA Y CORREGIDA)
-- ============================================================================

USE PoluxImportDB;
GO

-- ----------------------------------------------------------------------------
-- 1. TABLA: payers.payer
-- Reglas: RB-040 (Extensión 1:1 de persona al formalizar contratación)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('payers.payer', 'U') IS NULL
BEGIN
    CREATE TABLE payers.payer (
        id_persona             BIGINT NOT NULL,
        fecha_ingreso_payer    DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        estado_payer           VARCHAR(20) NOT NULL DEFAULT 'ACTIVO', -- ACTIVO, AL_DIA, MOROSO, CULMINADO, CANCELADO
        total_ordenes_activas  INT NOT NULL DEFAULT 0,
        fecha_cierre           DATETIME2(7) NULL,
        CONSTRAINT PK_payers_payer PRIMARY KEY CLUSTERED (id_persona),
        CONSTRAINT FK_payer_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT CK_payer_estado CHECK (estado_payer IN ('ACTIVO', 'AL_DIA', 'MOROSO', 'CULMINADO', 'CANCELADO'))
    );
END
GO

-- ----------------------------------------------------------------------------
-- 2. TABLA: payers.orden_contratacion
-- Reglas: RB-041 (Formalización de orden), RB-046 (Activación condicionada a pago inicial)
-- Clave de negocio: Una cotización aceptada formaliza una sola orden (UQ_orden_cotizacion)
-- En ventas al contado, el pago inicial debe ser forzosamente el 100% acordado.
-- ----------------------------------------------------------------------------
IF OBJECT_ID('payers.orden_contratacion', 'U') IS NULL
BEGIN
    CREATE TABLE payers.orden_contratacion (
        id_orden               BIGINT IDENTITY(1,1) NOT NULL,
        numero_orden           VARCHAR(30) NOT NULL,        -- Ej: ORD-2026-0001
        id_persona             BIGINT NOT NULL,
        id_cotizacion          BIGINT NOT NULL,
        tipo_suministro        VARCHAR(30) NOT NULL DEFAULT 'IMPORTACION_USA', -- STOCK_LOCAL_TRUJILLO, IMPORTACION_USA
        modalidad_pago         VARCHAR(20) NOT NULL DEFAULT 'CONTADO', -- CONTADO, CUOTAS
        total_acordado_pen     DECIMAL(12,2) NOT NULL,
        monto_pago_inicial_pactado_pen DECIMAL(12,2) NOT NULL,
        total_cuotas_pactadas  INT NOT NULL DEFAULT 1,
        total_pagado_validado_pen DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        saldo_pendiente_pen    DECIMAL(12,2) NOT NULL,
        estado_orden           VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_PAGO_INICIAL',
        -- Estados: PENDIENTE_PAGO_INICIAL, PAGO_INICIAL_CONFIRMADO, ACTIVADO_EN_IMPORTACION, COMPLETADO, CANCELADO
        fecha_formalizacion    DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        fecha_pago_inicial_confirmado DATETIME2(7) NULL,
        fecha_activacion_pedido DATETIME2(7) NULL,
        CONSTRAINT PK_payers_orden PRIMARY KEY CLUSTERED (id_orden),
        CONSTRAINT UQ_payers_orden_numero UNIQUE NONCLUSTERED (numero_orden),
        CONSTRAINT UQ_orden_cotizacion UNIQUE NONCLUSTERED (id_cotizacion),
        CONSTRAINT FK_orden_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT FK_orden_cotizacion FOREIGN KEY (id_cotizacion)
            REFERENCES leads.cotizacion (id_cotizacion) ON DELETE NO ACTION,
        CONSTRAINT CK_orden_tipo_suministro CHECK (tipo_suministro IN ('STOCK_LOCAL_TRUJILLO', 'IMPORTACION_USA')),
        CONSTRAINT CK_orden_modalidad CHECK (modalidad_pago IN ('CONTADO', 'CUOTAS')),
        CONSTRAINT CK_orden_totales CHECK (total_acordado_pen > 0 AND monto_pago_inicial_pactado_pen > 0),
        CONSTRAINT CK_orden_contado_total CHECK (
            modalidad_pago <> 'CONTADO' OR 
            (modalidad_pago = 'CONTADO' AND monto_pago_inicial_pactado_pen = total_acordado_pen AND total_cuotas_pactadas = 1)
        ),
        CONSTRAINT CK_orden_activacion_pago_confirmado CHECK (
            fecha_activacion_pedido IS NULL OR 
            (fecha_pago_inicial_confirmado IS NOT NULL AND fecha_activacion_pedido >= fecha_pago_inicial_confirmado)
        ),
        CONSTRAINT CK_orden_saldo_consistente CHECK (
            saldo_pendiente_pen = total_acordado_pen - total_pagado_validado_pen
        ),
        CONSTRAINT CK_orden_estado CHECK (estado_orden IN ('PENDIENTE_PAGO_INICIAL', 'PAGO_INICIAL_CONFIRMADO', 'ACTIVADO_EN_IMPORTACION', 'COMPLETADO', 'CANCELADO'))
    );

    CREATE NONCLUSTERED INDEX IX_orden_persona_estado
    ON payers.orden_contratacion (id_persona, estado_orden);

    CREATE NONCLUSTERED INDEX IX_orden_formalizacion_fechas
    ON payers.orden_contratacion (fecha_formalizacion, fecha_pago_inicial_confirmado, fecha_activacion_pedido);
END
GO

-- ----------------------------------------------------------------------------
-- 3. TABLA: payers.cronograma_cuota
-- Reglas: RB-044 (Programación y seguimiento de cuotas)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('payers.cronograma_cuota', 'U') IS NULL
BEGIN
    CREATE TABLE payers.cronograma_cuota (
        id_cuota               BIGINT IDENTITY(1,1) NOT NULL,
        id_orden               BIGINT NOT NULL,
        numero_cuota           INT NOT NULL,                -- 1 = Inicial, 2 = Segunda cuota, etc.
        monto_programado_pen   DECIMAL(12,2) NOT NULL,
        monto_pagado_pen       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        fecha_vencimiento      DATE NOT NULL,
        estado_cuota           VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADA', -- PROGRAMADA, PAGADA, OBSERVADA, VENCIDA
        fecha_pago_efectivo    DATETIME2(7) NULL,
        dias_mora              INT NOT NULL DEFAULT 0,
        CONSTRAINT PK_payers_cronograma PRIMARY KEY CLUSTERED (id_cuota),
        CONSTRAINT FK_cronograma_orden FOREIGN KEY (id_orden)
            REFERENCES payers.orden_contratacion (id_orden) ON DELETE CASCADE,
        CONSTRAINT UQ_cronograma_orden_cuota UNIQUE NONCLUSTERED (id_orden, numero_cuota),
        CONSTRAINT CK_cronograma_estado CHECK (estado_cuota IN ('PROGRAMADA', 'PAGADA', 'OBSERVADA', 'VENCIDA'))
    );

    CREATE NONCLUSTERED INDEX IX_cronograma_vencimiento
    ON payers.cronograma_cuota (estado_cuota, fecha_vencimiento);
END
GO

-- ----------------------------------------------------------------------------
-- 4. TABLA: payers.pago
-- Reglas: RB-005 (Unicidad número de operación bancaria), RB-043 (Conciliación)
-- El tipo de cambio aplicable para operaciones en USD es el fijado en la cotización.
-- ----------------------------------------------------------------------------
IF OBJECT_ID('payers.pago', 'U') IS NULL
BEGIN
    CREATE TABLE payers.pago (
        id_pago                BIGINT IDENTITY(1,1) NOT NULL,
        id_orden               BIGINT NOT NULL,
        id_cuota               BIGINT NULL,                 -- Opcional si es pago total contado
        medio_pago             VARCHAR(30) NOT NULL,        -- YAPE, PLIN, TRANSFERENCIA_BCP, TRANSFERENCIA_BBVA, TRANSFERENCIA_INTERBANK, DEPOSITO, TARJETA
        numero_operacion_transaccion VARCHAR(60) NOT NULL,  -- Unicidad estricta RB-005
        entidad_bancaria       VARCHAR(40) NULL,
        moneda                 VARCHAR(3) NOT NULL DEFAULT 'PEN',
        monto_pagado           DECIMAL(12,2) NOT NULL,
        tipo_cambio_aplicado   DECIMAL(6,4) NULL,           -- Revisado y tomado al momento de cotizar
        fecha_transaccion      DATETIME2(7) NOT NULL,
        url_comprobante_voucher NVARCHAR(300) NULL,
        estado_pago            VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, VALIDADO, OBSERVADO
        motivo_observacion     NVARCHAR(250) NULL,
        validado_por_ia        BIT NOT NULL DEFAULT 0,
        id_agente              SMALLINT NULL,               -- Agente de Cobranza
        validado_por_humano    BIT NOT NULL DEFAULT 0,
        usuario_validador      NVARCHAR(100) NULL,
        fecha_validacion       DATETIME2(7) NULL,
        CONSTRAINT PK_payers_pago PRIMARY KEY CLUSTERED (id_pago),
        CONSTRAINT FK_pago_orden FOREIGN KEY (id_orden)
            REFERENCES payers.orden_contratacion (id_orden) ON DELETE NO ACTION,
        CONSTRAINT FK_pago_cuota FOREIGN KEY (id_cuota)
            REFERENCES payers.cronograma_cuota (id_cuota) ON DELETE NO ACTION,
        CONSTRAINT FK_pago_agente FOREIGN KEY (id_agente)
            REFERENCES core.agente_ia (id_agente) ON DELETE NO ACTION,
        CONSTRAINT UQ_pago_num_operacion UNIQUE NONCLUSTERED (numero_operacion_transaccion),
        CONSTRAINT CK_pago_medio CHECK (medio_pago IN ('YAPE', 'PLIN', 'TRANSFERENCIA_BCP', 'TRANSFERENCIA_BBVA', 'TRANSFERENCIA_INTERBANK', 'DEPOSITO', 'TARJETA', 'OTRO')),
        CONSTRAINT CK_pago_moneda CHECK (moneda IN ('PEN', 'USD')),
        CONSTRAINT CK_pago_monto CHECK (monto_pagado > 0),
        CONSTRAINT CK_pago_estado CHECK (estado_pago IN ('PENDIENTE', 'VALIDADO', 'OBSERVADO'))
    );

    CREATE NONCLUSTERED INDEX IX_pago_orden_estado
    ON payers.pago (id_orden, estado_pago, fecha_validacion);
END
GO

-- ----------------------------------------------------------------------------
-- 5. TABLA: payers.comprobante_electronico
-- Reglas: Comprobante oficial emitido solo contra pagos validados
-- ----------------------------------------------------------------------------
IF OBJECT_ID('payers.comprobante_electronico', 'U') IS NULL
BEGIN
    CREATE TABLE payers.comprobante_electronico (
        id_comprobante         BIGINT IDENTITY(1,1) NOT NULL,
        id_orden               BIGINT NOT NULL,
        id_pago                BIGINT NOT NULL,
        tipo_comprobante       VARCHAR(20) NOT NULL,        -- BOLETA, FACTURA, NOTA_CREDITO
        serie                  VARCHAR(10) NOT NULL,        -- B001, F001
        numero_correlativo     INT NOT NULL,
        numero_documento_cliente VARCHAR(20) NOT NULL,
        nombre_razon_social    NVARCHAR(150) NOT NULL,
        subtotal_gravado_pen   DECIMAL(12,2) NOT NULL,
        igv_pen                DECIMAL(12,2) NOT NULL,
        total_comprobante_pen  DECIMAL(12,2) NOT NULL,
        estado_emision         VARCHAR(20) NOT NULL DEFAULT 'EMITIDO', -- EMITIDO, ANULADO, RECHAZADO_SUNAT
        fecha_emision          DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        hash_cpe               VARCHAR(100) NULL,
        CONSTRAINT PK_payers_comprobante PRIMARY KEY CLUSTERED (id_comprobante),
        CONSTRAINT FK_comprobante_orden FOREIGN KEY (id_orden)
            REFERENCES payers.orden_contratacion (id_orden) ON DELETE NO ACTION,
        CONSTRAINT FK_comprobante_pago FOREIGN KEY (id_pago)
            REFERENCES payers.pago (id_pago) ON DELETE NO ACTION,
        CONSTRAINT UQ_comprobante_serie_correlativo UNIQUE NONCLUSTERED (tipo_comprobante, serie, numero_correlativo),
        CONSTRAINT CK_comprobante_tipo CHECK (tipo_comprobante IN ('BOLETA', 'FACTURA', 'NOTA_CREDITO')),
        CONSTRAINT CK_comprobante_estado CHECK (estado_emision IN ('EMITIDO', 'ANULADO', 'RECHAZADO_SUNAT'))
    );
END
GO

-- Disparador para impedir emisión de comprobante a pagos no validados
CREATE OR ALTER TRIGGER payers.TR_bloquear_comprobante_pago_no_validado
ON payers.comprobante_electronico
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i
        INNER JOIN payers.pago p ON i.id_pago = p.id_pago
        WHERE p.estado_pago <> 'VALIDADO'
    )
    BEGIN
        RAISERROR('Operación denegada: Solo se pueden emitir comprobantes electrónicos para pagos validados y conciliados.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO
