/* ============================================================================
   PROYECTO: POLUX IMPORT — Ecosistema BI & Agentes IA (Trujillo, Perú)
   MOTOR:    Microsoft SQL Server 2019 / 2022 (T-SQL)
   ARCHIVO:  07_modelo_dimensional_poluxmart.sql
   METODOLOGÍA:
     Dr. Ricardo Mendoza Rivera ("rimenri") — Inteligencia de Negocios / Sistemas
     de Soporte a Decisiones (UNT).
   PROPÓSITO:
     Crear la Base de Datos Dimensional (Data Mart: PoluxImportMart) con
     esquema Constelación de Hechos (10 Dimensiones Conformadas con claves
     subrogadas Key... e identificadores de negocio id... al final + 6 Tablas
     de Hechos con medidas estrictamente aditivas y llaves degeneradas para
     carga incremental mediante MERGE).
   ============================================================================ */

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF DB_ID('PoluxImportMart') IS NULL
BEGIN
    CREATE DATABASE PoluxImportMart COLLATE Modern_Spanish_100_CI_AI_SC_UTF8;
END
GO

USE PoluxImportMart;
GO

PRINT '=== CREANDO MODELO DIMENSIONAL POLUXIMPORTMART (ESTILO DR. RICARDO MENDOZA) ===';
GO

/* ============================================================================
   1. ELIMINACION PREVIA DE TABLAS DE HECHOS Y DIMENSIONES (ORDEN INVERSO FK)
   ============================================================================ */
IF OBJECT_ID('dbo.FactFidelizacionTurned', 'U') IS NOT NULL DROP TABLE dbo.FactFidelizacionTurned;
IF OBJECT_ID('dbo.FactOperacionesCustomers', 'U') IS NOT NULL DROP TABLE dbo.FactOperacionesCustomers;
IF OBJECT_ID('dbo.FactCobranzaPayers', 'U') IS NOT NULL DROP TABLE dbo.FactCobranzaPayers;
IF OBJECT_ID('dbo.FactNegociacionLeads', 'U') IS NOT NULL DROP TABLE dbo.FactNegociacionLeads;
IF OBJECT_ID('dbo.FactCaptacionBuyers', 'U') IS NOT NULL DROP TABLE dbo.FactCaptacionBuyers;
IF OBJECT_ID('dbo.FactVentasPedidos', 'U') IS NOT NULL DROP TABLE dbo.FactVentasPedidos;

IF OBJECT_ID('dbo.DimHitoLogistico', 'U') IS NOT NULL DROP TABLE dbo.DimHitoLogistico;
IF OBJECT_ID('dbo.DimModalidadPago', 'U') IS NOT NULL DROP TABLE dbo.DimModalidadPago;
IF OBJECT_ID('dbo.DimSatisfaccion', 'U') IS NOT NULL DROP TABLE dbo.DimSatisfaccion;
IF OBJECT_ID('dbo.DimEficiencia', 'U') IS NOT NULL DROP TABLE dbo.DimEficiencia;
IF OBJECT_ID('dbo.DimAgente', 'U') IS NOT NULL DROP TABLE dbo.DimAgente;
IF OBJECT_ID('dbo.DimCanal', 'U') IS NOT NULL DROP TABLE dbo.DimCanal;
IF OBJECT_ID('dbo.DimCampana', 'U') IS NOT NULL DROP TABLE dbo.DimCampana;
IF OBJECT_ID('dbo.DimProducto', 'U') IS NOT NULL DROP TABLE dbo.DimProducto;
IF OBJECT_ID('dbo.DimPersona', 'U') IS NOT NULL DROP TABLE dbo.DimPersona;
IF OBJECT_ID('dbo.DimTiempo', 'U') IS NOT NULL DROP TABLE dbo.DimTiempo;
GO

/* ============================================================================
   2. DIMENSIONES CONFORMADAS (Key<Nombre> INT IDENTITY(1,1) + id<Nombre> al final)
   ============================================================================ */

