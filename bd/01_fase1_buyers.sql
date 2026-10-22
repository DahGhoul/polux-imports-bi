-- ============================================================================
-- BASE DE DATOS: PoluxImportDB
-- MOTOR: Microsoft SQL Server 2022
-- FASE 1: BUYERS (CAPTACIÓN DIGITAL, ATENCIÓN Y CONVERSIÓN INICIAL)
-- VERSIÓN: 1.0.0
-- ============================================================================

USE PoluxImportDB;
GO

-- ----------------------------------------------------------------------------
-- 1. TABLA: buyers.campana_marketing
-- Reglas: RN-022 (Campañas y publicaciones)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('buyers.campana_marketing', 'U') IS NULL
BEGIN
    CREATE TABLE buyers.campana_marketing (
        id_campana             INT IDENTITY(1,1) NOT NULL,
        codigo_campana         VARCHAR(50) NOT NULL,
        nombre_campana         NVARCHAR(150) NOT NULL,
        canal_publicitario     VARCHAR(40) NOT NULL,        -- TikTok, Instagram, Meta Ads, Google Ads
        audiencia_objetivo     NVARCHAR(200) NOT NULL,     -- La Libertad, Trujillo, Jóvenes 22-35, NSE A/B
        presupuesto_total_pen  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        fecha_inicio           DATE NOT NULL,
        fecha_fin              DATE NULL,
        estado_campana         VARCHAR(20) NOT NULL DEFAULT 'ACTIVA', -- PLANIFICADA, ACTIVA, PAUSADA, FINALIZADA
        fecha_creacion         DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_buyers_campana PRIMARY KEY CLUSTERED (id_campana),
        CONSTRAINT UQ_buyers_campana_codigo UNIQUE NONCLUSTERED (codigo_campana),
        CONSTRAINT CK_buyers_campana_canal CHECK (canal_publicitario IN ('TikTok', 'Instagram', 'Meta Ads', 'Google Ads', 'Organico', 'Otro')),
        CONSTRAINT CK_buyers_campana_estado CHECK (estado_campana IN ('PLANIFICADA', 'ACTIVA', 'PAUSADA', 'FINALIZADA'))
    );
END
GO

-- ----------------------------------------------------------------------------
-- 2. TABLA: buyers.publicacion
-- Representa piezas de contenido creadas en redes sociales
-- ----------------------------------------------------------------------------
IF OBJECT_ID('buyers.publicacion', 'U') IS NULL
BEGIN
    CREATE TABLE buyers.publicacion (
        id_publicacion         BIGINT IDENTITY(1,1) NOT NULL,
        id_campana             INT NOT NULL,
        codigo_publicacion     VARCHAR(60) NOT NULL,
        formato_contenido      VARCHAR(30) NOT NULL,        -- VIDEO_REEL, VIDEO_TIKTOK, CARRUSEL, IMAGEN, STORY
        tema_contenido         NVARCHAR(150) NOT NULL,     -- Lanzamiento iPhone 15, Comparativa AirPods Pro vs Max, etc.
        id_producto_destacado  INT NULL,
        url_publicacion        NVARCHAR(300) NULL,
        fecha_publicacion      DATETIME2(7) NOT NULL,
        estado_publicacion     VARCHAR(20) NOT NULL DEFAULT 'PUBLICADA',
        CONSTRAINT PK_buyers_publicacion PRIMARY KEY CLUSTERED (id_publicacion),
        CONSTRAINT UQ_buyers_publicacion_codigo UNIQUE NONCLUSTERED (codigo_publicacion),
        CONSTRAINT FK_publicacion_campana FOREIGN KEY (id_campana)
            REFERENCES buyers.campana_marketing (id_campana) ON DELETE NO ACTION,
        CONSTRAINT FK_publicacion_producto FOREIGN KEY (id_producto_destacado)
            REFERENCES core.producto_catalogo (id_producto) ON DELETE NO ACTION,
        CONSTRAINT CK_publicacion_formato CHECK (formato_contenido IN ('VIDEO_REEL', 'VIDEO_TIKTOK', 'CARRUSEL', 'IMAGEN', 'STORY', 'POST'))
    );

    CREATE NONCLUSTERED INDEX IX_publicacion_campana
    ON buyers.publicacion (id_campana, fecha_publicacion);
