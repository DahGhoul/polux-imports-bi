-- ============================================================================
-- BASE DE DATOS: PoluxImportDB
-- MOTOR: Microsoft SQL Server 2022
-- FASE 4: CUSTOMERS (SEGUIMIENTO LOGÍSTICO, INSPECCIÓN, CUMPLIMIENTO Y ENTREGA)
-- VERSIÓN: 2.0.0 (AUDITADA Y CORREGIDA)
-- ============================================================================

USE PoluxImportDB;
GO

-- ----------------------------------------------------------------------------
-- 1. TABLA: customers.customer
-- Reglas: RB-051 (Extensión 1:1 de persona), RB-061 (Cierre y traspaso a Turned)
-- Conserva pedido de origen y payer del que proviene
-- ----------------------------------------------------------------------------
IF OBJECT_ID('customers.customer', 'U') IS NULL
BEGIN
    CREATE TABLE customers.customer (
        id_persona             BIGINT NOT NULL,
        id_payer               BIGINT NULL,                 -- Payer de origen
        id_pedido_origen       BIGINT NULL,                 -- Pedido inicial que detonó la fase
        fecha_ingreso_customer DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        estado_customer        VARCHAR(20) NOT NULL DEFAULT 'ACTIVO', -- ACTIVO, ENTREGADO, CERRADO, TURNED
        total_pedidos_historicos INT NOT NULL DEFAULT 1,
        fecha_traspaso_turned  DATETIME2(7) NULL,
        CONSTRAINT PK_customers_customer PRIMARY KEY CLUSTERED (id_persona),
        CONSTRAINT FK_customer_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT FK_customer_payer FOREIGN KEY (id_payer)
            REFERENCES payers.payer (id_persona) ON DELETE NO ACTION,
        CONSTRAINT CK_customer_estado CHECK (estado_customer IN ('ACTIVO', 'ENTREGADO', 'CERRADO', 'TURNED'))
    );
END
GO

-- ----------------------------------------------------------------------------
-- 2. TABLA: customers.pedido
-- Representa el pedido de importación o despacho desde stock local activado tras confirmación del pago inicial
-- Reglas: RB-046, RB-047, KPI-CUS-03 (Cumplimiento de entregas pactadas)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('customers.pedido', 'U') IS NULL
BEGIN
    CREATE TABLE customers.pedido (
        id_pedido              BIGINT IDENTITY(1,1) NOT NULL,
        numero_pedido          VARCHAR(30) NOT NULL,        -- Ej: PED-2026-0001
        id_orden               BIGINT NOT NULL,
        id_persona             BIGINT NOT NULL,
        estado_pedido          VARCHAR(35) NOT NULL DEFAULT 'EN_COMPRA_USA',
        -- Estados: EN_COMPRA_USA, EN_TRANSITO_INTERNACIONAL, EN_ADUANA_PERU, LIBERADO_ADUANA, INGRESADO_TRUJILLO, EN_INSPECCION, APROBADO_PARA_ENTREGA, EN_REPARTO, ENTREGADO, CERRADO, OBSERVADO
        codigo_tracking_usa    VARCHAR(100) NULL,
        courier_internacional  VARCHAR(50) NULL,
        guia_aerea_courier     VARCHAR(100) NULL,
        fecha_activacion       DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        fecha_estimada_entrega DATE NOT NULL,
        fecha_llegada_trujillo DATETIME2(7) NULL,
        fecha_entrega_real     DATETIME2(7) NULL,
        CONSTRAINT PK_customers_pedido PRIMARY KEY CLUSTERED (id_pedido),
        CONSTRAINT UQ_customers_pedido_numero UNIQUE NONCLUSTERED (numero_pedido),
        CONSTRAINT FK_pedido_orden FOREIGN KEY (id_orden)
            REFERENCES payers.orden_contratacion (id_orden) ON DELETE NO ACTION,
        CONSTRAINT FK_pedido_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT CK_pedido_estado CHECK (estado_pedido IN (
            'EN_COMPRA_USA', 'EN_TRANSITO_INTERNACIONAL', 'EN_ADUANA_PERU',
            'LIBERADO_ADUANA', 'INGRESADO_TRUJILLO', 'EN_INSPECCION',
            'APROBADO_PARA_ENTREGA', 'EN_REPARTO', 'ENTREGADO', 'CERRADO', 'OBSERVADO'
        ))
    );

    CREATE NONCLUSTERED INDEX IX_pedido_persona_estado
    ON customers.pedido (id_persona, estado_pedido);

    CREATE NONCLUSTERED INDEX IX_pedido_fechas_cumplimiento
    ON customers.pedido (fecha_estimada_entrega, fecha_entrega_real, estado_pedido);