-- 2.1 DimTiempo (Idéntica al patrón v_DatosDimTiempo del docente)
CREATE TABLE dbo.DimTiempo (
    KeyTiempo   INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Anual       INT NOT NULL,
    Semestre    VARCHAR(10) NOT NULL,  -- Ej: 2025-S1, 2025-S2
    Trimestre   VARCHAR(10) NOT NULL,  -- Ej: 2025-T1..T4
    Mes         NVARCHAR(30) NOT NULL, -- Nombre del mes
    DiaSemana   NVARCHAR(30) NOT NULL, -- Nombre del día de la semana
    idFecha     DATE NOT NULL UNIQUE   -- Llave de negocio al final
);
GO

-- 2.2 DimPersona (Cliente / Prospecto del embudo IMPULSE)
CREATE TABLE dbo.DimPersona (
    KeyPersona      INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    CodigoCliente   VARCHAR(20) NOT NULL,
    NombreCompleto  NVARCHAR(210) NOT NULL,
    CiudadDistrito  NVARCHAR(80) NOT NULL,
    Pais            NVARCHAR(50) NOT NULL,
    RolCompra       VARCHAR(30) NOT NULL,
    EtapaActual     VARCHAR(20) NOT NULL,
    idPersona       BIGINT NOT NULL UNIQUE -- Llave de negocio al final
);
GO

-- 2.3 DimProducto (Catálogo oficial Apple)
CREATE TABLE dbo.DimProducto (
    KeyProducto         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SKU                 VARCHAR(50) NOT NULL,
    Producto            NVARCHAR(100) NOT NULL,
    Categoria           VARCHAR(40) NOT NULL,
    Capacidad           VARCHAR(20) NOT NULL,
    Color               NVARCHAR(50) NOT NULL,
    PrecioBasePEN       DECIMAL(12,2) NOT NULL,
    idProducto          INT NOT NULL UNIQUE -- Llave de negocio al final
);
GO

-- 2.4 DimCampana (Campañas digitales de captación)
CREATE TABLE dbo.DimCampana (
    KeyCampana          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    CodigoCampana       VARCHAR(50) NOT NULL,
    NombreCampana       NVARCHAR(150) NOT NULL,
    CanalPublicitario   VARCHAR(40) NOT NULL,
    AudienciaObjetivo   NVARCHAR(200) NOT NULL,
    PresupuestoPEN      DECIMAL(12,2) NOT NULL,
    idCampana           INT NOT NULL UNIQUE -- Llave de negocio al final
);
GO

-- 2.5 DimCanal (Canales de contacto y origen)
CREATE TABLE dbo.DimCanal (
    KeyCanal            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    NombreCanal         VARCHAR(50) NOT NULL,
    TipoCanal           VARCHAR(40) NOT NULL, -- RED_SOCIAL, MENSAJERIA, WEB, PASARELA
    idCanal             VARCHAR(50) NOT NULL UNIQUE -- Llave de negocio al final
);
GO

-- 2.6 DimAgente (Agentes de Inteligencia Artificial del ecosistema Polux)
CREATE TABLE dbo.DimAgente (
    KeyAgente           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    CodigoAgente        VARCHAR(30) NOT NULL,
    NombreAgente        NVARCHAR(80) NOT NULL,
    RolOperativo        NVARCHAR(200) NOT NULL,
    FasePrincipal       VARCHAR(20) NOT NULL,
    idAgente            SMALLINT NOT NULL UNIQUE -- Llave de negocio al final
);
GO

-- 2.7 DimEficiencia (Patrón exacto del docente: DATEDIFF(dd, fecha_estimada_entrega, fecha_entrega_real))
CREATE TABLE dbo.DimEficiencia (
    KeyEficiencia       INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    TipoPlazo           VARCHAR(25) NOT NULL, -- BUENO (<=0), REGULAR (1..2), MALO (3..5), MUY MALO (>5)
    idPlazo             INT NOT NULL UNIQUE   -- Días de diferencia (plazo) al final
);
GO

