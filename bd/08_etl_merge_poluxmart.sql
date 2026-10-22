/* ============================================================================
   PROYECTO: POLUX IMPORT — Ecosistema BI & Agentes IA (Trujillo, Perú)
   MOTOR:    Microsoft SQL Server 2019 / 2022 (T-SQL)
   ARCHIVO:  08_etl_merge_poluxmart.sql
   METODOLOGÍA:
     Dr. Ricardo Mendoza Rivera ("rimenri") — Inteligencia de Negocios / Sistemas
     de Soporte a Decisiones (UNT).
   PROPÓSITO:
     1. Crear la vista consolidada de fechas `dbo.v_DatosDimTiempo` en `PoluxImportDB`
        con `SELECT DISTINCT Anual = YEAR(...), Semestre = ..., Trimestre = ...,
        Mes = DATENAME(MM, ...), DiaSemana = DATENAME(dw, ...), idFecha = CAST(... AS DATE)`
        usando `UNION` entre las tablas transaccionales del embudo.
     2. Poblar las 10 Dimensiones Conformadas de `PoluxImportMart` usando
        estrictamente la sentencia `MERGE [PoluxImportMart].[dbo].[Dim...] AS dim
        USING (...) AS oltp ON ... WHEN NOT MATCHED THEN INSERT (...) VALUES (...);`.
     3. Poblar las 6 Tablas de Hechos de `PoluxImportMart` usando `MERGE` cruzando
        las tablas transaccionales de `PoluxImportDB` con las dimensiones del
        Data Mart a través de sus llaves de negocio (`idFecha`, `idPersona`,
        `idProducto`, `idCampana`, `idPlazo`, `idValor`, etc.).
     4. Crear Procedimientos Almacenados de Consulta de Indicadores (KPIs) y
        Análisis Dimensional equivalentes a los de las sesiones prácticas del docente.
   ============================================================================ */

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

USE PoluxImportDB;
GO

PRINT '=== 1. CREANDO VISTA v_DatosDimTiempo EN POLUXIMPORTDB (PATRON DEL DOCENTE) ===';
GO

CREATE OR ALTER VIEW dbo.v_DatosDimTiempo
AS
    SELECT DISTINCT
        Anual     = YEAR(fecha_evento),
        Semestre  = DATENAME(YY, fecha_evento) + '-S' + IIF(DATENAME(qq, fecha_evento) < 3, '1', '2'),
        Trimestre = DATENAME(YY, fecha_evento) + '-T' + DATENAME(qq, fecha_evento),
        Mes       = DATENAME(MM, fecha_evento),
        DiaSemana = DATENAME(dw, fecha_evento),
        idFecha   = CAST(fecha_evento AS DATE)
    FROM buyers.evento_web
    UNION
    SELECT DISTINCT
        Anual     = YEAR(fecha_consulta),
        Semestre  = DATENAME(YY, fecha_consulta) + '-S' + IIF(DATENAME(qq, fecha_consulta) < 3, '1', '2'),
        Trimestre = DATENAME(YY, fecha_consulta) + '-T' + DATENAME(qq, fecha_consulta),
        Mes       = DATENAME(MM, fecha_consulta),
        DiaSemana = DATENAME(dw, fecha_consulta),
        idFecha   = CAST(fecha_consulta AS DATE)
    FROM buyers.consulta
    UNION
    SELECT DISTINCT
        Anual     = YEAR(fecha_emision),
        Semestre  = DATENAME(YY, fecha_emision) + '-S' + IIF(DATENAME(qq, fecha_emision) < 3, '1', '2'),
        Trimestre = DATENAME(YY, fecha_emision) + '-T' + DATENAME(qq, fecha_emision),
        Mes       = DATENAME(MM, fecha_emision),
        DiaSemana = DATENAME(dw, fecha_emision),
        idFecha   = CAST(fecha_emision AS DATE)
    FROM leads.cotizacion
    UNION
    SELECT DISTINCT
        Anual     = YEAR(fecha_transaccion),
        Semestre  = DATENAME(YY, fecha_transaccion) + '-S' + IIF(DATENAME(qq, fecha_transaccion) < 3, '1', '2'),
        Trimestre = DATENAME(YY, fecha_transaccion) + '-T' + DATENAME(qq, fecha_transaccion),
        Mes       = DATENAME(MM, fecha_transaccion),
        DiaSemana = DATENAME(dw, fecha_transaccion),
        idFecha   = CAST(fecha_transaccion AS DATE)
    FROM payers.pago
    UNION
    SELECT DISTINCT
        Anual     = YEAR(fecha_activacion),
        Semestre  = DATENAME(YY, fecha_activacion) + '-S' + IIF(DATENAME(qq, fecha_activacion) < 3, '1', '2'),
        Trimestre = DATENAME(YY, fecha_activacion) + '-T' + DATENAME(qq, fecha_activacion),
        Mes       = DATENAME(MM, fecha_activacion),
        DiaSemana = DATENAME(dw, fecha_activacion),
        idFecha   = CAST(fecha_activacion AS DATE)
    FROM customers.pedido
    UNION
    SELECT DISTINCT
        Anual     = YEAR(fecha_respuesta),
        Semestre  = DATENAME(YY, fecha_respuesta) + '-S' + IIF(DATENAME(qq, fecha_respuesta) < 3, '1', '2'),
        Trimestre = DATENAME(YY, fecha_respuesta) + '-T' + DATENAME(qq, fecha_respuesta),
        Mes       = DATENAME(MM, fecha_respuesta),
        DiaSemana = DATENAME(dw, fecha_respuesta),
        idFecha   = CAST(fecha_respuesta AS DATE)
    FROM turned.encuesta_satisfaccion;
