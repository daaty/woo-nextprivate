// Diagnóstico avançado - Verificar configurações específicas
const https = require('https');

// Diferentes variações de teste
const testUrls = [
    // URL básica
    'https://checkout.infinitepay.io/rotadoscelulares',
    
    // URL com HTTPS
    'https://infinitepay.io/rotadoscelulares',
    
    // URL da plataforma principal
    'https://app.infinitepay.io/rotadoscelulares',
    
    // URL de checkout específica
    'https://checkout.infinitepay.io/@rotadoscelulares',
    
    // Possível estrutura alternativa
    'https://pay.infinitepay.io/rotadoscelulares'
];

console.log('🔍 DIAGNÓSTICO AVANÇADO - Infinitepay');
console.log('=====================================\n');

async function testMultipleUrls() {
    for (let i = 0; i < testUrls.length; i++) {
        const url = testUrls[i];
        
        console.log(`${i + 1}. Testando: ${url}`);
        
        await new Promise((resolve) => {
            const request = https.get(url, { timeout: 5000 }, (response) => {
                console.log(`   Status: ${response.statusCode}`);
                
                if (response.statusCode === 200) {
                    console.log('   ✅ FUNCIONA!');
                } else if (response.statusCode === 404) {
                    console.log('   ❌ Não encontrado');
                } else if (response.statusCode === 301 || response.statusCode === 302) {
                    console.log(`   🔄 Redirecionamento para: ${response.headers.location}`);
                } else {
                    console.log(`   ⚠️  Status: ${response.statusCode}`);
                }
                resolve();
            });
            
            request.on('error', (error) => {
                console.log(`   ❌ ERRO: ${error.message}`);
                resolve();
            });
            
            request.on('timeout', () => {
                console.log('   ⏱️  TIMEOUT');
                request.destroy();
                resolve();
            });
        });
        
        console.log(''); // Linha em branco
    }
}

// Função para testar com User-Agent do navegador
async function testWithBrowserHeaders() {
    console.log('🌐 TESTANDO COM HEADERS DE NAVEGADOR:');
    console.log('=====================================\n');
    
    const url = 'https://checkout.infinitepay.io/rotadoscelulares';
    
    const options = {
        hostname: 'checkout.infinitepay.io',
        path: '/rotadoscelulares',
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    };
    
    return new Promise((resolve) => {
        const request = https.request(options, (response) => {
            console.log(`Status: ${response.statusCode}`);
            console.log(`Headers: ${JSON.stringify(response.headers, null, 2)}`);
            
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                if (data.includes('página não encontrada') || data.includes('not found')) {
                    console.log('❌ ENCONTROU: "página não encontrada" no conteúdo');
                } else if (data.includes('infinitepay') || data.includes('checkout')) {
                    console.log('✅ CONTEÚDO PARECE CORRETO');
                } else {
                    console.log('⚠️  CONTEÚDO DESCONHECIDO');
                }
                resolve();
            });
        });
        
        request.on('error', (error) => {
            console.log(`❌ ERRO: ${error.message}`);
            resolve();
        });
        
        request.end();
    });
}

async function runDiagnostics() {
    await testMultipleUrls();
    await testWithBrowserHeaders();
    
    console.log('\n💡 POSSÍVEIS SOLUÇÕES:');
    console.log('=====================');
    console.log('1. Verificar se o handle na conta Infinitepay está EXATAMENTE: rotadoscelulares');
    console.log('2. Verificar se a conta está em modo ATIVO (não sandbox)');
    console.log('3. Verificar se há configurações de domínio pendentes');
    console.log('4. Contactar suporte da Infinitepay se necessário');
    
    console.log('\n🔗 LINKS PARA VERIFICAR:');
    console.log('========================');
    console.log('- Login Infinitepay: https://app.infinitepay.io');
    console.log('- Suporte: https://infinitepay.io/contato');
    console.log('- Documentação: https://docs.infinitepay.io');
}

runDiagnostics().catch(console.error);
