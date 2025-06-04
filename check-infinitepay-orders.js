// Script para verificar pedidos Infinitepay
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

const wooApi = new WooCommerceRestApi({
    url: 'https://rota.rotadoscelulares.com',
    consumerKey: 'ck_5c4ee8894628afae3de00713c32d90b17bb53b05',
    consumerSecret: 'cs_2059eb6cf2a4319f68bcfd7541ab2bceca14cb97',
    version: 'wc/v3'
});

async function checkRecentOrders() {
    try {        console.log('Verificando pedidos antigos (#171-178) e novos (#295-298)...');
        
        // Buscar pedidos antigos e novos para comparação
        const orders = await wooApi.get('orders', { 
            include: [171, 172, 174, 175, 177, 178, 295, 296, 297, 298], 
            per_page: 20 
        });orders.data.forEach(order => {
            console.log(`\nPedido #${order.number} (ID: ${order.id}):`);
            console.log(`  Payment Method: ${order.payment_method}`);
            console.log(`  Payment Method Title: ${order.payment_method_title}`);
            console.log(`  Status: ${order.status}`);
            console.log(`  Date: ${order.date_created}`);
            console.log(`  Customer ID: ${order.customer_id}`);
            console.log(`  Total: ${order.total}`);
            console.log(`  Subtotal: ${order.subtotal}`);
            console.log(`  Total Tax: ${order.total_tax}`);
            console.log(`  Shipping Total: ${order.shipping_total}`);
            console.log(`  Line Items:`);
            order.line_items.forEach(item => {
                console.log(`    - ${item.name}: Qty ${item.quantity} x ${item.price} = ${item.total}`);
            });
            console.log(`  Meta Data:`);
            order.meta_data.forEach(meta => {
                if (meta.key.includes('infinitepay') || meta.key.includes('payment') || meta.key.includes('total')) {
                    console.log(`    ${meta.key}: ${meta.value}`);
                }
            });
        });

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

checkRecentOrders();
