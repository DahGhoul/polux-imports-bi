/* ============================================================================
   PROYECTO: POLUX IMPORT — Ecosistema BI & Agentes IA (Trujillo, Perú)
   MOTOR:    Microsoft SQL Server 2019 / 2022 (T-SQL)
   ARCHIVO:  06_poblacion_masiva_100k.sql
   PROPÓSITO:
     Población masiva realista (>105,000 eventos web y decenas de miles de
     transacciones a lo largo de las 32 tablas de los 6 esquemas del embudo
     IMPULSE: core, buyers, leads, payers, customers, turned), incluyendo los
     perfiles de demostración y respetando el 100% de restricciones CHECK,
     índices UNIQUE filtrados y TRIGGERS de reglas de negocio.
   ============================================================================ */

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

USE PoluxImportDB;
GO

PRINT '=== INICIANDO POBLACION MASIVA DE POLUXIMPORTDB (100K+ REGISTROS) ===';
GO

/* ============================================================================
   1. CATALOGOS MAESTROS: AGENTES IA, PRODUCTOS APPLE E INVENTARIO TRUJILLO
   ============================================================================ */

-- 1.1 Agentes de IA (core.agente_ia)
IF NOT EXISTS (SELECT 1 FROM core.agente_ia)
BEGIN
    INSERT INTO core.agente_ia
        (codigo_agente, nombre_agente, rol_operativo, fase_principal, requiere_aprobacion_humana, es_activo)
    VALUES
        ('AGT_MARKETING',   'Agente Captador & Marketing IA',         'Segmentación de campañas, scoring de atención y promoción Buyer -> Lead', 'BUYERS',     0, 1),
        ('AGT_FAQ',         'Agente de Respuesta Instantánea FAQ',    'Resolución automática 24/7 de consultas sobre autenticidad, stock y pagos', 'BUYERS',     0, 1),
        ('AGT_NEGOCIADOR',  'Agente Negociador & Cotizador IA',       'Perfilamiento de necesidades, evaluación de intención y emisión de 3 opciones de cotización', 'LEADS', 0, 1),
        ('AGT_COBRANZA',    'Agente Financiero & Conciliación PoluxPay','Validación de pagos Yape/Plin/BCP, cronograma de cuotas y emisión de CPE SUNAT', 'PAYERS', 0, 1),
        ('AGT_SEGUIMIENTO', 'Agente Tracking Logístico Miami-Perú',   'Monitoreo de hitos USA-Aduanas-Trujillo, control de ansiedad e inspección Apple', 'CUSTOMERS', 0, 1),
        ('AGT_PLATAFORMA',  'Agente Fidelización & Postventa CRM',    'Encuestas NPS/CSAT, activación Apple Club Polux, referidos y recompras Turned', 'TURNED',     0, 1);
END
GO

-- 1.2 Catálogo de Productos Apple (core.producto_catalogo) - 24 SKUs oficiales
IF NOT EXISTS (SELECT 1 FROM core.producto_catalogo)
BEGIN
    INSERT INTO core.producto_catalogo
        (sku_fabricante, categoria, linea_modelo, capacidad_almacenamiento, color_oficial,
         precio_referencial_usd, precio_base_pen, estado_comercial, es_activo)
    VALUES
        ('APL-IP16PM-256-TN', 'iPhone',      'iPhone 16 Pro Max 256 GB',         '256GB', 'Titanio Natural',  1299.00, 5290.00, 'VIGENTE', 1),
        ('APL-IP16PM-512-TD', 'iPhone',      'iPhone 16 Pro Max 512 GB',         '512GB', 'Titanio Desierto', 1499.00, 6090.00, 'VIGENTE', 1),
        ('APL-IP16P-256-TN',  'iPhone',      'iPhone 16 Pro 256 GB',             '256GB', 'Titanio Natural',  1149.00, 4690.00, 'VIGENTE', 1),
        ('APL-IP16P-128-TB',  'iPhone',      'iPhone 16 Pro 128 GB',             '128GB', 'Titanio Blanco',   1049.00, 4290.00, 'VIGENTE', 1),
        ('APL-IP16-128-UL',   'iPhone',      'iPhone 16 128 GB',                 '128GB', 'Ultramarino',       899.00, 3590.00, 'VIGENTE', 1),
        ('APL-IP16-256-NG',   'iPhone',      'iPhone 16 256 GB',                 '256GB', 'Negro',             999.00, 3990.00, 'VIGENTE', 1),
        ('APL-IP15PM-256-TN', 'iPhone',      'iPhone 15 Pro Max 256 GB',         '256GB', 'Titanio Natural',  1129.00, 4590.00, 'VIGENTE', 1),
        ('APL-IP15P-128-TA',  'iPhone',      'iPhone 15 Pro 128 GB',             '128GB', 'Titanio Azul',      959.00, 3890.00, 'VIGENTE', 1),
        ('APL-IP15-128-AZ',   'iPhone',      'iPhone 15 128 GB',                 '128GB', 'Azul',              769.00, 3090.00, 'VIGENTE', 1),
        ('APL-IP14-128-MN',   'iPhone',      'iPhone 14 128 GB',                 '128GB', 'Medianoche',        579.00, 2290.00, 'VIGENTE', 1),
        ('APL-IP13-128-BL',   'iPhone',      'iPhone 13 128 GB',                 '128GB', 'Estelar',           479.00, 1890.00, 'VIGENTE', 1),
        ('APL-MBA-M3-256-MN', 'MacBook',     'MacBook Air M3 13" 16GB/256GB',    '256GB', 'Medianoche',       1199.00, 4890.00, 'VIGENTE', 1),
        ('APL-MBA-M3-512-GE', 'MacBook',     'MacBook Air M3 15" 16GB/512GB',    '512GB', 'Gris Espacial',    1479.00, 5990.00, 'VIGENTE', 1),
        ('APL-MBP-M4-512-NE', 'MacBook',     'MacBook Pro M4 14" 16GB/512GB',    '512GB', 'Negro Espacial',   1779.00, 7190.00, 'VIGENTE', 1),
        ('APL-MBP-M4P-1T-PL', 'MacBook',     'MacBook Pro M4 Pro 16" 24GB/1TB',  '1TB',   'Plata',            2549.00,10290.00, 'VIGENTE', 1),
        ('APL-IPAD-M4-256-NE','iPad',        'iPad Pro 11" M4 256 GB Wi-Fi',     '256GB', 'Negro Espacial',   1089.00, 4390.00, 'VIGENTE', 1),
        ('APL-IPAD-M2-128-AZ','iPad',        'iPad Air 11" M2 128 GB',           '128GB', 'Azul',              689.00, 2750.00, 'VIGENTE', 1),
        ('APL-IPAD-10-64-PL', 'iPad',        'iPad 10ma Gen 64 GB Wi-Fi',        '64GB',  'Plata',             419.00, 1690.00, 'VIGENTE', 1),
        ('APL-AWU2-49-TN',    'Apple Watch', 'Apple Watch Ultra 2 49mm Titanio', '64GB',  'Titanio Natural',   859.00, 3490.00, 'VIGENTE', 1),
        ('APL-AWS10-46-NG',   'Apple Watch', 'Apple Watch Series 10 46mm',       '64GB',  'Jet Black',         469.00, 1890.00, 'VIGENTE', 1),
        ('APL-APP2-USBC-BL',  'AirPods',     'AirPods Pro 2 USB-C MagSafe',      'N/A',   'Blanco',            259.00, 1049.00, 'VIGENTE', 1),
        ('APL-AP4-ANC-BL',    'AirPods',     'AirPods 4 con Cancelación Activa', 'N/A',   'Blanco',            199.00,  829.00, 'VIGENTE', 1),
        ('APL-ACC-MAGSAFE-25','Accesorios',  'Cargador MagSafe Oficial 25W',     'N/A',   'Blanco',             79.00,  329.00, 'VIGENTE', 1),
        ('APL-ACC-PENPRO-BL', 'Accesorios',  'Apple Pencil Pro',                 'N/A',   'Blanco',            149.00,  599.00, 'VIGENTE', 1);
END
GO

-- 1.3 Inventario en Sede Trujillo (core.inventario_trujillo)
-- Nota: stock_disponible es columna calculada (stock_fisico - stock_reservado)
IF NOT EXISTS (SELECT 1 FROM core.inventario_trujillo)
BEGIN
    INSERT INTO core.inventario_trujillo
        (id_producto, ubicacion_almacen, stock_fisico, stock_reservado, stock_minimo_alerta)
    SELECT
        id_producto,
        'Almacén Principal Trujillo — Av. Larco 840',
        16 + (id_producto % 15),
        2 + (id_producto % 5),
        3
    FROM core.producto_catalogo;
END
GO

/* ============================================================================
   2. FASE 1 CATALOGOS: CAMPAÑAS MARKETING, PUBLICACIONES, METRICAS Y FAQs
   ============================================================================ */