GO

/* ============================================================================
   2. CARGA ETL CON SENTENCIA MERGE PARA LAS 10 DIMENSIONES CONFORMADAS
   ============================================================================ */
PRINT '=== 2. EJECUTANDO SENTENCIAS MERGE PARA DIMENSIONES EN POLUXIMPORTMART ===';
GO

-- 2.1 MERGE DimTiempo
MERGE [PoluxImportMart].[dbo].[DimTiempo] AS dim
USING (
    SELECT Anual, Semestre, Trimestre, Mes, DiaSemana, idFecha
    FROM [PoluxImportDB].[dbo].[v_DatosDimTiempo]
) AS oltp
ON oltp.idFecha = dim.idFecha
WHEN NOT MATCHED THEN
    INSERT (Anual, Semestre, Trimestre, Mes, DiaSemana, idFecha)
    VALUES (oltp.Anual, oltp.Semestre, oltp.Trimestre, oltp.Mes, oltp.DiaSemana, oltp.idFecha);
GO

-- 2.2 MERGE DimPersona
MERGE [PoluxImportMart].[dbo].[DimPersona] AS dim
USING (
    SELECT
        ISNULL(codigo_cliente, CAST(100000 + id_persona AS VARCHAR(20))) AS CodigoCliente,
        CONCAT(nombres, ' ', ISNULL(apellidos, '')) AS NombreCompleto,
        ciudad AS CiudadDistrito,
        pais AS Pais,
        rol_compra_principal AS RolCompra,
        etapa_actual AS EtapaActual,
        id_persona AS idPersona
    FROM [PoluxImportDB].[core].[persona]
) AS oltp
ON oltp.idPersona = dim.idPersona
WHEN MATCHED AND dim.EtapaActual <> oltp.EtapaActual THEN
    UPDATE SET dim.EtapaActual = oltp.EtapaActual, dim.NombreCompleto = oltp.NombreCompleto
WHEN NOT MATCHED THEN
    INSERT (CodigoCliente, NombreCompleto, CiudadDistrito, Pais, RolCompra, EtapaActual, idPersona)
    VALUES (oltp.CodigoCliente, oltp.NombreCompleto, oltp.CiudadDistrito, oltp.Pais, oltp.RolCompra, oltp.EtapaActual, oltp.idPersona);
GO

-- 2.3 MERGE DimProducto
MERGE [PoluxImportMart].[dbo].[DimProducto] AS dim
USING (
    SELECT
        sku_fabricante AS SKU,
        linea_modelo AS Producto,
        categoria AS Categoria,
        ISNULL(capacidad_almacenamiento, 'N/A') AS Capacidad,
        ISNULL(color_oficial, 'Estándar') AS Color,
        precio_base_pen AS PrecioBasePEN,
        id_producto AS idProducto
    FROM [PoluxImportDB].[core].[producto_catalogo]
) AS oltp
ON oltp.idProducto = dim.idProducto
WHEN NOT MATCHED THEN
    INSERT (SKU, Producto, Categoria, Capacidad, Color, PrecioBasePEN, idProducto)
    VALUES (oltp.SKU, oltp.Producto, oltp.Categoria, oltp.Capacidad, oltp.Color, oltp.PrecioBasePEN, oltp.idProducto);
GO

-- 2.4 MERGE DimCampana
MERGE [PoluxImportMart].[dbo].[DimCampana] AS dim
USING (
    SELECT
        codigo_campana AS CodigoCampana,
        nombre_campana AS NombreCampana,
        canal_publicitario AS CanalPublicitario,
        audiencia_objetivo AS AudienciaObjetivo,
        presupuesto_total_pen AS PresupuestoPEN,
        id_campana AS idCampana
    FROM [PoluxImportDB].[buyers].[campana_marketing]
) AS oltp
ON oltp.idCampana = dim.idCampana
WHEN NOT MATCHED THEN
    INSERT (CodigoCampana, NombreCampana, CanalPublicitario, AudienciaObjetivo, PresupuestoPEN, idCampana)
    VALUES (oltp.CodigoCampana, oltp.NombreCampana, oltp.CanalPublicitario, oltp.AudienciaObjetivo, oltp.PresupuestoPEN, oltp.idCampana);
GO

-- 2.5 MERGE DimCanal
MERGE [PoluxImportMart].[dbo].[DimCanal] AS dim
USING (
    SELECT
        idCanal,
        idCanal AS NombreCanal,
        CASE WHEN idCanal IN ('WHATSAPP', 'INSTAGRAM_DM', 'TIKTOK_DM') THEN 'MENSAJERIA_REDES' ELSE 'DIGITAL_WEB' END AS TipoCanal
    FROM (
        SELECT DISTINCT canal_comunicacion AS idCanal FROM [PoluxImportDB].[buyers].[conversacion]
        UNION
        SELECT DISTINCT canal_conversion AS idCanal FROM [PoluxImportDB].[leads].[lead]
    ) c
) AS oltp
ON oltp.idCanal = dim.idCanal
WHEN NOT MATCHED THEN
    INSERT (NombreCanal, TipoCanal, idCanal)
    VALUES (oltp.NombreCanal, oltp.TipoCanal, oltp.idCanal);