END
GO

-- ----------------------------------------------------------------------------
-- 3. TABLA: buyers.publicacion_metrica
-- Reglas: RN-022, KPI-BUY-01 (Tasa de Interacción con Contenido)
-- Registra cortes históricos de métricas para evitar sobrescritura.
-- ----------------------------------------------------------------------------
IF OBJECT_ID('buyers.publicacion_metrica', 'U') IS NULL
BEGIN
    CREATE TABLE buyers.publicacion_metrica (
        id_metrica             BIGINT IDENTITY(1,1) NOT NULL,
        id_publicacion         BIGINT NOT NULL,
        fecha_corte            DATE NOT NULL,
        alcance_personas       INT NOT NULL DEFAULT 0,
        impresiones            INT NOT NULL DEFAULT 0,
        reproducciones_video   INT NOT NULL DEFAULT 0,
        me_gusta               INT NOT NULL DEFAULT 0,
        comentarios            INT NOT NULL DEFAULT 0,
        compartidos            INT NOT NULL DEFAULT 0,
        guardados              INT NOT NULL DEFAULT 0,
        clics_enlace           INT NOT NULL DEFAULT 0,
        gasto_corte_pen        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        fecha_registro         DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_buyers_publicacion_metrica PRIMARY KEY CLUSTERED (id_metrica),
        CONSTRAINT FK_metrica_publicacion FOREIGN KEY (id_publicacion)
            REFERENCES buyers.publicacion (id_publicacion) ON DELETE NO ACTION,
        CONSTRAINT UQ_metrica_publicacion_corte UNIQUE NONCLUSTERED (id_publicacion, fecha_corte),
        CONSTRAINT CK_metrica_alcance CHECK (alcance_personas >= 0)
    );

    CREATE NONCLUSTERED INDEX IX_metrica_corte
    ON buyers.publicacion_metrica (fecha_corte, id_publicacion);
END
GO

-- ----------------------------------------------------------------------------
-- 4. TABLA: buyers.faq_conocimiento
-- Reglas: RN-026 (Base de conocimiento aprobada para el Agente FAQ)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('buyers.faq_conocimiento', 'U') IS NULL
BEGIN
    CREATE TABLE buyers.faq_conocimiento (
        id_faq                 INT IDENTITY(1,1) NOT NULL,
        codigo_faq             VARCHAR(40) NOT NULL,
        tema                   VARCHAR(50) NOT NULL,        -- AUTENTICIDAD, TIEMPOS_IMPORTACION, GARANTIA, PAGOS, PROCESO
        categoria_producto     VARCHAR(40) NULL,
        pregunta_frecuente     NVARCHAR(300) NOT NULL,
        respuesta_aprobada     NVARCHAR(MAX) NOT NULL,
        version_faq            INT NOT NULL DEFAULT 1,
        estado_aprobacion      VARCHAR(20) NOT NULL DEFAULT 'APROBADO', -- BORRADOR, APROBADO, OBSOLETO
        aprobado_por_usuario   NVARCHAR(100) NOT NULL DEFAULT 'ADMIN_COMERCIAL',
        fecha_aprobacion       DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        fecha_vigencia_hasta   DATETIME2(7) NULL,
        es_activo              BIT NOT NULL DEFAULT 1,
        CONSTRAINT PK_buyers_faq PRIMARY KEY CLUSTERED (id_faq),
        CONSTRAINT UQ_buyers_faq_codigo UNIQUE NONCLUSTERED (codigo_faq),
        CONSTRAINT CK_buyers_faq_estado CHECK (estado_aprobacion IN ('BORRADOR', 'APROBADO', 'OBSOLETO'))
    );

    CREATE NONCLUSTERED INDEX IX_faq_tema_estado
    ON buyers.faq_conocimiento (tema, estado_aprobacion, es_activo);
END
GO

