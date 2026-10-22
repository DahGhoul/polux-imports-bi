# POLUX AI PLATFORM · POLUX IMPORTS S.A.C.
> **Sistema Transaccional OLTP, Data Mart Dimensional y Plataforma Web de Inteligencia Comercial**  
> Proyecto Universitario de Inteligencia de Negocios · Metodología IMPULSE · Trujillo, Perú

---

## 🚀 Resumen del Proyecto

Plataforma integral desarrollada para la importación y comercialización de tecnología Apple original (iPhone 16 Pro, MacBook M4, iPad Air, Apple Watch Series 10 y AirPods) traída directamente de Miami a Trujillo.

El sistema implementa el ciclo de vida completo del cliente (**BUYERS → LEADS → PAYERS → CUSTOMERS → TURNED**) con trazabilidad 360°, automatización con agentes inteligentes y análisis en tiempo real sobre más de **1.38 millones de registros** en SQL Server 2022.

---

## 📦 Estructura del Entregable

```text
polux-ai-platform/
├── bd/                                  # Scripts oficiales SQL Server 2022
│   ├── EJECUTAR_TODO_BD.bat             # Despliegue automático de toda la BD (1 clic)
│   ├── 00_fase0_nucleo_compartido.sql   # DDL Esquema core (personas, catálogos, agentes)
│   ├── 01_fase1_buyers.sql              # DDL Esquema buyers (eventos, consultas, formularios)
│   ├── 02_fase2_leads.sql               # DDL Esquema leads (intención, cotizaciones, propuestas)
│   ├── 03_fase3_payers.sql              # DDL Esquema payers (órdenes, cuotas, pagos PoluxPay)
│   ├── 04_fase4_customers.sql           # DDL Esquema customers (pedidos, inspección, entregas)
│   ├── 05_fase5_turned.sql              # DDL Esquema turned (encuestas NPS, fidelización)
│   ├── 06_poblacion_masiva_1M.sql       # DML 1,387,610+ registros generados por conjuntos
│   ├── 07_modelo_dimensional_poluxmart.sql # DDL Data Mart Estrella (PoluxImportMart)
│   ├── 08_etl_merge_poluxmart.sql       # ETL con MERGE hacia dimensiones y hechos
│   └── 09_reparar_codificacion_utf8.sql # Corrección UTF-8 (tildes y caracteres especiales)
├── backend/                             # API REST en NestJS + TypeORM + SQL Server
│   ├── src/controllers/                 # Controladores REST (/proyectobi)
│   └── src/services/                    # Lógica de agentes, embudo y reportes BI
├── frontend/                            # Aplicación React + Vite + Apple Design System
│   ├── src/pages/                       # Landing Apple, Dashboard, Fases y BI Analytics
│   ├── src/components/                  # Pasarela PoluxPay, Guía Demostrativa y Layout
│   └── src/refine.css                   # Capa estética refinada estilo Apple Graphite
├── INICIAR_POLUX.bat                    # Script para levantar backend y frontend localmente
├── DETENER_POLUX.bat                    # Script para detener los servicios
├── docker-compose.yml                   # Orquestación opcional en contenedores
└── README.md                            # Guía de instalación y uso
```

---

## 🗄️ 1. Base de Datos (`PoluxImportDB` y `PoluxImportMart`)

### Despliegue Rápido en SQL Server 2022
1. Abrir la carpeta `bd/`.
2. Ejecutar con doble clic:
   ```cmd
   EJECUTAR_TODO_BD.bat
   ```
   *(O desde PowerShell/CMD: `sqlcmd -S localhost -E -I -f 65001 -i bd\EJECUTAR_TODO_BD.bat`)*