GO

-- 2.6 MERGE DimAgente
MERGE [PoluxImportMart].[dbo].[DimAgente] AS dim
USING (
    SELECT
        codigo_agente AS CodigoAgente,
        nombre_agente AS NombreAgente,
        rol_operativo AS RolOperativo,
        fase_principal AS FasePrincipal,
        id_agente AS idAgente
    FROM [PoluxImportDB].[core].[agente_ia]
) AS oltp
ON oltp.idAgente = dim.idAgente
WHEN NOT MATCHED THEN
    INSERT (CodigoAgente, NombreAgente, RolOperativo, FasePrincipal, idAgente)
    VALUES (oltp.CodigoAgente, oltp.NombreAgente, oltp.RolOperativo, oltp.FasePrincipal, oltp.idAgente);
GO

-- 2.7 MERGE DimEficiencia (Patrón exacto del Dr. Ricardo Mendoza Rivera)
MERGE [PoluxImportMart].[dbo].[DimEficiencia] AS dim
USING (
    SELECT DISTINCT
        plazo = DATEDIFF(dd, fecha_estimada_entrega, CAST(ISNULL(fecha_entrega_real, fecha_estimada_entrega) AS DATE)),
        TipoPlazo = CASE
            WHEN DATEDIFF(dd, fecha_estimada_entrega, CAST(ISNULL(fecha_entrega_real, fecha_estimada_entrega) AS DATE)) <= 0 THEN 'BUENO'
            WHEN DATEDIFF(dd, fecha_estimada_entrega, CAST(ISNULL(fecha_entrega_real, fecha_estimada_entrega) AS DATE)) <= 2 THEN 'REGULAR'
            WHEN DATEDIFF(dd, fecha_estimada_entrega, CAST(ISNULL(fecha_entrega_real, fecha_estimada_entrega) AS DATE)) <= 5 THEN 'MALO'
            ELSE 'MUY MALO'
        END
    FROM [PoluxImportDB].[customers].[pedido]
) AS oltp
ON oltp.plazo = dim.idPlazo
WHEN NOT MATCHED THEN
    INSERT (TipoPlazo, idPlazo)
    VALUES (oltp.TipoPlazo, oltp.plazo);
GO

-- 2.8 MERGE DimSatisfaccion (Patrón exacto del Dr. Ricardo Mendoza Rivera)
MERGE [PoluxImportMart].[dbo].[DimSatisfaccion] AS dim
USING (
    SELECT DISTINCT
        NPS = CASE
            WHEN puntaje_nps < 7 THEN 'DETRACTORES'
            WHEN puntaje_nps < 9 THEN 'REGULARES'
            ELSE 'PROMOTORES'
        END,
        puntaje_nps
    FROM [PoluxImportDB].[turned].[encuesta_satisfaccion]
) AS oltp
ON dim.idValor = oltp.puntaje_nps
WHEN NOT MATCHED THEN
    INSERT (NPS, idValor)
    VALUES (oltp.NPS, oltp.puntaje_nps);
GO

-- 2.9 MERGE DimModalidadPago
MERGE [PoluxImportMart].[dbo].[DimModalidadPago] AS dim
USING (
    SELECT DISTINCT
        o.modalidad_pago AS Modalidad,
        pg.medio_pago AS MedioPago,
        CONCAT(o.modalidad_pago, '-', pg.medio_pago) AS idModalidadMedio
    FROM [PoluxImportDB].[payers].[pago] pg
    INNER JOIN [PoluxImportDB].[payers].[orden_contratacion] o ON o.id_orden = pg.id_orden
) AS oltp
ON dim.idModalidadMedio = oltp.idModalidadMedio
WHEN NOT MATCHED THEN
    INSERT (Modalidad, MedioPago, idModalidadMedio)
    VALUES (oltp.Modalidad, oltp.MedioPago, oltp.idModalidadMedio);
GO

-- 2.10 MERGE DimHitoLogistico
MERGE [PoluxImportMart].[dbo].[DimHitoLogistico] AS dim
USING (
    SELECT DISTINCT
        estado_pedido AS idCodigoHito,
        CASE estado_pedido
            WHEN 'EN_COMPRA_USA'             THEN 'Adquisición y Despacho en Almacén Miami (USA)'
            WHEN 'EN_TRANSITO_INTERNACIONAL' THEN 'Tránsito Aéreo Internacional (Miami -> Lima)'
            WHEN 'EN_ADUANA_PERU'            THEN 'Nacionalización e Inspección SUNAT (Callao)'
            WHEN 'APROBADO_PARA_ENTREGA'     THEN 'Arribo a Sede Trujillo e Inspección Física Aprobada'
            WHEN 'CERRADO'                   THEN 'Entregado y Servicio Cerrado Conforme en Trujillo'
            ELSE estado_pedido
        END AS NombreHito,
        CASE
            WHEN estado_pedido IN ('EN_COMPRA_USA', 'EN_TRANSITO_INTERNACIONAL') THEN 'ORIGEN_USA_TRANSITO'
            WHEN estado_pedido = 'EN_ADUANA_PERU' THEN 'ADUANAS_PERU'
            ELSE 'SEDE_TRUJILLO_ENTREGA'
        END AS FaseLogistica
    FROM [PoluxImportDB].[customers].[pedido]
) AS oltp
ON dim.idCodigoHito = oltp.idCodigoHito
WHEN NOT MATCHED THEN
    INSERT (NombreHito, FaseLogistica, idCodigoHito)
    VALUES (oltp.NombreHito, oltp.FaseLogistica, oltp.idCodigoHito);
