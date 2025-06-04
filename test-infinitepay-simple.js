// Teste simples do Infinitepay - apenas URL básica
const https = require('https');

// Configuração
const INFINITEPAY_HANDLE = 'rotadoscelulares';
const INFINITEPAY_BASE_URL = 'https://checkout.infinitepay.io';

console.log('🚀 Testando Infinitepay - Versão Simples...');
console.log('📍 Handle configurado:', INFINITEPAY_HANDLE);

// Teste 1: URL básica sem parâmetros
const basicUrl = `${INFINITEPAY_BASE_URL}/${INFINITEPAY_HANDLE}`;
console.log('\n🔗 TESTE 1 - URL Básica:');
console.log('URL:', basicUrl);

// Teste 2: URL com parâmetros mínimos
const items = [
    {
        name: 'Produto Teste',
        amount: 10000 // R$ 100,00 em centavos
    }
];

const params = new URLSearchParams();
params.append('items', JSON.stringify(items));
params.append('order_nsu', `teste_${Date.now()}`);
params.append('redirect_url', 'https://rota.rotadoscelulares.com/confirmacao/infinitepay');

const minimalUrl = `${basicUrl}?${params.toString()}`;
console.log('\n🔗 TESTE 2 - URL com Parâmetros Mínimos:');
console.log('URL:', minimalUrl);

// Teste 3: Verificar se as URLs são acessíveis
function testUrl(url, label) {
    return new Promise((resolve) => {
        console.log(`\n🔍 ${label}:`);
        console.log('URL:', url);
        
        const request = https.get(url, { timeout: 10000 }, (response) => {
            console.log(`Status: ${response.statusCode}`);
            
            if (response.statusCode === 200) {
                console.log('✅ SUCESSO! URL está funcionando');
            } else if (response.statusCode === 404) {
                console.log('❌ ERRO 404: Página não encontrada');
            } else {
                console.log(`⚠️  Status: ${response.statusCode}`);
            }
            resolve();
        });
        
        request.on('error', (error) => {
            console.log('❌ ERRO:', error.message);
            resolve();
        });
        
        request.on('timeout', () => {
            console.log('⏱️  TIMEOUT: Resposta demorou muito');
            request.destroy();
            resolve();
        });
    });
}

async function runTests() {
    await testUrl(basicUrl, 'Testando URL Básica');
    await testUrl(minimalUrl, 'Testando URL com Parâmetros');
    
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('=====================================');
    console.log('1. Se URL básica funcionou: Conta está configurada corretamente');
    console.log('2. Se URL básica falhou: Problema na configuração da conta');
    console.log('3. Se ambas falharam: Handle não existe ou conta não ativa');
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Copie e teste as URLs acima no navegador');
    console.log('2. Se não funcionar, verifique na Infinitepay:');
    console.log('   - Se o handle está correto');
    console.log('   - Se a conta está ativa');
    console.log('   - Se há configurações pendentes');
}

runTests().catch(console.error);