-- ----------------------------------------------------------------------------
-- 5. TABLA: buyers.evento_web
-- Reglas: RN-023 (Eventos web y visitas a landing pages)
-- Permite calcular el denominador de KPI-BUY-02 (Visitantes de landing page)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('buyers.evento_web', 'U') IS NULL
BEGIN
    CREATE TABLE buyers.evento_web (
        id_evento_web          BIGINT IDENTITY(1,1) NOT NULL,
        identificador_visitante VARCHAR(100) NOT NULL,      -- Cookie o Session UUID
        id_persona             BIGINT NULL,                 -- Se actualiza cuando el usuario se identifica
        tipo_evento            VARCHAR(40) NOT NULL,        -- VISITA_LANDING, VISTA_MODELO, CLIC_CTA, CLIC_WHATSAPP, INICIO_FORMULARIO
        canal_origen           VARCHAR(50) NULL,            -- TikTok, Instagram, Directo, Google
        id_publicacion         BIGINT NULL,
        utm_source             NVARCHAR(100) NULL,
        utm_campaign           NVARCHAR(100) NULL,
        url_pagina             NVARCHAR(300) NOT NULL,
        id_producto            INT NULL,
        tipo_dispositivo       VARCHAR(30) NULL,            -- MOVIL, DESKTOP, TABLET
        fecha_evento           DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_buyers_evento_web PRIMARY KEY CLUSTERED (id_evento_web),
        CONSTRAINT FK_evento_web_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT FK_evento_web_publicacion FOREIGN KEY (id_publicacion)
            REFERENCES buyers.publicacion (id_publicacion) ON DELETE NO ACTION,
        CONSTRAINT FK_evento_web_producto FOREIGN KEY (id_producto)
            REFERENCES core.producto_catalogo (id_producto) ON DELETE NO ACTION,
        CONSTRAINT CK_evento_web_tipo CHECK (tipo_evento IN ('VISITA_LANDING', 'VISTA_MODELO', 'CLIC_CTA', 'CLIC_WHATSAPP', 'INICIO_FORMULARIO', 'OTRO'))
    );

    CREATE NONCLUSTERED INDEX IX_evento_web_visitante_fecha
    ON buyers.evento_web (identificador_visitante, fecha_evento);

    CREATE NONCLUSTERED INDEX IX_evento_web_tipo_fecha
    ON buyers.evento_web (tipo_evento, fecha_evento);
END
GO

-- ----------------------------------------------------------------------------
-- 6. TABLA: buyers.envio_formulario
-- Reglas: RN-010 (Universo -> Buyer), RN-024 (Envíos clasificados), KPI-BUY-02
-- ----------------------------------------------------------------------------
IF OBJECT_ID('buyers.envio_formulario', 'U') IS NULL
BEGIN
    CREATE TABLE buyers.envio_formulario (
        id_envio_formulario    BIGINT IDENTITY(1,1) NOT NULL,
        id_evento_web          BIGINT NULL,
        identificador_visitante VARCHAR(100) NULL,
        canal_origen           VARCHAR(40) NOT NULL DEFAULT 'LANDING_PAGE',
        nombres                NVARCHAR(100) NOT NULL,
        apellidos              NVARCHAR(100) NULL,
        correo_electronico     NVARCHAR(150) NOT NULL,
        telefono_movil         VARCHAR(25) NOT NULL,
        categoria_interes      VARCHAR(40) NULL,
        id_producto_interes    INT NULL,
        mensaje_usuario        NVARCHAR(500) NULL,
        datos_enviados_json    NVARCHAR(MAX) NULL,
        clasificacion_envio    VARCHAR(20) NOT NULL DEFAULT 'VALIDO', -- VALIDO, DUPLICADO, RECHAZADO
        motivo_clasificacion   NVARCHAR(200) NULL,
        id_persona             BIGINT NULL,                 -- Persona creada o asociada
        fecha_envio            DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_buyers_envio_formulario PRIMARY KEY CLUSTERED (id_envio_formulario),
        CONSTRAINT FK_envio_evento FOREIGN KEY (id_evento_web)
            REFERENCES buyers.evento_web (id_evento_web) ON DELETE NO ACTION,
        CONSTRAINT FK_envio_producto FOREIGN KEY (id_producto_interes)
            REFERENCES core.producto_catalogo (id_producto) ON DELETE NO ACTION,
        CONSTRAINT FK_envio_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT CK_envio_clasificacion CHECK (clasificacion_envio IN ('VALIDO', 'DUPLICADO', 'RECHAZADO'))
    );

    CREATE NONCLUSTERED INDEX IX_envio_contacto
    ON buyers.envio_formulario (correo_electronico, telefono_movil, clasificacion_envio);

    CREATE NONCLUSTERED INDEX IX_envio_clasificacion_fecha
    ON buyers.envio_formulario (clasificacion_envio, fecha_envio);
