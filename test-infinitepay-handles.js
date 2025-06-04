/**
 * Script para testar diferentes handles da Infinitepay
 * Executa: node test-infinitepay-handles.js
 */

const https = require('https');

// Lista de handles para testar
const possibleHandles = [
    'rotadoscelulares',
    'rota-celulares', 
    'rotacelulares',
    'rotadoscelulares2025',
    'rota-dos-celulares'
];

function testHandle(handle) {
    return new Promise((resolve) => {
        const url = `https://checkout.infinitepay.io/${handle}`;
        
        console.log(`🔍 Testando handle: ${handle}`);
        console.log(`   URL: ${url}`);
        
        const req = https.get(url, (res) => {
            console.log(`   Status: ${res.statusCode}`);
            
            if (res.statusCode === 200) {
                console.log(`   ✅ FUNCIONA! Handle encontrado: ${handle}`);
                resolve({ handle, works: true, status: res.statusCode });
            } else if (res.statusCode === 404) {
                console.log(`   ❌ Handle não encontrado: ${handle}`);
                resolve({ handle, works: false, status: res.statusCode });
            } else {
                console.log(`   ⚠️  Status inesperado: ${res.statusCode}`);
                resolve({ handle, works: false, status: res.statusCode });
            }
        });
        
        req.on('error', (err) => {
            console.log(`   ❌ Erro de conexão: ${err.message}`);
            resolve({ handle, works: false, error: err.message });
        });
        
        req.setTimeout(5000, () => {
            console.log(`   ⏱️  Timeout para handle: ${handle}`);
            req.destroy();
            resolve({ handle, works: false, error: 'timeout' });
        });
    });
}

async function testAllHandles() {
    console.log('🚀 Testando handles da Infinitepay...\n');
    
    const results = [];
    
    for (const handle of possibleHandles) {
        const result = await testHandle(handle);
        results.push(result);
        console.log(''); // Linha em branco
        
        // Pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('📊 RESUMO DOS TESTES:');
    console.log('=' .repeat(50));
    
    const workingHandles = results.filter(r => r.works);
    const notWorkingHandles = results.filter(r => !r.works);
    
    if (workingHandles.length > 0) {
        console.log('\n✅ HANDLES QUE FUNCIONAM:');
        workingHandles.forEach(r => {
            console.log(`   - ${r.handle} (Status: ${r.status})`);
        });
        
        console.log('\n💡 AÇÃO REQUERIDA:');
        console.log(`   Configure o .env.local com um dos handles que funcionam:`);
        console.log(`   INFINITEPAY_HANDLE=${workingHandles[0].handle}`);
        
    } else {
        console.log('\n❌ NENHUM HANDLE FUNCIONA');
        console.log('\n💡 AÇÃO REQUERIDA:');
        console.log('   1. Acesse https://infinitepay.io');
        console.log('   2. Faça login ou crie uma conta');
        console.log('   3. Configure seu handle/username único');
        console.log('   4. Ative o checkout link na plataforma');
        console.log('\n📝 HANDLES TESTADOS (não funcionaram):');
        notWorkingHandles.forEach(r => {
            console.log(`   - ${r.handle} (Status: ${r.status})`);
        });
    }
    
    console.log('\n🔗 LINKS ÚTEIS:');
    console.log('   - Infinitepay: https://infinitepay.io');
    console.log('   - Login: https://app.infinitepay.io');
    console.log('   - Documentação: https://docs.infinitepay.io');
}

// Executar testes
testAllHandles().catch(console.error);
