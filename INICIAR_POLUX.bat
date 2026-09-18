@echo off
chcp 65001 >nul
title Polux AI Platform

echo.
echo ==============================================
echo       POLUX AI PLATFORM - INICIO DOCKER
echo ==============================================
echo.

docker version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker Desktop no esta iniciado o Docker no esta en PATH.
  echo Abre Docker Desktop y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

echo [1/2] Construyendo y levantando contenedores...
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo levantar el proyecto.
  echo Ejecuta: docker compose logs -f
  pause
  exit /b 1
)

echo.
echo [2/2] Contenedores iniciados.
echo La primera vez SQL Server y el seed pueden tardar unos segundos.
echo.
echo Aplicacion: http://localhost:8080
echo API:         http://localhost:3000/api/health
echo Swagger:     http://localhost:3000/docs
echo.
timeout /t 8 /nobreak >nul
start http://localhost:8080
