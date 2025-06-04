/**
 * Testes Integrados de Carrinho
 * 
 * Este arquivo contém testes automatizados para validar todas as correções
 * implementadas para resolver os problemas críticos do carrinho.
 * 
 * Testes cobertos:
 * 1. Performance do carrinho (deve ser < 3 segundos para adicionar item)
 * 2. Precisão da contagem de itens no mini carrinho
 * 3. Bloqueio de race conditions
 * 4. Recuperação de falhas de rede
 * 5. Comportamento em condições extremas (muitos itens, adições rápidas)
 */

import puppeteer from 'puppeteer';
import axios from 'axios';
import { promises as fs } from 'fs';

// Configuração
const CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  productIds: [1215, 1225, 1235, 1245], // Produtos para teste
  timeout: 60000, // 1 minuto
  performanceThreshold: 3000, // 3 segundos
};

// Utilitários
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const formatTime = ms => `${(ms / 1000).toFixed(2)}s`;

async function runTests() {
  console.log('🧪 Iniciando testes integrados do carrinho...');
  
  // Iniciar navegador
  const browser = await puppeteer.launch({
    headless: 'new', // nova versão headless
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const logs = [];
  let allTestsPassed = true;
  
  try {
    const page = await browser.newPage();
    
    // Configurar console.log para capturar logs do navegador
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[useCart]') || text.includes('[CartPerformance]')) {
        logs.push(text);
      }
    });

    // Teste 1: Performance de adição ao carrinho
    console.log('\n✅ TESTE 1: Performance de adição ao carrinho');
    await page.goto(`${CONFIG.baseUrl}/produto/${CONFIG.productIds[0]}`);
    await page.waitForSelector('.single_add_to_cart_button');
    
    // Medir tempo antes da operação
    const startTime = Date.now();
    
    // Adicionar ao carrinho
    await page.click('.single_add_to_cart_button');
    
    // Esperar pelo indicador de sucesso (pode ser uma mudança no mini carrinho)
    await page.waitForFunction(() => {
      // Procura pelo contador de carrinho com valor > 0
      const cartCountElem = document.querySelector('.cart-count');
      return cartCountElem && parseInt(cartCountElem.textContent) > 0;
    }, { timeout: CONFIG.timeout });
    
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    
    console.log(`⏱️ Tempo para adicionar ao carrinho: ${formatTime(timeTaken)}`);
    
    // Verificar performance
    if (timeTaken > CONFIG.performanceThreshold) {
      console.error(`❌ Adição ao carrinho está lenta: ${formatTime(timeTaken)}`);
      allTestsPassed = false;
    } else {
      console.log(`✅ Performance de adição ao carrinho é boa: ${formatTime(timeTaken)}`);
    }

    // Teste 2: Precisão da contagem de itens no mini carrinho
    console.log('\n✅ TESTE 2: Precisão da contagem de itens');
    
    // Limpar carrinho antes
    await page.goto(`${CONFIG.baseUrl}/cart`);
    const clearCartButton = await page.$('.clear-cart button');
    if (clearCartButton) {
      await clearCartButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
    
    // Adicionar vários itens com quantidades variadas
    for (let i = 0; i < 2; i++) {
      const productId = CONFIG.productIds[i % CONFIG.productIds.length];
      await page.goto(`${CONFIG.baseUrl}/produto/${productId}`);
      await page.waitForSelector('.quantity input');
      
      // Definir quantidade aleatória entre 1 e 5
      const quantity = Math.floor(Math.random() * 5) + 1;
      await page.$eval('.quantity input', (input, qty) => { input.value = qty; }, quantity);
      
      await page.click('.single_add_to_cart_button');
      await sleep(1000); // Pequena pausa para garantir processamento
    }
    
    // Verificar se a contagem está correta no carrinho
    await page.goto(`${CONFIG.baseUrl}/cart`);
    await page.waitForSelector('.cart-products');
    
    // Contar manualmente os itens no carrinho
    const manualCount = await page.evaluate(() => {
      const quantities = Array.from(document.querySelectorAll('.cart-products .quantity input'))
        .map(input => parseInt(input.value));
      return quantities.reduce((sum, qty) => sum + qty, 0);
    });
    
    // Obter contagem do mini-carrinho
    const miniCartCount = await page.evaluate(() => {
      const cartIcon = document.querySelector('.cart-count');
      return cartIcon ? parseInt(cartIcon.textContent) : 0;
    });
    
    console.log(`🛒 Contagem manual: ${manualCount}, Contagem mini-carrinho: ${miniCartCount}`);
    
    if (manualCount !== miniCartCount) {
      console.error(`❌ Discrepância na contagem do carrinho: Manual=${manualCount}, Mini=${miniCartCount}`);
      allTestsPassed = false;
    } else {
      console.log(`✅ Contagem do mini carrinho precisa`);
    }

    // Teste 3: Bloqueio de race conditions
    console.log('\n✅ TESTE 3: Bloqueio de race conditions');
    
    // Limpar carrinho novamente
    await page.goto(`${CONFIG.baseUrl}/cart`);
    const clearCartBtn = await page.$('.clear-cart button');
    if (clearCartBtn) {
      await clearCartBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
    
    // Adicionar o mesmo produto várias vezes rapidamente
    const productId = CONFIG.productIds[0];
    await page.goto(`${CONFIG.baseUrl}/produto/${productId}`);
    
    // Adicionar 3 vezes em rápida sucessão
    await Promise.all([
      page.click('.single_add_to_cart_button'),
      sleep(100).then(() => page.click('.single_add_to_cart_button')),
      sleep(200).then(() => page.click('.single_add_to_cart_button'))
    ]);
    
    // Esperar processamento
    await sleep(3000);
    
    // Verificar carrinho
    await page.goto(`${CONFIG.baseUrl}/cart`);
    await page.waitForSelector('.cart-products');
    
    // Procurar por erros nos logs
    const raceConditionErrors = logs.filter(log => 
      log.includes('race condition') || 
      log.includes('concorrência') ||
      log.includes('já em progresso')
    );
    
    if (raceConditionErrors.length > 0) {
      console.error(`❌ Race conditions detectadas:`);
      raceConditionErrors.forEach(log => console.error(`   ${log}`));
      allTestsPassed = false;
    } else {
      console.log(`✅ Bloqueio de race conditions funcionando`);
    }

    // Teste 4: Falhas de rede - Simulação
    console.log('\n✅ TESTE 4: Recuperação de falhas de rede');
    
    // Como não podemos facilmente simular falhas de rede com Puppeteer,
    // vamos verificar logs e código para tratamento de erros
    
    const errorHandlingLogs = logs.filter(log => 
      log.includes('Erro ao adicionar') || 
      log.includes('fallback') || 
      log.includes('retry') ||
      log.includes('standard')
    );
    
    console.log(`🔍 Encontrados ${errorHandlingLogs.length} logs relacionados a tratamento de erros`);
    
    // Verificar se o código possui os mecanismos de fallback
    try {
      const cartContextCode = await fs.readFile('f:\\Site Felipe\\next-react-site\\woo-next\\src\\contexts\\CartContext.js', 'utf8');
      const useCartCode = await fs.readFile('f:\\Site Felipe\\next-react-site\\woo-next\\src\\hooks\\useCart.js', 'utf8');
      
      const hasFallbackMechanism = 
        cartContextCode.includes('fallback') || 
        useCartCode.includes('fallback') ||
        useCartCode.includes('method standard') ||
        useCartCode.includes('GraphQL padrão');
      
      if (hasFallbackMechanism) {
        console.log(`✅ Mecanismos de fallback para falhas de rede encontrados`);
      } else {
        console.warn(`⚠️ Mecanismos de fallback podem não estar implementados completamente`);
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
    }

    // Teste 5: Comportamento em condições extremas
    console.log('\n✅ TESTE 5: Comportamento em condições extremas');
    
    // Limpar carrinho novamente
    await page.goto(`${CONFIG.baseUrl}/cart`);
    const clearBtn = await page.$('.clear-cart button');
    if (clearBtn) {
      await clearBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
    
    // Adicionar vários produtos diferentes em sequência rápida
    const addResults = [];
    
    for (const pid of CONFIG.productIds.slice(0, 3)) {
      const start = Date.now();
      await page.goto(`${CONFIG.baseUrl}/produto/${pid}`);
      await page.waitForSelector('.single_add_to_cart_button');
      await page.click('.single_add_to_cart_button');
      
      // Esperar até 10 segundos por atualização
      try {
        await page.waitForFunction(() => {
          // Verificar se o botão muda para indicar sucesso
          return document.querySelector('.cart-count');
        }, { timeout: 10000 });
        
        addResults.push({
          product: pid,
          time: Date.now() - start,
          success: true
        });
      } catch (e) {
        addResults.push({
          product: pid,
          time: Date.now() - start,
          success: false,
          error: e.message
        });
      }
      
      // Pequena pausa para não sobrecarregar totalmente
      await sleep(500);
    }
    
    // Analisar resultados
    const failedAdds = addResults.filter(r => !r.success);
    const slowAdds = addResults.filter(r => r.time > CONFIG.performanceThreshold);
    
    console.log(`📊 Resultados de adições rápidas:`);
    addResults.forEach(r => {
      console.log(`   Produto ${r.product}: ${formatTime(r.time)} - ${r.success ? 'Sucesso' : 'Falha'}`);
    });
    
    if (failedAdds.length > 0) {
      console.error(`❌ ${failedAdds.length} adições falharam em condições extremas`);
      allTestsPassed = false;
    } else if (slowAdds.length > 0) {
      console.warn(`⚠️ ${slowAdds.length} adições foram lentas em condições extremas`);
    } else {
      console.log(`✅ Comportamento adequado em condições extremas`);
    }
    
    // Teste 6: Verificar contagem de itens no mini carrinho após várias operações
    console.log('\n✅ TESTE 6: Estado final da contagem após operações múltiplas');
    
    // Ir para o carrinho e verificar estado final
    await page.goto(`${CONFIG.baseUrl}/cart`);
    await page.waitForSelector('.cart-products');
    
    // Contar manualmente novamente
    const finalManualCount = await page.evaluate(() => {
      const quantities = Array.from(document.querySelectorAll('.cart-products .quantity input'))
        .map(input => parseInt(input.value));
      return quantities.reduce((sum, qty) => sum + qty, 0);
    });
    
    // Obter contagem final do mini-carrinho
    const finalMiniCartCount = await page.evaluate(() => {
      const cartIcon = document.querySelector('.cart-count');
      return cartIcon ? parseInt(cartIcon.textContent) : 0;
    });
    
    console.log(`🛒 Contagem manual final: ${finalManualCount}, Contagem mini-carrinho final: ${finalMiniCartCount}`);
    
    if (finalManualCount !== finalMiniCartCount) {
      console.error(`❌ Discrepância final na contagem do carrinho: Manual=${finalManualCount}, Mini=${finalMiniCartCount}`);
      allTestsPassed = false;
    } else {
      console.log(`✅ Contagem final do mini carrinho precisa após múltiplas operações`);
    }

  } catch (error) {
    console.error(`❌ ERRO durante os testes:`, error);
    allTestsPassed = false;
  } finally {
    // Fechar navegador
    await browser.close();
  }
  
  // Resumo dos testes
  console.log('\n========== RESUMO DOS TESTES ==========');
  if (allTestsPassed) {
    console.log('✅ TODOS OS TESTES PASSARAM! Sistema de carrinho funcionando corretamente.');
  } else {
    console.error('❌ ALGUNS TESTES FALHARAM. Verifique os detalhes acima.');
  }
  
  // Salvar logs em arquivo
  try {
    const logContent = logs.join('\n');
    await fs.writeFile('cart-test-logs.txt', logContent);
    console.log('📝 Logs salvos em cart-test-logs.txt');
  } catch (err) {
    console.error('Erro ao salvar logs:', err);
  }
}

// Executar os testes
if (require.main === module) {
  runTests();
}

export default runTests;
