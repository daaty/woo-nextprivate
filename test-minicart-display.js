// Script to test the minicart display
// Filepath: f:\Site Felipe\next-react-site\woo-next\test-minicart-display.js

/**
 * This script tests if the minicart is displaying all items correctly,
 * even when there are more than 3 items in the cart.
 */

const fs = require('fs');
const path = require('path');

// Check if the minicart component limits the items displayed
function checkMinicartDisplay() {
  console.log('🔍 Verificando se o Minicart está exibindo todos os itens...');
  
  try {
    const minicartPath = path.join(__dirname, 'src', 'components', 'cart', 'Minicart.js');
    const minicartContent = fs.readFileSync(minicartPath, 'utf8');
    
    // Check for patterns that might limit item display
    const limitPatterns = [
      /cartData\.items\.slice\(0,\s*\d+\)\.map/,
      /items\.slice\(0,\s*\d+\)\.map/,
      /\.slice\(0,\s*3\)\.map/
    ];
    
    let hasLimits = false;
    for (const pattern of limitPatterns) {
      if (pattern.test(minicartContent)) {
        const match = minicartContent.match(pattern);
        console.log(`❌ Encontrado padrão limitante no código: ${match[0]}`);
        hasLimits = true;
      }
    }
    
    // Look for proper item display code
    const properPattern = /cartData\.items\.map\(/;
    const hasProperCode = properPattern.test(minicartContent);
    
    if (!hasLimits && hasProperCode) {
      console.log('✅ O Minicart está configurado para exibir todos os itens!');
    } else if (hasProperCode) {
      console.log('⚠️ O Minicart está usando .map() mas pode ter outros limitadores.');
    } else {
      console.log('❌ O Minicart não está configurado para iterar sobre todos os itens.');
    }
    
    // Check for code that handles the totalItemTypes property
    if (minicartContent.includes('totalItemTypes')) {
      console.log('✅ O Minicart está usando a propriedade totalItemTypes para rastrear o número real de itens.');
    } else {
      console.log('❌ O Minicart não está usando a propriedade totalItemTypes.');
    }
    
    // Check for hasMoreItems handling
    if (minicartContent.includes('hasMoreItems')) {
      console.log('✅ O Minicart está verificando a propriedade hasMoreItems.');
    } else {
      console.log('❌ O Minicart não está verificando a propriedade hasMoreItems.');
    }
    
    return !hasLimits && hasProperCode;
    
  } catch (error) {
    console.error('❌ Erro ao verificar o código do Minicart:', error.message);
    return false;
  }
}

// Check if simple-get.js returns all cart items
function checkSimpleGetAPI() {
  console.log('\n🔍 Verificando se a API simple-get está retornando todos os itens...');
  
  try {
    const simpleGetPath = path.join(__dirname, 'pages', 'api', 'cart', 'simple-get.js');
    const simpleGetContent = fs.readFileSync(simpleGetPath, 'utf8');
    
    // Check if the API sends back all items in the response
    if (simpleGetContent.includes('responseCart') && 
        simpleGetContent.includes('totalItemTypes')) {
      console.log('✅ A API simple-get está configurada para retornar informações sobre o número total de itens!');
    } else {
      console.log('❌ A API simple-get não está retornando metadata sobre o total de itens.');
    }
    
    // Check if API is adding wasLimited flag
    if (simpleGetContent.includes('wasLimited')) {
      console.log('✅ A API simple-get está adicionando a flag wasLimited para informar limitações de tamanho de cookie.');
    } else {
      console.log('❌ A API simple-get não está adicionando a flag wasLimited.');
    }
    
    return simpleGetContent.includes('responseCart') && 
           simpleGetContent.includes('totalItemTypes');
    
  } catch (error) {
    console.error('❌ Erro ao verificar o código do simple-get:', error.message);
    return false;
  }
}

// Run all tests
function runTests() {
  console.log('🧪 INICIANDO TESTES DO MINICART E API\n');
  
  const minicartResult = checkMinicartDisplay();
  const simpleGetResult = checkSimpleGetAPI();
  
  console.log('\n📊 RESULTADOS DOS TESTES:');
  if (minicartResult && simpleGetResult) {
    console.log('✅ SUCESSO: Tanto o Minicart quanto a API simple-get estão configurados corretamente!');
  } else if (minicartResult) {
    console.log('🔶 PARCIAL: O Minicart está configurado corretamente, mas a API simple-get pode ter problemas.');
  } else if (simpleGetResult) {
    console.log('🔶 PARCIAL: A API simple-get está configurada corretamente, mas o Minicart pode ter problemas de exibição.');
  } else {
    console.log('❌ FALHA: Tanto o Minicart quanto a API simple-get precisam de correções.');
  }
  
  console.log('\nTeste concluído!');
}

runTests();