GO

/* ============================================================================
   3. CARGA ETL CON SENTENCIA MERGE PARA LAS 6 TABLAS DE HECHOS
   ============================================================================ */
PRINT '=== 3. EJECUTANDO SENTENCIAS MERGE PARA TABLAS DE HECHOS EN POLUXIMPORTMART ===';
GO

-- 3.1 MERGE FactCaptacionBuyers
MERGE [PoluxImportMart].[dbo].[FactCaptacionBuyers] AS fact
USING (
    SELECT
        dt.KeyTiempo,
        dper.KeyPersona,
        dprod.KeyProducto,
        dcan.KeyCanal,
        dagt.KeyAgente,
        CantidadConsultas          = 1,
        CantidadResueltasIA        = CAST(con.resuelta_por_ia AS INT),
        CantidadDerivadasHumano    = CAST(con.derivada_a_humano AS INT),
        CantidadFormulariosValidos = CASE WHEN EXISTS (SELECT 1 FROM [PoluxImportDB].[buyers].[envio_formulario] ef WHERE ef.id_persona = conv.id_persona AND ef.clasificacion_envio = 'VALIDO') THEN 1 ELSE 0 END,
        CantidadTransicionLead     = CASE WHEN EXISTS (SELECT 1 FROM [PoluxImportDB].[leads].[lead] l WHERE l.id_persona = conv.id_persona) THEN 1 ELSE 0 END,
        PuntajeCalificacionUsuario = ISNULL(CAST(con.calificacion_usuario AS INT), 5),
        idConsulta                 = con.id_consulta
    FROM [PoluxImportDB].[buyers].[consulta] con
    INNER JOIN [PoluxImportDB].[buyers].[conversacion] conv ON conv.id_conversacion = con.id_conversacion
    INNER JOIN [PoluxImportMart].[dbo].[DimTiempo] dt ON dt.idFecha = CAST(con.fecha_consulta AS DATE)
    INNER JOIN [PoluxImportMart].[dbo].[DimPersona] dper ON dper.idPersona = conv.id_persona
    INNER JOIN [PoluxImportMart].[dbo].[DimProducto] dprod ON dprod.idProducto = ISNULL(con.id_producto, 1)
    INNER JOIN [PoluxImportMart].[dbo].[DimCanal] dcan ON dcan.idCanal = conv.canal_comunicacion
    INNER JOIN [PoluxImportMart].[dbo].[DimAgente] dagt ON dagt.idAgente = ISNULL(con.id_agente, 2)
) AS oltp
ON fact.idConsulta = oltp.idConsulta
WHEN NOT MATCHED THEN
    INSERT (KeyTiempo, KeyPersona, KeyProducto, KeyCanal, KeyAgente,
            CantidadConsultas, CantidadResueltasIA, CantidadDerivadasHumano,
            CantidadFormulariosValidos, CantidadTransicionLead, PuntajeCalificacionUsuario, idConsulta)
    VALUES (oltp.KeyTiempo, oltp.KeyPersona, oltp.KeyProducto, oltp.KeyCanal, oltp.KeyAgente,
            oltp.CantidadConsultas, oltp.CantidadResueltasIA, oltp.CantidadDerivadasHumano,
            oltp.CantidadFormulariosValidos, oltp.CantidadTransicionLead, oltp.PuntajeCalificacionUsuario, oltp.idConsulta);
GO

