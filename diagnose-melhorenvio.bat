@echo off
echo ===============================================
echo MELHOR ENVIO API INTEGRATION - DIAGNOSTIC TOOL
echo ===============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo ERROR: Node.js not found. Please install Node.js first.
  echo.
  pause
  exit /b 1
)

:: Set NODE_OPTIONS for compatibility
set NODE_OPTIONS=--openssl-legacy-provider

echo Running diagnostic tests...
echo.

:: Run the diagnostic script
node scripts/diagnose-melhorenvio.js

echo.
pause
