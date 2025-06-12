// API para processar retorno de pagamento da Infinitepay
// POST /api/infinitepay/payment-return

const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

// Inicializar API do WooCommerce
const wooApi = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
    consumerKey: process.env.WOO_CONSUMER_KEY,
    consumerSecret: process.env.WOO_CONSUMER_SECRET,
    version: "wc/v3"
});

/**
 * Processar retorno de pagamento da Infinitepay
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { 
            receipt_url, 
            transaction_id, 
            capture_method, 
            order_nsu, 
            slug,
            orderId 
        } = req.body;

        console.log('[Infinitepay] Processando retorno de pagamento...');
        console.log('[Infinitepay] Order ID:', orderId);
        console.log('[Infinitepay] Transaction ID:', transaction_id);
        console.log('[Infinitepay] Order NSU:', order_nsu);
        console.log('[Infinitepay] Capture Method:', capture_method);

        if (!orderId) {
            return res.status(400).json({
                error: 'ID do pedido não fornecido'
            });
        }

        // Verificar se o pagamento foi realmente aprovado
        const INFINITEPAY_HANDLE = process.env.INFINITEPAY_HANDLE;
        
        if (transaction_id && order_nsu && slug && INFINITEPAY_HANDLE) {
            // Fazer verificação na API da Infinitepay
            const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/infinitepay/verify-payment?${new URLSearchParams({
                handle: INFINITEPAY_HANDLE,
                transaction_nsu: transaction_id,
                external_order_nsu: order_nsu,
                slug: slug
            })}`);

            const verifyResult = await verifyResponse.json();
            
            console.log('[Infinitepay] Resultado da verificação:', verifyResult);

            if (verifyResult.success && verifyResult.paid) {
                // Pagamento confirmado - atualizar pedido para "processing"
                await wooApi.put(`orders/${orderId}`, {
                    status: 'processing',
                    meta_data: [
                        {
                            key: 'infinitepay_transaction_id',
                            value: transaction_id
                        },
                        {
                            key: 'infinitepay_receipt_url',
                            value: receipt_url
                        },
                        {
                            key: 'infinitepay_capture_method',
                            value: capture_method
                        },
                        {
                            key: 'infinitepay_payment_confirmed',
                            value: 'true'
                        },
                        {
                            key: 'infinitepay_payment_date',
                            value: new Date().toISOString()
                        }
                    ]
                });

                console.log('[Infinitepay] Pedido atualizado para "processing"');

                res.status(200).json({
                    success: true,
                    message: 'Pagamento confirmado e pedido atualizado',
                    status: 'paid',
                    orderId: orderId,
                    transactionId: transaction_id
                });

            } else {
                // Pagamento não confirmado
                console.log('[Infinitepay] Pagamento não confirmado na verificação');
                
                res.status(200).json({
                    success: false,
                    message: 'Pagamento não confirmado',
                    status: 'pending',
                    orderId: orderId
                });
            }
        } else {
            // Dados insuficientes para verificação
            console.log('[Infinitepay] Dados insuficientes para verificação completa');
            
            // Salvar os dados recebidos mesmo assim
            await wooApi.put(`orders/${orderId}`, {
                meta_data: [
                    {
                        key: 'infinitepay_return_data',
                        value: JSON.stringify(req.body)
                    },
                    {
                        key: 'infinitepay_return_date',
                        value: new Date().toISOString()
                    }
                ]
            });

            res.status(200).json({
                success: true,
                message: 'Dados de retorno salvos, verificação manual necessária',
                status: 'pending',
                orderId: orderId
            });
        }

    } catch (error) {
        console.error('[Infinitepay] Erro ao processar retorno:', error);
        
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno do servidor'
        });
    }
}