-- 3.2 MERGE FactNegociacionLeads
MERGE [PoluxImportMart].[dbo].[FactNegociacionLeads] AS fact
USING (
    SELECT
        dt.KeyTiempo,
        dper.KeyPersona,
        dprod.KeyProducto,
        dcan.KeyCanal,
        dagt.KeyAgente,
        CantidadCotizaciones        = 1,
        CantidadNecesidadCompleta   = CASE WHEN nc.id_producto_interes IS NOT NULL AND nc.presupuesto_estimado_pen IS NOT NULL AND nc.uso_previsto IS NOT NULL THEN 1 ELSE 0 END,
        CantidadPropuestaRespondida = ISNULL(CAST(pp.respondio_lead AS INT), 1),
        CantidadIntencionAlta       = CASE WHEN l.nivel_intencion_actual = 'ALTA' THEN 1 ELSE 0 END,
        CantidadCotizacionAceptada  = CASE WHEN cot.estado_cotizacion = 'ACEPTADA' THEN 1 ELSE 0 END,
        SubtotalCotizadoPEN         = cot.subtotal_pen,
        DescuentoCotizadoPEN        = cot.descuento_pen,
        TotalCotizadoPEN            = cot.total_pen,
        PuntajeIntencion            = ISNULL(ev.puntaje_intencion, 80.00),
        idCotizacion                = cot.id_cotizacion
    FROM [PoluxImportDB].[leads].[cotizacion] cot
    INNER JOIN [PoluxImportDB].[leads].[cotizacion_detalle] cd ON cd.id_cotizacion = cot.id_cotizacion
    INNER JOIN [PoluxImportDB].[leads].[lead] l ON l.id_persona = cot.id_persona
    LEFT JOIN  [PoluxImportDB].[leads].[necesidad_compra] nc ON nc.id_persona = cot.id_persona AND nc.es_vigente = 1
    LEFT JOIN  [PoluxImportDB].[leads].[presentacion_propuesta] pp ON pp.id_persona = cot.id_persona
    LEFT JOIN  [PoluxImportDB].[leads].[evaluacion_intencion] ev ON ev.id_persona = cot.id_persona
    INNER JOIN [PoluxImportMart].[dbo].[DimTiempo] dt ON dt.idFecha = CAST(cot.fecha_emision AS DATE)
    INNER JOIN [PoluxImportMart].[dbo].[DimPersona] dper ON dper.idPersona = cot.id_persona
    INNER JOIN [PoluxImportMart].[dbo].[DimProducto] dprod ON dprod.idProducto = cd.id_producto
    INNER JOIN [PoluxImportMart].[dbo].[DimCanal] dcan ON dcan.idCanal = l.canal_conversion
    INNER JOIN [PoluxImportMart].[dbo].[DimAgente] dagt ON dagt.idAgente = 3
) AS oltp
ON fact.idCotizacion = oltp.idCotizacion
WHEN NOT MATCHED THEN
    INSERT (KeyTiempo, KeyPersona, KeyProducto, KeyCanal, KeyAgente,
            CantidadCotizaciones, CantidadNecesidadCompleta, CantidadPropuestaRespondida,
            CantidadIntencionAlta, CantidadCotizacionAceptada, SubtotalCotizadoPEN,
            DescuentoCotizadoPEN, TotalCotizadoPEN, PuntajeIntencion, idCotizacion)
    VALUES (oltp.KeyTiempo, oltp.KeyPersona, oltp.KeyProducto, oltp.KeyCanal, oltp.KeyAgente,
            oltp.CantidadCotizaciones, oltp.CantidadNecesidadCompleta, oltp.CantidadPropuestaRespondida,
            oltp.CantidadIntencionAlta, oltp.CantidadCotizacionAceptada, oltp.SubtotalCotizadoPEN,
            oltp.DescuentoCotizadoPEN, oltp.TotalCotizadoPEN, oltp.PuntajeIntencion, oltp.idCotizacion);
GO

-- 3.3 MERGE FactCobranzaPayers
MERGE [PoluxImportMart].[dbo].[FactCobranzaPayers] AS fact
USING (
    SELECT
        dt.KeyTiempo,
        dper.KeyPersona,
        dprod.KeyProducto,
        dmod.KeyModalidadPago,
        dagt.KeyAgente,
        CantidadPagos             = 1,
        CantidadPagosValidadosIA  = CAST(pg.validado_por_ia AS INT),
        CantidadComprobantesSUNAT = CASE WHEN EXISTS (SELECT 1 FROM [PoluxImportDB].[payers].[comprobante_electronico] cpe WHERE cpe.id_pago = pg.id_pago) THEN 1 ELSE 0 END,
        CantidadOrdenActivada     = CASE WHEN o.fecha_activacion_pedido IS NOT NULL THEN 1 ELSE 0 END,
        MontoPagadoPEN            = pg.monto_pagado,
        MontoAcordadoOrdenPEN     = o.total_acordado_pen,
        SaldoPendienteOrdenPEN    = o.saldo_pendiente_pen,
        idPago                    = pg.id_pago
    FROM [PoluxImportDB].[payers].[pago] pg
    INNER JOIN [PoluxImportDB].[payers].[orden_contratacion] o ON o.id_orden = pg.id_orden
    INNER JOIN [PoluxImportDB].[leads].[cotizacion_detalle] cd ON cd.id_cotizacion = o.id_cotizacion
    INNER JOIN [PoluxImportMart].[dbo].[DimTiempo] dt ON dt.idFecha = CAST(pg.fecha_transaccion AS DATE)
    INNER JOIN [PoluxImportMart].[dbo].[DimPersona] dper ON dper.idPersona = o.id_persona
    INNER JOIN [PoluxImportMart].[dbo].[DimProducto] dprod ON dprod.idProducto = cd.id_producto
    INNER JOIN [PoluxImportMart].[dbo].[DimModalidadPago] dmod ON dmod.idModalidadMedio = CONCAT(o.modalidad_pago, '-', pg.medio_pago)
    INNER JOIN [PoluxImportMart].[dbo].[DimAgente] dagt ON dagt.idAgente = ISNULL(pg.id_agente, 4)
) AS oltp
ON fact.idPago = oltp.idPago
WHEN NOT MATCHED THEN
    INSERT (KeyTiempo, KeyPersona, KeyProducto, KeyModalidadPago, KeyAgente,
            CantidadPagos, CantidadPagosValidadosIA, CantidadComprobantesSUNAT,
            CantidadOrdenActivada, MontoPagadoPEN, MontoAcordadoOrdenPEN, SaldoPendienteOrdenPEN, idPago)
    VALUES (oltp.KeyTiempo, oltp.KeyPersona, oltp.KeyProducto, oltp.KeyModalidadPago, oltp.KeyAgente,
            oltp.CantidadPagos, oltp.CantidadPagosValidadosIA, oltp.CantidadComprobantesSUNAT,
            oltp.CantidadOrdenActivada, oltp.MontoPagadoPEN, oltp.MontoAcordadoOrdenPEN, oltp.SaldoPendienteOrdenPEN, oltp.idPago);
