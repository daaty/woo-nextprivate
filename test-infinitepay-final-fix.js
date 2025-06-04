const axios = require('axios');

async function testInfinitepayFix() {
    console.log('🔧 TESTE: Verificando correção da Infinitepay');
    console.log('==========================================');

    try {
        console.log('\n1️⃣ Testando criação do link com formato corrigido...');
        
        const testData = {
            items: [
                {
                    name: 'Xiaomi Redmi Note 12',
                    price: 899.90,
                    quantity: 1,
                    productId: 137
                }
            ],
            customer: {
                email: 'teste@exemplo.com',
                firstName: 'João',
                lastName: 'Silva',
                phone: '11999999999',
                cpf: '12345678901'
            },
            shipping: {
                address1: 'Rua das Flores, 123',
                address2: 'Apto 45',
                number: '123',
                city: 'São Paulo',
                state: 'SP',
                postcode: '01234567',
                country: 'BR',
                cost: 15.50
            },
            billing: {
                address1: 'Rua das Flores, 123',
                city: 'São Paulo',
                state: 'SP',
                postcode: '01234567',
                country: 'BR'
            },
            total: 915.40, // 899.90 + 15.50
            paymentMethod: 'infinitepay'
        };

        console.log('📤 Enviando dados para API...');
        console.log('   - Produto: R$', testData.items[0].price);
        console.log('   - Frete: R$', testData.shipping.cost);
        console.log('   - Total: R$', testData.total);

        const response = await axios.post('http://localhost:3000/api/infinitepay/create-link', testData, {
            timeout: 30000
        });

        if (response.status === 200 && response.data.success) {
            console.log('✅ API respondeu com sucesso!');
            console.log('🔗 URL gerada:', response.data.checkoutUrl);
            
            // Testar se a URL é acessível
            console.log('\n2️⃣ Testando se a URL da Infinitepay é acessível...');
            
            try {
                const urlTest = await axios.head(response.data.checkoutUrl, {
                    timeout: 10000,
                    maxRedirects: 5
                });
                
                if (urlTest.status === 200) {
                    console.log('✅ URL da Infinitepay está acessível!');
                    console.log('🎉 PROBLEMA CORRIGIDO: A Infinitepay agora deve funcionar!');
                } else {
                    console.log('⚠️ URL retornou status:', urlTest.status);
                }
                
            } catch (urlError) {
                if (urlError.response) {
                    console.log('❌ Erro ao acessar URL:', urlError.response.status, urlError.response.statusText);
                    
                    if (urlError.response.status === 400) {
                        console.log('❌ Ainda há problema nos parâmetros enviados para a Infinitepay');
                        
                        // Decodificar URL para debug
                        const url = new URL(response.data.checkoutUrl);
                        console.log('\n🔍 DEBUG - Parâmetros enviados:');
                        for (const [key, value] of url.searchParams.entries()) {
                            console.log(`   ${key}: ${value}`);
                        }
                    }
                } else {
                    console.log('❌ Erro de rede:', urlError.message);
                }
            }
            
        } else {
            console.log('❌ API retornou erro:', response.data);
        }

    } catch (error) {
        console.log('❌ Erro ao testar:', error.response?.data || error.message);
        
        if (error.response?.data) {
            console.log('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
        }
    }

    console.log('\n✅ Teste finalizado!');
}

testInfinitepayFix()
    .then(() => {
        console.log('\n🏁 Verificação concluída!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erro crítico:', error);
        process.exit(1);
    });
