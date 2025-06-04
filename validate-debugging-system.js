/**
 * VALIDAÇÃO COMPLETA DO SISTEMA DE DEBUGGING
 * Este script verifica se todos os logs e validações estão funcionando
 */

console.log('🔧 SISTEMA DE DEBUGGING - VALIDAÇÃO COMPLETA\n');

// 1. Verificar se os arquivos de log existem
const fs = require('fs');
const path = require('path');

const checkFiles = [
    'debug-checkout-logs.js',
    'pages/checkout.js',
    'pages/api/infinitepay/create-link.js'
];

console.log('1. 📁 VERIFICANDO ARQUIVOS...');
checkFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        console.log(`   ✅ ${file} - encontrado`);
    } else {
        console.log(`   ❌ ${file} - NÃO encontrado`);
    }
});

// 2. Verificar se o diretório de logs pode ser criado
console.log('\n2. 📋 VERIFICANDO SISTEMA DE LOGS...');
try {
    const { checkoutLogger, apiLogger } = require('./debug-checkout-logs');
    
    // Testar logs
    checkoutLogger.log('🧪 TESTE: Checkout logger funcionando');
    apiLogger.log('🧪 TESTE: API logger funcionando');
    
    console.log('   ✅ Sistema de logs inicializado com sucesso');
    
    // Verificar se os arquivos de log foram criados
    const logsDir = path.join(__dirname, 'logs');
    if (fs.existsSync(logsDir)) {
        const logFiles = fs.readdirSync(logsDir);
        console.log(`   ✅ Diretório de logs criado: ${logFiles.length} arquivos`);
        logFiles.forEach(file => {
            console.log(`      - ${file}`);
        });
    }
    
} catch (error) {
    console.log(`   ❌ Erro no sistema de logs: ${error.message}`);
}

// 3. Simular cenário de debugging
console.log('\n3. 🧪 SIMULANDO CENÁRIO DE DEBUGGING...');

const testScenarios = [
    {
        name: 'Frete não selecionado',
        data: {
            selectedShipping: null,
            shippingCost: 0,
            cartTotal: '199.90'
        }
    },
    {
        name: 'Frete selecionado corretamente',
        data: {
            selectedShipping: '04014',
            shippingCost: 15.50,
            cartTotal: '199.90'
        }
    },
    {
        name: 'CartTotal inválido',
        data: {
            selectedShipping: '04014',
            shippingCost: 15.50,
            cartTotal: 'NaN'
        }
    }
];

testScenarios.forEach((scenario, index) => {
    console.log(`   ${index + 1}. ${scenario.name}:`);
    
    const { selectedShipping, shippingCost, cartTotal } = scenario.data;
    
    // Simular priceToNumber
    const priceToNumber = (price) => {
        if (!price) return 0;
        if (typeof price === 'number') return price;
        const parsed = parseFloat(price.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    };
    
    const cartTotalParsed = priceToNumber(cartTotal);
    const total = cartTotalParsed + shippingCost;
    
    console.log(`      - cartTotal: ${cartTotal} → ${cartTotalParsed}`);
    console.log(`      - shippingCost: ${shippingCost}`);
    console.log(`      - Total calculado: ${total}`);
    
    // Validações
    const warnings = [];
    if (!selectedShipping) warnings.push('Frete não selecionado');
    if (shippingCost === 0 && selectedShipping) warnings.push('Frete com valor zero');
    if (cartTotalParsed === 0) warnings.push('CartTotal inválido');
    if (total <= 0) warnings.push('Total inválido');
    
    if (warnings.length > 0) {
        console.log(`      ⚠️  Avisos: ${warnings.join(', ')}`);
    } else {
        console.log(`      ✅ Cenário válido`);
    }
    console.log('');
});

// 4. Instruções finais
console.log('4. 📋 PRÓXIMOS PASSOS PARA DEBUGGING:');
console.log('');
console.log('   Para testar com pedido real:');
console.log('   1. Abra o site no navegador');
console.log('   2. Adicione produtos ao carrinho');
console.log('   3. Vá para o checkout');
console.log('   4. Preencha os dados e calcule o frete');
console.log('   5. Finalize o pedido');
console.log('   6. Execute: node test-logs-real-time.js');
console.log('');
console.log('   Para limpar logs: node debug-checkout-logs.js clear');
console.log('   Para analisar logs: node debug-checkout-logs.js analyze');
console.log('');
console.log('🎯 PONTOS CRÍTICOS A VERIFICAR NOS LOGS:');
console.log('   • checkout-debug.log: valores de shippingCost e total');
console.log('   • api-debug.log: dados recebidos pela API');
console.log('   • api-debug.log: cálculo de shipping_lines');
console.log('   • Pedidos no WooCommerce admin: valor total e shipping_lines');
console.log('');
console.log('✅ Sistema de debugging instalado e pronto para uso!');
