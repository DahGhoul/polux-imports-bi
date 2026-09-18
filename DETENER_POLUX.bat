@echo off
chcp 65001 >nul
title Detener Polux AI Platform
docker compose down
echo.
echo Polux AI Platform detenido. El volumen SQL se conserva.
pause
