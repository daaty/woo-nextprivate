const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
    consumerKey: process.env.WOO_CONSUMER_KEY,
    consumerSecret: process.env.WOO_CONSUMER_SECRET,
    version: "wc/v3"
});

export default async function handler(req, res) {
    const { orderId } = req.query;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        console.log(`[Test Order API] Buscando pedido ${orderId} via REST API...`);
        
        // Buscar pedido específico
        const { data: order } = await api.get(`orders/${orderId}`);
        
        console.log(`[Test Order API] Pedido encontrado:`, {
            id: order.id,
            number: order.number,
            status: order.status,
            customer_id: order.customer_id,
            date_created: order.date_created,
            total: order.total
        });

        // Buscar também todos os pedidos para comparar
        const { data: allOrders } = await api.get('orders', {
            per_page: 20,
            orderby: 'date',
            order: 'desc'
        });

        console.log(`[Test Order API] Total de pedidos encontrados: ${allOrders.length}`);
        
        return res.status(200).json({
            success: true,
            order: {
                id: order.id,
                number: order.number,
                status: order.status,
                customer_id: order.customer_id,
                date_created: order.date_created,
                total: order.total,
                billing: order.billing,
                meta_data: order.meta_data
            },
            summary: {
                totalOrders: allOrders.length,
                recentOrders: allOrders.slice(0, 5).map(o => ({
                    id: o.id,
                    number: o.number,
                    status: o.status,
                    customer_id: o.customer_id,
                    date_created: o.date_created
                }))
            }
        });

    } catch (error) {
        console.error(`[Test Order API] Erro ao buscar pedido ${orderId}:`, error.message);
        
        return res.status(error.response?.status || 500).json({
            success: false,
            error: error.message,
            details: error.response?.data || null
        });
    }
}
