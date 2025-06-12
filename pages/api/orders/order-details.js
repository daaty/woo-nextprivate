/**
 * API Route para buscar detalhes completos de um pedido específico
 * GET /api/orders/order-details?orderId=123
 */

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
    consumerKey: process.env.WOO_CONSUMER_KEY,
    consumerSecret: process.env.WOO_CONSUMER_SECRET,
    version: "wc/v3"
});

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { orderId } = req.query;

        if (!orderId) {
            return res.status(400).json({ 
                error: 'ID do pedido é obrigatório' 
            });
        }

        console.log(`[Order Details API] Buscando detalhes do pedido: ${orderId}`);

        // Buscar pedido específico com todos os detalhes
        const { data: order } = await api.get(`orders/${orderId}`);

        console.log(`[Order Details API] Pedido encontrado: ${order.id}, Status: ${order.status}`);
        console.log(`[Order Details API] Meta data encontrados: ${order.meta_data?.length || 0} itens`);

        // Retornar pedido completo com meta_data
        return res.status(200).json({
            success: true,
            order: {
                id: order.id,
                number: order.number,
                status: order.status,
                date_created: order.date_created,
                date_modified: order.date_modified,
                total: order.total,
                payment_method: order.payment_method,
                payment_method_title: order.payment_method_title,
                customer_id: order.customer_id,
                meta_data: order.meta_data || [],
                line_items: order.line_items || [],
                billing: order.billing || {},
                shipping: order.shipping || {}
            }
        });

    } catch (error) {
        console.error('[Order Details API] Erro ao buscar pedido:', error.message);
        
        return res.status(error.response?.status || 500).json({
            success: false,
            error: 'Erro ao buscar detalhes do pedido',
            message: error.message,
            details: error.response?.data || null
        });
    }
}
