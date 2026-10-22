# DOCUMENTACIÓN TÉCNICA Y FICHAS DE TABLAS DE HECHOS (DATA WAREHOUSE)
## 👥 Responsables: DÚO 2 (Ronaldo y Anghela)
### Proyecto: Sistema Polux Imports S.A.C. · Inteligencia de Negocios (Metodología IMPULSE)
---

Este documento contiene la **documentación formal y técnica de las Tablas de Hechos (Fact Tables)** y la **verificación matemática de indicadores** para actualizar los puntos **3.4, 4.3, 5.2 y 6.2** del informe final. Corresponde exactamente con el script DDL oficial implementado en SQL Server 2022: [`bd/07_modelo_dimensional_poluxmart.sql`](file:///c:/Users/Diego/Downloads/UNIDAD%20I-20260917T042929Z-1-001/UNIDAD%20I/bd/07_modelo_dimensional_poluxmart.sql).

---

## 📌 PARTE 1: VERIFICACIÓN DE INDICADORES (KPIS) POR FASE DEL INFORME

| Sección del Informe | Proceso de Negocio | Indicador / KPI Principal | Fórmula Matemática | Medidas en la Tabla de Hechos |
| :--- | :--- | :--- | :--- | :--- |
| **3.4 (BUYERS)** | Interacción y Captación de Clientes Potenciales | **Tasa de Captación Digital** | $\frac{\text{Formularios Válidos}}{\text{Visitantes Únicos Landing}} \times 100$ | `CantidadFormulariosValidos`, `CantidadConsultas` en `FactCaptacionBuyers` |
| **3.4 (BUYERS)** | Atención Omnicanal por Agente FAQ | **Tasa de Resolución Automática IA** | $\frac{\text{Consultas Resueltas por IA}}{\text{Total de Consultas Atendidas}} \times 100$ | `CantidadResueltasIA`, `CantidadConsultas` en `FactCaptacionBuyers` |
| **4.3 (LEADS)** | Calificación de Intención y Propuestas | **Tasa de Necesidad Identificada** | $\frac{\text{Leads con Necesidad Completa}}{\text{Total de Leads Calificados}} \times 100$ | `CantidadNecesidadCompleta`, `CantidadCotizaciones` en `FactNegociacionLeads` |
| **4.3 (LEADS)** | Negociación y Cierre de Cotizaciones | **Tasa de Conversión Lead a Payer** | $\frac{\text{Cotizaciones Aceptadas}}{\text{Total de Cotizaciones Emitidas}} \times 100$ | `CantidadCotizacionAceptada`, `CantidadCotizaciones` en `FactNegociacionLeads` |
| **5.2 (PAYERS)** | Conciliación Financiera PoluxPay | **Tasa de Pagos Validados por IA** | $\frac{\text{Pagos Validados Automáticamente}}{\text{Total Pagos Recibidos}} \times 100$ | `CantidadPagosValidadosIA`, `CantidadPagos` en `FactCobranzaPayers` |
| **5.2 (PAYERS)** | Activación Operativa de Importación | **Tasa de Activación de Órdenes** | $\frac{\text{Órdenes con Pago Inicial Conforme}}{\text{Total Órdenes Emitidas}} \times 100$ | `CantidadOrdenActivada`, `MontoPagadoPEN` en `FactCobranzaPayers` |
| **6.2 (CUSTOMERS)** | Inspección, Logística USA y Entrega Trujillo | **Tasa de Cumplimiento a Tiempo (OTIF)** | $\frac{\text{Entregas Realizadas } \le \text{ Fecha Estimada}}{\text{Total Entregas Realizadas}} \times 100$ | `CantidadEntregasATiempo`, `CantidadEntregasExitosas` en `FactOperacionesCustomers` |
| **6.2 (CUSTOMERS)** | Trazabilidad y Calidad Física en Almacén | **Tasa de Aprobación de Inspección** | $\frac{\text{Inspecciones Físicas Aprobadas}}{\text{Total Pedidos Arribados a Trujillo}} \times 100$ | `CantidadInspeccionAprobada`, `CantidadPedidos` en `FactOperacionesCustomers` |
| **6.2 (TURNED)** | Satisfacción Postventa y Apple Club | **Net Promoter Score (NPS)** | $\% \text{Promotores (9-10)} - \% \text{Detractores (0-6)}$ | `CantidadPromotores`, `CantidadDetractores`, `CantidadEncuestas` en `FactFidelizacionTurned` |

---

## 📋 PARTE 2: FICHAS TÉCNICAS DE LAS TABLAS DE HECHOS (DATA MART `PoluxImportMart`)

### Ficha Técnica 1: `FactCaptacionBuyers`
* **Sección del Informe:** 3.4 Modelo Dimensional Fase BUYERS (Agente de Marketing y FAQ).
* **Granularidad:** Un registro por cada consulta o interacción individual atendida por el sistema o agente en un canal específico.
* **Tabla en Data Mart:** `PoluxImportMart.dbo.FactCaptacionBuyers`

| Nombre del Campo | Tipo de Dato | Clasificación / Rol | Descripción y Regla de Negocio |
| :--- | :--- | :--- | :--- |
| `KeyCaptacionBuyer` | `INT IDENTITY(1,1)` | Clave Primaria (Surrogada) | Identificador secuencial interno de la tabla de hechos. |
| `KeyTiempo` | `INT` | Clave Foránea (FK) | Conexión con `DimTiempo` (Día, Mes, Trimestre, Año, DíaSemana). |
| `KeyPersona` | `INT` | Clave Foránea (FK) | Conexión con `DimPersona` (Datos demográficos, NSE, Distrito Trujillo). |
| `KeyProducto` | `INT` | Clave Foránea (FK) | Conexión con `DimProducto` (Equipo Apple cotizado, Gama, Categoría). |
| `KeyCanal` | `INT` | Clave Foránea (FK) | Conexión con `DimCanal` (WhatsApp, Instagram, TikTok, Anuncio Pagado). |
| `KeyAgente` | `INT` | Clave Foránea (FK) | Conexión con `DimAgente` (`AG_CAPTACION` o `AG_FAQ`). |
| `CantidadConsultas` | `INT` | Medida Aditiva | Conteo de consultas recibidas (valor base = 1). |
| `CantidadResueltasIA` | `INT` | Medida Aditiva | `1` si fue resuelta de forma autónoma por la IA; `0` si requirió asesor. |
| `CantidadDerivadasHumano` | `INT` | Medida Aditiva | `1` si fue escalada a un asesor humano de ventas. |
| `CantidadFormulariosValidos` | `INT` | Medida Aditiva | `1` si completó formulario sin duplicidad de DNI/Celular. |
| `CantidadTransicionLead` | `INT` | Medida Aditiva | `1` si el Buyer calificó e ingresó a la fase de LEADS. |
| `PuntajeCalificacionUsuario` | `INT` | Medida Semi-aditiva | Valoración del usuario sobre la respuesta (1 a 5 estrellas). |
| `idConsulta` | `BIGINT` | Clave Degenerada | Código original transaccional en `buyers.consulta` (Trazabilidad OLTP). |

---

### Ficha Técnica 2: `FactNegociacionLeads`
* **Sección del Informe:** 4.3 Modelo Dimensional Fase LEADS (Agente Negociador y Propuestas).
* **Granularidad:** Un registro por cada cotización formal emitida y evaluada para un lead calificado.
* **Tabla en Data Mart:** `PoluxImportMart.dbo.FactNegociacionLeads`

| Nombre del Campo | Tipo de Dato | Clasificación / Rol | Descripción y Regla de Negocio |
| :--- | :--- | :--- | :--- |
| `KeyNegociacionLead` | `INT IDENTITY(1,1)` | Clave Primaria (Surrogada) | Identificador secuencial interno del hecho de negociación. |
| `KeyTiempo` | `INT` | Clave Foránea (FK) | Conexión con `DimTiempo`. |
| `KeyPersona` | `INT` | Clave Foránea (FK) | Conexión con `DimPersona` (Perfil 360° del comprador). |
| `KeyProducto` | `INT` | Clave Foránea (FK) | Conexión con `DimProducto` (Modelo Apple cotizado). |
| `KeyCanal` | `INT` | Clave Foránea (FK) | Conexión con `DimCanal`. |
| `KeyAgente` | `INT` | Clave Foránea (FK) | Conexión con `DimAgente` (`AG_NEGOCIADOR`). |
| `CantidadCotizaciones` | `INT` | Medida Aditiva | Conteo de cotizaciones emitidas (valor = 1). |
| `CantidadNecesidadCompleta` | `INT` | Medida Aditiva | `1` si tiene equipo de interés, presupuesto y uso registrado. |
| `CantidadPropuestaRespondida` | `INT` | Medida Aditiva | `1` si el lead seleccionó una de las 3 alternativas comerciales. |
| `CantidadIntencionAlta` | `INT` | Medida Aditiva | `1` si el algoritmo clasificó la intención en nivel ALTO ($\ge 80$). |
| `CantidadCotizacionAceptada` | `INT` | Medida Aditiva | `1` si aceptó la oferta y pasó a emitir orden de pago (PAYER). |
| `SubtotalCotizadoPEN` | `DECIMAL(12,2)` | Medida Aditiva | Monto bruto cotizado en Soles. |
| `DescuentoCotizadoPEN` | `DECIMAL(12,2)` | Medida Aditiva | Descuento aplicado respetando los márgenes autorizados. |
| `TotalCotizadoPEN` | `DECIMAL(12,2)` | Medida Aditiva | Monto neto final acordado en Soles. |
| `PuntajeIntencion` | `DECIMAL(5,2)` | Medida Semi-aditiva | Score de propensión de compra calculado por el agente (0 a 100). |
| `idCotizacion` | `BIGINT` | Clave Degenerada | Código original en `leads.cotizacion`. |

---

### Ficha Técnica 3: `FactCobranzaPayers`
* **Sección del Informe:** 5.2 Modelo Dimensional Fase PAYERS (Pasarela PoluxPay y Finanzas).
* **Granularidad:** Un registro por cada transacción o abono financiero procesado por una orden de compra.
* **Tabla en Data Mart:** `PoluxImportMart.dbo.FactCobranzaPayers`

| Nombre del Campo | Tipo de Dato | Clasificación / Rol | Descripción y Regla de Negocio |
| :--- | :--- | :--- | :--- |
| `KeyCobranzaPayer` | `INT IDENTITY(1,1)` | Clave Primaria (Surrogada) | Identificador secuencial interno de cobranza. |
| `KeyTiempo` | `INT` | Clave Foránea (FK) | Conexión con `DimTiempo` (Fecha de abono/transacción). |
| `KeyPersona` | `INT` | Clave Foránea (FK) | Conexión con `DimPersona`. |
| `KeyProducto` | `INT` | Clave Foránea (FK) | Conexión con `DimProducto`. |
| `KeyModalidadPago` | `INT` | Clave Foránea (FK) | Conexión con `DimModalidadPago` (Contado, Cuotas, Adelanto). |
| `KeyAgente` | `INT` | Clave Foránea (FK) | Conexión con `DimAgente` (`AG_SEGUIMIENTO` y Pasarela PoluxPay). |
| `CantidadPagos` | `INT` | Medida Aditiva | Número de transacciones bancarias (valor = 1). |
| `CantidadPagosValidadosIA` | `INT` | Medida Aditiva | `1` si fue validado y conciliado por el agente; `0` si fue observado. |
| `CantidadComprobantesSUNAT` | `INT` | Medida Aditiva | `1` si se generó y emitió boleta/factura electrónica SUNAT. |
| `CantidadOrdenActivada` | `INT` | Medida Aditiva | `1` si el abono cubrió el importe requerido para iniciar importación. |
| `MontoPagadoPEN` | `DECIMAL(12,2)` | Medida Aditiva | Importe recaudado en Soles. |
| `MontoAcordadoOrdenPEN` | `DECIMAL(12,2)` | Medida Aditiva | Valor total contractual de la orden. |
| `SaldoPendienteOrdenPEN` | `DECIMAL(12,2)` | Medida Semi-aditiva | Monto restante por liquidar previo a la entrega en Trujillo. |
| `idPago` | `BIGINT` | Clave Degenerada | Código original en `payers.pago`. |

---

### Ficha Técnica 4: `FactOperacionesCustomers`
* **Sección del Informe:** 6.2 Modelo Dimensional Fase CUSTOMERS (Logística, Inspección y Entrega).
* **Granularidad:** Un registro por cada pedido físico despachado e inspeccionado en la sede Trujillo.
* **Tabla en Data Mart:** `PoluxImportMart.dbo.FactOperacionesCustomers`

| Nombre del Campo | Tipo de Dato | Clasificación / Rol | Descripción y Regla de Negocio |
| :--- | :--- | :--- | :--- |
| `KeyOperacionCustomer` | `INT IDENTITY(1,1)` | Clave Primaria (Surrogada) | Identificador secuencial de operaciones. |
| `KeyTiempo` | `INT` | Clave Foránea (FK) | Conexión con `DimTiempo` (Fecha de entrega física). |
| `KeyPersona` | `INT` | Clave Foránea (FK) | Conexión con `DimPersona`. |
| `KeyProducto` | `INT` | Clave Foránea (FK) | Conexión con `DimProducto`. |
| `KeyHitoLogistico` | `INT` | Clave Foránea (FK) | Conexión con `DimHitoLogistico` (Miami, Aduanas, Trujillo). |
| `KeyEficiencia` | `INT` | Clave Foránea (FK) | Conexión con `DimEficiencia` (A tiempo, Con retraso leve, Crítico). |
| `KeyAgente` | `INT` | Clave Foránea (FK) | Conexión con `DimAgente` (`AG_LOGISTICA`). |
| `CantidadPedidos` | `INT` | Medida Aditiva | Total de pedidos procesados (valor = 1). |
| `CantidadInspeccionAprobada` | `INT` | Medida Aditiva | `1` si empaque y sellos Apple USA llegaron intactos a Trujillo. |
| `CantidadEntregasExitosas` | `INT` | Medida Aditiva | `1` si el cliente firmó el acta de conformidad sin observaciones. |
| `CantidadEntregasATiempo` | `INT` | Medida Aditiva | `1` si la entrega real cumplió la fecha estimada contractual. |
| `CantidadImprevistos` | `INT` | Medida Aditiva | Número de incidencias logísticas o aduaneras registradas. |
| `CantidadActualizacionesIA` | `INT` | Medida Aditiva | Mensajes de trazabilidad proactiva enviados al cliente. |
| `DiasCicloPedido` | `INT` | Medida Aditiva | Días transcurridos desde el pago inicial hasta la entrega final. |
| `DiasVariacionEntrega` | `INT` | Medida Aditiva | Desviación en días respecto al compromiso pactado. |
| `idPedido` | `BIGINT` | Clave Degenerada | Código original en `customers.pedido`. |

---

### Ficha Técnica 5: `FactFidelizacionTurned`
* **Sección del Informe:** 6.2 Modelo Dimensional Postventa y Fidelización (Fase TURNED).
* **Granularidad:** Un registro por cada encuesta de satisfacción NPS y ticket postventa gestionado.
* **Tabla en Data Mart:** `PoluxImportMart.dbo.FactFidelizacionTurned`

| Nombre del Campo | Tipo de Dato | Clasificación / Rol | Descripción y Regla de Negocio |
| :--- | :--- | :--- | :--- |
| `KeyFidelizacionTurned` | `INT IDENTITY(1,1)` | Clave Primaria (Surrogada) | Identificador secuencial de fidelización. |
| `KeyTiempo` | `INT` | Clave Foránea (FK) | Conexión con `DimTiempo`. |
| `KeyPersona` | `INT` | Clave Foránea (FK) | Conexión con `DimPersona`. |
| `KeyProducto` | `INT` | Clave Foránea (FK) | Conexión con `DimProducto`. |
| `KeySatisfaccion` | `INT` | Clave Foránea (FK) | Conexión con `DimSatisfaccion` (Promotor, Pasivo, Detractor). |
| `KeyAgente` | `INT` | Clave Foránea (FK) | Conexión con `DimAgente` (`AG_FIDELIZACION`). |
| `CantidadEncuestas` | `INT` | Medida Aditiva | Conteo de encuestas NPS respondidas. |
| `CantidadPromotores` | `INT` | Medida Aditiva | `1` si calificó con 9 o 10; `0` en otro caso. |
| `CantidadPasivos` | `INT` | Medida Aditiva | `1` si calificó con 7 u 8; `0` en otro caso. |
| `CantidadDetractores` | `INT` | Medida Aditiva | `1` si calificó con 0 a 6; `0` en otro caso. |
| `CantidadResolucionFCR` | `INT` | Medida Aditiva | `1` si el soporte técnico postventa resolvió en el 1er contacto. |
| `CantidadRecompras90d` | `INT` | Medida Aditiva | Compras posteriores de accesorios o equipos en 90 días. |
| `CantidadReferidosEfectivos`| `INT` | Medida Aditiva | Amigos o familiares referidos que llegaron a comprar. |
| `PuntajeNPS` | `INT` | Medida Semi-aditiva | Calificación otorgada en escala estándar del 0 al 10. |
| `PuntajeCSAT` | `INT` | Medida Semi-aditiva | Satisfacción con la atención postventa (1 al 5). |
| `idEncuesta` | `BIGINT` | Clave Degenerada | Código original en `turned.encuesta_satisfaccion`. |

---

### Ficha Técnica 6: `FactVentasPedidos`
* **Sección del Informe:** Consolidado Estratégico Corporativo (Visión Directiva de Ventas y Margen).
* **Granularidad:** Un registro por cada pedido cerrado y facturado.
* **Tabla en Data Mart:** `PoluxImportMart.dbo.FactVentasPedidos`

| Nombre del Campo | Tipo de Dato | Clasificación / Rol | Descripción y Regla de Negocio |
| :--- | :--- | :--- | :--- |
| `KeyVentaPedido` | `INT IDENTITY(1,1)` | Clave Primaria (Surrogada) | Identificador secuencial de ventas. |
| `KeyTiempo`, `KeyPersona`, `KeyProducto`, `KeyCampana`, `KeyAgente`, `KeyEficiencia`, `KeySatisfaccion` | `INT` | Claves Foráneas (FK) | Dimensiones de análisis comercial y financiero. |
| `CantidadUnidades` | `INT` | Medida Aditiva | Equipos Apple adquiridos por pedido. |
| `MontoVentaTotalPEN` | `DECIMAL(12,2)` | Medida Aditiva | Total facturado en Soles. |
| `MontoPagadoValidadoPEN` | `DECIMAL(12,2)` | Medida Aditiva | Importe bancarizado verificado. |
| `CostoReferencialPEN` | `DECIMAL(12,2)` | Medida Aditiva | Costo de importación CIF Miami-Callao. |
| `MargenBrutoPEN` | `DECIMAL(12,2)` | Medida Aditiva | $\text{MontoVentaTotalPEN} - \text{CostoReferencialPEN}$. |
| `DocumentoPedido` | `VARCHAR(30)` | Clave Degenerada | Número único de pedido (ej. `PED-2025-001201`). |

---

## ⚠️ PARTE 3: CORRECCIÓN DE TÍTULOS DE FIGURAS EN EL INFORME (OBSERVACIÓN CRÍTICA)

En el documento Word actual (`INFORME FINAL_G5.pdf` / `finalito`), los títulos de las figuras del modelo dimensional tienen nombres duplicados o erróneos que el docente Dr. Ricardo Mendoza Rivera observará de inmediato. **Deben cambiarse por los siguientes títulos correctos:**

1. **Página 10 (Sección 3.4):**  
   * ❌ Actual: `Figura 2. Esquema de Modelo Dimensional de Buyers`  
   * ✅ **Correcto:** `Figura 2. Esquema de Modelo Dimensional en Estrella: Proceso de Captación y Consultas (Fase BUYERS)`
2. **Página 16 (Sección 4.3):**  
   * ❌ Actual: `Figura 4. Esquema de Modelo Dimensional de Buyers` *(¡Decía Buyers en lugar de Leads!)*  
   * ✅ **Correcto:** `Figura 4. Esquema de Modelo Dimensional en Estrella: Negociación y Calificación de Intención (Fase LEADS)`
3. **Página 21 (Sección 5.2):**  
   * ❌ Actual: `Figura 6. Esquema de Modelo Dimensional de Buyers` *(¡Decía Buyers en lugar de Payers!)*  
   * ✅ **Correcto:** `Figura 6. Esquema de Modelo Dimensional en Estrella: Conciliación de Pagos y Recaudación (Fase PAYERS)`
4. **Página 28 (Sección 6.2):**  
   * ❌ Actual: `Figura 8. Esquema de Modelo Dimensional de Customers`  
   * ✅ **Correcto:** `Figura 8. Esquema de Modelo Dimensional en Estrella: Operaciones Logísticas, Inspección y Entregas (Fase CUSTOMERS)`
5. **Página 28 (Sección 6.2.2):**  
   * ❌ Actual: `Figura 9. Esquema de Modelo Dimensional de Trazabilidad Pedidos`  
   * ✅ **Correcto:** `Figura 9. Esquema de Modelo Dimensional en Estrella: Fidelización, Retención y Net Promoter Score (Fase TURNED)`
