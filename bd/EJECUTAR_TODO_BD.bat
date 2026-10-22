@echo off
chcp 65001 > nul
echo ========================================================
echo POLUX IMPORTS - DESPLIEGUE AUTOMATIZADO DE BASE DE DATOS
echo SQL Server 2022 (PoluxImportDB + PoluxImportMart 1M+)
echo ========================================================

set SERVER=localhost
if not "%1"=="" set SERVER=%1

echo Servidor: %SERVER%
echo.

echo [1/9] Creando Esquema Fase 0 (Nucleo Compartido)...
sqlcmd -S %SERVER% -E -I -f 65001 -i "00_fase0_nucleo_compartido.sql"
if %ERRORLEVEL% NEQ 0 goto error

echo [2/9] Creando Esquema Fase 1 (Buyers)...
sqlcmd -S %SERVER% -E -I -f 65001 -i "01_fase1_buyers.sql"
if %ERRORLEVEL% NEQ 0 goto error

echo [3/9] Creando Esquema Fase 2 (Leads)...
sqlcmd -S %SERVER% -E -I -f 65001 -i "02_fase2_leads.sql"
if %ERRORLEVEL% NEQ 0 goto error

echo [4/9] Creando Esquema Fase 3 (Payers)...
sqlcmd -S %SERVER% -E -I -f 65001 -i "03_fase3_payers.sql"
if %ERRORLEVEL% NEQ 0 goto error

echo [5/9] Creando Esquema Fase 4 (Customers)...
sqlcmd -S %SERVER% -E -I -f 65001 -i "04_fase4_customers.sql"
if %ERRORLEVEL% NEQ 0 goto error

echo [6/9] Creando Esquema Fase 5 (Turned)...
sqlcmd -S %SERVER% -E -I -f 65001 -i "05_fase5_turned.sql"
if %ERRORLEVEL% NEQ 0 goto error

echo [7/9] Insertando Poblacion Masiva de 1,000,000+ Registros...
sqlcmd -S %SERVER% -E -I -f 65001 -i "06_poblacion_masiva_1M.sql"
if %ERRORLEVEL% NEQ 0 goto error

echo [8/9] Creando Data Mart Dimensional (PoluxImportMart)...
sqlcmd -S %SERVER% -E -I -f 65001 -i "07_modelo_dimensional_poluxmart.sql"
if %ERRORLEVEL% NEQ 0 goto error

echo [9/9] Ejecutando ETL con MERGE hacia PoluxImportMart...
sqlcmd -S %SERVER% -E -I -f 65001 -i "08_etl_merge_poluxmart.sql"
if %ERRORLEVEL% NEQ 0 goto error

echo.
echo ========================================================
echo BASE DE DATOS Y DATA MART DESPLEGADOS SATISFACTORIAMENTE!
echo Total registros insertados: 1,387,610+
echo ========================================================
goto fin

:error
echo.
echo [ERROR] Ocurrio un problema al ejecutar los scripts SQL.
pause
exit /b 1

:fin
pause
