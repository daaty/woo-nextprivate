// Debug específico para erro "página não encontrada" da Infinitepay
const fetch = require('cross-fetch');

async function debugInfinitepayError() {
    console.log('🔍 DIAGNÓSTICO: Erro "página não encontrada" Infinitepay');
    console.log('=' * 60);

    // 1. Verificar se o handle base funciona
    console.log('\n1️⃣ Testando handle base da Infinitepay...');
    
    const baseHandles = [
        'rotadoscelulares',
        'rota-dos-celulares', 
        'rotacelulares',
        'rota-celulares'
    ];

    for (const handle of baseHandles) {
        try {
            const testUrl = `https://checkout.infinitepay.io/${handle}`;
            console.log(`\n🧪 Testando: ${testUrl}`);
            
            const response = await fetch(testUrl, { 
                method: 'GET',
                redirect: 'manual' // Não seguir redirects
            });
            
            console.log(`   Status: ${response.status}`);
            console.log(`   Headers Location: ${response.headers.get('location') || 'N/A'}`);
            
            if (response.status === 200) {
                console.log('   ✅ Handle VÁLIDO encontrado!');
                const text = await response.text();
                if (text.includes('Infinitepay') || text.includes('checkout')) {
                    console.log('   ✅ Página de checkout detectada');
                } else {
                    console.log('   ⚠️ Página existe mas pode não ser checkout');
                }
            } else if (response.status === 404) {
                console.log('   ❌ Handle não existe');
            } else if (response.status >= 300 && response.status < 400) {
                console.log('   🔄 Redirect detectado');
            }
            
        } catch (error) {
            console.log(`   💥 Erro: ${error.message}`);
        }
    }

    // 2. Testar URL completa com parâmetros mínimos
    console.log('\n\n2️⃣ Testando URL com parâmetros mínimos...');
    
    const testParams = new URLSearchParams({
        'items[0][name]': 'Produto Teste',
        'items[0][price]': '1000', // R$ 10,00 em centavos
        'items[0][quantity]': '1',
        'customer[name]': 'João Teste',
        'customer[email]': 'teste@email.com',
        'nsu': 'test_' + Date.now(),
        'redirect_url': 'https://rotadoscelulares.com/confirmacao'
    });

    for (const handle of baseHandles) {
        try {
            const fullUrl = `https://checkout.infinitepay.io/${handle}?${testParams.toString()}`;
            console.log(`\n🧪 Testando URL completa: ${handle}`);
            console.log(`   URL: ${fullUrl.substring(0, 100)}...`);
            
            const response = await fetch(fullUrl, { 
                method: 'GET',
                redirect: 'manual'
            });
            
            console.log(`   Status: ${response.status}`);
            
            if (response.status === 200) {
                console.log('   ✅ URL completa FUNCIONA!');
                break;
            } else if (response.status === 404) {
                console.log('   ❌ Página não encontrada');
            } else {
                console.log(`   ⚠️ Status inesperado: ${response.status}`);
            }
            
        } catch (error) {
            console.log(`   💥 Erro: ${error.message}`);
        }
    }

    // 3. Verificar se existem problemas com caracteres especiais
    console.log('\n\n3️⃣ Testando caracteres especiais nos parâmetros...');
    
    const problematicParams = new URLSearchParams({
        'items[0][name]': 'Smartphone Xiaomi Redmi Note 12 128GB', // Nome real com espaços
        'items[0][price]': '89900', // Preço real
        'items[0][quantity]': '1',
        'customer[name]': 'José da Silva', // Nome com acentos
        'customer[email]': 'jose@email.com.br',
        'customer[cpf]': '123.456.789-00', // CPF com pontuação
        'nsu': 'ORDER_123_' + Date.now(),
        'redirect_url': 'https://rotadoscelulares.com/confirmacao/infinitepay?order=123'
    });

    try {
        const testUrl = `https://checkout.infinitepay.io/rotadoscelulares?${problematicParams.toString()}`;
        console.log('🧪 Testando com dados reais...');
        console.log('   Parâmetros:', problematicParams.toString().substring(0, 200) + '...');
        
        const response = await fetch(testUrl, { 
            method: 'GET',
            redirect: 'manual'
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.status === 404) {
            console.log('   ❌ Problema pode estar nos parâmetros ou codificação');
        }
        
    } catch (error) {
        console.log(`   💥 Erro: ${error.message}`);
    }

    // 4. Verificar documentação ou configuração necessária
    console.log('\n\n4️⃣ Verificações adicionais necessárias:');
    console.log('   📋 Verificar no painel Infinitepay:');
    console.log('   - Handle correto da loja');
    console.log('   - Status da conta (ativa/inativa)');
    console.log('   - Configurações de checkout');
    console.log('   - Domínios autorizados');
    console.log('   \n   📋 Verificar no código:');
    console.log('   - INFINITEPAY_HANDLE no .env.local');
    console.log('   - Formato dos parâmetros enviados');
    console.log('   - Codificação de URL');

    console.log('\n\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Confirmar handle correto no painel Infinitepay');
    console.log('2. Verificar se conta está ativa');
    console.log('3. Testar com parâmetros mais simples');
    console.log('4. Verificar logs no painel Infinitepay');
}

// Executar diagnóstico
debugInfinitepayError()
    .then(() => {
        console.log('\n🏁 Diagnóstico concluído!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erro no diagnóstico:', error);
        process.exit(1);
    });
