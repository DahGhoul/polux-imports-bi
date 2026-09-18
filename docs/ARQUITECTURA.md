# Arquitectura técnica

## Decisión principal

La persona no se duplica por fase. Existe una entidad `Person` y el campo `stage` representa su posición actual dentro de IMPULSE.

La trazabilidad se conserva en `FunnelTransition`.

## Entidades operacionales

### Person

Datos de identidad y contexto comercial:

- contacto;
- edad y ciudad;
- ocupación / universidad;
- NSE e ingreso estimado;
- producto principal y secundarios;
- intereses;
- presupuesto;
- forma de pago;
- etapa;
- score;
- prioridad;
- probabilidad de conversión;
- recomendación del agente.

### Interaction

Registra todo evento relevante: formulario, consulta de precio, disponibilidad, pago, entrega, garantía, cotización, reclamo, etc.

### ProductView

Representa actividad observable sobre productos.

### Quote

Cotización formal con código, valor, modalidad y vencimiento.

### FunnelTransition

Audita cambios de etapa sin destruir el historial.

### AgentAction

Audita qué hizo cada agente, el detalle de la acción y su razonamiento.

### Campaign

Datos de captación y KPI de marketing.

## Agente de Marketing

Entradas:

- perfil de persona;
- interacción;
- recurrencia de producto;
- cotización;
- recencia.

Salidas:

- score;
- prioridad;
- resumen;
- siguiente mejor acción;
- potencial transición BUYER → LEAD.

Transición automática si se detecta cualquiera de estas señales explícitas:

- `PRICE_FINAL`
- `STOCK_QUERY`
- `PAYMENT_QUERY`
- `DELIVERY_QUERY`
- `QUOTE_REQUEST`

## Agente Negociador

Entradas:

- perfil heredado;
- score de BUYERS;
- consultas comerciales;
- cotización;
- completitud de datos;
- modalidad de pago;
- señales sensibles.

Salidas:

- probabilidad estimada;
- prioridad comercial;
- recomendación;
- propuesta;
- necesidad de intervención humana.

Guardrails:

- `SPECIAL_DISCOUNT` → humano.
- `COMPLAINT` → humano.
- El agente no confirma pagos por sí mismo.
- LEAD → PAYER solo después de la confirmación del módulo de pagos.

## Evolución hacia Agente Maestro

El futuro Master Agent puede leer `stage`, `agent_actions` y `funnel_transitions` y delegar al agente especializado correspondiente:

```text
BUYER    -> Marketing Agent
LEAD     -> Negotiation Agent
PAYER    -> Processing Agent
CUSTOMER -> Loyalty Agent
```

No es necesario cambiar las entidades principales para añadirlo.