IF NOT EXISTS (SELECT 1 FROM buyers.campana_marketing)
BEGIN
    INSERT INTO buyers.campana_marketing
        (codigo_campana, nombre_campana, canal_publicitario, audiencia_objetivo, presupuesto_total_pen, fecha_inicio, fecha_fin, estado_campana)
    VALUES
        ('CMP-2025-01', 'Lanzamiento iPhone 16 Pro — Trujillo Premium',      'Instagram',  'Víctor Larco / El Golf, Profesionales 25-45 años, NSE A/B', 4800.00, '2025-01-05', '2025-06-30', 'ACTIVA'),
        ('CMP-2025-02', 'Back to University UNT & UPAO — MacBook M3',        'TikTok',     'Trujillo Centro, Universitarios Ingeniería/Medicina 18-26',  3600.00, '2025-01-15', '2025-05-30', 'ACTIVA'),
        ('CMP-2025-03', 'Importación Directa Miami en 8 Días — Seguridad',   'Meta Ads',   'La Libertad, Empresarios y ejecutivos NSE A/B',              3200.00, '2025-02-01', '2025-06-30', 'ACTIVA'),
        ('CMP-2025-04', 'Plan Renovación Apple Trujillo — Serie Verificada', 'Instagram',  'Primavera / San Andrés, Usuarios iPhone 12/13/14',           2900.00, '2025-02-10', '2025-06-30', 'ACTIVA'),
        ('CMP-2025-05', 'Captación Web Inbound — Trujillo Google Search',    'Google Ads', 'Trujillo Metropolitano, Búsqueda activa compra Apple',        5200.00, '2025-01-01', '2025-12-31', 'ACTIVA'),
        ('CMP-2025-06', 'Reels Unboxing Series Verificadas Apple',           'TikTok',     'Huanchaco / California, Jóvenes profesionales 20-35 años',    2100.00, '2025-03-01', '2025-06-30', 'ACTIVA'),
        ('CMP-2025-07', 'Especialistas Médicos & Clínicas — iPad Pro M4',    'Meta Ads',   'El Golf / San Andrés, Médicos clínicas privadas',            2600.00, '2025-03-10', '2025-07-31', 'ACTIVA'),
        ('CMP-2025-08', 'Financiamiento Cuotas PoluxPay & Yape Empresas',    'Instagram',  'La Merced, Emprendedores digitales Trujillo',                3100.00, '2025-03-15', '2025-08-31', 'ACTIVA'),
        ('CMP-2025-09', 'Creadores de Contenido Norte — iPhone 16 Pro Max',  'TikTok',     'Las Quintanas, Filmmakers, fotógrafos y agencias',           2800.00, '2025-04-01', '2025-08-31', 'ACTIVA'),
        ('CMP-2025-10', 'Cyber Apple Polux Trujillo — Stock Inmediato',      'Google Ads', 'Compradores inmediatos La Libertad',                         4500.00, '2025-04-10', '2025-07-15', 'ACTIVA'),
        ('CMP-2025-11', 'Ecosistema Apple Watch Ultra 2 + AirPods Pro 2',    'Instagram',  'El Golf, Deportistas y ejecutivos',                          1950.00, '2025-04-20', '2025-08-30', 'ACTIVA'),
        ('CMP-2025-12', 'Programa Referidos Apple Club Polux (15% MagSafe)', 'Organico',   'Víctor Larco Herrera, Clientes actuales y referidos VIP',    1800.00, '2025-01-10', '2025-12-31', 'ACTIVA');
END
GO

-- Publicaciones (60 publicaciones distribuidas en las 12 campañas)
IF NOT EXISTS (SELECT 1 FROM buyers.publicacion)
BEGIN
    ;WITH N AS (
        SELECT TOP (60) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
        FROM sys.all_objects
    )
    INSERT INTO buyers.publicacion
        (id_campana, codigo_publicacion, formato_contenido, tema_contenido, id_producto_destacado, url_publicacion, fecha_publicacion, estado_publicacion)
    SELECT
        ((n - 1) % 12) + 1 AS id_campana,
        CONCAT('POST-2025-', RIGHT('000' + CAST(n AS VARCHAR(3)), 3)),
        CASE n % 6 WHEN 0 THEN 'VIDEO_REEL' WHEN 1 THEN 'VIDEO_TIKTOK' WHEN 2 THEN 'CARRUSEL' WHEN 3 THEN 'IMAGEN' WHEN 4 THEN 'STORY' ELSE 'POST' END,
        CONCAT('Contenido Oficial Polux #', n, ' — Importación Directa USA a Trujillo con Serie Verificada'),
        ((n - 1) % 24) + 1 AS id_producto_destacado,
        CONCAT('https://poluximports.pe/social/post-', n),
        DATEADD(DAY, -(180 - n * 2), SYSDATETIME()),
        'PUBLICADA'
    FROM N;
END
GO

-- Métricas de publicaciones (1,200 cortes históricos)
IF NOT EXISTS (SELECT 1 FROM buyers.publicacion_metrica)
BEGIN
    ;WITH P AS (SELECT id_publicacion FROM buyers.publicacion),
          D AS (SELECT TOP (20) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS d FROM sys.all_objects)
    INSERT INTO buyers.publicacion_metrica
        (id_publicacion, fecha_corte, alcance_personas, impresiones, reproducciones_video,
         me_gusta, comentarios, compartidos, guardados, clics_enlace, gasto_corte_pen)
    SELECT
        P.id_publicacion,
        DATEADD(DAY, -D.d, CAST(SYSDATETIME() AS DATE)),
        1200 + (P.id_publicacion * 37 + D.d * 29) % 4500,
        1800 + (P.id_publicacion * 53 + D.d * 41) % 6500,
        950  + (P.id_publicacion * 31 + D.d * 23) % 3800,
        85   + (P.id_publicacion * 11 + D.d * 7)  % 380,
        14   + (P.id_publicacion * 3  + D.d * 2)  % 65,
        9    + (P.id_publicacion * 5  + D.d * 3)  % 40,
        18   + (P.id_publicacion * 7  + D.d * 5)  % 75,
        45   + (P.id_publicacion * 13 + D.d * 9)  % 220,
        ROUND(45.00 + ((P.id_publicacion * 7 + D.d * 5) % 95), 2)
    FROM P CROSS JOIN D;
END
GO

-- Base de conocimiento FAQ (buyers.faq_conocimiento)
IF NOT EXISTS (SELECT 1 FROM buyers.faq_conocimiento)
BEGIN
    INSERT INTO buyers.faq_conocimiento
        (codigo_faq, tema, categoria_producto, pregunta_frecuente, respuesta_aprobada, version_faq, estado_aprobacion, aprobado_por_usuario, es_activo)
    VALUES
        ('FAQ-001', 'GARANTIA',            'iPhone',     '¿Los iPhone importados tienen garantía oficial Apple en Perú?', 'Sí, todos los equipos sellados cuentan con 12 meses de garantía oficial Apple verificable por número de serie y respaldo directo en nuestra sede de Trujillo.', 1, 'APROBADO', 'ADMIN_COMERCIAL', 1),
        ('FAQ-002', 'TIEMPOS_IMPORTACION', 'MacBook',    '¿Cuánto demora una importación a pedido desde Miami hasta Trujillo?', 'El tránsito regular desde nuestro almacén en Miami pasando por Aduanas SUNAT hasta nuestra tienda en Av. Larco 840 toma entre 7 y 12 días calendario.', 1, 'APROBADO', 'ADMIN_COMERCIAL', 1),
        ('FAQ-003', 'PAGOS',               'iPhone',     '¿Qué modalidades de pago aceptan y cómo funciona el pago en cuotas?', 'Aceptamos Yape, Plin, transferencia BCP/Interbank y tarjetas vía PoluxPay. En pedidos de importación puedes separar con el 50% inicial y pagar el 50% al recoger en Trujillo.', 1, 'APROBADO', 'ADMIN_COMERCIAL', 1),
        ('FAQ-004', 'AUTENTICIDAD',        'iPhone',     '¿Cómo verifico que el equipo es nuevo sellado y no reacondicionado?', 'Durante el protocolo de entrega en Trujillo verificamos juntos la caja sellada y validamos el número de serie en checkcoverage.apple.com antes de abrirlo.', 1, 'APROBADO', 'ADMIN_COMERCIAL', 1),
        ('FAQ-005', 'PROCESO',             'iPad',       '¿El precio cotizado ya incluye impuestos de SUNAT y desaduanaje?', 'Sí, todas nuestras cotizaciones en soles (PEN) son precio final todo incluido (FOB Miami + flete aéreo + seguro + nacionalización SUNAT + envío a Trujillo).', 1, 'APROBADO', 'ADMIN_COMERCIAL', 1),
        ('FAQ-006', 'AUTENTICIDAD',        'AirPods',    '¿Tienen equipos y accesorios en stock inmediato en Trujillo?', 'Sí, contamos con stock físico inmediato en nuestra sede de Víctor Larco para los modelos más solicitados (iPhone 15, iPhone 16 y AirPods Pro 2).', 1, 'APROBADO', 'ADMIN_COMERCIAL', 1);
END
GO

/* ============================================================================
   3. POBLACION DE PERSONAS (core.persona): PERFILES HERO + 30,000 PERSONAS
   ============================================================================ */
PRINT 'Insertando 30,000 personas en core.persona...';

