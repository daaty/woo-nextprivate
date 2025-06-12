/**
 * API Route para buscar pedidos do cliente usando WooCommerce REST API
 * GET /api/orders/customer-orders?customerId=123
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
        const { customerId } = req.query;

        if (!customerId) {
            return res.status(400).json({ 
                error: 'ID do cliente é obrigatório' 
            });
        }        console.log(`[Customer Orders API] Buscando pedidos para customer ID: ${customerId}`);

        // Buscar pedidos do cliente específico
        const { data: customerOrders } = await api.get('orders', {
            customer: customerId,
            per_page: 50,
            orderby: 'date',
            order: 'desc'
        });

        // Buscar também pedidos Infinitepay sem cliente associado (customer_id = 0)
        const { data: infinitepayOrders } = await api.get('orders', {
            customer: 0, // Pedidos sem cliente associado
            per_page: 50,
            orderby: 'date',
            order: 'desc',
            meta_key: 'infinitepay_processing',
            meta_value: 'true'
        });

        // Combinar e remover duplicatas
        const allOrders = [...customerOrders, ...infinitepayOrders];
        const uniqueOrders = allOrders.filter((order, index, self) => 
            index === self.findIndex(o => o.id === order.id)
        );        console.log(`[Customer Orders API] Encontrados ${customerOrders.length} pedidos do cliente + ${infinitepayOrders.length} pedidos Infinitepay = ${uniqueOrders.length} total`);        // Função para calcular total do pedido quando WooCommerce não retorna valor válido
        const calculateOrderTotal = (order) => {
            let total = 0;
            
            // Tentar usar o total do WooCommerce primeiro
            if (order.total && !isNaN(parseFloat(order.total))) {
                return parseFloat(order.total);
            }
            
            console.warn(`[Customer Orders] Total inválido para pedido ${order.number}: "${order.total}". Calculando total baseado nos line_items.`);
            
            // Calcular baseado nos line_items se o total estiver vazio
            if (order.line_items && order.line_items.length > 0) {
                total = order.line_items.reduce((sum, item) => {
                    const itemTotal = parseFloat(item.total) || 0;
                    return sum + itemTotal;
                }, 0);
            }
            
            // Adicionar frete se disponível
            const shippingTotal = parseFloat(order.shipping_total) || 0;
            total += shippingTotal;
            
            // Adicionar taxa se disponível
            const feeTotal = parseFloat(order.fee_total) || 0;
            total += feeTotal;
            
            // Subtrair descontos se disponíveis
            const discountTotal = parseFloat(order.discount_total) || 0;
            total -= discountTotal;
            
            console.log(`[Customer Orders] Total calculado para pedido ${order.number}: R$ ${total.toFixed(2)}`);
            
            return total;
        };

        // Formatar pedidos para o frontend
        const formattedOrders = uniqueOrders.map(order => {
            const calculatedTotal = calculateOrderTotal(order);
            
            return {
                id: order.id,
                orderNumber: order.number,
                date: order.date_created,
                status: formatOrderStatus(order.status),
                statusRaw: order.status,
                total: `R$ ${calculatedTotal.toFixed(2)}`,
                totalRaw: calculatedTotal.toString(),
                paymentMethod: order.payment_method_title || order.payment_method,
                items: order.line_items?.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: `R$ ${parseFloat(item.price || 0).toFixed(2)}`,
                    total: `R$ ${parseFloat(item.total || 0).toFixed(2)}`,
                    image: item.image?.src || null
                })) || [],
                billing: {
                    firstName: order.billing?.first_name,
                    lastName: order.billing?.last_name,
                    email: order.billing?.email,
                    phone: order.billing?.phone,
                    address: order.billing?.address_1,
                    city: order.billing?.city,
                    state: order.billing?.state,
                    postcode: order.billing?.postcode
                },
                shipping: {
                    firstName: order.shipping?.first_name,
                    lastName: order.shipping?.last_name,
                    address: order.shipping?.address_1,
                    city: order.shipping?.city,
                    state: order.shipping?.state,
                    postcode: order.shipping?.postcode
                },
                customerId: order.customer_id,
                orderKey: order.order_key,
                currency: order.currency,
                dateCreated: order.date_created,
                dateModified: order.date_modified,
                // Adicionar informações de debug
                debug: {
                    originalTotal: order.total,
                    calculatedTotal: calculatedTotal.toFixed(2),
                    hasLineItems: !!(order.line_items && order.line_items.length > 0),
                    lineItemsCount: order.line_items?.length || 0
                }
            };
        });

        return res.status(200).json({
            success: true,
            orders: formattedOrders,
            total: formattedOrders.length
        });

    } catch (error) {
        console.error('[Customer Orders API] Erro ao buscar pedidos:', error.message);
        
        return res.status(error.response?.status || 500).json({
            success: false,
            error: 'Erro ao buscar pedidos',
            message: error.message,
            details: error.response?.data || null
        });
    }
}

/**
 * Formatar status do pedido para português
 */
function formatOrderStatus(status) {
    const statusMap = {
        'pending': 'Pendente',
        'processing': 'Processando',
        'on-hold': 'Aguardando',
        'completed': 'Concluído',
        'cancelled': 'Cancelado',
        'refunded': 'Reembolsado',
        'failed': 'Falhou'
    };
    
    return statusMap[status] || status;
}
