-- ============================================================================
-- BASE DE DATOS: PoluxImportDB
-- MOTOR: Microsoft SQL Server 2022
-- FASE 0: NÚCLEO TRANSACCIONAL, ENTIDADES COMPARTIDAS Y CATÁLOGOS MAESTROS
-- VERSIÓN: 2.0.0 (AUDITADA Y CORREGIDA)
-- ============================================================================

IF DB_ID('PoluxImportDB') IS NULL
BEGIN
    CREATE DATABASE PoluxImportDB COLLATE Modern_Spanish_100_CI_AI_SC_UTF8;
END
GO

USE PoluxImportDB;
GO

-- Esquemas organizacionales
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'core')
    EXEC('CREATE SCHEMA core AUTHORIZATION dbo;');
GO
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'buyers')
    EXEC('CREATE SCHEMA buyers AUTHORIZATION dbo;');
GO
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'leads')
    EXEC('CREATE SCHEMA leads AUTHORIZATION dbo;');
GO
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'payers')
    EXEC('CREATE SCHEMA payers AUTHORIZATION dbo;');
GO
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'customers')
    EXEC('CREATE SCHEMA customers AUTHORIZATION dbo;');
GO
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'turned')
    EXEC('CREATE SCHEMA turned AUTHORIZATION dbo;');
GO

-- Secuencia para generación automática de Código de Cliente único de 6 dígitos
IF NOT EXISTS (SELECT * FROM sys.sequences WHERE name = 'seq_codigo_cliente' AND schema_id = SCHEMA_ID('core'))
BEGIN
    CREATE SEQUENCE core.seq_codigo_cliente
        AS INT
        START WITH 100001
        INCREMENT BY 1
        MINVALUE 100001
        MAXVALUE 999999;
END
GO

