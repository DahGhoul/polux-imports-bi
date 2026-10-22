-- ============================================================================
-- BASE DE DATOS: PoluxImportDB
-- MOTOR: Microsoft SQL Server 2022
-- FASE 5: TURNED (POSTVENTA, FIDELIZACIÓN, NPS Y PROGRAMA DE REFERIDOS)
-- VERSIÓN: 2.0.0 (AUDITADA Y CORREGIDA)
-- ============================================================================

USE PoluxImportDB;
GO

-- ----------------------------------------------------------------------------
-- 1. TABLA: turned.turned
-- Reglas: RB-014 (Transición Customer -> Turned: NPS 9-10, referido, recompra 90d)
-- Extensión 1:1 de persona para gestión de fidelización activa
-- Cuando un cliente Turned realiza una recompra, permanece en estado TURNED
-- registrando la transacción en pedidos/pagos sin reiniciar el embudo.
-- ----------------------------------------------------------------------------
IF OBJECT_ID('turned.turned', 'U') IS NULL
BEGIN
    CREATE TABLE turned.turned (
        id_persona             BIGINT NOT NULL,
        fecha_ingreso_turned   DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        criterio_transicion    VARCHAR(40) NOT NULL,        -- NPS_PROMOTOR, REFERIDO_EFECTIVO, RECOMPRA_90_DIAS
        score_nps_inicial      TINYINT NULL,
        total_referidos_efectivos INT NOT NULL DEFAULT 0,
        total_recompras_90d    INT NOT NULL DEFAULT 0,
        fecha_ultima_recompra  DATETIME2(7) NULL,
        estado_fidelizacion    VARCHAR(20) NOT NULL DEFAULT 'ACTIVO', -- ACTIVO, PROMOTOR_DESTACADO, INACTIVO
        CONSTRAINT PK_turned_turned PRIMARY KEY CLUSTERED (id_persona),
        CONSTRAINT FK_turned_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT CK_turned_criterio CHECK (criterio_transicion IN ('NPS_PROMOTOR', 'REFERIDO_EFECTIVO', 'RECOMPRA_90_DIAS', 'COMBINADO')),
        CONSTRAINT CK_turned_nps CHECK (score_nps_inicial BETWEEN 0 AND 10 OR score_nps_inicial IS NULL),
        CONSTRAINT CK_turned_estado CHECK (estado_fidelizacion IN ('ACTIVO', 'PROMOTOR_DESTACADO', 'INACTIVO'))
    );
END
GO

-- ----------------------------------------------------------------------------
-- 2. TABLA: turned.encuesta_satisfaccion
-- Reglas: RB-060 (Registro de NPS, CSAT y FCR)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('turned.encuesta_satisfaccion', 'U') IS NULL
BEGIN
    CREATE TABLE turned.encuesta_satisfaccion (
        id_encuesta            BIGINT IDENTITY(1,1) NOT NULL,
        id_persona             BIGINT NOT NULL,
        id_pedido              BIGINT NOT NULL,
        tipo_encuesta          VARCHAR(30) NOT NULL DEFAULT 'POST_ENTREGA', -- POST_ENTREGA, PERIODICA_POSTVENTA
        puntaje_nps            TINYINT NOT NULL,            -- 0 a 10 (0-6 Detractor, 7-8 Pasivo, 9-10 Promotor)
        puntaje_csat           TINYINT NOT NULL,            -- 1 a 5 (Muy insatisfecho a Muy satisfecho)
        resolucion_primer_contacto_fcr BIT NOT NULL DEFAULT 1,
        comentario_cliente     NVARCHAR(MAX) NULL,
        fecha_envio            DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        fecha_respuesta        DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_turned_encuesta PRIMARY KEY CLUSTERED (id_encuesta),
        CONSTRAINT FK_encuesta_persona FOREIGN KEY (id_persona)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT FK_encuesta_pedido FOREIGN KEY (id_pedido)
            REFERENCES customers.pedido (id_pedido) ON DELETE NO ACTION,
        CONSTRAINT CK_encuesta_nps CHECK (puntaje_nps BETWEEN 0 AND 10),
        CONSTRAINT CK_encuesta_csat CHECK (puntaje_csat BETWEEN 1 AND 5)
    );

    CREATE NONCLUSTERED INDEX IX_encuesta_nps
    ON turned.encuesta_satisfaccion (puntaje_nps, fecha_respuesta);
END
GO