IF NOT EXISTS (SELECT 1 FROM core.persona)
BEGIN
    -- 3.1 Insertar primero los 8 perfiles emblemáticos de la demostración y del informe
    INSERT INTO core.persona
        (codigo_cliente, tipo_documento, numero_documento, nombres, apellidos, correo_electronico,
         telefono_movil, ciudad, pais, rol_compra_principal, consentimiento_datos, fecha_consentimiento,
         ip_consentimiento, version_politica_privacidad, etapa_actual, estado_registro, fecha_creacion, fecha_actualizacion)
    VALUES
        ('100001', 'DNI', '72849101', 'Sofía',     'Salazar Vega',      'sofia.salazar@upao.edu.pe',        '+51 944812001', 'Víctor Larco Herrera', 'Perú', 'USUARIO_FINAL', 1, DATEADD(DAY,-25,SYSDATETIME()), '190.236.44.11', 'v1.0', 'BUYER',    'ACTIVO', DATEADD(DAY,-25,SYSDATETIME()), DATEADD(HOUR,-3,SYSDATETIME())),
        ('100002', 'DNI', '72849102', 'Diego',     'Ramírez Paredes',   'diego.ramirez@unitru.edu.pe',      '+51 944812002', 'Trujillo Centro',      'Perú', 'DECISOR',       1, DATEADD(DAY,-40,SYSDATETIME()), '190.236.44.12', 'v1.0', 'LEADS',    'ACTIVO', DATEADD(DAY,-40,SYSDATETIME()), DATEADD(HOUR,-2,SYSDATETIME())),
        ('100003', 'DNI', '72849103', 'Carlos',    'Mendoza Alcántara', 'carlos.mendoza@agrotrujillo.pe',   '+51 944812003', 'El Golf',              'Perú', 'PAGADOR',       1, DATEADD(DAY,-55,SYSDATETIME()), '190.236.44.13', 'v1.0', 'PAYER',    'ACTIVO', DATEADD(DAY,-55,SYSDATETIME()), DATEADD(HOUR,-5,SYSDATETIME())),
        ('100004', 'DNI', '72849104', 'Camila',    'Paredes Urteaga',   'camila.paredes@estudioarquitec.pe','+51 944812004', 'California',           'Perú', 'USUARIO_FINAL', 1, DATEADD(DAY,-75,SYSDATETIME()), '190.236.44.14', 'v1.0', 'CUSTOMER', 'ACTIVO', DATEADD(DAY,-75,SYSDATETIME()), DATEADD(DAY,-1,SYSDATETIME())),
        ('100005', 'DNI', '72849105', 'Sebastián', 'Gutiérrez Ríos',    'sebastian.gutierrez@upn.edu.pe',   '+51 944812005', 'Primavera',            'Perú', 'EMPRESA',       1, DATEADD(DAY,-110,SYSDATETIME()),'190.236.44.15', 'v1.0', 'TURNED',   'ACTIVO', DATEADD(DAY,-110,SYSDATETIME()),DATEADD(DAY,-2,SYSDATETIME())),
        ('100006', 'DNI', '72849106', 'Valeria',   'Cabanillas Luján',  'valeria.cabanillas@gmail.com',     '+51 944812006', 'Huanchaco',            'Perú', 'USUARIO_FINAL', 1, DATEADD(DAY,-18,SYSDATETIME()), '190.236.44.16', 'v1.0', 'BUYER',    'ACTIVO', DATEADD(DAY,-18,SYSDATETIME()), DATEADD(HOUR,-8,SYSDATETIME())),
        ('100007', 'DNI', '72849107', 'Rodrigo',   'Villanueva Bazán',  'rodrigo.villanueva@minera.pe',     '+51 944812007', 'Las Quintanas',        'Perú', 'DECISOR',       1, DATEADD(DAY,-30,SYSDATETIME()), '190.236.44.17', 'v1.0', 'LEADS',    'ACTIVO', DATEADD(DAY,-30,SYSDATETIME()), DATEADD(HOUR,-6,SYSDATETIME())),
        ('100008', 'DNI', '72849108', 'Luciana',   'Zavaleta Orbegoso', 'luciana.zavaleta@clinica.pe',      '+51 944812008', 'San Andrés',           'Perú', 'USUARIO_FINAL', 1, DATEADD(DAY,-45,SYSDATETIME()), '190.236.44.18', 'v1.0', 'PAYER',    'ACTIVO', DATEADD(DAY,-45,SYSDATETIME()), DATEADD(HOUR,-4,SYSDATETIME()));

    -- 3.2 Insertar 29,992 personas adicionales mediante CTE de números (Total = 30,000 personas)
    ;WITH E1(N) AS (SELECT 1 FROM (VALUES (1),(1),(1),(1),(1),(1),(1),(1),(1),(1)) d(n)),
          E2(N) AS (SELECT 1 FROM E1 a CROSS JOIN E1 b),
          E4(N) AS (SELECT 1 FROM E2 a CROSS JOIN E2 b),
          Tally(n) AS (
              SELECT TOP (29992) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) + 8
              FROM E4 a CROSS JOIN E2 b
          )
    INSERT INTO core.persona
        (codigo_cliente, tipo_documento, numero_documento, nombres, apellidos, correo_electronico,
         telefono_movil, ciudad, pais, rol_compra_principal, consentimiento_datos, fecha_consentimiento,
         ip_consentimiento, version_politica_privacidad, etapa_actual, estado_registro, fecha_creacion, fecha_actualizacion)
    SELECT
        CAST(100000 + n AS CHAR(6)) AS codigo_cliente,
        'DNI' AS tipo_documento,
        RIGHT('00000000' + CAST(40000000 + n AS VARCHAR(8)), 8) AS numero_documento,
        CASE n % 16
            WHEN 0 THEN 'Mateo'     WHEN 1 THEN 'Valentina' WHEN 2 THEN 'Santiago' WHEN 3 THEN 'Mariana'
            WHEN 4 THEN 'Leonardo'  WHEN 5 THEN 'Ximena'    WHEN 6 THEN 'Joaquín'  WHEN 7 THEN 'Ariana'
            WHEN 8 THEN 'Gabriel'   WHEN 9 THEN 'Renata'    WHEN 10 THEN 'Nicolás' WHEN 11 THEN 'Fernanda'
            WHEN 12 THEN 'Alejandro'WHEN 13 THEN 'Daniela'  WHEN 14 THEN 'Samuel'  ELSE 'Alessandra'
        END AS nombres,
        CONCAT(
            CASE n % 12
                WHEN 0 THEN 'Rodríguez' WHEN 1 THEN 'Sánchez'   WHEN 2 THEN 'Flores'     WHEN 3 THEN 'Castillo'
                WHEN 4 THEN 'Vásquez'   WHEN 5 THEN 'Díaz'      WHEN 6 THEN 'Chávez'     WHEN 7 THEN 'Mendoza'
                WHEN 8 THEN 'Salazar'   WHEN 9 THEN 'Paredes'   WHEN 10 THEN 'Villanueva' ELSE 'Orbegoso'
            END, ' ',
            CASE (n / 12) % 10
                WHEN 0 THEN 'Castañeda' WHEN 1 THEN 'Urteaga'   WHEN 2 THEN 'Luján'      WHEN 3 THEN 'Ganoza'
                WHEN 4 THEN 'Alcántara' WHEN 5 THEN 'Ríos'      WHEN 6 THEN 'Zavaleta'   WHEN 7 THEN 'Cabanillas'
                WHEN 8 THEN 'Bazán'     ELSE 'Rebaza'
            END
        ) AS apellidos,
        CONCAT('cliente.', 100000 + n, '@poluxtrujillo.pe') AS correo_electronico,
        CONCAT('+51 9', RIGHT('00000000' + CAST(41000000 + n AS VARCHAR(8)), 8)) AS telefono_movil,
        CASE n % 10
            WHEN 0 THEN 'Víctor Larco Herrera' WHEN 1 THEN 'Trujillo Centro' WHEN 2 THEN 'El Golf'
            WHEN 3 THEN 'California'           WHEN 4 THEN 'San Andrés'      WHEN 5 THEN 'Primavera'
            WHEN 6 THEN 'Las Quintanas'        WHEN 7 THEN 'La Merced'       WHEN 8 THEN 'Huanchaco'
            ELSE 'La Esperanza'
        END AS ciudad,
        'Perú' AS pais,
        CASE n % 4 WHEN 0 THEN 'USUARIO_FINAL' WHEN 1 THEN 'DECISOR' WHEN 2 THEN 'PAGADOR' ELSE 'EMPRESA' END AS rol_compra_principal,
        1 AS consentimiento_datos,
        DATEADD(DAY, -(365 - (n % 340)), SYSDATETIME()) AS fecha_consentimiento,
        CONCAT('190.236.', (n % 200) + 1, '.', (n % 250) + 1) AS ip_consentimiento,
        'v1.0' AS version_politica_privacidad,
        -- Distribución del embudo para las 30,000 personas:
        -- n <= 18000: BUYER (18,000)
        -- 18001..25000: LEADS (7,000)
        -- 25001..26500: PAYER (1,500)
        -- 26501..28000: CUSTOMER (1,500)
        -- 28001..30000: TURNED (2,000)
        CASE
            WHEN n <= 18000 THEN 'BUYER'
            WHEN n <= 25000 THEN 'LEADS'
            WHEN n <= 26500 THEN 'PAYER'
            WHEN n <= 28000 THEN 'CUSTOMER'
            ELSE 'TURNED'
        END AS etapa_actual,
        'ACTIVO' AS estado_registro,
        DATEADD(DAY, -(365 - (n % 340)), SYSDATETIME()) AS fecha_creacion,
        DATEADD(DAY, -(n % 45), SYSDATETIME()) AS fecha_actualizacion
    FROM Tally;

    ALTER SEQUENCE core.seq_codigo_cliente RESTART WITH 130001;
END
GO

/* ============================================================================
   4. FASE 1 BUYERS: 105,000 EVENTOS WEB, 32,000 FORMULARIOS Y 45,000 CONSULTAS
   ============================================================================ */
PRINT 'Insertando 105,000 eventos web en buyers.evento_web...';

IF NOT EXISTS (SELECT 1 FROM buyers.evento_web)
BEGIN
    ;WITH E1(N) AS (SELECT 1 FROM (VALUES (1),(1),(1),(1),(1),(1),(1),(1),(1),(1)) d(n)),
          E2(N) AS (SELECT 1 FROM E1 a CROSS JOIN E1 b),
          E4(N) AS (SELECT 1 FROM E2 a CROSS JOIN E2 b),
          Tally(n) AS (
              SELECT TOP (105000) ROW_NUMBER() OVER (ORDER BY (SELECT NULL))
              FROM E4 a CROSS JOIN E2 b
          )
    INSERT INTO buyers.evento_web
        (identificador_visitante, id_persona, tipo_evento, canal_origen, id_publicacion,
         utm_source, utm_campaign, url_pagina, id_producto, tipo_dispositivo, fecha_evento)
    SELECT
        CONCAT('VIS-UUID-', RIGHT('0000000' + CAST(n AS VARCHAR(7)), 7)) AS identificador_visitante,
        ((n - 1) % 30000) + 1 AS id_persona,
        CASE n % 6
            WHEN 0 THEN 'VISITA_LANDING'
            WHEN 1 THEN 'VISTA_MODELO'
            WHEN 2 THEN 'CLIC_CTA'
            WHEN 3 THEN 'CLIC_WHATSAPP'
            WHEN 4 THEN 'INICIO_FORMULARIO'
            ELSE 'OTRO'
        END AS tipo_evento,
        CASE n % 4 WHEN 0 THEN 'Instagram' WHEN 1 THEN 'TikTok' WHEN 2 THEN 'Google' ELSE 'Directo' END AS canal_origen,
        ((n - 1) % 60) + 1 AS id_publicacion,
        CASE n % 4 WHEN 0 THEN 'instagram' WHEN 1 THEN 'tiktok' WHEN 2 THEN 'google' ELSE 'facebook' END AS utm_source,
        CONCAT('cmp_2025_', ((n - 1) % 12) + 1) AS utm_campaign,
        CONCAT('https://poluximports.pe/catalogo/apple-sku-', ((n - 1) % 24) + 1) AS url_pagina,
        ((n - 1) % 24) + 1 AS id_producto,
        CASE n % 3 WHEN 0 THEN 'MOVIL' WHEN 1 THEN 'MOVIL' ELSE 'DESKTOP' END AS tipo_dispositivo,
        DATEADD(MINUTE, -(n * 4), SYSDATETIME()) AS fecha_evento
    FROM Tally;
END
GO