-- ----------------------------------------------------------------------------
-- 1. TABLA: core.persona
-- Reglas: RB-001 (Identidad única), RB-004 (Consentimiento y anonimización)
-- Tipos de documentos permitidos y validados:
--   - DNI: 8 dígitos numéricos
--   - CE: 12 dígitos numéricos
--   - PASAPORTE: 1 letra + 8 dígitos
--   - RUC: 11 dígitos numéricos
-- ----------------------------------------------------------------------------
IF OBJECT_ID('core.persona', 'U') IS NULL
BEGIN
    CREATE TABLE core.persona (
        id_persona              BIGINT IDENTITY(1,1) NOT NULL,
        codigo_cliente          CHAR(6) NULL,               -- Código correlativo de negocio (6 dígitos)
        tipo_documento          VARCHAR(10) NULL,           -- DNI, CE, PASAPORTE, RUC
        numero_documento        VARCHAR(20) NULL,
        nombres                 NVARCHAR(100) NOT NULL,
        apellidos               NVARCHAR(100) NULL,
        correo_electronico      NVARCHAR(150) NULL,
        telefono_movil          VARCHAR(25) NULL,
        ciudad                  NVARCHAR(80) NOT NULL DEFAULT 'Trujillo',
        pais                    NVARCHAR(50) NOT NULL DEFAULT 'Perú',
        rol_compra_principal    VARCHAR(30) NOT NULL DEFAULT 'USUARIO_FINAL', -- USUARIO_FINAL, DECISOR, PAGADOR, EMPRESA
        consentimiento_datos    BIT NOT NULL DEFAULT 0,
        fecha_consentimiento    DATETIME2(7) NULL,
        ip_consentimiento       VARCHAR(45) NULL,
        version_politica_privacidad VARCHAR(20) NULL DEFAULT 'v1.0',
        fecha_revocacion_consentimiento DATETIME2(7) NULL,
        motivo_revocacion       NVARCHAR(200) NULL,
        etapa_actual            VARCHAR(20) NOT NULL DEFAULT 'BUYER', -- BUYER, LEAD, PAYER, CUSTOMER, TURNED, INACTIVO
        estado_registro         VARCHAR(20) NOT NULL DEFAULT 'ACTIVO', -- ACTIVO, BLOQUEADO, RETIRADO
        fecha_creacion          DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        fecha_actualizacion     DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_core_persona PRIMARY KEY CLUSTERED (id_persona),
        CONSTRAINT CK_core_persona_tipo_doc CHECK (tipo_documento IN ('DNI', 'CE', 'PASAPORTE', 'RUC') OR tipo_documento IS NULL),
        CONSTRAINT CK_core_persona_doc_formato CHECK (
            (tipo_documento IS NULL AND numero_documento IS NULL) OR
            (tipo_documento = 'DNI' AND LEN(numero_documento) = 8 AND numero_documento NOT LIKE '%[^0-9]%') OR
            (tipo_documento = 'CE' AND LEN(numero_documento) = 12 AND numero_documento NOT LIKE '%[^0-9]%') OR
            (tipo_documento = 'PASAPORTE' AND LEN(numero_documento) = 9 AND SUBSTRING(numero_documento, 1, 1) LIKE '[A-Za-z]' AND SUBSTRING(numero_documento, 2, 8) NOT LIKE '%[^0-9]%') OR
            (tipo_documento = 'RUC' AND LEN(numero_documento) = 11 AND numero_documento NOT LIKE '%[^0-9]%')
        ),
        CONSTRAINT CK_core_persona_rol_compra CHECK (rol_compra_principal IN ('USUARIO_FINAL', 'DECISOR', 'PAGADOR', 'EMPRESA')),
        CONSTRAINT CK_core_persona_etapa CHECK (etapa_actual IN ('UNIVERSO', 'BUYER', 'LEADS', 'PAYER', 'CUSTOMER', 'TURNED', 'INACTIVO')),
        CONSTRAINT CK_core_persona_estado CHECK (estado_registro IN ('ACTIVO', 'BLOQUEADO', 'RETIRADO'))
    );

    -- Índice único estricto para documento oficial
    CREATE UNIQUE NONCLUSTERED INDEX UQ_core_persona_documento
    ON core.persona (tipo_documento, numero_documento)
    WHERE tipo_documento IS NOT NULL AND numero_documento IS NOT NULL;

    -- Índice único para código de cliente
    CREATE UNIQUE NONCLUSTERED INDEX UQ_core_persona_codigo_cliente
    ON core.persona (codigo_cliente)
    WHERE codigo_cliente IS NOT NULL;

    CREATE NONCLUSTERED INDEX IX_core_persona_contacto
    ON core.persona (correo_electronico, telefono_movil);

    CREATE NONCLUSTERED INDEX IX_core_persona_etapa
    ON core.persona (etapa_actual, estado_registro);
END
GO

-- ----------------------------------------------------------------------------
-- 2. TABLA: core.historial_etapa
-- Reglas: RB-002 (Trazabilidad inmutable de etapas)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('core.historial_etapa', 'U') IS NULL
BEGIN
    CREATE TABLE core.historial_etapa (
        id_historial_etapa      BIGINT IDENTITY(1,1) NOT NULL,
        id_persona              BIGINT NOT NULL,
        etapa_anterior          VARCHAR(20) NOT NULL,
        etapa_nueva             VARCHAR(20) NOT NULL,
        motivo_transicion       NVARCHAR(250) NOT NULL,
        senal_origen            NVARCHAR(150) NULL,
        id_entidad_referencia   BIGINT NULL,               -- ID de cotizacion, pago, pedido, etc.
        tipo_entidad_referencia VARCHAR(40) NULL,
        fecha_transicion        DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        registrado_por          VARCHAR(50) NOT NULL DEFAULT 'SYSTEM_AGENT',
        CONSTRAINT PK_core_historial_etapa PRIMARY KEY CLUSTERED (id_historial_etapa),
        CONSTRAINT FK_historial_etapa_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT CK_historial_etapa_ant CHECK (etapa_anterior IN ('UNIVERSO', 'BUYER', 'LEADS', 'PAYER', 'CUSTOMER', 'TURNED', 'INACTIVO')),
        CONSTRAINT CK_historial_etapa_nueva CHECK (etapa_nueva IN ('UNIVERSO', 'BUYER', 'LEADS', 'PAYER', 'CUSTOMER', 'TURNED', 'INACTIVO'))
    );

    CREATE NONCLUSTERED INDEX IX_historial_etapa_persona_fecha
    ON core.historial_etapa (id_persona, fecha_transicion DESC);