### Estadísticas de Población Verificadas
- **Total Registros:** `1,387,610` registros distribuidos lógicamente entre las 32 tablas.
- **core.persona:** `80,000` clientes únicos en Trujillo (`50,000 BUYERS`, `18,000 LEADS`, `4,000 PAYERS`, `4,000 CUSTOMERS`, `4,000 TURNED`).
- **buyers.evento_web:** `350,000` eventos en landing y formularios.
- **buyers.consulta:** `110,000` consultas de clientes atendidas por IA / Asesores.
- **core.historial_etapa:** `134,013` transiciones de embudo auditadas.
- **core.accion_agente:** `100,000` bitácoras operativas de agentes autónomos.
- **PoluxImportMart:** Data Mart dimensional poblado con `MERGE` sincronizando dimensiones (`DimPersona`, `DimTiempo`, `DimProducto`, `DimCanal`, `DimAgente`, `DimEficiencia`, `DimSatisfaccion`) y tablas de hechos (`FactCaptacionBuyers`, `FactNegociacionLeads`, `FactCobranzaPayers`, `FactOperacionesCustomers`, `FactVentasPedidos`, `FactFidelizacionTurned`).

---

## 💻 2. Cómo Levantar el Software

### Requisitos Previos
- **Node.js** v18+ instalado.
- **SQL Server 2022** en ejecución en `localhost` con autenticación Windows o usuario `sa` (`PoluxDemo_2026!`).

### Paso a Paso
1. **Instalar dependencias del Backend:**
   ```bash
   cd backend
   npm install
   npm run build
   ```
2. **Instalar dependencias del Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```
3. **Ejecutar el Sistema:**
   - Opción 1: Ejecutar el archivo `INICIAR_POLUX.bat`.
   - Opción 2: En dos terminales separadas:
     ```bash
     # Terminal 1: Backend (puerto 3000)
     cd backend && node dist/main.js

     # Terminal 2: Frontend (puerto 8080)
     cd frontend && npm run dev -- --port 8080
     ```

4. **Navegación:**
   - **Tienda / Landing Oficial (Estilo Apple):** [http://localhost:8080/landing](http://localhost:8080/landing)
   - **Tablero General & BI:** [http://localhost:8080/](http://localhost:8080/)
   - **Reportes Oficiales del Informe (Anexos 3, 4, 5 y 6):** [http://localhost:8080/analytics](http://localhost:8080/analytics)
   - **Command Center Multi-Agente:** [http://localhost:8080/agents](http://localhost:8080/agents)

---

## 📊 3. Reportes Oficiales del Informe Implementados en Software

Desde el módulo `/analytics` se visualizan en tiempo real los reportes requeridos:
1. **Anexo 3 (Fase BUYERS):** Interacción y captación por canal (Enero, Febrero, Marzo × WhatsApp, Instagram, TikTok, Anuncio Pagado).
2. **Anexo 4 (Fase BUYERS):** Resolución de consultas por tema con Agente FAQ (Autenticidad, Garantía, Tiempo de entrega, Medio de pago, Stock/precio).
3. **Anexo 5 (Fase LEADS):** Leads e intención de compra con Agente Negociador por jerarquía de 3 niveles: Mes → Categoría Apple → Nivel de Intención.
4. **Reporte Fase 3 (PAYERS):** Conciliación Financiera PoluxPay y Pedidos Listos en Trujillo por Mes, Modalidad y Medio de Pago (Tabla 6).
5. **Anexo 6 (Fase CUSTOMERS):** Entregas y confirmación por modalidad (Domicilio, Punto de recojo, Transportista tercero) con cumplimiento a tiempo y actas de conformidad.

---

## 👥 Equipo de Trabajo
- **Dúo 1:** Corrección de Modelos E-R y Esquemas Dimensionales.
- **Dúo 2:** Análisis Dimensional y Fichas de Tablas de Hechos.
- **Dúo 3 (Diego e Imanol):** Poblado Masivo de Base de Datos (1 Millón+ de Registros), Desarrollo de Software (React + NestJS) y Reportes Oficiales en Vivo.