-- 2.8 DimSatisfaccion (Patrón exacto del docente: NPS DETRACTORES <7, REGULARES 7..8, PROMOTORES >=9)
CREATE TABLE dbo.DimSatisfaccion (
    KeySatisfaccion     INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    NPS                 VARCHAR(25) NOT NULL, -- DETRACTORES, REGULARES, PROMOTORES
    idValor             TINYINT NOT NULL UNIQUE -- Puntaje NPS (0..10) al final
);
GO

-- 2.9 DimModalidadPago (Modalidad financiera y medio de pago)
CREATE TABLE dbo.DimModalidadPago (
    KeyModalidadPago    INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Modalidad           VARCHAR(30) NOT NULL, -- CONTADO, CUOTAS
    MedioPago           VARCHAR(40) NOT NULL, -- YAPE, PLIN, TRANSFERENCIA_BCP, TARJETA, etc.
    idModalidadMedio    VARCHAR(80) NOT NULL UNIQUE -- Llave compuesta de negocio al final
);
GO

-- 2.10 DimHitoLogistico (Etapas del tránsito internacional Miami -> Lima SUNAT -> Trujillo)
CREATE TABLE dbo.DimHitoLogistico (
    KeyHitoLogistico    INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    NombreHito          NVARCHAR(120) NOT NULL,
    FaseLogistica       VARCHAR(40) NOT NULL,
    idCodigoHito        VARCHAR(40) NOT NULL UNIQUE -- Llave de negocio al final
);
GO

/* ============================================================================
   3. TABLAS DE HECHOS (CONSTELACION DE HECHOS CON MEDIDAS ADITIVAS)
      Regla del Docente: Las tablas de hechos almacenan medidas numéricas
      aditivas/contables (1/0, conteos, montos, días) + llave degenerada de
      documento/transacción al final para permitir MERGE idempotente.
   ============================================================================ */

-- 3.1 FactCaptacionBuyers (Fase 1: BUYERS — Consultas y atención inicial IA)
CREATE TABLE dbo.FactCaptacionBuyers (
    KeyCaptacionBuyer           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    KeyTiempo                   INT NOT NULL REFERENCES dbo.DimTiempo(KeyTiempo),
    KeyPersona                  INT NOT NULL REFERENCES dbo.DimPersona(KeyPersona),
    KeyProducto                 INT NOT NULL REFERENCES dbo.DimProducto(KeyProducto),
    KeyCanal                    INT NOT NULL REFERENCES dbo.DimCanal(KeyCanal),
    KeyAgente                   INT NOT NULL REFERENCES dbo.DimAgente(KeyAgente),
    -- Medidas aditivas para los KPIs de Buyers:
    CantidadConsultas           INT NOT NULL, -- Denominador Tasa Resolución Automática
    CantidadResueltasIA         INT NOT NULL, -- Numerador Tasa Resolución Automática (1 o 0)
    CantidadDerivadasHumano     INT NOT NULL, -- 1 o 0
    CantidadFormulariosValidos  INT NOT NULL, -- Numerador Conversión Visitante -> Buyer
    CantidadTransicionLead      INT NOT NULL, -- Numerador Conversión Buyer -> Lead (1 o 0)
    PuntajeCalificacionUsuario  INT NOT NULL,
    idConsulta                  BIGINT NOT NULL UNIQUE -- Llave degenerada de transacción al final
);
GO

