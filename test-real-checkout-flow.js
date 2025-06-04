// Teste completo do fluxo de checkout Infinitepay
const axios = require('axios');

async function testRealCheckoutFlow() {
    console.log('🛒 TESTE: Simulação do fluxo real de checkout');
    console.log('=' * 60);

    try {
        // 1. Primeiro, vamos verificar se o servidor está rodando
        console.log('\n1️⃣ Verificando servidor...');
        try {
            const healthCheck = await axios.get('http://localhost:3000/api/health', {
                timeout: 5000
            });
            console.log('✅ Servidor rodando');
        } catch (healthError) {
            console.log('❌ Servidor não está rodando. Execute: npm run dev');
            return;
        }

        // 2. Verificar configuração da Infinitepay
        console.log('\n2️⃣ Verificando configuração...');
        const configTest = await axios.post('http://localhost:3000/api/infinitepay/create-link', {
            items: [],
            customer: { email: 'test@test.com' },
            shipping: { address1: 'test' },
            total: 0
        });
        
        if (configTest.status === 400) {
            console.log('✅ API responde corretamente a dados inválidos');
        }

        // 3. Dados de checkout simulando um cenário real
        const realScenarioData = {
            items: [
                {
                    name: 'iPhone 15 Pro Max 256GB',
                    price: 899.99,
                    quantity: 1,
                    productId: 137,
                    totalPrice: 899.99
                },
                {
                    name: 'Capa Protetora',
                    price: 49.90,
                    quantity: 1,
                    productId: 117,
                    totalPrice: 49.90
                }
            ],
            customer: {
                firstName: 'Felipe',
                lastName: 'Cliente',
                email: 'felipe@rotadoscelulares.com',
                phone: '11987654321',
                cpf: '12345678901',
                databaseId: 1
            },
            shipping: {
                address1: 'Rua das Palmeiras, 123',
                address2: 'Apto 45',
                city: 'São Paulo',
                state: 'SP',
                postcode: '01310100',
                country: 'BR',
                cost: 25.90
            },
            billing: {
                address1: 'Rua das Palmeiras, 123',
                city: 'São Paulo',
                state: 'SP',
                postcode: '01310100',
                country: 'BR'
            },
            total: 975.79, // 899.99 + 49.90 + 25.90
            paymentMethod: 'infinitepay'
        };

        console.log('\n3️⃣ Criando checkout com dados reais...');
        const checkoutResponse = await axios.post('http://localhost:3000/api/infinitepay/create-link', realScenarioData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('✅ Checkout criado com sucesso!');
        console.log('📋 Dados da resposta:');
        console.log('- Order ID:', checkoutResponse.data.orderId);
        console.log('- Order Number:', checkoutResponse.data.orderNumber);
        console.log('- Success:', checkoutResponse.data.success);

        const checkoutUrl = checkoutResponse.data.checkoutUrl;
        console.log('\n🔗 URL de checkout gerada:');
        console.log(checkoutUrl);

        // 4. Verificar se a URL está acessível
        console.log('\n4️⃣ Testando acesso à URL da Infinitepay...');
        try {
            const urlTest = await axios.get(checkoutUrl, {
                timeout: 15000,
                validateStatus: function (status) {
                    return status < 500;
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (urlTest.status === 200) {
                console.log('✅ URL acessível - checkout da Infinitepay funcionando!');
                
                // Verificar se contém elementos típicos de uma página de checkout
                const pageContent = urlTest.data;
                if (typeof pageContent === 'string') {
                    if (pageContent.includes('checkout') || pageContent.includes('payment') || pageContent.includes('infinitepay')) {
                        console.log('✅ Página parece ser um checkout válido');
                    } else {
                        console.log('⚠️ Página não parece ser um checkout (pode ser página de erro)');
                    }
                }
            } else if (urlTest.status === 404) {
                console.log('❌ URL retorna 404 - PROBLEMA IDENTIFICADO!');
                console.log('\n🔍 POSSÍVEIS CAUSAS:');
                console.log('1. Handle "rotadoscelulares" não existe na Infinitepay');
                console.log('2. Conta Infinitepay não está ativa');
                console.log('3. Formato dos parâmetros incorreto');
                console.log('4. URL base da Infinitepay mudou');
                
                // Testar URL base da Infinitepay
                console.log('\n🧪 Testando URL base da Infinitepay...');
                try {
                    const baseTest = await axios.get('https://checkout.infinitepay.io/', {
                        timeout: 10000,
                        validateStatus: () => true
                    });
                    console.log('URL base status:', baseTest.status);
                } catch (baseError) {
                    console.log('❌ URL base inacessível:', baseError.message);
                }
            } else {
                console.log('⚠️ Status inesperado:', urlTest.status);
            }
        } catch (urlError) {
            console.log('❌ Erro ao acessar URL:', urlError.message);
        }

        // 5. Testar URL de confirmação
        console.log('\n5️⃣ Verificando página de confirmação...');
        const confirmationUrl = `http://localhost:3000/confirmacao/infinitepay?order=${checkoutResponse.data.orderId}`;
        try {
            const confirmTest = await axios.get(confirmationUrl, {
                timeout: 10000
            });
            console.log('✅ Página de confirmação acessível');
        } catch (confirmError) {
            console.log('❌ Página de confirmação com problema:', confirmError.message);
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados:', error.response.data);
        }
    }
}

// Executar teste
testRealCheckoutFlow()
    .then(() => {
        console.log('\n🏁 Teste completo concluído!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erro crítico:', error);
        process.exit(1);
    });