PRINT 'Insertando 32,000 formularios en buyers.envio_formulario...';

IF NOT EXISTS (SELECT 1 FROM buyers.envio_formulario)
BEGIN
    ;WITH E1(N) AS (SELECT 1 FROM (VALUES (1),(1),(1),(1),(1),(1),(1),(1),(1),(1)) d(n)),
          E2(N) AS (SELECT 1 FROM E1 a CROSS JOIN E1 b),
          E4(N) AS (SELECT 1 FROM E2 a CROSS JOIN E2 b),
          Tally(n) AS (
              SELECT TOP (32000) ROW_NUMBER() OVER (ORDER BY (SELECT NULL))
              FROM E4 a CROSS JOIN E2 b
          )
    INSERT INTO buyers.envio_formulario
        (id_evento_web, identificador_visitante, canal_origen, nombres, apellidos,
         correo_electronico, telefono_movil, categoria_interes, id_producto_interes,
         mensaje_usuario, clasificacion_envio, motivo_clasificacion, id_persona, fecha_envio)
    SELECT
        n AS id_evento_web,
        CONCAT('VIS-UUID-', RIGHT('0000000' + CAST(n AS VARCHAR(7)), 7)),
        CASE n % 3 WHEN 0 THEN 'LANDING_PAGE' WHEN 1 THEN 'FORMULARIO_META' ELSE 'TIKTOK_LEAD_GEN' END,
        p.nombres,
        p.apellidos,
        p.correo_electronico,
        p.telefono_movil,
        CASE (n % 5) WHEN 0 THEN 'iPhone' WHEN 1 THEN 'MacBook' WHEN 2 THEN 'iPad' WHEN 3 THEN 'Apple Watch' ELSE 'AirPods' END,
        ((n - 1) % 24) + 1,
        'Deseo recibir información de precio final, stock en Trujillo y facilidades de pago.',
        CASE WHEN n > 30000 THEN 'DUPLICADO' ELSE 'VALIDO' END,
        CASE WHEN n > 30000 THEN 'Segundo envío desde misma sesión de campaña' ELSE 'Datos completos y consentimiento verificado' END,
        p.id_persona,
        DATEADD(MINUTE, -(n * 11), SYSDATETIME())
    FROM Tally t
    JOIN core.persona p ON p.id_persona = ((t.n - 1) % 30000) + 1;
END
GO

PRINT 'Insertando 30,000 conversaciones y 45,000 consultas en buyers.conversacion y buyers.consulta...';

IF NOT EXISTS (SELECT 1 FROM buyers.conversacion)
BEGIN
    ;WITH E1(N) AS (SELECT 1 FROM (VALUES (1),(1),(1),(1),(1),(1),(1),(1),(1),(1)) d(n)),
          E2(N) AS (SELECT 1 FROM E1 a CROSS JOIN E1 b),
          E4(N) AS (SELECT 1 FROM E2 a CROSS JOIN E2 b),
          Tally(n) AS (
              SELECT TOP (30000) ROW_NUMBER() OVER (ORDER BY (SELECT NULL))
              FROM E4 a CROSS JOIN E2 b
          )
    INSERT INTO buyers.conversacion
        (id_persona, canal_comunicacion, identificador_externo_chat, estado_conversacion, fecha_inicio, fecha_cierre)
    SELECT
        n AS id_persona,
        CASE n % 4 WHEN 0 THEN 'WHATSAPP' WHEN 1 THEN 'INSTAGRAM_DM' WHEN 2 THEN 'TIKTOK_DM' ELSE 'WEBCHAT' END,
        CONCAT('CHAT-EXT-', 100000 + n),
        CASE WHEN n % 9 = 0 THEN 'DERIVADA_HUMANO' ELSE 'CERRADA' END,
        DATEADD(DAY, -(180 - (n % 175)), SYSDATETIME()),
        DATEADD(MINUTE, 18, DATEADD(DAY, -(180 - (n % 175)), SYSDATETIME()))
    FROM Tally;
END
GO

IF NOT EXISTS (SELECT 1 FROM buyers.consulta)
BEGIN
    ;WITH E1(N) AS (SELECT 1 FROM (VALUES (1),(1),(1),(1),(1),(1),(1),(1),(1),(1)) d(n)),
          E2(N) AS (SELECT 1 FROM E1 a CROSS JOIN E1 b),
          E4(N) AS (SELECT 1 FROM E2 a CROSS JOIN E2 b),
          Tally(n) AS (
              SELECT TOP (45000) ROW_NUMBER() OVER (ORDER BY (SELECT NULL))
              FROM E4 a CROSS JOIN E2 b
          )
    INSERT INTO buyers.consulta
        (id_conversacion, id_agente, id_faq, tema_consulta, id_producto, texto_pregunta,
         texto_respuesta, resuelta_por_ia, derivada_a_humano, motivo_derivacion,
         nivel_confianza, calificacion_usuario, fecha_consulta)
    SELECT
        ((n - 1) % 30000) + 1 AS id_conversacion,
        2 AS id_agente, -- AGT_FAQ
        ((n - 1) % 6) + 1 AS id_faq,
        CASE n % 5
            WHEN 0 THEN 'PRECIO'
            WHEN 1 THEN 'TIEMPO_ENTREGA'
            WHEN 2 THEN 'METODO_PAGO'
            WHEN 3 THEN 'GARANTIA'
            ELSE 'AUTENTICIDAD'
        END AS tema_consulta,
        ((n - 1) % 24) + 1 AS id_producto,
        CASE n % 5
            WHEN 0 THEN 'Hola, ¿cuál es el precio final en soles puesto en Trujillo con impuestos SUNAT incluidos?'
            WHEN 1 THEN '¿Cuántos días demora en llegar desde el almacén de Miami hasta la tienda de Av. Larco?'
            WHEN 2 THEN '¿Cómo funciona el pago con 50% de adelanto por Yape/Plin y 50% al recoger en Trujillo?'
            WHEN 3 THEN '¿Los equipos tienen 1 año de garantía oficial Apple válida en Perú?'
            ELSE '¿El número de serie Apple se verifica en checkcoverage.apple.com al momento de la entrega?'
        END AS texto_pregunta,
        'Sí, en Polux Imports todos nuestros equipos son 100% originales sellados con serie verificable en Apple, garantía oficial de 12 meses y entrega en nuestra sede de Av. Larco 840, Trujillo.',
        CASE WHEN n % 9 = 0 THEN 0 ELSE 1 END AS resuelta_por_ia,
        CASE WHEN n % 9 = 0 THEN 1 ELSE 0 END AS derivada_a_humano,
        CASE WHEN n % 9 = 0 THEN 'Solicita descuento especial o evaluación de equipo en parte de pago' ELSE NULL END,
        89.50 + (n % 10),
        CASE WHEN n % 9 = 0 THEN 4 ELSE 5 END,
        DATEADD(MINUTE, -(n * 7), SYSDATETIME())
    FROM Tally;
END
GO

/* ============================================================================
   5. FASE 2 LEADS: 12,006 LEADS, SEÑALES, NECESIDADES, PROPUESTAS, EVALUACIONES Y COTIZACIONES
      (Incluye personas con id_persona = 2, 3, 4, 5, 7, 8 + id_persona 18001..30000)
   ============================================================================ */
PRINT 'Insertando 12,006 Leads y sus tablas de negociación en esquema leads...';

IF NOT EXISTS (SELECT 1 FROM leads.lead)
BEGIN
    ;WITH TargetLeads AS (
        SELECT id_persona, etapa_actual, fecha_creacion
        FROM core.persona
        WHERE id_persona IN (2, 3, 4, 5, 7, 8) OR id_persona > 18000
    )
    INSERT INTO leads.lead
        (id_persona, fecha_ingreso_lead, estado_lead, canal_conversion, prioridad_comercial,
         nivel_intencion_actual, motivo_perdida, fecha_cierre)
    SELECT
        id_persona,
        DATEADD(DAY, 2, fecha_creacion),
        CASE
            WHEN etapa_actual IN ('PAYER', 'CUSTOMER', 'TURNED') THEN 'CONVERTIDO'
            WHEN id_persona % 15 = 0 AND id_persona > 18008 THEN 'PERDIDO'
            ELSE 'ACTIVO'
        END,
        CASE id_persona % 4 WHEN 0 THEN 'WHATSAPP' WHEN 1 THEN 'INSTAGRAM_DM' WHEN 2 THEN 'LANDING_WEB' ELSE 'TIKTOK_DM' END,
        CASE WHEN etapa_actual IN ('PAYER', 'CUSTOMER', 'TURNED') OR id_persona <= 8 THEN 'ALTA'
             WHEN id_persona % 3 = 0 THEN 'ALTA'
             WHEN id_persona % 3 = 1 THEN 'MEDIA'
             ELSE 'URGENTE' END,
        CASE WHEN etapa_actual IN ('PAYER', 'CUSTOMER', 'TURNED') OR id_persona <= 8 OR id_persona % 2 = 0 THEN 'ALTA' ELSE 'MEDIA' END,
        CASE WHEN id_persona % 15 = 0 AND id_persona > 18008 AND etapa_actual = 'LEADS' THEN 'Postergó decisión de compra para el próximo mes' ELSE NULL END,
        CASE WHEN etapa_actual IN ('PAYER', 'CUSTOMER', 'TURNED') THEN DATEADD(DAY, -10, SYSDATETIME()) ELSE NULL END
    FROM TargetLeads;
END
GO

-- Señales de intención (24,012 registros: 2 señales por cada Lead)
IF NOT EXISTS (SELECT 1 FROM leads.senal_intencion)
BEGIN
    INSERT INTO leads.senal_intencion
        (id_persona, tipo_senal, id_producto, cantidad_interes, id_conversacion, id_consulta, produjo_transicion_lead, fecha_senal)
    SELECT
        l.id_persona,
        'CONSULTA_PRECIO',
        ((l.id_persona - 1) % 24) + 1,
        1,
        l.id_persona,
        l.id_persona,
        0,
        DATEADD(HOUR, -6, l.fecha_ingreso_lead)
    FROM leads.lead l
    UNION ALL
    SELECT
        l.id_persona,
        'SOLICITUD_COTIZACION',
        ((l.id_persona - 1) % 24) + 1,
        1,
        l.id_persona,
        l.id_persona,
        1,
        l.fecha_ingreso_lead
    FROM leads.lead l;
