const axios = require('axios');

async function testDomainsFix() {
    console.log('🔧 TESTE: Verificando se os domínios foram corrigidos corretamente');
    console.log('==========================================');

    try {
        console.log('\n1️⃣ Testando GraphQL com rota.rotadoscelulares.com...');
        
        const graphqlTest = await axios.post('https://rota.rotadoscelulares.com/graphql', {
            query: `
                query TestQuery {
                    generalSettings {
                        title
                        url
                    }
                }
            `
        }, {
            timeout: 10000
        });

        if (graphqlTest.status === 200) {
            console.log('✅ GraphQL funcionando:', graphqlTest.data?.data?.generalSettings?.title);
        }

    } catch (error) {
        console.log('❌ Erro no GraphQL:', error.message);
    }

    try {
        console.log('\n2️⃣ Testando Infinitepay com site.rotadoscelulares.com...');
        
        // Teste simulando a criação de link
        const testData = {
            items: [
                {
                    name: 'Produto Teste',
                    price: 100,
                    quantity: 1
                }
            ],
            customer: {
                email: 'teste@exemplo.com',
                firstName: 'João',
                lastName: 'Silva'
            },
            shipping: {
                address1: 'Rua Teste, 123',
                city: 'São Paulo',
                state: 'SP',
                postcode: '01234567'
            },
            total: 115.50,
            paymentMethod: 'infinitepay'
        };

        const infinitepayTest = await axios.post('http://localhost:3000/api/infinitepay/create-link', testData, {
            timeout: 15000
        });

        if (infinitepayTest.status === 200) {
            console.log('✅ Infinitepay funcionando');
            console.log('🔗 URL gerada:', infinitepayTest.data.checkoutUrl);
            
            // Verificar se a URL usa o domínio correto na redirect_url
            const url = new URL(infinitepayTest.data.checkoutUrl);
            const redirectUrl = url.searchParams.get('redirect_url');
            
            if (redirectUrl && redirectUrl.includes('site.rotadoscelulares.com')) {
                console.log('✅ Redirect URL usa domínio correto:', redirectUrl);
            } else {
                console.log('❌ Redirect URL incorreta:', redirectUrl);
            }
        }

    } catch (error) {
        console.log('❌ Erro na Infinitepay:', error.response?.data || error.message);
    }

    console.log('\n3️⃣ Verificando configuração de variáveis de ambiente...');
    
    // Simular leitura do .env
    const envVars = {
        'NEXT_PUBLIC_WORDPRESS_URL': process.env.NEXT_PUBLIC_WORDPRESS_URL || 'não definido',
        'INFINITEPAY_SITE_URL': process.env.INFINITEPAY_SITE_URL || 'não definido',
        'INFINITEPAY_HANDLE': process.env.INFINITEPAY_HANDLE || 'não definido'
    };

    Object.entries(envVars).forEach(([key, value]) => {
        console.log(`📝 ${key}: ${value}`);
    });

    console.log('\n✅ Teste de domínios concluído!');
}

testDomainsFix()
    .then(() => {
        console.log('\n🏁 Verificação finalizada!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erro crítico:', error);
        process.exit(1);
    });