GO

-- 3.4 MERGE FactOperacionesCustomers
MERGE [PoluxImportMart].[dbo].[FactOperacionesCustomers] AS fact
USING (
    SELECT
        dt.KeyTiempo,
        dper.KeyPersona,
        dprod.KeyProducto,
        dhito.KeyHitoLogistico,
        defi.KeyEficiencia,
        dagt.KeyAgente,
        CantidadPedidos            = 1,
        CantidadInspeccionAprobada = CASE WHEN EXISTS (SELECT 1 FROM [PoluxImportDB].[customers].[inspeccion_calidad] ic WHERE ic.id_pedido = ped.id_pedido AND ic.resultado_inspeccion = 'APROBADO') THEN 1 ELSE 0 END,
        CantidadEntregasExitosas   = CASE WHEN EXISTS (SELECT 1 FROM [PoluxImportDB].[customers].[cierre_servicio] cs WHERE cs.id_pedido = ped.id_pedido AND cs.estado_cierre = 'COMPLETADO_EXITOSO') THEN 1 ELSE 0 END,
        CantidadEntregasATiempo    = CASE WHEN DATEDIFF(dd, ped.fecha_estimada_entrega, CAST(ISNULL(ped.fecha_entrega_real, ped.fecha_estimada_entrega) AS DATE)) <= 0 THEN 1 ELSE 0 END,
        CantidadImprevistos        = (SELECT COUNT(1) FROM [PoluxImportDB].[customers].[imprevisto_operativo] imp WHERE imp.id_pedido = ped.id_pedido),
        CantidadActualizacionesIA  = (SELECT COUNT(1) FROM [PoluxImportDB].[customers].[actualizacion_seguimiento] act WHERE act.id_pedido = ped.id_pedido),
        DiasCicloPedido            = DATEDIFF(dd, ped.fecha_activacion, ISNULL(ped.fecha_entrega_real, SYSDATETIME())),
        DiasVariacionEntrega       = DATEDIFF(dd, ped.fecha_estimada_entrega, CAST(ISNULL(ped.fecha_entrega_real, ped.fecha_estimada_entrega) AS DATE)),
        idPedido                   = ped.id_pedido
    FROM [PoluxImportDB].[customers].[pedido] ped
    INNER JOIN [PoluxImportDB].[payers].[orden_contratacion] o ON o.id_orden = ped.id_orden
    INNER JOIN [PoluxImportDB].[leads].[cotizacion_detalle] cd ON cd.id_cotizacion = o.id_cotizacion
    INNER JOIN [PoluxImportMart].[dbo].[DimTiempo] dt ON dt.idFecha = CAST(ped.fecha_activacion AS DATE)
    INNER JOIN [PoluxImportMart].[dbo].[DimPersona] dper ON dper.idPersona = ped.id_persona
    INNER JOIN [PoluxImportMart].[dbo].[DimProducto] dprod ON dprod.idProducto = cd.id_producto
    INNER JOIN [PoluxImportMart].[dbo].[DimHitoLogistico] dhito ON dhito.idCodigoHito = ped.estado_pedido
    INNER JOIN [PoluxImportMart].[dbo].[DimEficiencia] defi ON defi.idPlazo = DATEDIFF(dd, ped.fecha_estimada_entrega, CAST(ISNULL(ped.fecha_entrega_real, ped.fecha_estimada_entrega) AS DATE))
    INNER JOIN [PoluxImportMart].[dbo].[DimAgente] dagt ON dagt.idAgente = 5
) AS oltp
ON fact.idPedido = oltp.idPedido
WHEN NOT MATCHED THEN
    INSERT (KeyTiempo, KeyPersona, KeyProducto, KeyHitoLogistico, KeyEficiencia, KeyAgente,
            CantidadPedidos, CantidadInspeccionAprobada, CantidadEntregasExitosas,
            CantidadEntregasATiempo, CantidadImprevistos, CantidadActualizacionesIA,
            DiasCicloPedido, DiasVariacionEntrega, idPedido)
    VALUES (oltp.KeyTiempo, oltp.KeyPersona, oltp.KeyProducto, oltp.KeyHitoLogistico, oltp.KeyEficiencia, oltp.KeyAgente,
            oltp.CantidadPedidos, oltp.CantidadInspeccionAprobada, oltp.CantidadEntregasExitosas,
            oltp.CantidadEntregasATiempo, oltp.CantidadImprevistos, oltp.CantidadActualizacionesIA,
            oltp.DiasCicloPedido, oltp.DiasVariacionEntrega, oltp.idPedido);
GO