END
GO

-- Clave foránea diferida para id_pedido_origen en customers.customer
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_customer_pedido_origen')
BEGIN
    ALTER TABLE customers.customer
    ADD CONSTRAINT FK_customer_pedido_origen FOREIGN KEY (id_pedido_origen)
        REFERENCES customers.pedido (id_pedido) ON DELETE NO ACTION;
END
GO

-- ----------------------------------------------------------------------------
-- 3. TABLA: customers.seguimiento_logistico_hito
-- Trazabilidad de hitos físicos del trayecto aduanero e internacional
-- ----------------------------------------------------------------------------
IF OBJECT_ID('customers.seguimiento_logistico_hito', 'U') IS NULL
BEGIN
    CREATE TABLE customers.seguimiento_logistico_hito (
        id_hito                BIGINT IDENTITY(1,1) NOT NULL,
        id_pedido              BIGINT NOT NULL,
        codigo_hito            VARCHAR(40) NOT NULL,
        -- Hitos: COMPRA_USA, RECEPCION_MIAMI, EMBARQUE_AEREO, LLEGADA_LIMA, EN_ADUANAS, LIBERADO_ADUANA, TRASLADO_TRUJILLO, LLEGADA_TRUJILLO
        descripcion_hito       NVARCHAR(250) NOT NULL,
        ubicacion_geografica   NVARCHAR(100) NOT NULL,
        fecha_hito             DATETIME2(7) NOT NULL,
        fecha_registro         DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        registrado_por         VARCHAR(50) NOT NULL DEFAULT 'SYSTEM_COURIER_API',
        CONSTRAINT PK_customers_hito PRIMARY KEY CLUSTERED (id_hito),
        CONSTRAINT FK_hito_pedido FOREIGN KEY (id_pedido)
            REFERENCES customers.pedido (id_pedido) ON DELETE CASCADE,
        CONSTRAINT CK_hito_codigo CHECK (codigo_hito IN (
            'COMPRA_USA', 'RECEPCION_MIAMI', 'EMBARQUE_AEREO', 'LLEGADA_LIMA',
            'EN_ADUANAS', 'LIBERADO_ADUANA', 'TRASLADO_TRUJILLO', 'LLEGADA_TRUJILLO', 'OTRO'
        ))
    );

    CREATE NONCLUSTERED INDEX IX_hito_pedido_fecha
    ON customers.seguimiento_logistico_hito (id_pedido, fecha_hito);
END
GO

-- ----------------------------------------------------------------------------
-- 4. TABLA: customers.actualizacion_seguimiento
-- Reglas: RB-052 (Seguimiento proactivo), RB-053, KPI-CUS-01 (Frecuencia de actualización)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('customers.actualizacion_seguimiento', 'U') IS NULL
BEGIN
    CREATE TABLE customers.actualizacion_seguimiento (
        id_actualizacion       BIGINT IDENTITY(1,1) NOT NULL,
        id_pedido              BIGINT NOT NULL,
        hito_comunicado        VARCHAR(50) NOT NULL,
        canal_envio            VARCHAR(30) NOT NULL DEFAULT 'WHATSAPP', -- WHATSAPP, CORREO, SMS
        mensaje_enviado        NVARCHAR(MAX) NOT NULL,
        generado_por_ia        BIT NOT NULL DEFAULT 1,
        id_agente              SMALLINT NULL,               -- Agente de Seguimiento
        respondio_cliente      BIT NOT NULL DEFAULT 0,
        nivel_ansiedad_detectado VARCHAR(20) NOT NULL DEFAULT 'BAJO', -- BAJO, MEDIO, ALTO
        fecha_envio            DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_customers_actualizacion PRIMARY KEY CLUSTERED (id_actualizacion),
        CONSTRAINT FK_actualizacion_pedido FOREIGN KEY (id_pedido)
            REFERENCES customers.pedido (id_pedido) ON DELETE CASCADE,
        CONSTRAINT FK_actualizacion_agente FOREIGN KEY (id_agente)
            REFERENCES core.agente_ia (id_agente) ON DELETE NO ACTION,
        CONSTRAINT CK_actualizacion_ansiedad CHECK (nivel_ansiedad_detectado IN ('BAJO', 'MEDIO', 'ALTO'))
    );

    CREATE NONCLUSTERED INDEX IX_actualizacion_pedido_fecha
    ON customers.actualizacion_seguimiento (id_pedido, fecha_envio DESC);