END
GO

-- ----------------------------------------------------------------------------
-- 7. TABLA: buyers.conversacion
-- Hilo de comunicación de mensajería con la persona
-- ----------------------------------------------------------------------------
IF OBJECT_ID('buyers.conversacion', 'U') IS NULL
BEGIN
    CREATE TABLE buyers.conversacion (
        id_conversacion        BIGINT IDENTITY(1,1) NOT NULL,
        id_persona             BIGINT NOT NULL,
        canal_comunicacion     VARCHAR(30) NOT NULL,        -- WHATSAPP, INSTAGRAM_DM, TIKTOK_DM, WEBCHAT
        identificador_externo_chat VARCHAR(100) NULL,       -- ID chat en WhatsApp/Twilio
        estado_conversacion    VARCHAR(20) NOT NULL DEFAULT 'ABIERTA', -- ABIERTA, CERRADA, DERIVADA_HUMANO
        fecha_inicio           DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        fecha_cierre           DATETIME2(7) NULL,
        CONSTRAINT PK_buyers_conversacion PRIMARY KEY CLUSTERED (id_conversacion),
        CONSTRAINT FK_conversacion_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT CK_conversacion_canal CHECK (canal_comunicacion IN ('WHATSAPP', 'INSTAGRAM_DM', 'TIKTOK_DM', 'WEBCHAT', 'CORREO')),
        CONSTRAINT CK_conversacion_estado CHECK (estado_conversacion IN ('ABIERTA', 'CERRADA', 'DERIVADA_HUMANO'))
    );

    CREATE NONCLUSTERED INDEX IX_conversacion_persona
    ON buyers.conversacion (id_persona, estado_conversacion);
END
GO

-- ----------------------------------------------------------------------------
-- 8. TABLA: buyers.consulta
-- Reglas: RN-025, RN-026, KPI-BUY-03 (Tasa de Resolución Automática)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('buyers.consulta', 'U') IS NULL
BEGIN
    CREATE TABLE buyers.consulta (
        id_consulta            BIGINT IDENTITY(1,1) NOT NULL,
        id_conversacion        BIGINT NOT NULL,
        id_agente              SMALLINT NULL,               -- Agente FAQ
        id_faq                 INT NULL,                    -- FAQ oficial utilizada
        tema_consulta          VARCHAR(50) NOT NULL,        -- AUTENTICIDAD, TIEMPO_ENTREGA, GARANTIA, PRECIO, METODO_PAGO
        id_producto            INT NULL,
        texto_pregunta         NVARCHAR(MAX) NOT NULL,
        texto_respuesta        NVARCHAR(MAX) NULL,
        resuelta_por_ia        BIT NOT NULL DEFAULT 0,
        derivada_a_humano      BIT NOT NULL DEFAULT 0,
        motivo_derivacion      NVARCHAR(200) NULL,
        nivel_confianza        DECIMAL(5,2) NULL,
        calificacion_usuario   TINYINT NULL,                -- 1 a 5 estrellas
        fecha_consulta         DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_buyers_consulta PRIMARY KEY CLUSTERED (id_consulta),
        CONSTRAINT FK_consulta_conversacion FOREIGN KEY (id_conversacion)
            REFERENCES buyers.conversacion (id_conversacion) ON DELETE CASCADE,
        CONSTRAINT FK_consulta_agente FOREIGN KEY (id_agente)
            REFERENCES core.agente_ia (id_agente) ON DELETE NO ACTION,
        CONSTRAINT FK_consulta_faq FOREIGN KEY (id_faq)
            REFERENCES buyers.faq_conocimiento (id_faq) ON DELETE NO ACTION,
        CONSTRAINT FK_consulta_producto FOREIGN KEY (id_producto)
            REFERENCES core.producto_catalogo (id_producto) ON DELETE NO ACTION,
        CONSTRAINT CK_consulta_calificacion CHECK (calificacion_usuario BETWEEN 1 AND 5 OR calificacion_usuario IS NULL)
    );

    CREATE NONCLUSTERED INDEX IX_consulta_resolucion_fecha
    ON buyers.consulta (resuelta_por_ia, derivada_a_humano, fecha_consulta);
END
GO