-- 3.5 MERGE FactFidelizacionTurned
MERGE [PoluxImportMart].[dbo].[FactFidelizacionTurned] AS fact
USING (
    SELECT
        dt.KeyTiempo,
        dper.KeyPersona,
        dprod.KeyProducto,
        dsat.KeySatisfaccion,
        dagt.KeyAgente,
        CantidadEncuestas          = 1,
        CantidadPromotores         = CASE WHEN enc.puntaje_nps >= 9 THEN 1 ELSE 0 END,
        CantidadPasivos            = CASE WHEN enc.puntaje_nps IN (7, 8) THEN 1 ELSE 0 END,
        CantidadDetractores        = CASE WHEN enc.puntaje_nps <= 6 THEN 1 ELSE 0 END,
        CantidadResolucionFCR      = CAST(enc.resolucion_primer_contacto_fcr AS INT),
        CantidadRecompras90d       = ISNULL(t.total_recompras_90d, 0),
        CantidadReferidosEfectivos = ISNULL(t.total_referidos_efectivos, 0),
        PuntajeNPS                 = CAST(enc.puntaje_nps AS INT),
        PuntajeCSAT                = CAST(enc.puntaje_csat AS INT),
        idEncuesta                 = enc.id_encuesta
    FROM [PoluxImportDB].[turned].[encuesta_satisfaccion] enc
    INNER JOIN [PoluxImportDB].[customers].[pedido] ped ON ped.id_pedido = enc.id_pedido
    INNER JOIN [PoluxImportDB].[payers].[orden_contratacion] o ON o.id_orden = ped.id_orden
    INNER JOIN [PoluxImportDB].[leads].[cotizacion_detalle] cd ON cd.id_cotizacion = o.id_cotizacion
    LEFT JOIN  [PoluxImportDB].[turned].[turned] t ON t.id_persona = enc.id_persona
    INNER JOIN [PoluxImportMart].[dbo].[DimTiempo] dt ON dt.idFecha = CAST(enc.fecha_respuesta AS DATE)
    INNER JOIN [PoluxImportMart].[dbo].[DimPersona] dper ON dper.idPersona = enc.id_persona
    INNER JOIN [PoluxImportMart].[dbo].[DimProducto] dprod ON dprod.idProducto = cd.id_producto
    INNER JOIN [PoluxImportMart].[dbo].[DimSatisfaccion] dsat ON dsat.idValor = enc.puntaje_nps
    INNER JOIN [PoluxImportMart].[dbo].[DimAgente] dagt ON dagt.idAgente = 6
) AS oltp
ON fact.idEncuesta = oltp.idEncuesta
WHEN NOT MATCHED THEN
    INSERT (KeyTiempo, KeyPersona, KeyProducto, KeySatisfaccion, KeyAgente,
            CantidadEncuestas, CantidadPromotores, CantidadPasivos, CantidadDetractores,
            CantidadResolucionFCR, CantidadRecompras90d, CantidadReferidosEfectivos,
            PuntajeNPS, PuntajeCSAT, idEncuesta)
    VALUES (oltp.KeyTiempo, oltp.KeyPersona, oltp.KeyProducto, oltp.KeySatisfaccion, oltp.KeyAgente,
            oltp.CantidadEncuestas, oltp.CantidadPromotores, oltp.CantidadPasivos, oltp.CantidadDetractores,
            oltp.CantidadResolucionFCR, oltp.CantidadRecompras90d, oltp.CantidadReferidosEfectivos,
            oltp.PuntajeNPS, oltp.PuntajeCSAT, oltp.idEncuesta);
GO

-- 3.6 MERGE FactVentasPedidos (Tabla Consolidada estilo FactVentas de TenebrosaMart del Docente)
MERGE [PoluxImportMart].[dbo].[FactVentasPedidos] AS fact
USING (
    SELECT
        dt.KeyTiempo,
        dper.KeyPersona,
        dprod.KeyProducto,
        dcamp.KeyCampana,
        dagt.KeyAgente,
        defi.KeyEficiencia,
        dsat.KeySatisfaccion,
        CantidadUnidades       = cd.cantidad,
        MontoVentaTotalPEN     = o.total_acordado_pen,
        MontoPagadoValidadoPEN = o.total_pagado_validado_pen,
        CostoReferencialPEN    = ROUND(dprod.PrecioBasePEN * 0.78, 2),
        MargenBrutoPEN         = o.total_acordado_pen - ROUND(dprod.PrecioBasePEN * 0.78, 2),
        DocumentoPedido        = ped.numero_pedido
    FROM [PoluxImportDB].[customers].[pedido] ped
    INNER JOIN [PoluxImportDB].[payers].[orden_contratacion] o ON o.id_orden = ped.id_orden
    INNER JOIN [PoluxImportDB].[leads].[cotizacion_detalle] cd ON cd.id_cotizacion = o.id_cotizacion
    LEFT JOIN  [PoluxImportDB].[turned].[encuesta_satisfaccion] enc ON enc.id_pedido = ped.id_pedido
    INNER JOIN [PoluxImportMart].[dbo].[DimTiempo] dt ON dt.idFecha = CAST(ped.fecha_activacion AS DATE)
    INNER JOIN [PoluxImportMart].[dbo].[DimPersona] dper ON dper.idPersona = ped.id_persona
    INNER JOIN [PoluxImportMart].[dbo].[DimProducto] dprod ON dprod.idProducto = cd.id_producto
    INNER JOIN [PoluxImportMart].[dbo].[DimCampana] dcamp ON dcamp.idCampana = ((ped.id_persona - 1) % 12) + 1
    INNER JOIN [PoluxImportMart].[dbo].[DimAgente] dagt ON dagt.idAgente = 4
    INNER JOIN [PoluxImportMart].[dbo].[DimEficiencia] defi ON defi.idPlazo = DATEDIFF(dd, ped.fecha_estimada_entrega, CAST(ISNULL(ped.fecha_entrega_real, ped.fecha_estimada_entrega) AS DATE))
    INNER JOIN [PoluxImportMart].[dbo].[DimSatisfaccion] dsat ON dsat.idValor = ISNULL(enc.puntaje_nps, 9)
) AS oltp
ON fact.DocumentoPedido = oltp.DocumentoPedido
WHEN NOT MATCHED THEN
    INSERT (KeyTiempo, KeyPersona, KeyProducto, KeyCampana, KeyAgente, KeyEficiencia, KeySatisfaccion,
            CantidadUnidades, MontoVentaTotalPEN, MontoPagadoValidadoPEN, CostoReferencialPEN, MargenBrutoPEN, DocumentoPedido)
    VALUES (oltp.KeyTiempo, oltp.KeyPersona, oltp.KeyProducto, oltp.KeyCampana, oltp.KeyAgente, oltp.KeyEficiencia, oltp.KeySatisfaccion,
            oltp.CantidadUnidades, oltp.MontoVentaTotalPEN, oltp.MontoPagadoValidadoPEN, oltp.CostoReferencialPEN, oltp.MargenBrutoPEN, oltp.DocumentoPedido);
