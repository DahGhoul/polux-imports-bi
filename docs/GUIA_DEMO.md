# Guía de demostración — 3.6 y 4.6

## Escena 1: presentar el sistema

Abrir `http://localhost:8080`.

Explicar que es una plataforma operacional única para IMPULSE. Cada persona posee un registro central y un `stage`. Por eso no se pierde el historial al pasar de BUYER a LEAD.

## Escena 2: BUYERS

Ir a **Buyers** y buscar `Valeria Mendoza`.

Mostrar:

- 23 años, Trujillo.
- Universidad Nacional de Trujillo.
- Intereses: fotografía, redes sociales y tecnología.
- iPhone 16 Pro 256 GB como producto principal.
- Presupuesto y modalidad de pago.
- Vistas del producto e historial.
- Score y explicación de las señales.

Aclarar que los datos son sintéticos para la demo, pero el flujo está preparado para recibir datos reales.

## Escena 3: Agente de Marketing

En el perfil de Valeria, presionar **Ejecutar agente**.

Después presionar **Solicitar cotización** o **Simular precio final**.

El evento constituye una intención comercial explícita. El motor registra la interacción, recalcula el score, crea la acción del agente, registra la transición y actualiza `stage` de BUYER a LEAD.

## Escena 4: LEADS

Ir a **Leads** y buscar a Valeria. Abrir el perfil.

Mostrar que se conservan:

- datos personales;
- intereses;
- comportamiento;
- producto;
- historial de BUYERS;
- cotización;
- transición de embudo.

El Agente Negociador añade probabilidad estimada de conversión, prioridad y siguiente mejor acción.

## Escena 5: propuesta

Presionar **Generar propuesta**.

La aplicación devuelve tres alternativas basadas en presupuesto, producto y modalidad de pago. El agente no autoriza descuentos especiales fuera de las reglas.

## Escena 6: guardrail

Para demostrar la filosofía del agente, puede usarse la API o ampliar el front para simular `SPECIAL_DISCOUNT`: el motor marca `humanInterventionRequired = true`.

La idea clave es que el agente asiste y automatiza, pero una decisión sensible puede escalarse a una persona.

## Escena 7: siguiente fase

Presionar **Simular primer pago** solo si se quiere cerrar la historia completa.

El sistema cambia LEAD → PAYER únicamente después de la confirmación del módulo de pagos, dejando listo el expediente para el agente de procesamiento de otro integrante.

## Escena 8: BI

Abrir **Analytics & KPI**.

Explicar:

```text
POLUX_OLTP → ETL → POLUX_DW → Dashboard / indicadores
```

La aplicación actual es el sistema transaccional que genera los hechos que posteriormente se explotan en el modelo dimensional.