END
GO

-- Necesidad de compra vigente (1 por cada Lead -> respeta UQ_necesidad_persona_vigente)
IF NOT EXISTS (SELECT 1 FROM leads.necesidad_compra)
BEGIN
    INSERT INTO leads.necesidad_compra
        (id_persona, id_producto_interes, capacidad_deseada, color_deseado, accesorios_requeridos,
         presupuesto_estimado_pen, uso_previsto, preocupaciones_expresadas, plazo_deseado_dias,
         modalidad_pago_interes, es_vigente, fecha_registro)
    SELECT
        l.id_persona,
        ((l.id_persona - 1) % 20) + 1 AS id_producto_interes,
        p.capacidad_almacenamiento,
        p.color_oficial,
        'AirPods Pro 2 + Cargador MagSafe 25W',
        p.precio_base_pen,
        CASE l.id_persona % 4 WHEN 0 THEN 'PERSONAL' WHEN 1 THEN 'LABORAL' WHEN 2 THEN 'EMPRESA' ELSE 'REGALO' END,
        'Verificación de serie original Apple y cumplimiento del plazo de importación Miami-Trujillo.',
        CASE WHEN l.id_persona % 3 = 0 THEN 3 ELSE 10 END,
        CASE WHEN l.id_persona % 2 = 0 THEN 'CONTADO' ELSE 'CUOTAS' END,
        1,
        DATEADD(HOUR, 1, l.fecha_ingreso_lead)
    FROM leads.lead l
    JOIN core.producto_catalogo p ON p.id_producto = ((l.id_persona - 1) % 20) + 1;
END
GO

-- Presentación de propuesta e iteración de evaluación (leads.presentacion_propuesta y leads.evaluacion_intencion)
IF NOT EXISTS (SELECT 1 FROM leads.presentacion_propuesta)
BEGIN
    INSERT INTO leads.presentacion_propuesta
        (id_persona, id_necesidad, canal_presentacion, beneficio_destacado, preocupacion_atendida,
         respondio_lead, fecha_presentacion, fecha_respuesta, tipo_interaccion_respuesta)
    SELECT
        n.id_persona,
        n.id_necesidad,
        'WHATSAPP',
        'Garantía oficial Apple de 12 meses, serie verificada en tienda Trujillo y facilidad de 50% adelanto.',
        'Autenticidad garantizada y seguimiento de hitos logísticos en tiempo real.',
        CASE WHEN l.estado_lead = 'PERDIDO' THEN 0 ELSE 1 END,
        DATEADD(HOUR, 3, n.fecha_registro),
        CASE WHEN l.estado_lead = 'PERDIDO' THEN NULL ELSE DATEADD(HOUR, 5, n.fecha_registro) END,
        CASE WHEN l.estado_lead = 'PERDIDO' THEN 'SIN_RESPUESTA' ELSE 'ACEPTA_COTIZAR' END
    FROM leads.necesidad_compra n
    JOIN leads.lead l ON l.id_persona = n.id_persona;
END
GO

IF NOT EXISTS (SELECT 1 FROM leads.evaluacion_intencion)
BEGIN
    INSERT INTO leads.evaluacion_intencion
        (id_persona, id_agente, puntaje_intencion, nivel_intencion, prioridad_sugerida,
         consultas_precio_count, frecuencia_interaccion, senales_sustento_json, fecha_evaluacion)
    SELECT
        l.id_persona,
        3, -- AGT_NEGOCIADOR
        CASE WHEN l.nivel_intencion_actual = 'ALTA' THEN 86.50 ELSE 68.00 END,
        l.nivel_intencion_actual,
        l.prioridad_comercial,
        2 + (l.id_persona % 3),
        4 + (l.id_persona % 5),
        '{"senales":["SOLICITUD_COTIZACION","CONSULTA_PRECIO"],"perfilCompleto":true,"ciudad":"Trujillo"}',
        DATEADD(HOUR, 4, l.fecha_ingreso_lead)
    FROM leads.lead l;
END
GO

-- Cotizaciones formales (leads.cotizacion y leads.cotizacion_detalle)
IF NOT EXISTS (SELECT 1 FROM leads.cotizacion)
BEGIN
    INSERT INTO leads.cotizacion
        (id_persona, numero_cotizacion, id_cotizacion_previa, version_numero, fecha_emision,
         fecha_vencimiento, subtotal_pen, descuento_pen, total_pen, tipo_cambio_referencial,
         total_usd, modalidad_pago, pago_inicial_sugerido_pen, numero_cuotas_sugeridas,
         estado_cotizacion, fecha_aceptacion)
    SELECT
        l.id_persona,
        CONCAT('COT-2025-', RIGHT('000000' + CAST(l.id_persona AS VARCHAR(6)), 6)),
        NULL,
        1,
        DATEADD(DAY, -12, SYSDATETIME()),
        DATEADD(DAY, 7, SYSDATETIME()),
        p.precio_base_pen,
        0.00,
        p.precio_base_pen,
        3.7500,
        p.precio_referencial_usd,
        n.modalidad_pago_interes,
        CASE WHEN n.modalidad_pago_interes = 'CONTADO' THEN p.precio_base_pen ELSE ROUND(p.precio_base_pen * 0.50, 2) END,
        CASE WHEN n.modalidad_pago_interes = 'CONTADO' THEN 1 ELSE 2 END,
        CASE WHEN l.estado_lead = 'CONVERTIDO' THEN 'ACEPTADA'
             WHEN l.estado_lead = 'PERDIDO' THEN 'VENCIDA'
             ELSE 'ENVIADA' END,
        CASE WHEN l.estado_lead = 'CONVERTIDO' THEN DATEADD(DAY, -10, SYSDATETIME()) ELSE NULL END
    FROM leads.lead l
    JOIN leads.necesidad_compra n ON n.id_persona = l.id_persona
    JOIN core.producto_catalogo p ON p.id_producto = n.id_producto_interes;

    INSERT INTO leads.cotizacion_detalle
        (id_cotizacion, id_producto, id_necesidad, tipo_atencion, cantidad, precio_unitario_pen, subtotal_item_pen, notas_item)
    SELECT
        c.id_cotizacion,
        n.id_producto_interes,
        n.id_necesidad,
        CASE WHEN n.id_producto_interes IN (5, 7, 8, 9, 10, 11, 18, 20, 21, 22, 23, 24) THEN 'STOCK_TRUJILLO' ELSE 'IMPORTACION_PEDIDO' END,
        1,
        c.total_pen,
        c.total_pen,
        'Equipo Apple nuevo sellado con garantía oficial 12 meses y entrega en Trujillo.'
    FROM leads.cotizacion c
    JOIN leads.necesidad_compra n ON n.id_persona = c.id_persona;
END
GO

/* ============================================================================
   6. FASE 3 PAYERS: 5,004 PAYERS, ORDENES DE CONTRATACION, CUOTAS, PAGOS Y COMPROBANTES
      (Personas en etapa PAYER, CUSTOMER o TURNED: id_persona IN (3,4,5,8) o id_persona > 25000)
   ============================================================================ */
PRINT 'Insertando 5,004 Payers, Ordenes, Cuotas, Pagos y Comprobantes en esquema payers...';

IF NOT EXISTS (SELECT 1 FROM payers.payer)
BEGIN
    INSERT INTO payers.payer
        (id_persona, fecha_ingreso_payer, estado_payer, total_ordenes_activas, fecha_cierre)
    SELECT
        c.id_persona,
        DATEADD(DAY, -10, SYSDATETIME()),
        CASE WHEN per.etapa_actual IN ('CUSTOMER', 'TURNED') THEN 'CULMINADO'
             WHEN c.modalidad_pago = 'CONTADO' THEN 'AL_DIA'
             ELSE 'ACTIVO' END,
        1,
        CASE WHEN per.etapa_actual IN ('CUSTOMER', 'TURNED') THEN DATEADD(DAY, -3, SYSDATETIME()) ELSE NULL END
    FROM leads.cotizacion c
    JOIN core.persona per ON per.id_persona = c.id_persona
    WHERE per.etapa_actual IN ('PAYER', 'CUSTOMER', 'TURNED');
END
GO

-- Órdenes de contratación (Respetando estrictamente CK_orden_contado_total, CK_orden_activacion_pago_confirmado y CK_orden_saldo_consistente)
IF NOT EXISTS (SELECT 1 FROM payers.orden_contratacion)
BEGIN
    INSERT INTO payers.orden_contratacion
        (numero_orden, id_persona, id_cotizacion, tipo_suministro, modalidad_pago,
         total_acordado_pen, monto_pago_inicial_pactado_pen, total_cuotas_pactadas,
         total_pagado_validado_pen, saldo_pendiente_pen, estado_orden,
         fecha_formalizacion, fecha_pago_inicial_confirmado, fecha_activacion_pedido)
    SELECT
        CONCAT('ORD-2025-', RIGHT('000000' + CAST(py.id_persona AS VARCHAR(6)), 6)),
        py.id_persona,
        c.id_cotizacion,
        CASE WHEN cd.tipo_atencion = 'STOCK_TRUJILLO' THEN 'STOCK_LOCAL_TRUJILLO' ELSE 'IMPORTACION_USA' END,
        c.modalidad_pago,
        c.total_pen AS total_acordado_pen,
        CASE WHEN c.modalidad_pago = 'CONTADO' THEN c.total_pen ELSE c.pago_inicial_sugerido_pen END AS monto_pago_inicial_pactado_pen,
        CASE WHEN c.modalidad_pago = 'CONTADO' THEN 1 ELSE 2 END AS total_cuotas_pactadas,
        -- Si ya es CUSTOMER/TURNED o es CONTADO, pagó el 100%; si sigue en PAYER con CUOTAS, pagó el 50% inicial
        CASE WHEN per.etapa_actual IN ('CUSTOMER', 'TURNED') OR c.modalidad_pago = 'CONTADO'
             THEN c.total_pen
             ELSE c.pago_inicial_sugerido_pen END AS total_pagado_validado_pen,
        CASE WHEN per.etapa_actual IN ('CUSTOMER', 'TURNED') OR c.modalidad_pago = 'CONTADO'
             THEN 0.00
             ELSE c.total_pen - c.pago_inicial_sugerido_pen END AS saldo_pendiente_pen,
        CASE WHEN per.etapa_actual IN ('CUSTOMER', 'TURNED') THEN 'COMPLETADO'
             ELSE 'ACTIVADO_EN_IMPORTACION' END AS estado_orden,
        DATEADD(DAY, -10, SYSDATETIME()) AS fecha_formalizacion,
        DATEADD(DAY, -9, SYSDATETIME())  AS fecha_pago_inicial_confirmado,
        DATEADD(HOUR, 2, DATEADD(DAY, -9, SYSDATETIME())) AS fecha_activacion_pedido
    FROM payers.payer py
    JOIN leads.cotizacion c ON c.id_persona = py.id_persona
    JOIN leads.cotizacion_detalle cd ON cd.id_cotizacion = c.id_cotizacion
    JOIN core.persona per ON per.id_persona = py.id_persona;