-- 3.2 FactNegociacionLeads (Fase 2: LEADS — Necesidades, propuestas y cotizaciones)
CREATE TABLE dbo.FactNegociacionLeads (
    KeyNegociacionLead          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    KeyTiempo                   INT NOT NULL REFERENCES dbo.DimTiempo(KeyTiempo),
    KeyPersona                  INT NOT NULL REFERENCES dbo.DimPersona(KeyPersona),
    KeyProducto                 INT NOT NULL REFERENCES dbo.DimProducto(KeyProducto),
    KeyCanal                    INT NOT NULL REFERENCES dbo.DimCanal(KeyCanal),
    KeyAgente                   INT NOT NULL REFERENCES dbo.DimAgente(KeyAgente),
    -- Medidas aditivas para los KPIs de Leads:
    CantidadCotizaciones        INT NOT NULL,
    CantidadNecesidadCompleta   INT NOT NULL, -- KPI-LEA-01: Lead con necesidad identificada (1 o 0)
    CantidadPropuestaRespondida INT NOT NULL, -- KPI-LEA-02: Interacción con propuesta (1 o 0)
    CantidadIntencionAlta       INT NOT NULL, -- KPI-LEA-03: Lead con intención ALTA (1 o 0)
    CantidadCotizacionAceptada  INT NOT NULL, -- Conversión Lead -> Payer (1 o 0)
    SubtotalCotizadoPEN         DECIMAL(12,2) NOT NULL,
    DescuentoCotizadoPEN        DECIMAL(12,2) NOT NULL,
    TotalCotizadoPEN            DECIMAL(12,2) NOT NULL,
    PuntajeIntencion            DECIMAL(5,2) NOT NULL,
    idCotizacion                BIGINT NOT NULL UNIQUE -- Llave degenerada al final
);
GO

-- 3.3 FactCobranzaPayers (Fase 3: PAYERS — Órdenes formalizadas, pagos y conciliación)
CREATE TABLE dbo.FactCobranzaPayers (
    KeyCobranzaPayer            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    KeyTiempo                   INT NOT NULL REFERENCES dbo.DimTiempo(KeyTiempo),
    KeyPersona                  INT NOT NULL REFERENCES dbo.DimPersona(KeyPersona),
    KeyProducto                 INT NOT NULL REFERENCES dbo.DimProducto(KeyProducto),
    KeyModalidadPago            INT NOT NULL REFERENCES dbo.DimModalidadPago(KeyModalidadPago),
    KeyAgente                   INT NOT NULL REFERENCES dbo.DimAgente(KeyAgente),
    -- Medidas aditivas para los KPIs de Payers:
    CantidadPagos               INT NOT NULL,
    CantidadPagosValidadosIA    INT NOT NULL, -- Conciliación automática PoluxPay (1 o 0)
    CantidadComprobantesSUNAT   INT NOT NULL, -- CPE emitido (1 o 0)
    CantidadOrdenActivada       INT NOT NULL, -- Conversión Payer -> Customer (1 o 0)
    MontoPagadoPEN              DECIMAL(12,2) NOT NULL,
    MontoAcordadoOrdenPEN       DECIMAL(12,2) NOT NULL,
    SaldoPendienteOrdenPEN      DECIMAL(12,2) NOT NULL,
    idPago                      BIGINT NOT NULL UNIQUE -- Llave degenerada al final
);
GO

-- 3.4 FactOperacionesCustomers (Fase 4: CUSTOMERS — Pedidos, logística, inspección y entrega)
CREATE TABLE dbo.FactOperacionesCustomers (
    KeyOperacionCustomer        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    KeyTiempo                   INT NOT NULL REFERENCES dbo.DimTiempo(KeyTiempo),
    KeyPersona                  INT NOT NULL REFERENCES dbo.DimPersona(KeyPersona),
    KeyProducto                 INT NOT NULL REFERENCES dbo.DimProducto(KeyProducto),
    KeyHitoLogistico            INT NOT NULL REFERENCES dbo.DimHitoLogistico(KeyHitoLogistico),
    KeyEficiencia               INT NOT NULL REFERENCES dbo.DimEficiencia(KeyEficiencia),
    KeyAgente                   INT NOT NULL REFERENCES dbo.DimAgente(KeyAgente),
    -- Medidas aditivas para los KPIs de Customers:
    CantidadPedidos             INT NOT NULL,
    CantidadInspeccionAprobada  INT NOT NULL, -- RB-013 Inspección física aprobada en Trujillo (1 o 0)
    CantidadEntregasExitosas    INT NOT NULL, -- KPI-CUS-04 Entrega sin observaciones (1 o 0)
    CantidadEntregasATiempo     INT NOT NULL, -- KPI-CUS-03 Cumplimiento de fecha pactada (1 o 0)
    CantidadImprevistos         INT NOT NULL, -- KPI-CUS-02 Imprevistos registrados
    CantidadActualizacionesIA   INT NOT NULL, -- KPI-CUS-01 Notificaciones proactivas enviadas
    DiasCicloPedido             INT NOT NULL,
    DiasVariacionEntrega        INT NOT NULL, -- DATEDIFF(dd, fecha_estimada_entrega, fecha_entrega_real)
    idPedido                    BIGINT NOT NULL UNIQUE -- Llave degenerada al final
);
GO

