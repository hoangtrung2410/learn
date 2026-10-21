@echo off
chcp 65001 >nul
set ROOT=%~dp0..

if not exist "%ROOT%\backend\node_modules" (
  echo Dang cai thu vien backend lan dau, vui long cho...
  pushd "%ROOT%\backend"
  call npm install --no-audit --no-fund
  popd
)
if not exist "%ROOT%\frontend\node_modules" (
  echo Dang cai thu vien frontend lan dau, vui long cho...
  pushd "%ROOT%\frontend"
  call npm install --no-audit --no-fund
  popd
)

echo.
echo Backend : http://localhost:3000
echo Frontend: http://localhost:5173
start "LinguaPulse Backend" cmd /k "cd /d "%ROOT%\backend" && node node_modules\tsx\dist\cli.mjs src\main.ts"
start "LinguaPulse Frontend" cmd /k "cd /d "%ROOT%\frontend" && node node_modules\vite\bin\vite.js"
timeout /t 6 >nul
start "" http://localhost:5173
