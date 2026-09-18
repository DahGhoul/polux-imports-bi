# POLUX AI PLATFORM

Plataforma web académica para **Polux Imports**, enfocada en los apartados **3.6 BUYERS — Agente de Marketing** y **4.6 LEADS — Agente Negociador** del Trabajo 01 de Inteligencia de Negocios.

La aplicación está preparada como una demo operacional real: usa **React + TypeScript**, **NestJS**, **Microsoft SQL Server 2022** y **Docker Compose**. Los datos son **sintéticos** y se cargan automáticamente para poder exponer el sistema sin depender de integraciones externas.

## Qué incluye

### BUYERS — Agente de Marketing

- Listado de personas potenciales con búsqueda y prioridad.
- Perfil 360° con datos personales, laborales, universidad, NSE, intereses, presupuesto, producto principal, canal y fuente de adquisición.
- Comportamiento observado: vistas de producto, consultas, formularios, cotizaciones e historial.
- Score explicable de intención comercial.
- Motor de reglas para detectar intención explícita.
- Simulación de eventos en vivo.
- Transición automática **BUYER → LEAD** conservando todo el historial.
- Trazabilidad de decisiones del agente.

### LEADS — Agente Negociador

- Perfil comercial 360° heredado desde BUYERS.
- Prioridad ALTA / MEDIA / BAJA.
- Probabilidad estimada de conversión.
- Cotización vigente.
- Recomendación de siguiente mejor acción.
- Generación de 3 alternativas de propuesta comercial.
- Guardrails: descuentos especiales y reclamos se escalan a humano.
- Simulación de confirmación del primer pago y transición **LEAD → PAYER**.

### BI / Inteligencia de Negocios

- Dashboard operacional de embudo.
- KPI de BUYERS según el informe.
- Rendimiento de campañas simuladas.
- SQL Server OLTP: `POLUX_OLTP`.
- Scripts opcionales para un futuro `POLUX_DW` dimensional y ETL en `database/bi/`.

---

# Inicio rápido con Docker Desktop

## Requisitos

- Docker Desktop abierto.
- Docker Compose habilitado.
- Puertos libres: `8080`, `3000` y `1433`.
- Recomendado: 4 GB o más de memoria disponible para Docker, porque SQL Server es el contenedor más pesado.

## Opción 1 — Windows, doble clic

Ejecutar:

```text
INICIAR_POLUX.bat
```

Al terminar el primer build, abrir:

```text
http://localhost:8080
```

## Opción 2 — Terminal

Desde la carpeta del proyecto:

```bash
docker compose up -d --build
```

Luego:

- Aplicación: http://localhost:8080
- API: http://localhost:3000/api/health
- Swagger: http://localhost:3000/docs
- SQL Server: localhost:1433

Credenciales SQL Server de la demo:

```text
Servidor: localhost,1433
Usuario: sa
Password: PoluxDemo_2026!
Base: POLUX_OLTP
```

> Para cambiar la contraseña, copiar `.env.example` como `.env` y editar `MSSQL_SA_PASSWORD` antes del primer arranque.

## Ver logs

```bash
docker compose logs -f
```

## Detener

```bash
docker compose down
```

Para conservar los datos, usar el comando anterior. Para borrar también el volumen SQL y volver a crear todo desde cero:

```bash
docker compose down -v
```

---

# Flujo recomendado para la exposición

1. Abrir **Overview** y explicar el embudo operacional.
2. Entrar a **Buyers**.
3. Buscar **Valeria Mendoza**.
4. Abrir su perfil 360° y enseñar gustos, presupuesto, producto, comportamiento y score.
5. Presionar **Simular precio final** o **Solicitar cotización**.
6. El sistema detectará intención explícita y la persona cambiará automáticamente de **BUYER → LEAD**.
7. Ir a **Leads** y abrir el mismo perfil; todo su historial seguirá disponible.
8. Ejecutar el **Agente Negociador** y enseñar prioridad, probabilidad de cierre y siguiente mejor acción.
9. Presionar **Generar propuesta** para mostrar tres alternativas.
10. Opcional: **Simular primer pago**, demostrando que el cambio **LEAD → PAYER** solo ocurre tras la confirmación del módulo de pagos.
11. Abrir **Marketing Agent** y **Negotiation Agent** para mostrar las decisiones auditables.
12. Abrir **Analytics & KPI** para conectar la solución con Inteligencia de Negocios y ETL.

Si Valeria ya fue promovida durante una prueba anterior, en **Analytics & KPI** usar **Reiniciar demo** para restaurar todos los datos sintéticos.

---

# Arquitectura

```text
React + TypeScript
       │
       ▼
     Nginx
       │ /api
       ▼
NestJS + TypeORM
       │
       ▼
SQL Server 2022
   POLUX_OLTP
       │
       ├── persons
       ├── interactions
       ├── product_views
       ├── quotes
       ├── funnel_transitions
       ├── agent_actions
       └── campaigns
       │
       ▼
 Futuro proceso ETL
       │
       ▼
   POLUX_DW
```

El diseño evita duplicar a una persona por cada fase. La misma persona conserva su identidad y cambia su campo `stage` entre `BUYER`, `LEAD`, `PAYER`, etc. Cada transición queda registrada en `funnel_transitions`.

---

# Motor de agentes

La demo no depende de una API externa de IA. Esto es deliberado para que la exposición funcione incluso sin credenciales o internet.

El comportamiento se implementa mediante:

1. **Datos persistentes** de la persona.
2. **Reglas explicables** de intención comercial.
3. **Scoring** calculado con señales observables.
4. **Estado del embudo**.
5. **Acciones auditables** almacenadas en `agent_actions`.
6. **Guardrails** para decisiones que requieren revisión humana.

Después se puede conectar un LLM como capa adicional para resumir conversaciones o redactar mensajes, sin cambiar el modelo principal del sistema.

---

# Estructura del proyecto

```text
polux-ai-platform/
├── backend/                 NestJS + TypeORM
│   └── src/
│       ├── entities/
│       ├── services/
│       └── controllers/
├── frontend/                React + Vite
│   └── src/
│       ├── components/
│       ├── pages/
│       └── lib/
├── database/
│   └── bi/                  Modelo dimensional y ETL propuestos
├── docs/
│   ├── ARQUITECTURA.md
│   └── GUIA_DEMO.md
├── docker-compose.yml
├── INICIAR_POLUX.bat
└── DETENER_POLUX.bat
```

## Nota sobre los datos

Todos los nombres, números, presupuestos, interacciones y comportamientos cargados por el seed son **ficticios/sintéticos** y existen únicamente para la demostración académica. Cuando Polux Imports opere realmente, el seed puede deshabilitarse y las mismas tablas pueden alimentarse desde formularios, landing pages, web analytics, WhatsApp Business u otras integraciones.