END
GO

-- Cronograma de cuotas (Cuota 1 para todas las órdenes + Cuota 2 para las órdenes en modalidad CUOTAS)
IF NOT EXISTS (SELECT 1 FROM payers.cronograma_cuota)
BEGIN
    -- Cuota 1 (Pago único o Adelanto 50%)
    INSERT INTO payers.cronograma_cuota
        (id_orden, numero_cuota, monto_programado_pen, monto_pagado_pen, fecha_vencimiento, estado_cuota, fecha_pago_efectivo, dias_mora)
    SELECT
        o.id_orden,
        1,
        o.monto_pago_inicial_pactado_pen,
        o.monto_pago_inicial_pactado_pen,
        CAST(DATEADD(DAY, -9, SYSDATETIME()) AS DATE),
        'PAGADA',
        o.fecha_pago_inicial_confirmado,
        0
    FROM payers.orden_contratacion o;

    -- Cuota 2 (Saldo contraentrega para órdenes en modalidad CUOTAS)
    INSERT INTO payers.cronograma_cuota
        (id_orden, numero_cuota, monto_programado_pen, monto_pagado_pen, fecha_vencimiento, estado_cuota, fecha_pago_efectivo, dias_mora)
    SELECT
        o.id_orden,
        2,
        o.total_acordado_pen - o.monto_pago_inicial_pactado_pen,
        CASE WHEN o.saldo_pendiente_pen = 0 THEN o.total_acordado_pen - o.monto_pago_inicial_pactado_pen ELSE 0.00 END,
        CAST(DATEADD(DAY, 5, SYSDATETIME()) AS DATE),
        CASE WHEN o.saldo_pendiente_pen = 0 THEN 'PAGADA' ELSE 'PROGRAMADA' END,
        CASE WHEN o.saldo_pendiente_pen = 0 THEN DATEADD(DAY, -4, SYSDATETIME()) ELSE NULL END,
        0
    FROM payers.orden_contratacion o
    WHERE o.modalidad_pago = 'CUOTAS';
END
GO

-- Pagos (payers.pago) y Comprobantes Electrónicos (payers.comprobante_electronico)
-- Nota: El trigger TR_bloquear_comprobante_pago_no_validado exige estado_pago = 'VALIDADO'
IF NOT EXISTS (SELECT 1 FROM payers.pago)
BEGIN
    INSERT INTO payers.pago
        (id_orden, id_cuota, medio_pago, numero_operacion_transaccion, entidad_bancaria,
         moneda, monto_pagado, tipo_cambio_aplicado, fecha_transaccion, url_comprobante_voucher,
         estado_pago, validado_por_ia, id_agente, validado_por_humano, usuario_validador, fecha_validacion)
    SELECT
        cc.id_orden,
        cc.id_cuota,
        CASE o.id_persona % 5 WHEN 0 THEN 'YAPE' WHEN 1 THEN 'PLIN' WHEN 2 THEN 'TRANSFERENCIA_BCP' WHEN 3 THEN 'TARJETA' ELSE 'TRANSFERENCIA_INTERBANK' END,
        CONCAT('OP-PLX-2025-', RIGHT('0000000' + CAST(cc.id_cuota AS VARCHAR(7)), 7)),
        CASE o.id_persona % 3 WHEN 0 THEN 'BCP' WHEN 1 THEN 'Interbank' ELSE 'BBVA' END,
        'PEN',
        cc.monto_pagado_pen,
        3.7500,
        cc.fecha_pago_efectivo,
        CONCAT('https://poluximports.pe/vouchers/op-', cc.id_cuota, '.pdf'),
        'VALIDADO',
        1,
        4, -- AGT_COBRANZA
        0,
        'POLUXPAY_IA',
        DATEADD(MINUTE, 2, cc.fecha_pago_efectivo)
    FROM payers.cronograma_cuota cc
    JOIN payers.orden_contratacion o ON o.id_orden = cc.id_orden
    WHERE cc.estado_cuota = 'PAGADA';

    INSERT INTO payers.comprobante_electronico
        (id_orden, id_pago, tipo_comprobante, serie, numero_correlativo,
         numero_documento_cliente, nombre_razon_social, subtotal_gravado_pen, igv_pen,
         total_comprobante_pen, estado_emision, fecha_emision, hash_cpe)
    SELECT
        pg.id_orden,
        pg.id_pago,
        'BOLETA',
        'B001',
        pg.id_pago,
        per.numero_documento,
        CONCAT(per.nombres, ' ', per.apellidos),
        ROUND(pg.monto_pagado / 1.18, 2),
        pg.monto_pagado - ROUND(pg.monto_pagado / 1.18, 2),
        pg.monto_pagado,
        'EMITIDO',
        pg.fecha_validacion,
        CONCAT('SHA256-SUNAT-PLX-', pg.id_pago)
    FROM payers.pago pg
    JOIN payers.orden_contratacion o ON o.id_orden = pg.id_orden
    JOIN core.persona per ON per.id_persona = o.id_persona;
END
GO

/* ============================================================================
   7. FASE 4 CUSTOMERS: PEDIDOS, HITOS LOGISTICOS, INSPECCION CALIDAD, ENTREGA Y CIERRE
      (Respeta triggers TR_bloquear_entrega_sin_inspeccion_aprobada y TR_bloquear_cierre_con_observaciones)
   ============================================================================ */
PRINT 'Insertando Customers, Pedidos, Hitos Logísticos, Inspecciones, Entregas y Cierres...';

IF NOT EXISTS (SELECT 1 FROM customers.customer)
BEGIN
    INSERT INTO customers.customer
        (id_persona, id_payer, id_pedido_origen, fecha_ingreso_customer, estado_customer, total_pedidos_historicos, fecha_traspaso_turned)
    SELECT
        py.id_persona,
        py.id_persona,
        NULL,
        o.fecha_activacion_pedido,
        CASE WHEN per.etapa_actual = 'TURNED' THEN 'TURNED'
             WHEN per.etapa_actual = 'CUSTOMER' THEN 'CERRADO'
             ELSE 'ACTIVO' END,
        CASE WHEN per.etapa_actual = 'TURNED' AND py.id_persona % 4 = 0 THEN 2 ELSE 1 END,
        CASE WHEN per.etapa_actual = 'TURNED' THEN DATEADD(DAY, -1, SYSDATETIME()) ELSE NULL END
    FROM payers.payer py
    JOIN payers.orden_contratacion o ON o.id_persona = py.id_persona
    JOIN core.persona per ON per.id_persona = py.id_persona;
END
GO

IF NOT EXISTS (SELECT 1 FROM customers.pedido)
BEGIN
    INSERT INTO customers.pedido
        (numero_pedido, id_orden, id_persona, estado_pedido, codigo_tracking_usa,
         courier_internacional, guia_aerea_courier, fecha_activacion, fecha_estimada_entrega,
         fecha_llegada_trujillo, fecha_entrega_real)
    SELECT
        CONCAT('PED-2025-', RIGHT('000000' + CAST(o.id_orden AS VARCHAR(6)), 6)),
        o.id_orden,
        o.id_persona,
        CASE
            WHEN per.etapa_actual IN ('CUSTOMER', 'TURNED') THEN 'CERRADO'
            WHEN o.id_orden % 4 = 0 THEN 'EN_COMPRA_USA'
            WHEN o.id_orden % 4 = 1 THEN 'EN_TRANSITO_INTERNACIONAL'
            WHEN o.id_orden % 4 = 2 THEN 'EN_ADUANA_PERU'
            ELSE 'APROBADO_PARA_ENTREGA'
        END,
        CONCAT('US-MIA-', 100000 + o.id_orden),
        'DHL Express Aviation / Polux Cargo',
        CONCAT('AWB-774-', 200000 + o.id_orden),
        o.fecha_activacion_pedido,
        -- Variamos la fecha estimada frente a la entrega real (DATEADD(DAY,-2,SYSDATETIME())) para que DimEficiencia tenga BUENO, REGULAR, MALO y MUY MALO
        CASE o.id_orden % 10
            WHEN 0 THEN CAST(DATEADD(DAY, -4, SYSDATETIME()) AS DATE) -- 2 días atraso -> REGULAR
            WHEN 1 THEN CAST(DATEADD(DAY, -6, SYSDATETIME()) AS DATE) -- 4 días atraso -> MALO
            WHEN 2 THEN CAST(DATEADD(DAY, -9, SYSDATETIME()) AS DATE) -- 7 días atraso -> MUY MALO
            ELSE CAST(DATEADD(DAY, -1, SYSDATETIME()) AS DATE)        -- a tiempo / antes -> BUENO
        END AS fecha_estimada_entrega,
        CASE WHEN per.etapa_actual IN ('CUSTOMER', 'TURNED') OR o.id_orden % 4 = 3 THEN DATEADD(DAY, -3, SYSDATETIME()) ELSE NULL END,
        CASE WHEN per.etapa_actual IN ('CUSTOMER', 'TURNED') THEN DATEADD(DAY, -2, SYSDATETIME()) ELSE NULL END
    FROM payers.orden_contratacion o
    JOIN core.persona per ON per.id_persona = o.id_persona;

    -- Actualizar id_pedido_origen en customers.customer
    UPDATE cu
    SET cu.id_pedido_origen = p.id_pedido
    FROM customers.customer cu
    JOIN customers.pedido p ON p.id_persona = cu.id_persona;
END
GO

