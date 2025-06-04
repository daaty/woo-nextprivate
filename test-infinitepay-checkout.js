// Test script para verificar a criação de links de checkout Infinitepay
// Execute: node test-infinitepay-checkout.js

require('dotenv').config({ path: '.env.local' });

async function testInfinitepayCheckout() {
    console.log('🧪 Testando criação de link de checkout Infinitepay...\n');

    // Verificar configuração
    const handle = process.env.INFINITEPAY_HANDLE;
    console.log('📝 Configuração:');
    console.log(`   Handle: ${handle}`);
    console.log(`   Site URL: ${process.env.NEXT_PUBLIC_SITE_URL}`);
    
    if (!handle) {
        console.error('❌ INFINITEPAY_HANDLE não configurado!');
        return;
    }

    if (handle === 'seu_handle_aqui' || handle === 'your_handle_here') {
        console.error('❌ INFINITEPAY_HANDLE ainda não foi configurado com valor real!');
        return;
    }

    console.log('✅ Configuração OK\n');

    // Simular dados de teste
    const testData = {
        items: [
            {
                name: 'iPhone 15 Pro 128GB',
                price: 1299.99,
                quantity: 1,
                productId: 123
            },
            {
                name: 'Capinha iPhone 15 Pro',
                price: 59.90,
                quantity: 1,
                productId: 456
            }
        ],
        customer: {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao.silva@email.com',
            phone: '(11) 99999-9999',
            cpf: '123.456.789-00'
        },
        shipping: {
            address1: 'Rua das Flores, 123',
            address2: 'Apto 45',
            city: 'São Paulo',
            state: 'SP',
            postcode: '01234-567',
            country: 'BR',
            cost: 15.50,
            number: '123'
        },
        total: 1375.39,
        paymentMethod: 'infinitepay-checkout'
    };

    console.log('📦 Dados de teste:');
    console.log(`   Cliente: ${testData.customer.firstName} ${testData.customer.lastName}`);
    console.log(`   Email: ${testData.customer.email}`);
    console.log(`   Itens: ${testData.items.length}`);
    console.log(`   Total: R$ ${testData.total.toFixed(2)}`);
    console.log(`   Frete: R$ ${testData.shipping.cost.toFixed(2)}\n`);

    try {
        console.log('🔄 Simulando criação de link...');

        // Preparar itens no formato Infinitepay (centavos)
        const infinitepayItems = testData.items.map(item => ({
            name: item.name,
            amount: Math.round((item.price * item.quantity) * 100),
            quantity: 1
        }));

        // Adicionar frete
        if (testData.shipping.cost > 0) {
            infinitepayItems.push({
                name: 'Frete',
                amount: Math.round(testData.shipping.cost * 100),
                quantity: 1
            });
        }

        // Gerar NSU e URLs
        const orderNsu = `TEST_${Date.now()}`;
        const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/confirmacao/infinitepay?order=TEST`;

        // Construir URL do checkout
        const baseUrl = `https://checkout.infinitepay.io/${handle}`;
        const params = new URLSearchParams();
        
        params.append('items', JSON.stringify(infinitepayItems));
        params.append('order_nsu', orderNsu);
        params.append('redirect_url', redirectUrl);
        params.append('customer_name', `${testData.customer.firstName} ${testData.customer.lastName}`);
        params.append('customer_email', testData.customer.email);
        
        const cleanPhone = testData.customer.phone.replace(/\D/g, '');
        if (cleanPhone.length >= 10) {
            params.append('customer_cellphone', cleanPhone);
        }
        
        const cleanCep = testData.shipping.postcode.replace(/\D/g, '');
        if (cleanCep.length === 8) {
            params.append('address_cep', cleanCep);
        }

        const checkoutUrl = `${baseUrl}?${params.toString()}`;

        console.log('✅ Link de checkout gerado com sucesso!\n');
        console.log('🔗 URL do Checkout:');
        console.log(checkoutUrl);
        console.log('\n📋 Detalhes:');
        console.log(`   Base URL: ${baseUrl}`);
        console.log(`   Order NSU: ${orderNsu}`);
        console.log(`   Redirect URL: ${redirectUrl}`);
        console.log(`   Itens processados: ${infinitepayItems.length}`);
        
        console.log('\n💰 Itens para Infinitepay:');
        infinitepayItems.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.name} - R$ ${(item.amount / 100).toFixed(2)}`);
        });

        console.log('\n🚀 Teste concluído com sucesso!');
        console.log('💡 Você pode copiar a URL acima e testar no navegador');

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Executar teste
testInfinitepayCheckout();