END
GO

-- Disparador de inmutabilidad estricta (RB-002): impide UPDATE o DELETE en el historial
CREATE OR ALTER TRIGGER core.TR_core_historial_etapa_inmutable
ON core.historial_etapa
FOR UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR('Operación denegada: El historial de etapas de Polux Import es un registro inmutable y de solo anexión (Append-Only).', 16, 1);
    ROLLBACK TRANSACTION;
END;
GO

-- ----------------------------------------------------------------------------
-- 3. TABLA: core.producto_catalogo
-- Catálogo oficial de productos Apple importables
-- ----------------------------------------------------------------------------
IF OBJECT_ID('core.producto_catalogo', 'U') IS NULL
BEGIN
    CREATE TABLE core.producto_catalogo (
        id_producto             INT IDENTITY(1,1) NOT NULL,
        sku_fabricante          VARCHAR(50) NOT NULL,
        categoria               VARCHAR(40) NOT NULL,       -- iPhone, AirPods, iPad, MacBook, Apple Watch, Accesorios
        linea_modelo            NVARCHAR(100) NOT NULL,     -- iPhone 15 Pro, MacBook Air M3, etc.
        capacidad_almacenamiento VARCHAR(20) NULL,          -- 128GB, 256GB, 512GB, 1TB
        color_oficial           NVARCHAR(50) NULL,
        precio_referencial_usd  DECIMAL(12,2) NOT NULL,
        precio_base_pen         DECIMAL(12,2) NOT NULL,
        estado_comercial        VARCHAR(20) NOT NULL DEFAULT 'VIGENTE', -- VIGENTE, DESCONTINUADO, AGOTADO_USA
        es_activo               BIT NOT NULL DEFAULT 1,
        fecha_creacion          DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_core_producto_catalogo PRIMARY KEY CLUSTERED (id_producto),
        CONSTRAINT UQ_core_producto_sku UNIQUE NONCLUSTERED (sku_fabricante),
        CONSTRAINT CK_core_producto_categoria CHECK (categoria IN ('iPhone', 'AirPods', 'iPad', 'MacBook', 'Apple Watch', 'Accesorios', 'Otro')),
        CONSTRAINT CK_core_producto_precio_usd CHECK (precio_referencial_usd > 0),
        CONSTRAINT CK_core_producto_precio_pen CHECK (precio_base_pen > 0),
        CONSTRAINT CK_core_producto_estado CHECK (estado_comercial IN ('VIGENTE', 'DESCONTINUADO', 'AGOTADO_USA'))
    );

    CREATE NONCLUSTERED INDEX IX_core_producto_categoria_modelo
    ON core.producto_catalogo (categoria, linea_modelo, estado_comercial);
END
GO