END
GO

-- ----------------------------------------------------------------------------
-- 5. TABLA: customers.imprevisto_operativo
-- Reglas: RB-054 (Gestión de imprevistos), RB-055, KPI-CUS-02 (Tiempo de resolución)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('customers.imprevisto_operativo', 'U') IS NULL
BEGIN
    CREATE TABLE customers.imprevisto_operativo (
        id_imprevisto          BIGINT IDENTITY(1,1) NOT NULL,
        id_pedido              BIGINT NOT NULL,
        tipo_imprevisto        VARCHAR(40) NOT NULL,        -- RETENCION_ADUANERA, IMPUESTO_ADICIONAL, RETRASO_VUELO, DISCREPANCIA_PROVEEDOR, DANO_EMPAQUE
        descripcion            NVARCHAR(500) NOT NULL,
        impacto_estimado_dias  INT NOT NULL DEFAULT 0,
        fecha_deteccion        DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        fecha_resolucion       DATETIME2(7) NULL,
        estado_imprevisto      VARCHAR(20) NOT NULL DEFAULT 'EN_GESTION', -- EN_GESTION, RESUELTO, ESCALADO_HUMANO
        responsable_humano     NVARCHAR(100) NULL,
        solucion_aplicada      NVARCHAR(500) NULL,
        id_accion_agente       BIGINT NULL,
        CONSTRAINT PK_customers_imprevisto PRIMARY KEY CLUSTERED (id_imprevisto),
        CONSTRAINT FK_imprevisto_pedido FOREIGN KEY (id_pedido)
            REFERENCES customers.pedido (id_pedido) ON DELETE CASCADE,
        CONSTRAINT FK_imprevisto_accion_agente FOREIGN KEY (id_accion_agente)
            REFERENCES core.accion_agente (id_accion_agente) ON DELETE NO ACTION,
        CONSTRAINT CK_imprevisto_tipo CHECK (tipo_imprevisto IN ('RETENCION_ADUANERA', 'IMPUESTO_ADICIONAL', 'RETRASO_VUELO', 'DISCREPANCIA_PROVEEDOR', 'DANO_EMPAQUE', 'OTRO')),
        CONSTRAINT CK_imprevisto_estado CHECK (estado_imprevisto IN ('EN_GESTION', 'RESUELTO', 'ESCALADO_HUMANO'))
    );

    CREATE NONCLUSTERED INDEX IX_imprevisto_fechas
    ON customers.imprevisto_operativo (estado_imprevisto, fecha_deteccion, fecha_resolucion);
END
GO

-- ----------------------------------------------------------------------------
-- 6. TABLA: customers.inspeccion_calidad
-- Reglas: RB-013 (Inspección física en sede Trujillo previa a coordinar entrega)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('customers.inspeccion_calidad', 'U') IS NULL
BEGIN
    CREATE TABLE customers.inspeccion_calidad (
        id_inspeccion          BIGINT IDENTITY(1,1) NOT NULL,
        id_pedido              BIGINT NOT NULL,
        numero_intento         INT NOT NULL DEFAULT 1,      -- 1, 2 si hubo solución con proveedor
        estado_empaque_externo VARCHAR(30) NOT NULL DEFAULT 'CONFORME',
        sellos_seguridad_apple VARCHAR(30) NOT NULL DEFAULT 'INTACTOS',
        resultado_inspeccion   VARCHAR(20) NOT NULL DEFAULT 'APROBADO', -- APROBADO, OBSERVADO
        detalle_observaciones  NVARCHAR(500) NULL,
        inspector_usuario      NVARCHAR(100) NOT NULL DEFAULT 'CONTROL_CALIDAD_TRUJILLO',
        fecha_inspeccion       DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_customers_inspeccion PRIMARY KEY CLUSTERED (id_inspeccion),
        CONSTRAINT FK_inspeccion_pedido FOREIGN KEY (id_pedido)
            REFERENCES customers.pedido (id_pedido) ON DELETE NO ACTION,
        CONSTRAINT UQ_inspeccion_pedido_intento UNIQUE NONCLUSTERED (id_pedido, numero_intento),
        CONSTRAINT CK_inspeccion_resultado CHECK (resultado_inspeccion IN ('APROBADO', 'OBSERVADO'))
    );
END
GO