GO

/* ============================================================================
   4. PROCEDIMIENTO ALMACENADO DE CONSULTA DE INDICADORES DEL EMBUDO IMPULSE
      Calcula cada KPI mostrando explícitamente sus 2 medidas base (Numerador y Denominador)
   ============================================================================ */
USE PoluxImportMart;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Indicadores_Embudo_Polux
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Fase = '1. BUYERS',
        Indicador = 'KPI-BUY-03: Tasa de Resolución Automática IA',
        Medida_1_Numerador = SUM(CantidadResueltasIA),
        Medida_2_Denominador = SUM(CantidadConsultas),
        Valor_KPI_Pct = CAST(ROUND(100.0 * SUM(CantidadResueltasIA) / NULLIF(SUM(CantidadConsultas), 0), 2) AS DECIMAL(6,2))
    FROM dbo.FactCaptacionBuyers

    UNION ALL

    SELECT
        Fase = '2. LEADS',
        Indicador = 'KPI-LEA-01: Tasa de Leads con Necesidades Identificadas',
        Medida_1_Numerador = SUM(CantidadNecesidadCompleta),
        Medida_2_Denominador = SUM(CantidadCotizaciones),
        Valor_KPI_Pct = CAST(ROUND(100.0 * SUM(CantidadNecesidadCompleta) / NULLIF(SUM(CantidadCotizaciones), 0), 2) AS DECIMAL(6,2))
    FROM dbo.FactNegociacionLeads

    UNION ALL

    SELECT
        Fase = '2. LEADS',
        Indicador = 'KPI-LEA-03: Índice de Leads con Intención Alta',
        Medida_1_Numerador = SUM(CantidadIntencionAlta),
        Medida_2_Denominador = SUM(CantidadCotizaciones),
        Valor_KPI_Pct = CAST(ROUND(100.0 * SUM(CantidadIntencionAlta) / NULLIF(SUM(CantidadCotizaciones), 0), 2) AS DECIMAL(6,2))
    FROM dbo.FactNegociacionLeads

    UNION ALL

    SELECT
        Fase = '3. PAYERS',
        Indicador = 'KPI-PAY-01: Tasa de Pagos Validados Automáticamente por IA',
        Medida_1_Numerador = SUM(CantidadPagosValidadosIA),
        Medida_2_Denominador = SUM(CantidadPagos),
        Valor_KPI_Pct = CAST(ROUND(100.0 * SUM(CantidadPagosValidadosIA) / NULLIF(SUM(CantidadPagos), 0), 2) AS DECIMAL(6,2))
    FROM dbo.FactCobranzaPayers

    UNION ALL

    SELECT
        Fase = '4. CUSTOMERS',
        Indicador = 'KPI-CUS-03: Cumplimiento de Entregas en Plazo Pactado (BUENO)',
        Medida_1_Numerador = SUM(CantidadEntregasATiempo),
        Medida_2_Denominador = SUM(CantidadPedidos),
        Valor_KPI_Pct = CAST(ROUND(100.0 * SUM(CantidadEntregasATiempo) / NULLIF(SUM(CantidadPedidos), 0), 2) AS DECIMAL(6,2))
    FROM dbo.FactOperacionesCustomers

    UNION ALL

    SELECT
        Fase = '5. TURNED',
        Indicador = 'KPI-TUR-01: Net Promoter Score (Promotores % - Detractores %)',
        Medida_1_Numerador = SUM(CantidadPromotores) - SUM(CantidadDetractores),
        Medida_2_Denominador = SUM(CantidadEncuestas),
        Valor_KPI_Pct = CAST(ROUND(100.0 * (SUM(CantidadPromotores) - SUM(CantidadDetractores)) / NULLIF(SUM(CantidadEncuestas), 0), 2) AS DECIMAL(6,2))
    FROM dbo.FactFidelizacionTurned;
END;
GO

PRINT '=== RESUMEN DE FILAS EN POLUXIMPORTMART ===';
SELECT
    t.name AS Tabla_Dimensional,
    SUM(p.rows) AS Total_Filas
FROM sys.tables t
JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
GROUP BY t.name
ORDER BY t.name;
GO

EXEC dbo.sp_Indicadores_Embudo_Polux;
GO
