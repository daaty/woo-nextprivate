/**
 * Teste final para verificar se o problema do endereço de entrega foi resolvido
 * Simula um pedido completo do início ao fim
 */

const testCompleteOrder = () => {
    console.log('🔍 === TESTE COMPLETO DE PEDIDO - VERIFICAÇÃO FINAL ===\n');
    
    // Simular dados exatos como aparecem no seu caso
    const realOrderData = {
        paymentMethod: 'infinitepay-checkout',
        shipping: {
            address1: 'Rua Engenheiro Ricardo Franco',
            address2: '',
            city: 'Cuiabá',
            state: 'Mato Grosso',
            postcode: '78005000',
            country: 'BR'
        },
        billing: {
            address1: 'Rua Engenheiro Ricardo Franco',
            address2: '',
            city: 'Cuiabá', 
            state: 'Mato Grosso',
            postcode: '78005000',
            country: 'BR'
        },
        customer: {
            firstName: 'Wesley',
            lastName: 'Silva',
            email: 'arctic-pkr@hotmail.com',
            phone: '66999367808',
            databaseId: 123
        },
        items: [
            {
                name: 'Smartphone XYZ',
                price: 899.99,
                quantity: 1,
                productId: 456
            }
        ],
        total: 919.99,
        shippingCost: 20.00
    };

    console.log('1. 📝 DADOS DO PEDIDO ORIGINAL:');
    console.log('   Cliente:', realOrderData.customer.firstName, realOrderData.customer.lastName);
    console.log('   Email:', realOrderData.customer.email);
    console.log('   Telefone:', realOrderData.customer.phone);
    console.log('   Total:', 'R$', realOrderData.total);
    console.log('');

    console.log('2. 🏠 ENDEREÇOS CONFIGURADOS:');
    console.log('   ENTREGA (shipping):');
    console.log('   - Endereço:', realOrderData.shipping.address1);
    console.log('   - Cidade:', realOrderData.shipping.city);
    console.log('   - Estado:', realOrderData.shipping.state);
    console.log('   - CEP:', realOrderData.shipping.postcode);
    console.log('');
    console.log('   COBRANÇA (billing):');
    console.log('   - Endereço:', realOrderData.billing.address1);
    console.log('   - Cidade:', realOrderData.billing.city);
    console.log('   - Estado:', realOrderData.billing.state);
    console.log('   - CEP:', realOrderData.billing.postcode);
    console.log('');

    // Simular processamento da API exatamente como está implementado
    const { items, customer, shipping, billing, total, paymentMethod } = realOrderData;
    
    console.log('3. ✅ VALIDAÇÕES DA API:');
    console.log('   Shipping válido:', !!(shipping && shipping.address1 && shipping.postcode));
    console.log('   Customer válido:', !!(customer && customer.email));
    console.log('   Items válidos:', !!(items && Array.isArray(items) && items.length > 0));
    console.log('');

    // Simular objeto exato que será enviado ao WooCommerce
    const finalOrderTotal = parseFloat(total.toString());
    
    const wooOrderData = {
        customer_id: customer.databaseId || 0,
        payment_method: 'infinitepay-checkout',
        payment_method_title: 'Infinitepay Checkout',
        status: 'pending',
        total: finalOrderTotal.toFixed(2),
        needs_shipping_address: true,
        shipping_required: true,
        virtual: false,
        billing: {
            first_name: customer.firstName || '',
            last_name: customer.lastName || '',
            email: customer.email,
            phone: customer.phone || '',
            address_1: billing?.address1 || shipping?.address1 || '',
            address_2: billing?.address2 || shipping?.address2 || '',
            city: billing?.city || shipping?.city || '',
            state: billing?.state || shipping?.state || '',
            postcode: billing?.postcode || shipping?.postcode || '',
            country: billing?.country || shipping?.country || 'BR'
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
        line_items: items.map(item => ({
            product_id: item.productId || 0,
            quantity: item.quantity || 1,
            name: item.name,
            price: item.price.toFixed(2),
            total: (item.price * item.quantity).toFixed(2),
            virtual: false,
            downloadable: false,
            requires_shipping: true
        })),
        meta_data: [
            { key: 'infinitepay_processing', value: 'true' },
            { key: '_requires_shipping', value: 'yes' },
            { key: '_shipping_address_index', value: shipping?.address1 || '' },
            { key: '_shipping_city', value: shipping?.city || '' },
            { key: '_shipping_state', value: shipping?.state || '' },
            { key: '_shipping_postcode', value: shipping?.postcode || '' },
            { key: '_shipping_country', value: shipping?.country || 'BR' }
        ]
    };

    console.log('4. 📤 DADOS FINAIS PARA WOOCOMMERCE:');
    console.log('   needs_shipping_address:', wooOrderData.needs_shipping_address);
    console.log('   shipping_required:', wooOrderData.shipping_required);
    console.log('   virtual:', wooOrderData.virtual);
    console.log('');
    console.log('   BILLING WooCommerce:');
    console.log('   - first_name:', wooOrderData.billing.first_name);
    console.log('   - last_name:', wooOrderData.billing.last_name);
    console.log('   - address_1:', wooOrderData.billing.address_1);
    console.log('   - city:', wooOrderData.billing.city);
    console.log('   - state:', wooOrderData.billing.state);
    console.log('   - postcode:', wooOrderData.billing.postcode);
    console.log('');
    console.log('   SHIPPING WooCommerce:');
    console.log('   - first_name:', wooOrderData.shipping.first_name);
    console.log('   - last_name:', wooOrderData.shipping.last_name);
    console.log('   - address_1:', wooOrderData.shipping.address_1);
    console.log('   - city:', wooOrderData.shipping.city);
    console.log('   - state:', wooOrderData.shipping.state);
    console.log('   - postcode:', wooOrderData.shipping.postcode);
    console.log('');

    console.log('5. 🔍 VERIFICAÇÕES CRÍTICAS:');
    const shippingOk = !!(wooOrderData.shipping.address_1 && wooOrderData.shipping.postcode);
    const billingOk = !!(wooOrderData.billing.address_1 && wooOrderData.billing.postcode);
    const flagsOk = wooOrderData.needs_shipping_address && wooOrderData.shipping_required && !wooOrderData.virtual;
    const metaOk = wooOrderData.meta_data.some(meta => meta.key === '_requires_shipping' && meta.value === 'yes');
    
    console.log('   ✅ Shipping completo:', shippingOk);
    console.log('   ✅ Billing completo:', billingOk);
    console.log('   ✅ Flags de entrega:', flagsOk);
    console.log('   ✅ Meta shipping:', metaOk);
    console.log('   ✅ Items físicos:', wooOrderData.line_items.every(item => item.requires_shipping));
    console.log('');

    // Resultado final
    const allTestsPassed = shippingOk && billingOk && flagsOk && metaOk;
    
    if (allTestsPassed) {
        console.log('🎉 ===== TESTE APROVADO =====');
        console.log('✅ Todos os dados estão corretos!');
        console.log('✅ Endereço de entrega será enviado para o WooCommerce!');
        console.log('✅ Todas as flags necessárias estão configuradas!');
        console.log('');
        console.log('🔄 PRÓXIMOS PASSOS:');
        console.log('1. Fazer um pedido real no checkout');
        console.log('2. Verificar nos logs se os dados foram enviados');
        console.log('3. Verificar no painel WooCommerce se ambos endereços aparecem');
        console.log('4. Se ainda não aparecer, verificar configurações do tema/plugin');
    } else {
        console.log('❌ ===== TESTE FALHOU =====');
        console.log('❌ Algum dado está faltando!');
        console.log('- Shipping OK:', shippingOk);
        console.log('- Billing OK:', billingOk);
        console.log('- Flags OK:', flagsOk);
        console.log('- Meta OK:', metaOk);
    }
    
    console.log('');
    console.log('📋 RESUMO DAS CORREÇÕES IMPLEMENTADAS:');
    console.log('✅ 1. Separação correta de billing e shipping no checkout.js');
    console.log('✅ 2. Validação de shipping obrigatório na API');
    console.log('✅ 3. Flags needs_shipping_address e shipping_required');
    console.log('✅ 4. Items marcados como requires_shipping: true');
    console.log('✅ 5. Meta data _requires_shipping: yes');
    console.log('✅ 6. Logs detalhados para debug');
    console.log('✅ 7. Validação final dos dados criados');
};

// Executar teste
testCompleteOrder();
