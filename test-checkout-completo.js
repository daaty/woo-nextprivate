/**
 * Teste completo do checkout Infinitepay
 * Executa: node test-checkout-completo.js
 */

const https = require('https');

// Dados de teste do pedido
const testOrder = {
    items: [
        {
            name: "iPhone 14 Pro Max 256GB",
            amount: 899900, // R$ 8.999,00 em centavos
            quantity: 1
        },
        {
            name: "Frete - Sedex",
            amount: 1550, // R$ 15,50 em centavos  
            quantity: 1
        }
    ],
    order_nsu: `TEST_${Date.now()}`,
    redirect_url: "https://loja.rotadoscelulares.com/confirmacao/infinitepay?order=123",
    customer_name: "João Silva",
    customer_email: "joao@teste.com",
    customer_cellphone: "11999887766",
    address_cep: "01310100"
};

function testCheckoutURL() {
    const handle = process.env.INFINITEPAY_HANDLE || 'rotadoscelulares';
    const baseUrl = `https://checkout.infinitepay.io/${handle}`;
    
    // Criar parâmetros da URL
    const params = new URLSearchParams();
    
    // Parâmetros obrigatórios
    params.append('items', JSON.stringify(testOrder.items));
    params.append('order_nsu', testOrder.order_nsu);
    params.append('redirect_url', testOrder.redirect_url);
    
    // Parâmetros opcionais
    if (testOrder.customer_name) {
        params.append('customer_name', testOrder.customer_name);
    }
    if (testOrder.customer_email) {
        params.append('customer_email', testOrder.customer_email);
    }
    if (testOrder.customer_cellphone) {
        params.append('customer_cellphone', testOrder.customer_cellphone);
    }
    if (testOrder.address_cep) {
        params.append('address_cep', testOrder.address_cep);
    }
    
    const fullUrl = `${baseUrl}?${params.toString()}`;
    
    console.log('🛒 TESTE COMPLETO DO CHECKOUT INFINITEPAY');
    console.log('=' .repeat(60));
    console.log('');
    console.log('📝 Dados do pedido de teste:');
    console.log(`   Handle: ${handle}`);
    console.log(`   NSU: ${testOrder.order_nsu}`);
    console.log(`   Items: ${testOrder.items.length}`);
    console.log(`   Cliente: ${testOrder.customer_name} (${testOrder.customer_email})`);
    console.log(`   Total: R$ ${(testOrder.items.reduce((sum, item) => sum + item.amount, 0) / 100).toFixed(2)}`);
    console.log('');
    console.log('🔗 URL COMPLETA DO CHECKOUT:');
    console.log(fullUrl);
    console.log('');
    console.log('📋 PARÂMETROS ENVIADOS:');
    
    // Mostrar todos os parâmetros
    for (const [key, value] of params.entries()) {
        if (key === 'items') {
            console.log(`   ${key}: ${JSON.stringify(JSON.parse(value), null, 2)}`);
        } else {
            console.log(`   ${key}: ${value}`);
        }
    }
    
    console.log('');
    console.log('🧪 PRÓXIMOS PASSOS PARA TESTAR:');
    console.log('   1. Copie a URL acima');
    console.log('   2. Abra em uma nova aba do navegador');
    console.log('   3. Verifique se a página de checkout carrega');
    console.log('   4. Teste um pagamento simulado (se estiver em sandbox)');
    console.log('');
    console.log('✅ Se funcionar: A integração está OK!');
    console.log('❌ Se não funcionar: Verificar configuração da conta Infinitepay');
    
    return fullUrl;
}

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

// Executar teste
const checkoutUrl = testCheckoutURL();
