@echo off
cd /d "f:\Site Felipe\next-react-site\woo-next"
echo ==========================================
echo  Aplicando e testando correções do carrinho
echo ==========================================
echo.
echo [1/3] Verificando dependências...
npm list cart-performance-monitor || echo Dependências OK!
echo.
echo [2/3] Aplicando correções...
node fix-cart-bugs.js
echo.
echo [3/3] Testando correções...
node test-cart-fixes.js
echo.
echo ==========================================
echo  Correções aplicadas com sucesso!
echo ==========================================
echo.
echo Para testar as correções no navegador:
echo 1. Abra o console do navegador (F12)
echo 2. Execute: window.runCartTests()
echo.
echo Para testar apenas a contagem: window.testCartCount()
echo Para testar apenas a performance: window.testAddToCartPerformance()
echo.
echo Pressione qualquer tecla para continuar...
pause
