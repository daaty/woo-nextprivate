const axios = require('axios');

// Teste de diagnóstico da criação de link Infinitepay
async function testInfinitepayLinkCreation() {
    console.log('🔍 TESTE: Diagnóstico da criação de link Infinitepay');
    console.log('=' * 60);

    try {
        // Dados de teste simples
        const testData = {
            items: [
                {
                    name: 'Produto Teste',
                    price: 100,
                    quantity: 1,
                    productId: 137,
                    totalPrice: 100
                }
            ],
            customer: {
                firstName: 'João',
                lastName: 'Silva',
                email: 'teste@exemplo.com',
                phone: '11999999999',
                cpf: '12345678901'
            },
            shipping: {
                address1: 'Rua Teste, 123',
                address2: 'Apto 45',
                city: 'São Paulo',
                state: 'SP',
                postcode: '01234567',
                country: 'BR',
                cost: 15.50
            },
            billing: {
                address1: 'Rua Teste, 123',
                city: 'São Paulo',
                state: 'SP',
                postcode: '01234567',
                country: 'BR'
            },
            total: 115.50,
            paymentMethod: 'infinitepay'
        };

        console.log('📤 Enviando requisição para API...');
        console.log('Dados enviados:', JSON.stringify(testData, null, 2));

        const response = await axios.post('http://localhost:3000/api/infinitepay/create-link', testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('\n✅ RESPOSTA DA API:');
        console.log('Status:', response.status);
        console.log('Dados:', JSON.stringify(response.data, null, 2));

        if (response.data.checkoutUrl) {
            console.log('\n🔗 LINK GERADO:');
            console.log(response.data.checkoutUrl);
            
            // Tentar acessar o link para verificar se está funcionando
            console.log('\n🌐 Testando acesso ao link...');
            try {
                const linkTest = await axios.get(response.data.checkoutUrl, {
                    timeout: 10000,
                    validateStatus: function (status) {
                        return status < 500; // Aceitar qualquer status < 500
                    }
                });
                console.log('Status do link:', linkTest.status);
                
                if (linkTest.status === 200) {
                    console.log('✅ Link acessível!');
                } else if (linkTest.status === 404) {
                    console.log('❌ Link retorna 404 - página não encontrada');
                    console.log('Possíveis problemas:');
                    console.log('1. Handle incorreto na Infinitepay');
                    console.log('2. Parâmetros malformados na URL');
                    console.log('3. Conta Infinitepay não ativa ou configurada incorretamente');
                } else {
                    console.log('⚠️ Status inesperado:', linkTest.status);
                }
            } catch (linkError) {
                console.log('❌ Erro ao acessar link:', linkError.message);
            }
        }

    } catch (error) {
        console.error('❌ Erro na criação do link:', error.message);
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados do erro:', error.response.data);
        }
    }
}

// Executar teste
testInfinitepayLinkCreation()
    .then(() => {
        console.log('\n🏁 Teste concluído!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erro crítico:', error);
        process.exit(1);
    });