-- Seguimiento logístico por hitos (customers.seguimiento_logistico_hito) y actualizaciones proactivas (customers.actualizacion_seguimiento)
IF NOT EXISTS (SELECT 1 FROM customers.seguimiento_logistico_hito)
BEGIN
    INSERT INTO customers.seguimiento_logistico_hito
        (id_pedido, codigo_hito, descripcion_hito, ubicacion_geografica, fecha_hito, registrado_por)
    SELECT
        p.id_pedido,
        'RECEPCION_MIAMI',
        'Recepción y consolidación de equipo Apple en almacén logístico de Miami (Doral, FL).',
        'Miami, Florida, USA',
        DATEADD(DAY, -8, SYSDATETIME()),
        'SYSTEM_COURIER_API'
    FROM customers.pedido p
    UNION ALL
    SELECT
        p.id_pedido,
        'EN_ADUANAS',
        'Ingreso a proceso de nacionalización e inspección SUNAT en Aeropuerto Internacional Jorge Chávez.',
        'Callao, Lima, Perú',
        DATEADD(DAY, -5, SYSDATETIME()),
        'SYSTEM_COURIER_API'
    FROM customers.pedido p
    WHERE p.estado_pedido NOT IN ('EN_COMPRA_USA', 'EN_TRANSITO_INTERNACIONAL')
    UNION ALL
    SELECT
        p.id_pedido,
        'LLEGADA_TRUJILLO',
        'Arribo verificado a sede principal Polux Imports en Av. Larco 840, Víctor Larco Herrera.',
        'Trujillo, La Libertad, Perú',
        ISNULL(p.fecha_llegada_trujillo, DATEADD(DAY, -3, SYSDATETIME())),
        'CONTROL_LOGISTICO_TRUJILLO'
    FROM customers.pedido p
    WHERE p.estado_pedido IN ('APROBADO_PARA_ENTREGA', 'CERRADO');

    INSERT INTO customers.actualizacion_seguimiento
        (id_pedido, hito_comunicado, canal_envio, mensaje_enviado, generado_por_ia, id_agente, respondio_cliente, nivel_ansiedad_detectado, fecha_envio)
    SELECT
        h.id_pedido,
        h.codigo_hito,
        'WHATSAPP',
        CONCAT('Actualización automática Polux Tracking: ', h.descripcion_hito, ' (Ubicación: ', h.ubicacion_geografica, ').'),
        1,
        5, -- AGT_SEGUIMIENTO
        1,
        CASE WHEN h.id_pedido % 8 = 0 THEN 'MEDIO' ELSE 'BAJO' END,
        DATEADD(MINUTE, 10, h.fecha_hito)
    FROM customers.seguimiento_logistico_hito h;
END
GO

-- Imprevistos operativos (para una fracción realista de pedidos con retraso aduanero/vuelo)
IF NOT EXISTS (SELECT 1 FROM customers.imprevisto_operativo)
BEGIN
    INSERT INTO customers.imprevisto_operativo
        (id_pedido, tipo_imprevisto, descripcion, impacto_estimado_dias, fecha_deteccion, fecha_resolucion, estado_imprevisto, responsable_humano, solucion_aplicada)
    SELECT
        p.id_pedido,
        CASE WHEN p.id_pedido % 2 = 0 THEN 'RETENCION_ADUANERA' ELSE 'RETRASO_VUELO' END,
        'Revisión documentaria aleatoria de partida arancelaria en SUNAT Callao.',
        2,
        DATEADD(DAY, -6, SYSDATETIME()),
        DATEADD(DAY, -4, SYSDATETIME()),
        'RESUELTO',
        'Especialista Aduanas Polux',
        'Presentación inmediata de factura comercial Apple USA y liberación de DUA.'
    FROM customers.pedido p
    WHERE p.id_pedido % 10 IN (0, 1, 2);
END
GO

-- Inspección de calidad (OBLIGATORIA con resultado 'APROBADO' antes de insertar en customers.entrega por trigger RB-013)
IF NOT EXISTS (SELECT 1 FROM customers.inspeccion_calidad)
BEGIN
    INSERT INTO customers.inspeccion_calidad
        (id_pedido, numero_intento, estado_empaque_externo, sellos_seguridad_apple, resultado_inspeccion,
         detalle_observaciones, inspector_usuario, fecha_inspeccion)
    SELECT
        p.id_pedido,
        1,
        'CONFORME',
        'INTACTOS',
        'APROBADO',
        'Caja sellada original intacta y precintos de fábrica Apple verificados en sede Trujillo.',
        'CONTROL_CALIDAD_TRUJILLO',
        DATEADD(HOUR, -6, ISNULL(p.fecha_entrega_real, SYSDATETIME()))
    FROM customers.pedido p
    WHERE p.estado_pedido IN ('APROBADO_PARA_ENTREGA', 'CERRADO');

    INSERT INTO customers.verificacion_cumplimiento
        (id_pedido, id_inspeccion, modelo_fisico_detectado, capacidad_fisica, color_fisico,
         numero_serie_imei, resultado_verificacion, evidencia_fotografica_url, verificado_por_ia, id_agente, fecha_verificacion)
    SELECT
        ic.id_pedido,
        ic.id_inspeccion,
        pr.linea_modelo,
        ISNULL(pr.capacidad_almacenamiento, 'N/A'),
        ISNULL(pr.color_oficial, 'Oficial Apple'),
        CONCAT('F2LWR', RIGHT('000000' + CAST(ic.id_pedido AS VARCHAR(6)), 6), 'Y6Q'),
        'CONFORME',
        CONCAT('https://poluximports.pe/inspecciones/serial-', ic.id_pedido, '.jpg'),
        1,
        5, -- AGT_SEGUIMIENTO
        DATEADD(HOUR, -5, ISNULL(p.fecha_entrega_real, SYSDATETIME()))
    FROM customers.inspeccion_calidad ic
    JOIN customers.pedido p ON p.id_pedido = ic.id_pedido
    JOIN payers.orden_contratacion o ON o.id_orden = p.id_orden
    JOIN leads.cotizacion_detalle cd ON cd.id_cotizacion = o.id_cotizacion
    JOIN core.producto_catalogo pr ON pr.id_producto = cd.id_producto;
END
GO

-- Entregas, Confirmación de Entrega y Cierre de Servicio (Solo para pedidos CERRADO)
IF NOT EXISTS (SELECT 1 FROM customers.entrega)
BEGIN
    INSERT INTO customers.entrega
        (id_pedido, modalidad_entrega, direccion_entrega, nombre_persona_recibe,
         documento_identidad_recibe, fecha_coordinada_entrega, fecha_real_entrega, estado_entrega)
    SELECT
        p.id_pedido,
        CASE WHEN p.id_pedido % 3 = 0 THEN 'DESPACHO_DOMICILIO_TRUJILLO' ELSE 'RECOJO_OFICINA_TRUJILLO' END,
        CONCAT('Av. Larco 840 — ', per.ciudad, ', Trujillo'),
        CONCAT(per.nombres, ' ', per.apellidos),
        per.numero_documento,
        p.fecha_entrega_real,
        p.fecha_entrega_real,
        'ENTREGADO'
    FROM customers.pedido p
    JOIN core.persona per ON per.id_persona = p.id_persona
    WHERE p.estado_pedido = 'CERRADO';

    INSERT INTO customers.confirmacion_entrega
        (id_entrega, numero_confirmacion, medio_confirmacion, url_archivo_evidencia,
         tiene_observaciones, detalle_observaciones, fecha_confirmacion)
    SELECT
        e.id_entrega,
        1,
        'ACTA_CONFORMIDAD',
        CONCAT('https://poluximports.pe/actas/entrega-', e.id_entrega, '.pdf'),
        0, -- Sin observaciones para cumplir RB-059
        'Cliente verificó serie Apple en checkcoverage.apple.com y firmó acta de conformidad.',
        DATEADD(MINUTE, 15, e.fecha_real_entrega)
    FROM customers.entrega e;

    INSERT INTO customers.cierre_servicio
        (id_pedido, id_persona, fecha_pago_inicial, fecha_cierre_operativo,
         traspasado_a_postventa, fecha_traspaso, estado_cierre)
    SELECT
        e.id_pedido,
        p.id_persona,
        o.fecha_pago_inicial_confirmado,
        DATEADD(MINUTE, 30, e.fecha_real_entrega),
        1,
        DATEADD(MINUTE, 35, e.fecha_real_entrega),
        'COMPLETADO_EXITOSO'
    FROM customers.entrega e
    JOIN customers.pedido p ON p.id_pedido = e.id_pedido
    JOIN payers.orden_contratacion o ON o.id_orden = p.id_orden;
END
GO

/* ============================================================================
   8. FASE 5 TURNED: CLIENTES FIDELIZADOS, ENCUESTAS NPS Y REFERIDOS
   ============================================================================ */
PRINT 'Insertando Turned, Encuestas NPS y Referidos en esquema turned...';

IF NOT EXISTS (SELECT 1 FROM turned.turned)
BEGIN
    INSERT INTO turned.turned
        (id_persona, fecha_ingreso_turned, criterio_transicion, score_nps_inicial,
         total_referidos_efectivos, total_recompras_90d, fecha_ultima_recompra, estado_fidelizacion)
    SELECT
        cs.id_persona,
        DATEADD(DAY, -1, SYSDATETIME()),
        CASE cs.id_persona % 3
            WHEN 0 THEN 'COMBINADO'
            WHEN 1 THEN 'NPS_PROMOTOR'
            ELSE 'RECOMPRA_90_DIAS'
        END,
        CASE cs.id_persona % 10
            WHEN 0 THEN 6  -- Detractor
            WHEN 1 THEN 7  -- Pasivo
            WHEN 2 THEN 8  -- Pasivo
            WHEN 3 THEN 9  -- Promotor
            ELSE 10        -- Promotor
        END,
        CASE WHEN cs.id_persona % 3 = 0 THEN 1 ELSE 0 END,
        CASE WHEN cs.id_persona % 4 = 0 THEN 1 ELSE 0 END,
        CASE WHEN cs.id_persona % 4 = 0 THEN SYSDATETIME() ELSE NULL END,
        CASE WHEN cs.id_persona % 3 = 0 THEN 'PROMOTOR_DESTACADO' ELSE 'ACTIVO' END
    FROM customers.cierre_servicio cs
    JOIN core.persona per ON per.id_persona = cs.id_persona
    WHERE per.etapa_actual = 'TURNED';