-- ----------------------------------------------------------------------------
-- 3.1. TABLA: core.inventario_trujillo
-- Reglas: RB-012 (Control de stock físico en sede principal Trujillo)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('core.inventario_trujillo', 'U') IS NULL
BEGIN
    CREATE TABLE core.inventario_trujillo (
        id_inventario           INT IDENTITY(1,1) NOT NULL,
        id_producto             INT NOT NULL,
        ubicacion_almacen       NVARCHAR(100) NOT NULL DEFAULT 'Almacén Principal Trujillo',
        stock_fisico            INT NOT NULL DEFAULT 0,
        stock_reservado         INT NOT NULL DEFAULT 0,
        stock_disponible        AS (stock_fisico - stock_reservado) PERSISTED,
        stock_minimo_alerta     INT NOT NULL DEFAULT 2,
        fecha_ultima_actualizacion DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_core_inventario PRIMARY KEY CLUSTERED (id_inventario),
        CONSTRAINT FK_inventario_producto FOREIGN KEY (id_producto)
            REFERENCES core.producto_catalogo (id_producto) ON DELETE NO ACTION,
        CONSTRAINT UQ_inventario_producto_ubicacion UNIQUE NONCLUSTERED (id_producto, ubicacion_almacen),
        CONSTRAINT CK_inventario_stock_fisico CHECK (stock_fisico >= 0),
        CONSTRAINT CK_inventario_stock_reservado CHECK (stock_reservado >= 0),
        CONSTRAINT CK_inventario_reserva_valida CHECK (stock_reservado <= stock_fisico)
    );

    CREATE NONCLUSTERED INDEX IX_inventario_producto_disponible
    ON core.inventario_trujillo (id_producto, stock_disponible);
END
GO

-- ----------------------------------------------------------------------------
-- 3.2. TABLA: core.configuracion_parametro
-- Centraliza los umbrales configurables requeridos por las reglas de negocio
-- ----------------------------------------------------------------------------
IF OBJECT_ID('core.configuracion_parametro', 'U') IS NULL
BEGIN
    CREATE TABLE core.configuracion_parametro (
        id_parametro            INT IDENTITY(1,1) NOT NULL,
        codigo_parametro        VARCHAR(60) NOT NULL,
        descripcion             NVARCHAR(250) NOT NULL,
        valor_numerico          DECIMAL(12,2) NULL,
        valor_texto             NVARCHAR(200) NULL,
        unidad_medida           VARCHAR(30) NOT NULL, -- HORAS, DIAS, PORCENTAJE, MONTO
        fecha_modificacion      DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_core_parametro PRIMARY KEY CLUSTERED (id_parametro),
        CONSTRAINT UQ_core_parametro_codigo UNIQUE NONCLUSTERED (codigo_parametro)
    );

    -- Valores iniciales configurables según reglas de negocio
    INSERT INTO core.configuracion_parametro (codigo_parametro, descripcion, valor_numerico, unidad_medida)
    VALUES 
    ('UMBRAL_ALERTA_FORMALIZACION_COTIZACION_HORAS', 'Plazo máx. para formalizar cotización aceptada antes de alerta', 24.00, 'HORAS'),
    ('UMBRAL_ALERTA_PAGO_INICIAL_HORAS', 'Plazo máx. para confirmar pago inicial de pedido formalizado antes de alerta', 48.00, 'HORAS'),
    ('UMBRAL_ALERTA_ACTIVACION_PEDIDO_HORAS', 'Plazo máx. para activar pedido tras pago inicial antes de alerta', 24.00, 'HORAS'),
    ('UMBRAL_INACTIVIDAD_LEAD_PERDIDO_DIAS', 'Días de inactividad de respuesta para considerar lead como perdido (1 semana)', 7.00, 'DIAS'),
    ('UMBRAL_FRECUENCIA_ACTUALIZACION_DIAS', 'Días máximos sin actualización de seguimiento al cliente', 4.00, 'DIAS'),
    ('UMBRAL_RESOLUCION_IMPREVISTOS_DIAS', 'Meta de resolución de imprevistos operativos en días calendario', 5.00, 'DIAS'),
    ('TIPO_CAMBIO_PREDETERMINADO_USD_PEN', 'Tipo de cambio referencial vigente al cotizar', 3.7500, 'MONTO');
END
GO

