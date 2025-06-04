// Teste de sincronização do CartContext
const { chromium } = require('playwright');

async function testCartContextSync() {
  console.log('🧪 Iniciando teste de sincronização do CartContext...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Interceptar logs do console
  page.on('console', msg => {
    if (msg.text().includes('[CartContext]') || msg.text().includes('[useCartRest]')) {
      console.log('🔍', msg.text());
    }
  });
  
  try {
    console.log('📱 Navegando para a página do carrinho...');
    await page.goto('http://localhost:3000/cart');
    
    // Aguardar a página carregar
    await page.waitForTimeout(3000);
    
    // Verificar se o CartContext está inicializado
    const contextReady = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Aguardar até o contexto estar pronto ou timeout
        let attempts = 0;
        const checkContext = () => {
          attempts++;
          
          // Verificar se existe algum componente do carrinho
          const cartContainer = document.querySelector('.cart-container');
          const loading = document.querySelector('[data-testid="loading"]');
          
          if (cartContainer && !loading) {
            console.log('✅ CartContext parece estar pronto');
            resolve({ ready: true, attempts });
          } else if (attempts > 20) {
            console.log('❌ Timeout aguardando CartContext');
            resolve({ ready: false, attempts });
          } else {
            setTimeout(checkContext, 500);
          }
        };
        
        checkContext();
      });
    });
    
    console.log('📊 Resultado do teste:', contextReady);
    
    // Verificar dados específicos do carrinho
    const cartData = await page.evaluate(() => {
      // Tentar acessar dados globais do carrinho
      return {
        hasCartItems: !!document.querySelector('.cart-items'),
        hasEmptyMessage: !!document.querySelector('.empty-cart'),
        hasErrorMessage: !!document.querySelector('.error-message'),
        cartTitle: document.querySelector('.cart-title')?.textContent,
        itemCount: document.querySelectorAll('.cart-item').length
      };
    });
    
    console.log('📦 Dados do carrinho na página:', cartData);
    
    // Testar adição de produto ao carrinho
    console.log('🛒 Testando navegação para produto...');
    await page.goto('http://localhost:3000/produto/xiaomi-redmi-note-13-128gb-8gb-ram');
    await page.waitForTimeout(2000);
    
    // Verificar se existe botão de adicionar
    const addButton = await page.$('[data-testid="add-to-cart"], .add-to-cart-button, button:has-text("Adicionar")');
    
    if (addButton) {
      console.log('🛒 Clicando no botão adicionar ao carrinho...');
      await addButton.click();
      await page.waitForTimeout(3000);
      
      // Voltar para o carrinho
      await page.goto('http://localhost:3000/cart');
      await page.waitForTimeout(2000);
      
      // Verificar se o item foi adicionado
      const updatedCartData = await page.evaluate(() => ({
        hasCartItems: !!document.querySelector('.cart-items'),
        itemCount: document.querySelectorAll('.cart-item').length,
        totalText: document.querySelector('.cart-total')?.textContent
      }));
      
      console.log('📦 Carrinho após adição:', updatedCartData);
    } else {
      console.log('⚠️ Botão de adicionar não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await browser.close();
  }
}

testCartContextSync().catch(console.error);
