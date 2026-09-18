# Capa de datos

La demo usa `POLUX_OLTP` en SQL Server. NestJS crea la base de datos y las tablas automáticamente durante el primer arranque.

La carpeta `bi/` deja preparada la evolución académica hacia `POLUX_DW`:

- `DimPerson`
- `DimProduct`
- `DimDate`
- `DimFunnelStage`
- `FactInteraction`
- `FactFunnelTransition`

El ETL está separado intencionalmente de la aplicación operacional para que el grupo pueda adaptarlo al modelo dimensional final del informe.