-- ----------------------------------------------------------------------------
-- 4. TABLA: core.agente_ia
-- Catálogo de Agentes de Inteligencia Artificial del Ecosistema Polux
-- ----------------------------------------------------------------------------
IF OBJECT_ID('core.agente_ia', 'U') IS NULL
BEGIN
    CREATE TABLE core.agente_ia (
        id_agente               SMALLINT IDENTITY(1,1) NOT NULL,
        codigo_agente           VARCHAR(30) NOT NULL,       -- AGT_MARKETING, AGT_FAQ, AGT_NEGOCIADOR, AGT_COBRANZA, AGT_SEGUIMIENTO, AGT_PLATAFORMA
        nombre_agente           NVARCHAR(80) NOT NULL,
        rol_operativo           NVARCHAR(200) NOT NULL,
        fase_principal          VARCHAR(20) NOT NULL,       -- BUYERS, LEADS, PAYERS, CUSTOMERS, PLATAFORMA
        requiere_aprobacion_humana BIT NOT NULL DEFAULT 0,
        es_activo               BIT NOT NULL DEFAULT 1,
        fecha_registro          DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_core_agente_ia PRIMARY KEY CLUSTERED (id_agente),
        CONSTRAINT UQ_core_agente_codigo UNIQUE NONCLUSTERED (codigo_agente),
        CONSTRAINT CK_core_agente_fase CHECK (fase_principal IN ('BUYERS', 'LEADS', 'PAYERS', 'CUSTOMERS', 'TURNED', 'PLATAFORMA'))
    );
END
GO

-- ----------------------------------------------------------------------------
-- 5. TABLA: core.accion_agente
-- Reglas: RB-003 (Auditoría de decisiones automatizadas de IA)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('core.accion_agente', 'U') IS NULL
BEGIN
    CREATE TABLE core.accion_agente (
        id_accion_agente        BIGINT IDENTITY(1,1) NOT NULL,
        id_agente               SMALLINT NOT NULL,
        id_persona              BIGINT NULL,
        tipo_accion             VARCHAR(50) NOT NULL,       -- RECOMENDACION_CONTENIDO, RESPUESTA_FAQ, PRIORIZACION_LEAD, VALIDACION_PAGO, NOTIFICACION_HITO, ALERTA_CUELLO_BOTELLA
        entidad_afectada        VARCHAR(50) NULL,           -- cotizacion, pago, pedido, etc.
        id_entidad_afectada     BIGINT NULL,
        decision_tomada         NVARCHAR(MAX) NOT NULL,
        datos_sustento_json     NVARCHAR(MAX) NULL,         -- JSON con variables de entrada analizadas
        nivel_confianza_ia      DECIMAL(5,2) NULL,          -- 0.00 a 100.00%
        requirio_aprobacion     BIT NOT NULL DEFAULT 0,
        aprobada_por_humano     BIT NULL,                   -- NULL: pendiente, 1: aprobada, 0: rechazada
        usuario_humano_aprobador NVARCHAR(100) NULL,
        resultado_ejecucion     VARCHAR(20) NOT NULL DEFAULT 'EXITOSO', -- EXITOSO, FALLIDO, DERIVADO, DESCARTADO
        mensaje_error           NVARCHAR(500) NULL,
        fecha_ejecucion         DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_core_accion_agente PRIMARY KEY CLUSTERED (id_accion_agente),
        CONSTRAINT FK_accion_agente_agente FOREIGN KEY (id_agente)
            REFERENCES core.agente_ia (id_agente) ON DELETE NO ACTION,
        CONSTRAINT FK_accion_agente_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT CK_accion_agente_confianza CHECK (nivel_confianza_ia BETWEEN 0 AND 100 OR nivel_confianza_ia IS NULL),
        CONSTRAINT CK_accion_agente_resultado CHECK (resultado_ejecucion IN ('EXITOSO', 'FALLIDO', 'DERIVADO', 'DESCARTADO'))
    );

    CREATE NONCLUSTERED INDEX IX_accion_agente_persona_fecha
    ON core.accion_agente (id_persona, fecha_ejecucion DESC);

    CREATE NONCLUSTERED INDEX IX_accion_agente_agente_tipo
    ON core.accion_agente (id_agente, tipo_accion, fecha_ejecucion DESC);
END
GO

