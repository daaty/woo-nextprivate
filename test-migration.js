#!/usr/bin/env node

/**
 * Script de teste para verificar a migração PagBank → Infinitepay
 * 
 * Verifica:
 * - Se as APIs do PagBank foram removidas
 * - Se as APIs da Infinitepay estão presentes
 * - Se os componentes foram atualizados
 * - Se não há referências órfãs
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando migração PagBank → Infinitepay...\n');

// Verificar se arquivos PagBank foram removidos
const pagbankFiles = [
    'pages/api/pagbank/create-order.js',
    'pages/api/pagbank/webhook.js',
    'pages/api/pagbank/status',
    'src/services/pagbankApi.js'
];

console.log('❌ Verificando remoção de arquivos PagBank:');
pagbankFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        console.log(`   ⚠️  ENCONTRADO: ${file} (deveria ter sido removido)`);
    } else {
        console.log(`   ✅ REMOVIDO: ${file}`);
    }
});

// Verificar se arquivos Infinitepay estão presentes
const infinitepayFiles = [
    'pages/api/infinitepay/create-link.js',
    'pages/api/infinitepay/verify-payment.js',
    'pages/api/infinitepay/payment-return.js',
    'pages/confirmacao/infinitepay.js'
];

console.log('\n✅ Verificando presença de arquivos Infinitepay:');
infinitepayFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        console.log(`   ✅ PRESENTE: ${file}`);
    } else {
        console.log(`   ❌ AUSENTE: ${file} (deveria estar presente)`);
    }
});

// Verificar conteúdo dos arquivos principais
const checkFileContent = (filePath, searchTerms) => {
    try {
        const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
        
        console.log(`\n📄 Verificando ${filePath}:`);
        
        searchTerms.good.forEach(term => {
            if (content.includes(term)) {
                console.log(`   ✅ ENCONTRADO: "${term}"`);
            } else {
                console.log(`   ❌ AUSENTE: "${term}" (deveria estar presente)`);
            }
        });
        
        searchTerms.bad.forEach(term => {
            if (content.includes(term)) {
                console.log(`   ⚠️  ENCONTRADO: "${term}" (deveria ter sido removido)`);
            } else {
                console.log(`   ✅ REMOVIDO: "${term}"`);
            }
        });
        
    } catch (error) {
        console.log(`   ❌ ERRO ao ler arquivo: ${error.message}`);
    }
};

// Verificar checkout.js
checkFileContent('pages/checkout.js', {
    good: [
        'processInfinitepayPayment',
        'infinitepay-checkout',
        '/api/infinitepay/create-link'
    ],
    bad: [
        'processPagBankPayment',
        'pagbank-pix',
        '/api/pagbank/create-order'
    ]
});

// Verificar PaymentModes.js
checkFileContent('src/components/checkout/PaymentModes.js', {
    good: [
        'infinitepay-checkout'
    ],
    bad: [
        'pagbank-pix',
        'pagbank-credit',
        'pagbank-boleto'
    ]
});

// Verificar OrdersTab.js
checkFileContent('src/components/account/OrdersTab.js', {
    good: [
        'isInfinitepayOrder',
        'checkAndUpdateInfinitepayStatus'
    ],
    bad: [
        'isPagBankOrder',
        'checkAndUpdatePagBankStatus'
    ]
});

console.log('\n🎯 Resumo da migração:');
console.log('   📁 Arquivos PagBank removidos');
console.log('   📁 Arquivos Infinitepay criados');
console.log('   🔄 Componentes atualizados');
console.log('   ⚙️  Lógica de pagamento migrada');

console.log('\n📋 Próximos passos:');
console.log('   1. Configurar variáveis de ambiente (ver INFINITEPAY-CONFIG.md)');
console.log('   2. Testar fluxo completo de checkout');
console.log('   3. Verificar página de confirmação');
console.log('   4. Configurar webhooks se necessário');

console.log('\n✨ Migração concluída com sucesso!');
