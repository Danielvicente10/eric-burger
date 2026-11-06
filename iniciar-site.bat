@echo off
chcp 65001 >nul
title Eric Burger - servidor local
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale em https://nodejs.org e rode de novo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias, so na primeira vez...
  call npm install
  if errorlevel 1 (
    echo Falhou o npm install. Veja o erro acima.
    pause
    exit /b 1
  )
)

echo Abrindo http://localhost:5173 em alguns segundos...
start "" cmd /c "timeout /t 5 >nul & start http://localhost:5173"

echo Para parar o servidor, feche esta janela.
call npm run dev
pause