-- ----------------------------------------------------------------------------
-- 6. TABLA: core.alerta_operativa
-- Sistema centralizado de alertas de impulsamiento para responsables y agentes
-- ----------------------------------------------------------------------------
IF OBJECT_ID('core.alerta_operativa', 'U') IS NULL
BEGIN
    CREATE TABLE core.alerta_operativa (
        id_alerta               BIGINT IDENTITY(1,1) NOT NULL,
        fase                    VARCHAR(20) NOT NULL,       -- BUYERS, LEADS, PAYERS, CUSTOMERS, TURNED
        codigo_tipo_alerta      VARCHAR(50) NOT NULL,       -- COTIZACION_SIN_FORMALIZAR_24H, PAGO_INICIAL_PENDIENTE_48H, ACTIVACION_PENDIENTE_24H, CLIENTE_SIN_ACTUALIZACION, IMPREVISTO_SIN_RESOLVER
        id_persona              BIGINT NULL,
        id_entidad_referencia   BIGINT NULL,
        tipo_entidad_referencia VARCHAR(40) NULL,
        accion_recomendada      NVARCHAR(300) NOT NULL,
        rol_responsable         VARCHAR(50) NOT NULL,       -- COMERCIAL, COBRANZA, OPERACIONES, LOGISTICA, AGENTE_IA
        estado_alerta           VARCHAR(20) NOT NULL DEFAULT 'ACTIVA', -- ACTIVA, EN_ATENCION, RESUELTA, EXPIRADA
        fecha_generacion        DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        fecha_resolucion        DATETIME2(7) NULL,
        usuario_resolutor       NVARCHAR(100) NULL,
        CONSTRAINT PK_core_alerta_operativa PRIMARY KEY CLUSTERED (id_alerta),
        CONSTRAINT FK_alerta_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT CK_alerta_fase CHECK (fase IN ('BUYERS', 'LEADS', 'PAYERS', 'CUSTOMERS', 'TURNED')),
        CONSTRAINT CK_alerta_estado CHECK (estado_alerta IN ('ACTIVA', 'EN_ATENCION', 'RESUELTA', 'EXPIRADA'))
    );

    CREATE NONCLUSTERED INDEX IX_alerta_estado_fase
    ON core.alerta_operativa (estado_alerta, fase, fecha_generacion DESC);
END
GO

-- ----------------------------------------------------------------------------
-- 7. PROCEDIMIENTO ALMACENADO: core.sp_anonimizar_persona
-- Reglas: RB-004 (Cumplimiento de revocación de consentimiento de datos)
-- ----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE core.sp_anonimizar_persona
    @id_persona BIGINT,
    @motivo_revocacion NVARCHAR(200) = 'Solicitud formal de retiro de consentimiento de datos'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM core.persona WHERE id_persona = @id_persona)
        BEGIN
            RAISERROR('La persona especificada no existe en la base de datos.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        UPDATE core.persona
        SET nombres = 'ANONIMIZADO',
            apellidos = 'ANONIMIZADO',
            correo_electronico = 'anonimo_' + CAST(id_persona AS VARCHAR(20)) + '@polux.invalid',
            telefono_movil = NULL,
            numero_documento = NULL,
            tipo_documento = NULL,
            consentimiento_datos = 0,
            fecha_revocacion_consentimiento = SYSDATETIME(),
            motivo_revocacion = @motivo_revocacion,
            estado_registro = 'RETIRADO',
            fecha_actualizacion = SYSDATETIME()
        WHERE id_persona = @id_persona;

        INSERT INTO core.historial_etapa (
            id_persona, etapa_anterior, etapa_nueva, motivo_transicion, senal_origen, registrado_por
        )
        SELECT id_persona, etapa_actual, 'INACTIVO', 'Anonimización de datos personales por retiro de consentimiento', 'DERECHO_ARCO', 'SISTEMA_COMPLIANCE'
        FROM core.persona WHERE id_persona = @id_persona;

        UPDATE core.persona SET etapa_actual = 'INACTIVO' WHERE id_persona = @id_persona;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