-- 3.5 FactFidelizacionTurned (Fase 5: TURNED — Encuestas NPS/CSAT, referidos y recompras)
CREATE TABLE dbo.FactFidelizacionTurned (
    KeyFidelizacionTurned       INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    KeyTiempo                   INT NOT NULL REFERENCES dbo.DimTiempo(KeyTiempo),
    KeyPersona                  INT NOT NULL REFERENCES dbo.DimPersona(KeyPersona),
    KeyProducto                 INT NOT NULL REFERENCES dbo.DimProducto(KeyProducto),
    KeySatisfaccion             INT NOT NULL REFERENCES dbo.DimSatisfaccion(KeySatisfaccion),
    KeyAgente                   INT NOT NULL REFERENCES dbo.DimAgente(KeyAgente),
    -- Medidas aditivas para los KPIs de Turned:
    CantidadEncuestas           INT NOT NULL,
    CantidadPromotores          INT NOT NULL, -- NPS 9..10 (1 o 0)
    CantidadPasivos             INT NOT NULL, -- NPS 7..8  (1 o 0)
    CantidadDetractores         INT NOT NULL, -- NPS 0..6  (1 o 0)
    CantidadResolucionFCR       INT NOT NULL, -- Resolución al primer contacto (1 o 0)
    CantidadRecompras90d        INT NOT NULL,
    CantidadReferidosEfectivos  INT NOT NULL,
    PuntajeNPS                  INT NOT NULL,
    PuntajeCSAT                 INT NOT NULL,
    idEncuesta                  BIGINT NOT NULL UNIQUE -- Llave degenerada al final
);
GO

-- 3.6 FactVentasPedidos (Tabla de Hechos Consolidada estilo FactVentas de TenebrosaMart del Docente)
--     Cruza: DimTiempo, DimPersona, DimProducto, DimCampana, DimEficiencia, DimSatisfaccion y DimAgente
CREATE TABLE dbo.FactVentasPedidos (
    KeyVentaPedido              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    KeyTiempo                   INT NOT NULL REFERENCES dbo.DimTiempo(KeyTiempo),
    KeyPersona                  INT NOT NULL REFERENCES dbo.DimPersona(KeyPersona),
    KeyProducto                 INT NOT NULL REFERENCES dbo.DimProducto(KeyProducto),
    KeyCampana                  INT NOT NULL REFERENCES dbo.DimCampana(KeyCampana),
    KeyAgente                   INT NOT NULL REFERENCES dbo.DimAgente(KeyAgente),
    KeyEficiencia               INT NOT NULL REFERENCES dbo.DimEficiencia(KeyEficiencia),
    KeySatisfaccion             INT NOT NULL REFERENCES dbo.DimSatisfaccion(KeySatisfaccion),
    -- Medidas aditivas consolidadas:
    CantidadUnidades            INT NOT NULL,
    MontoVentaTotalPEN          DECIMAL(12,2) NOT NULL,
    MontoPagadoValidadoPEN      DECIMAL(12,2) NOT NULL,
    CostoReferencialPEN         DECIMAL(12,2) NOT NULL,
    MargenBrutoPEN              DECIMAL(12,2) NOT NULL,
    DocumentoPedido             VARCHAR(30) NOT NULL UNIQUE -- Llave degenerada (numero_pedido) igual que Documento en TenebrosaMart
);
GO

PRINT '=== MODELO DIMENSIONAL POLUXIMPORTMART CREADO EXITOSAMENTE ===';
GO
