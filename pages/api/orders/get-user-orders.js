
/**
 * API Route para buscar pedidos do usuário
 * Integra pedidos do WooCommerce + pedidos do PagBank
 * GET /api/orders/get-user-orders
 */

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { userId, email } = req.query;

        if (!userId && !email) {
            return res.status(400).json({ 
                error: 'ID do usuário ou email é obrigatório' 
            });
        }

        console.log('[GetUserOrders] Buscando pedidos para:', { userId, email });

        // Buscar pedidos do sistema local (salvos no BD local ou arquivo JSON)
        const localOrders = await getLocalOrders(userId, email);
        
        // Buscar pedidos do WooCommerce (se integrado)
        const wooOrders = await getWooCommerceOrders(userId, email);

        // Combinar e ordenar por data
        const allOrders = [...localOrders, ...wooOrders]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        console.log('[GetUserOrders] Total de pedidos encontrados:', allOrders.length);

        res.status(200).json({
            success: true,
            orders: allOrders,
            total: allOrders.length
        });

    } catch (error) {
        console.error('[GetUserOrders] Erro ao buscar pedidos:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: error.message 
        });
    }
}

/**
 * Buscar pedidos salvos localmente (arquivo JSON temporário ou BD)
 */
async function getLocalOrders(userId, email) {
    try {
        // Por enquanto, usar arquivo JSON como simulação
        // Em produção, substituir por consulta ao banco de dados
        
        const fs = require('fs');
        const path = require('path');
        
        const ordersFilePath = path.join(process.cwd(), 'data', 'orders.json');
        
        // Verificar se arquivo existe
        if (!fs.existsSync(ordersFilePath)) {
            // Criar diretório e arquivo se não existir
            const dirPath = path.dirname(ordersFilePath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            fs.writeFileSync(ordersFilePath, JSON.stringify({ orders: [] }, null, 2));
            return [];
        }

        const ordersData = JSON.parse(fs.readFileSync(ordersFilePath, 'utf8'));
        const orders = ordersData.orders || [];

        // Filtrar pedidos por usuário
        const userOrders = orders.filter(order => 
            order.customer.userId === userId || 
            order.customer.email === email
        );

        // Formatar pedidos para o padrão esperado
        return userOrders.map(order => ({
            id: order.orderId,
            orderNumber: order.orderId.substring(0, 8).toUpperCase(),
            date: order.createdAt,
            status: mapPaymentStatus(order.status),
            total: `R$ ${parseFloat(order.total).toFixed(2)}`,
            paymentMethod: order.paymentType,
            items: order.items || [],
            customer: order.customer,
            shipping: order.shipping,
            paymentData: order.paymentData || {},
            source: 'pagbank'
        }));

    } catch (error) {
        console.error('[GetLocalOrders] Erro ao buscar pedidos locais:', error);
        return [];
    }
}

/**
 * Buscar pedidos do WooCommerce via GraphQL
 */
async function getWooCommerceOrders(userId, email) {
    try {
        // Implementar integração com WooCommerce
        // Por enquanto retornar array vazio
        console.log('[GetWooOrders] Integração WooCommerce ainda não implementada');
        return [];
        
        /*
        // Exemplo de integração futura:
        const response = await fetch(`${process.env.WORDPRESS_SITE_URL}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query GetCustomerOrders($customerId: Int!) {
                        customer(customerId: $customerId) {
                            orders {
                                nodes {
                                    id
                                    orderNumber
                                    date
                                    status
                                    total
                                    lineItems { ... }
                                }
                            }
                        }
                    }
                `,
                variables: { customerId: parseInt(userId) }
            })
        });
        
        const data = await response.json();
        return data?.data?.customer?.orders?.nodes || [];
        */
    } catch (error) {
        console.error('[GetWooOrders] Erro ao buscar pedidos WooCommerce:', error);
        return [];
    }
}

/**
 * Mapear status de pagamento para status de pedido
 */
function mapPaymentStatus(paymentStatus) {
    const statusMap = {
        'pending': 'Pendente',
        'processing': 'Processando',
        'paid': 'Pago',
        'completed': 'Concluído',
        'cancelled': 'Cancelado',
        'failed': 'Falhou',
        'refunded': 'Reembolsado'
    };
    
    return statusMap[paymentStatus] || paymentStatus;
}