-- ----------------------------------------------------------------------------
-- 7. TABLA: customers.verificacion_cumplimiento
-- Reglas: RB-056 (Verificación técnica automatizada de especificaciones y serie)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('customers.verificacion_cumplimiento', 'U') IS NULL
BEGIN
    CREATE TABLE customers.verificacion_cumplimiento (
        id_verificacion        BIGINT IDENTITY(1,1) NOT NULL,
        id_pedido              BIGINT NOT NULL,
        id_inspeccion          BIGINT NOT NULL,
        modelo_fisico_detectado NVARCHAR(100) NOT NULL,
        capacidad_fisica       VARCHAR(20) NOT NULL,
        color_fisico           NVARCHAR(50) NOT NULL,
        numero_serie_imei      VARCHAR(50) NOT NULL,        -- Serial Apple único verificado
        resultado_verificacion VARCHAR(25) NOT NULL DEFAULT 'CONFORME', -- CONFORME, CON_DISCREPANCIA
        evidencia_fotografica_url NVARCHAR(300) NULL,
        verificado_por_ia      BIT NOT NULL DEFAULT 1,
        id_agente              SMALLINT NULL,
        fecha_verificacion     DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_customers_verificacion PRIMARY KEY CLUSTERED (id_verificacion),
        CONSTRAINT FK_verificacion_pedido FOREIGN KEY (id_pedido)
            REFERENCES customers.pedido (id_pedido) ON DELETE NO ACTION,
        CONSTRAINT FK_verificacion_inspeccion FOREIGN KEY (id_inspeccion)
            REFERENCES customers.inspeccion_calidad (id_inspeccion) ON DELETE NO ACTION,
        CONSTRAINT FK_verificacion_agente FOREIGN KEY (id_agente)
            REFERENCES core.agente_ia (id_agente) ON DELETE NO ACTION,
        CONSTRAINT CK_verificacion_resultado CHECK (resultado_verificacion IN ('CONFORME', 'CON_DISCREPANCIA'))
    );

    CREATE NONCLUSTERED INDEX IX_verificacion_resultado
    ON customers.verificacion_cumplimiento (resultado_verificacion, fecha_verificacion);
END
GO

-- ----------------------------------------------------------------------------
-- 8. TABLA: customers.entrega
-- Reglas: RB-013 (Coordinación solo tras inspección aprobada), RB-057 (Una entrega por pedido)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('customers.entrega', 'U') IS NULL
BEGIN
    CREATE TABLE customers.entrega (
        id_entrega             BIGINT IDENTITY(1,1) NOT NULL,
        id_pedido              BIGINT NOT NULL,
        modalidad_entrega      VARCHAR(30) NOT NULL DEFAULT 'RECOJO_OFICINA_TRUJILLO',
        -- Modalidades: RECOJO_OFICINA_TRUJILLO, DESPACHO_DOMICILIO_TRUJILLO, ENVIO_NACIONAL_AGENCIA
        direccion_entrega      NVARCHAR(200) NOT NULL DEFAULT 'Oficina Principal Trujillo',
        nombre_persona_recibe  NVARCHAR(150) NOT NULL,
        documento_identidad_recibe VARCHAR(20) NOT NULL,
        fecha_coordinada_entrega DATETIME2(7) NOT NULL,
        fecha_real_entrega     DATETIME2(7) NULL,
        estado_entrega         VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, EN_REPARTO, ENTREGADO, OBSERVADO
        CONSTRAINT PK_customers_entrega PRIMARY KEY CLUSTERED (id_entrega),
        CONSTRAINT FK_entrega_pedido FOREIGN KEY (id_pedido)
            REFERENCES customers.pedido (id_pedido) ON DELETE NO ACTION,
        CONSTRAINT UQ_entrega_pedido UNIQUE NONCLUSTERED (id_pedido),
        CONSTRAINT CK_entrega_modalidad CHECK (modalidad_entrega IN ('RECOJO_OFICINA_TRUJILLO', 'DESPACHO_DOMICILIO_TRUJILLO', 'ENVIO_NACIONAL_AGENCIA')),
        CONSTRAINT CK_entrega_estado CHECK (estado_entrega IN ('PENDIENTE', 'EN_REPARTO', 'ENTREGADO', 'OBSERVADO'))
    );
END
GO

