// Debug específico para erro 400 no WooCommerce
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
require('dotenv').config({ path: '.env.local' });

// Inicializar API do WooCommerce
const wooApi = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
    consumerKey: process.env.WOO_CONSUMER_KEY,
    consumerSecret: process.env.WOO_CONSUMER_SECRET,
    version: "wc/v3"
});

async function debugWooCommerceError() {
    console.log('🔍 DEBUG: Erro 400 no WooCommerce');
    console.log('=' * 50);

    try {
        // Testar dados mínimos primeiro
        console.log('\n1️⃣ Testando criação de pedido com dados mínimos...');
        
        const minimalOrderData = {
            status: 'pending',
            total: '899.99',
            billing: {
                first_name: 'João',
                last_name: 'Silva',
                email: 'joao@email.com'
            },
            line_items: [
                {
                    product_id: 137, // ID de produto que sabemos que existe
                    quantity: 1
                }
            ]
        };

        console.log('📦 Dados mínimos:', JSON.stringify(minimalOrderData, null, 2));

        try {
            const minimalResult = await wooApi.post('orders', minimalOrderData);
            console.log('✅ Pedido mínimo criado com sucesso:', minimalResult.data.id);
            
            // Limpar pedido de teste
            await wooApi.delete(`orders/${minimalResult.data.id}`, { force: true });
            console.log('🗑️ Pedido de teste removido');
            
        } catch (minimalError) {
            console.log('❌ Erro no pedido mínimo:', minimalError.response?.data || minimalError.message);
            
            if (minimalError.response?.data?.data?.details) {
                console.log('📋 Detalhes do erro:', minimalError.response.data.data.details);
            }
        }

        // Testar com dados mais complexos (como no código real)
        console.log('\n2️⃣ Testando com dados completos...');
        
        const customer = {
            firstName: "João",
            lastName: "Silva",
            email: "joao@email.com",
            phone: "(11) 99999-9999",
            cpf: "123.456.789-00"
        };

        const shipping = {
            address1: "Rua das Flores, 123",
            address2: "Apto 45", 
            city: "São Paulo",
            state: "SP",
            postcode: "01234-567",
            country: "BR",
            number: "123"
        };

        const items = [
            {
                name: "Smartphone Xiaomi Redmi Note 12",
                databaseId: 137,
                price: 899.99,
                quantity: 1
            }
        ];

        const complexOrderData = {
            customer_id: 0,
            payment_method: 'infinitepay-checkout',
            payment_method_title: 'Infinitepay Checkout',
            status: 'pending',
            total: '899.99',
            needs_shipping_address: true,
            shipping_required: true,
            virtual: false,
            billing: {
                first_name: customer.firstName || '',
                last_name: customer.lastName || '',
                email: customer.email,
                phone: customer.phone || '',
                address_1: shipping?.address1 || '',
                address_2: shipping?.address2 || '',
                city: shipping?.city || '',
                state: shipping?.state || '',
                postcode: shipping?.postcode || '',
                country: shipping?.country || 'BR'
            },
            shipping: {
                first_name: customer.firstName || '',
                last_name: customer.lastName || '',
                address_1: shipping?.address1 || '',
                address_2: shipping?.address2 || '',
                city: shipping?.city || '',
                state: shipping?.state || '',
                postcode: shipping?.postcode || '',
                country: shipping?.country || 'BR'
            },
            line_items: [
                {
                    product_id: 137,
                    quantity: 1,
                    total: '899.99'
                }
            ],
            meta_data: [
                {
                    key: 'infinitepay_processing',
                    value: 'true'
                },
                {
                    key: 'customer_cpf',
                    value: customer.cpf || ''
                }
            ]
        };

        console.log('📦 Dados completos (resumo):', {
            billing: complexOrderData.billing.email,
            shipping: complexOrderData.shipping.address_1,
            items: complexOrderData.line_items.length,
            meta: complexOrderData.meta_data.length
        });

        try {
            const complexResult = await wooApi.post('orders', complexOrderData);
            console.log('✅ Pedido completo criado com sucesso:', complexResult.data.id);
            
            // Limpar pedido de teste
            await wooApi.delete(`orders/${complexResult.data.id}`, { force: true });
            console.log('🗑️ Pedido de teste removido');
            
        } catch (complexError) {
            console.log('❌ Erro no pedido completo:', complexError.response?.data || complexError.message);
            
            if (complexError.response?.data?.data?.details) {
                console.log('📋 Detalhes do erro WooCommerce:', complexError.response.data.data.details);
            }
            
            if (complexError.response?.data?.data?.params) {
                console.log('📋 Parâmetros inválidos:', complexError.response.data.data.params);
            }
        }

    } catch (error) {
        console.error('💥 Erro geral:', error);
    }
}

// Executar debug
debugWooCommerceError()
    .then(() => {
        console.log('\n🏁 Debug concluído!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erro crítico:', error);
        process.exit(1);
    });
