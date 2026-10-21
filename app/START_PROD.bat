@echo off
chcp 65001 >nul
set ROOT=%~dp0..
echo Dang build giao dien (chi can lan dau hoac khi sua code)...
pushd "%ROOT%\frontend"
if not exist node_modules call npm install --no-audit --no-fund
node node_modules\vite\bin\vite.js build
popd
pushd "%ROOT%\backend"
if not exist node_modules call npm install --no-audit --no-fund
start "" http://localhost:3000
node node_modules\tsx\dist\cli.mjs src\main.ts