END
GO

-- Encuestas de satisfacción para todos los pedidos cerrados (turned.encuesta_satisfaccion)
IF NOT EXISTS (SELECT 1 FROM turned.encuesta_satisfaccion)
BEGIN
    INSERT INTO turned.encuesta_satisfaccion
        (id_persona, id_pedido, tipo_encuesta, puntaje_nps, puntaje_csat,
         resolucion_primer_contacto_fcr, comentario_cliente, fecha_envio, fecha_respuesta)
    SELECT
        cs.id_persona,
        cs.id_pedido,
        'POST_ENTREGA',
        CASE cs.id_persona % 10
            WHEN 0 THEN 6  -- Detractor (10%)
            WHEN 1 THEN 7  -- Regular / Pasivo (20%)
            WHEN 2 THEN 8
            WHEN 3 THEN 9  -- Promotor (70%)
            ELSE 10
        END AS puntaje_nps,
        CASE WHEN cs.id_persona % 10 = 0 THEN 3 WHEN cs.id_persona % 10 IN (1,2) THEN 4 ELSE 5 END AS puntaje_csat,
        1,
        CASE
            WHEN cs.id_persona % 10 >= 3 THEN 'Excelente servicio en Trujillo, equipo Apple 100% original sellado y seguimiento puntual.'
            WHEN cs.id_persona % 10 IN (1,2) THEN 'El equipo llegó perfecto y sellado, aunque Aduanas demoró un par de días adicionales.'
            ELSE 'El producto es original pero tuve demora en la coordinación del horario de recojo.'
        END,
        DATEADD(HOUR, 2, cs.fecha_cierre_operativo),
        DATEADD(HOUR, 6, cs.fecha_cierre_operativo)
    FROM customers.cierre_servicio cs;
END
GO

IF NOT EXISTS (SELECT 1 FROM turned.referido)
BEGIN
    INSERT INTO turned.referido
        (id_persona_promotor, id_persona_referida, codigo_enlace_referido, estado_referido,
         id_pedido_generado, fecha_registro, fecha_conversion, recompensa_entregada)
    SELECT TOP (1200)
        t.id_persona AS id_persona_promotor,
        ((t.id_persona % 15000) + 50) AS id_persona_referida,
        CONCAT('REF-CLUB-', t.id_persona),
        CASE WHEN t.id_persona % 2 = 0 THEN 'COMPRA_EFECTIVA' ELSE 'COTIZADO' END,
        cs.id_pedido,
        DATEADD(DAY, -5, SYSDATETIME()),
        CASE WHEN t.id_persona % 2 = 0 THEN SYSDATETIME() ELSE NULL END,
        CASE WHEN t.id_persona % 2 = 0 THEN 'Descuento 15% MagSafe Apple Club Polux' ELSE NULL END
    FROM turned.turned t
    JOIN customers.cierre_servicio cs ON cs.id_persona = t.id_persona;
END
GO

/* ============================================================================
   9. TRAZABILIDAD TRANSVERSAL: HISTORIAL DE ETAPAS, ACCIONES IA Y ALERTAS
   ============================================================================ */
PRINT 'Insertando Historial de Etapas (Inmutable), Acciones de Agentes IA y Alertas...';

IF NOT EXISTS (SELECT 1 FROM core.historial_etapa)
BEGIN
    -- Transición 1: UNIVERSO -> BUYER para las 30,000 personas
    INSERT INTO core.historial_etapa
        (id_persona, etapa_anterior, etapa_nueva, motivo_transicion, senal_origen, id_entidad_referencia, tipo_entidad_referencia, fecha_transicion, registrado_por)
    SELECT
        p.id_persona,
        'UNIVERSO',
        'BUYER',
        'Captación inicial mediante campaña digital e interacción verificada.',
        'ENVIO_FORMULARIO_WEB',
        p.id_persona,
        'persona',
        p.fecha_creacion,
        'AGT_MARKETING'
    FROM core.persona p;

    -- Transición 2: BUYER -> LEADS para todos los que llegaron a LEADS o superior
    INSERT INTO core.historial_etapa
        (id_persona, etapa_anterior, etapa_nueva, motivo_transicion, senal_origen, id_entidad_referencia, tipo_entidad_referencia, fecha_transicion, registrado_por)
    SELECT
        l.id_persona,
        'BUYER',
        'LEADS',
        'Intención comercial explícita detectada (consulta de precio final, stock y solicitud de cotización).',
        'SOLICITUD_COTIZACION',
        l.id_persona,
        'lead',
        l.fecha_ingreso_lead,
        'AGT_MARKETING'
    FROM leads.lead l;

    -- Transición 3: LEADS -> PAYER para todos los que llegaron a PAYER o superior
    INSERT INTO core.historial_etapa
        (id_persona, etapa_anterior, etapa_nueva, motivo_transicion, senal_origen, id_entidad_referencia, tipo_entidad_referencia, fecha_transicion, registrado_por)
    SELECT
        o.id_persona,
        'LEADS',
        'PAYER',
        'Pago validado en pasarela PoluxPay y orden de contratación formalizada.',
        'PAGO_VALIDADO',
        o.id_orden,
        'orden_contratacion',
        o.fecha_pago_inicial_confirmado,
        'AGT_COBRANZA'
    FROM payers.orden_contratacion o;

    -- Transición 4: PAYER -> CUSTOMER para todos los que recibieron pedido/entrega
    INSERT INTO core.historial_etapa
        (id_persona, etapa_anterior, etapa_nueva, motivo_transicion, senal_origen, id_entidad_referencia, tipo_entidad_referencia, fecha_transicion, registrado_por)
    SELECT
        cs.id_persona,
        'PAYER',
        'CUSTOMER',
        'Equipo Apple entregado en Trujillo con serie verificada y cierre de servicio conforme.',
        'ENTREGA_CONFORME',
        cs.id_pedido,
        'pedido',
        cs.fecha_cierre_operativo,
        'AGT_SEGUIMIENTO'
    FROM customers.cierre_servicio cs;

    -- Transición 5: CUSTOMER -> TURNED para los clientes fidelizados
    INSERT INTO core.historial_etapa
        (id_persona, etapa_anterior, etapa_nueva, motivo_transicion, senal_origen, id_entidad_referencia, tipo_entidad_referencia, fecha_transicion, registrado_por)
    SELECT
        t.id_persona,
        'CUSTOMER',
        'TURNED',
        'Cliente Promotor NPS (9-10) / Recompra efectiva incorporado al programa Apple Club Polux.',
        t.criterio_transicion,
        t.id_persona,
        'turned',
        t.fecha_ingreso_turned,
        'AGT_PLATAFORMA'
    FROM turned.turned t;
END
GO

IF NOT EXISTS (SELECT 1 FROM core.accion_agente)
BEGIN
    INSERT INTO core.accion_agente
        (id_agente, id_persona, tipo_accion, entidad_afectada, id_entidad_afectada,
         decision_tomada, datos_sustento_json, nivel_confianza_ia, requirio_aprobacion,
         aprobada_por_humano, resultado_ejecucion, fecha_ejecucion)
    SELECT TOP (30000)
        CASE p.etapa_actual
            WHEN 'BUYER' THEN 1
            WHEN 'LEADS' THEN 3
            WHEN 'PAYER' THEN 4
            WHEN 'CUSTOMER' THEN 5
            ELSE 6
        END AS id_agente,
        p.id_persona,
        CASE p.etapa_actual
            WHEN 'BUYER' THEN 'RECOMENDACION_CONTENIDO'
            WHEN 'LEADS' THEN 'PRIORIZACION_LEAD'
            WHEN 'PAYER' THEN 'VALIDACION_PAGO'
            WHEN 'CUSTOMER' THEN 'NOTIFICACION_HITO'
            ELSE 'ACTIVACION_FIDELIZACION'
        END AS tipo_accion,
        LOWER(p.etapa_actual),
        p.id_persona,
        CONCAT('Acción autónoma IA ejecutada para ', p.nombres, ' ', p.apellidos, ' (Código: ', p.codigo_cliente, ') en fase ', p.etapa_actual, '.'),
        CONCAT('{"etapa":"', p.etapa_actual, '","ciudad":"', p.ciudad, '","confianza":94.5}'),
        94.50,
        0,
        NULL,
        'EXITOSO',
        p.fecha_actualizacion
    FROM core.persona p;
END
GO

IF NOT EXISTS (SELECT 1 FROM core.alerta_operativa)
BEGIN
    INSERT INTO core.alerta_operativa
        (fase, codigo_tipo_alerta, id_persona, id_entidad_referencia, tipo_entidad_referencia,
         accion_recomendada, rol_responsable, estado_alerta, fecha_generacion)
    SELECT TOP (500)
        CASE p.etapa_actual
            WHEN 'BUYER' THEN 'BUYERS'
            WHEN 'LEADS' THEN 'LEADS'
            WHEN 'PAYER' THEN 'PAYERS'
            WHEN 'CUSTOMER' THEN 'CUSTOMERS'
            ELSE 'TURNED'
        END,
        CASE p.etapa_actual
            WHEN 'BUYER' THEN 'BUYER_ALTA_INTENCION_DETECTADA'
            WHEN 'LEADS' THEN 'COTIZACION_SIN_FORMALIZAR_24H'
            WHEN 'PAYER' THEN 'ARRIBO_TRUJILLO_COORDINAR_SALDO'
            WHEN 'CUSTOMER' THEN 'INSPECCION_FISICA_APROBADA'
            ELSE 'RECOMPENSA_REFERIDO_EFECTIVO'
        END,
        p.id_persona,
        p.id_persona,
        'persona',
        'Ejecutar protocolo de contacto proactivo por WhatsApp según matriz de impulsamiento IMPULSE.',
        'AGENTE_IA',
        'ACTIVA',
        SYSDATETIME()
    FROM core.persona p
    ORDER BY p.id_persona ASC;
END
GO

PRINT '=== RESUMEN DE CONTEO DE FILAS EN POLUXIMPORTDB ===';
SELECT
    s.name AS Esquema,
    t.name AS Tabla,
    SUM(p.rows) AS Total_Filas
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
GROUP BY s.name, t.name
ORDER BY SUM(p.rows) DESC, s.name, t.name;
GO