-- ----------------------------------------------------------------------------
-- 3. TABLA: turned.referido
-- Trazabilidad de contactos referidos por clientes existentes y su conversión
-- Regla de Negocio: Si el referido ya existía como Buyer, la compra efectiva
-- se atribuye al promotor y se le recompensa conforme a la regla de negocio.
-- ----------------------------------------------------------------------------
IF OBJECT_ID('turned.referido', 'U') IS NULL
BEGIN
    CREATE TABLE turned.referido (
        id_referido            BIGINT IDENTITY(1,1) NOT NULL,
        id_persona_promotor    BIGINT NOT NULL,
        id_persona_referida    BIGINT NOT NULL,
        codigo_enlace_referido VARCHAR(50) NULL,
        estado_referido        VARCHAR(30) NOT NULL DEFAULT 'REGISTRADO',
        -- Estados: REGISTRADO, CONTACTADO, COTIZADO, COMPRA_EFECTIVA, DESCARTADO
        id_pedido_generado     BIGINT NULL,
        fecha_registro         DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        fecha_conversion       DATETIME2(7) NULL,
        recompensa_entregada   NVARCHAR(150) NULL,          -- Bono de descuento, accesorio gratis, etc.
        CONSTRAINT PK_turned_referido PRIMARY KEY CLUSTERED (id_referido),
        CONSTRAINT FK_referido_promotor FOREIGN KEY (id_persona_promotor)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT FK_referido_destinatario FOREIGN KEY (id_persona_referida)
            REFERENCES core.persona (id_persona) ON DELETE NO ACTION,
        CONSTRAINT FK_referido_pedido FOREIGN KEY (id_pedido_generado)
            REFERENCES customers.pedido (id_pedido) ON DELETE NO ACTION,
        CONSTRAINT UQ_referido_par UNIQUE NONCLUSTERED (id_persona_promotor, id_persona_referida),
        CONSTRAINT CK_referido_estado CHECK (estado_referido IN ('REGISTRADO', 'CONTACTADO', 'COTIZADO', 'COMPRA_EFECTIVA', 'DESCARTADO'))
    );

    CREATE NONCLUSTERED INDEX IX_referido_promotor_estado
    ON turned.referido (id_persona_promotor, estado_referido);
END
GO

-- ----------------------------------------------------------------------------
-- 4. PROCEDIMIENTO ALMACENADO: turned.sp_registrar_recompra_turned
-- Reglas: RB-014 (Recompra en Turned sin reiniciar el ciclo de la persona)
-- ----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE turned.sp_registrar_recompra_turned
    @id_persona BIGINT,
    @id_pedido BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM turned.turned WHERE id_persona = @id_persona)
        BEGIN
            RAISERROR('La persona no se encuentra registrada en la fase Turned.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Actualiza métricas de fidelización y recompra en turned.turned
        UPDATE turned.turned
        SET total_recompras_90d = total_recompras_90d + 1,
            fecha_ultima_recompra = SYSDATETIME(),
            estado_fidelizacion = 'PROMOTOR_DESTACADO'
        WHERE id_persona = @id_persona;

        -- Actualiza contador en customer
        UPDATE customers.customer
        SET total_pedidos_historicos = total_pedidos_historicos + 1
        WHERE id_persona = @id_persona;

        -- Registra evento en el historial sin alterar la etapa 'TURNED'
        INSERT INTO core.historial_etapa (
            id_persona, etapa_anterior, etapa_nueva, motivo_transicion, senal_origen, id_entidad_referencia, tipo_entidad_referencia, registrado_por
        )
        VALUES (
            @id_persona, 'TURNED', 'TURNED', 'Recompra recurrente de cliente fidelizado', 'NUEVA_COMPRA', @id_pedido, 'pedido', 'SISTEMA_FIDELIZACION'
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- ----------------------------------------------------------------------------
-- 5. PROCEDIMIENTO ALMACENADO: turned.sp_consolidar_referido_efectivo
-- Reglas: Atribución al promotor y entrega de recompensa tras compra efectiva
-- ----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE turned.sp_consolidar_referido_efectivo
    @id_persona_promotor BIGINT,
    @id_persona_referida BIGINT,
    @id_pedido BIGINT,
    @recompensa NVARCHAR(150) = 'Cupón 10% de descuento en accesorios oficiales'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE turned.referido
        SET estado_referido = 'COMPRA_EFECTIVA',
            id_pedido_generado = @id_pedido,
            fecha_conversion = SYSDATETIME(),
            recompensa_entregada = @recompensa
        WHERE id_persona_promotor = @id_persona_promotor
          AND id_persona_referida = @id_persona_referida;

        -- Incrementa contador de referidos efectivos del promotor
        UPDATE turned.turned
        SET total_referidos_efectivos = total_referidos_efectivos + 1,
            estado_fidelizacion = 'PROMOTOR_DESTACADO'
        WHERE id_persona = @id_persona_promotor;

        -- Genera alerta operativa para entrega formal del beneficio
        INSERT INTO core.alerta_operativa (
            fase, codigo_tipo_alerta, id_persona, id_entidad_referencia, tipo_entidad_referencia, accion_recomendada, rol_responsable
        )
        VALUES (
            'TURNED', 'RECOMPENSA_REFERIDO_EFECTIVO', @id_persona_promotor, @id_pedido, 'referido', 'Entregar recompensa de referido al cliente promotor', 'COMERCIAL'
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
