@echo off
REM Script to apply and test the cart size limit fix
REM Filepath: f:\Site Felipe\next-react-site\woo-next\run-cart-size-fix.bat

echo ======================================================
echo    FIXING CART SIZE LIMIT ISSUE - MORE THAN 3 ITEMS
echo ======================================================
echo.

echo [1/3] Applying fixes to cart API...
node fix-cart-size-limit.js
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Error applying cart fixes! Aborting.
  exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Checking if server is running...
curl -s http://localhost:3000 >nul
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Please start the development server first with "npm run dev"
  echo Once the server is running, run this script again.
  exit /b 1
)

echo Server is running! Proceeding with tests...
echo.

echo [3/3] Testing cart with multiple products...
echo.
node test-cart-size-limit-fix.js

echo.
echo ======================================================
echo             FIX COMPLETE - NEXT STEPS
echo ======================================================
echo.
echo To verify the fix:
echo 1. Open the Xiaomi page in your browser
echo 2. Add more than 3 products to your cart
echo 3. Verify that all products appear in the cart UI
echo.
echo If any issues persist, you can restore the original files with:
echo copy pages\api\cart\simple-add.js.bak pages\api\cart\simple-add.js
echo copy pages\api\cart\simple-get.js.bak pages\api\cart\simple-get.js
echo.
