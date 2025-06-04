@echo off
echo ========================================
echo MELHOR ENVIO API INTEGRATION TEST
echo ========================================
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

echo Testing Melhor Envio API integration...
echo.

:: Run the test script
node scripts/test-melhorenvio-api.js

echo.
pause
