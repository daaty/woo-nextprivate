// Teste específico para verificar correção da Infinitepay
const fetch = require('cross-fetch');

async function testInfinitepayFix() {
    console.log('🔧 TESTE: Correção da Infinitepay - Formato de parâmetros');
    console.log('=' * 60);

    try {
        console.log('\n1️⃣ Testando criação de link com dados reais...');
        
        const testPayload = {
            items: [
                {
                    name: "Smartphone Xiaomi Redmi Note 12",
                    price: 899.99,
                    quantity: 1
                }
            ],
            customer: {
                firstName: "João",
                lastName: "Silva",
                email: "joao@email.com",
                phone: "(11) 99999-9999",
                cpf: "123.456.789-00"
            },
            shipping: {
                address1: "Rua das Flores, 123",
                address2: "Apto 45",
                city: "São Paulo",
                state: "SP",
                postcode: "01234-567",
                country: "BR",
                number: "123"
            },
            billing: {
                address1: "Rua das Flores, 123",
                address2: "Apto 45",
                city: "São Paulo",
                state: "SP",
                postcode: "01234-567",
                country: "BR"
            },
            total: 899.99,
            paymentMethod: "infinitepay"
        };

        console.log('📦 Dados do teste:', {
            items: testPayload.items.length,
            customer: testPayload.customer.email,
            total: testPayload.total
        });

        // Chamar API local
        const response = await fetch('http://localhost:3000/api/infinitepay/create-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPayload)
        });

        console.log(`\n2️⃣ Resposta da API: ${response.status}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Link criado com sucesso!');
            console.log('🔗 URL gerada:', data.checkoutUrl);
            console.log('📋 Order ID:', data.orderId);
            console.log('📋 Order Number:', data.orderNumber);

            // Testar se o link funciona
            console.log('\n3️⃣ Testando acesso ao link gerado...');
            
            try {
                const linkResponse = await fetch(data.checkoutUrl, {
                    method: 'GET',
                    redirect: 'manual'
                });

                console.log(`Status do link: ${linkResponse.status}`);
                
                if (linkResponse.status === 200) {
                    console.log('✅ SUCESSO! Link da Infinitepay funcionando!');
                    
                    // Verificar se é página de checkout
                    const pageContent = await linkResponse.text();
                    if (pageContent.includes('checkout') || pageContent.includes('Infinitepay') || pageContent.length > 1000) {
                        console.log('✅ Página de checkout detectada!');
                    } else {
                        console.log('⚠️ Página carregada mas pode não ser checkout');
                        console.log('Conteúdo (primeiros 200 chars):', pageContent.substring(0, 200));
                    }
                } else if (linkResponse.status === 404) {
                    console.log('❌ AINDA COM ERRO: Página não encontrada');
                    console.log('🔍 Verificar se o formato dos parâmetros está correto');
                } else {
                    console.log(`⚠️ Status inesperado: ${linkResponse.status}`);
                }

            } catch (linkError) {
                console.log('❌ Erro ao testar link:', linkError.message);
            }

        } else {
            const errorData = await response.text();
            console.log('❌ Erro na criação do link:', errorData);
        }

    } catch (error) {
        console.error('💥 Erro no teste:', error);
    }
}

// Executar teste
testInfinitepayFix()
    .then(() => {
        console.log('\n🏁 Teste concluído!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erro crítico:', error);
        process.exit(1);
    });