-- Disparador que garantiza RB-013: No coordinar ni crear entrega sin inspección previa APROBADA
CREATE OR ALTER TRIGGER customers.TR_bloquear_entrega_sin_inspeccion_aprobada
ON customers.entrega
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE NOT EXISTS (
            SELECT 1 FROM customers.inspeccion_calidad ic
            WHERE ic.id_pedido = i.id_pedido
              AND ic.resultado_inspeccion = 'APROBADO'
        )
    )
    BEGIN
        RAISERROR('Operación denegada (RB-013): No se puede registrar la coordinación de entrega sin que el pedido cuente con una inspección física con resultado APROBADO en la sede de Trujillo.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- ----------------------------------------------------------------------------
-- 9. TABLA: customers.confirmacion_entrega
-- Reglas: RB-058 (Confirmaciones múltiples), RB-059 (Cierre condicionado), KPI-CUS-04
-- Clave compuesta única: (id_entrega, numero_confirmacion)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('customers.confirmacion_entrega', 'U') IS NULL
BEGIN
    CREATE TABLE customers.confirmacion_entrega (
        id_confirmacion        BIGINT IDENTITY(1,1) NOT NULL,
        id_entrega             BIGINT NOT NULL,
        numero_confirmacion    INT NOT NULL DEFAULT 1,
        medio_confirmacion     VARCHAR(30) NOT NULL DEFAULT 'ACTA_CONFORMIDAD', -- ACTA_CONFORMIDAD, FIRMA_DIGITAL, FOTO_RECEPCION
        url_archivo_evidencia  NVARCHAR(300) NULL,
        tiene_observaciones    BIT NOT NULL DEFAULT 0,
        detalle_observaciones  NVARCHAR(500) NULL,
        fecha_confirmacion     DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_customers_confirmacion PRIMARY KEY CLUSTERED (id_confirmacion),
        CONSTRAINT FK_confirmacion_entrega FOREIGN KEY (id_entrega)
            REFERENCES customers.entrega (id_entrega) ON DELETE CASCADE,
        CONSTRAINT UQ_confirmacion_entrega_numero UNIQUE NONCLUSTERED (id_entrega, numero_confirmacion)
    );

    CREATE NONCLUSTERED INDEX IX_confirmacion_observaciones
    ON customers.confirmacion_entrega (tiene_observaciones, fecha_confirmacion);
END
GO

-- ----------------------------------------------------------------------------
-- 10. TABLA: customers.cierre_servicio
-- Reglas: RB-059 (Bloqueo si hay observaciones), RB-061 (Cierre formal y traspaso)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('customers.cierre_servicio', 'U') IS NULL
BEGIN
    CREATE TABLE customers.cierre_servicio (
        id_cierre              BIGINT IDENTITY(1,1) NOT NULL,
        id_pedido              BIGINT NOT NULL,
        id_persona             BIGINT NOT NULL,
        fecha_pago_inicial     DATETIME2(7) NOT NULL,
        fecha_cierre_operativo DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        dias_ciclo_total       AS DATEDIFF(day, fecha_pago_inicial, fecha_cierre_operativo),
        traspasado_a_postventa BIT NOT NULL DEFAULT 1,
        fecha_traspaso         DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        estado_cierre          VARCHAR(30) NOT NULL DEFAULT 'COMPLETADO_EXITOSO', -- COMPLETADO_EXITOSO, CERRADO_CON_OBSERVACION
        CONSTRAINT PK_customers_cierre PRIMARY KEY CLUSTERED (id_cierre),
        CONSTRAINT FK_cierre_pedido FOREIGN KEY (id_pedido)
            REFERENCES customers.pedido (id_pedido) ON DELETE NO ACTION,
        CONSTRAINT FK_cierre_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT UQ_cierre_pedido UNIQUE NONCLUSTERED (id_pedido),
        CONSTRAINT CK_cierre_estado CHECK (estado_cierre IN ('COMPLETADO_EXITOSO', 'CERRADO_CON_OBSERVACION'))
    );
END
GO

-- Disparador que garantiza RB-059: Impedir cierre exitoso si la entrega tiene observaciones no subsanadas
CREATE OR ALTER TRIGGER customers.TR_bloquear_cierre_con_observaciones
ON customers.cierre_servicio
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i
        INNER JOIN customers.entrega e ON i.id_pedido = e.id_pedido
        WHERE EXISTS (
            SELECT 1 FROM customers.confirmacion_entrega ce
            WHERE ce.id_entrega = e.id_entrega AND ce.tiene_observaciones = 1
        )
        AND NOT EXISTS (
            SELECT 1 FROM customers.confirmacion_entrega ce2
            WHERE ce2.id_entrega = e.id_entrega AND ce2.tiene_observaciones = 0
        )
        AND i.estado_cierre = 'COMPLETADO_EXITOSO'
    )
    BEGIN
        RAISERROR('Operación denegada (RB-059): El pedido no puede cerrarse como COMPLETADO_EXITOSO mientras exista una confirmación de entrega con observaciones sin subsanar.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO
