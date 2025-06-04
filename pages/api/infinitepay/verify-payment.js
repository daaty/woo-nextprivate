// API para verificar pagamentos da Infinitepay
// GET /api/infinitepay/verify-payment

/**
 * Verificar status de pagamento na Infinitepay
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { handle, transaction_nsu, external_order_nsu, slug } = req.query;

        // Validação dos parâmetros
        if (!handle || !transaction_nsu || !external_order_nsu || !slug) {
            return res.status(400).json({
                error: 'Parâmetros obrigatórios não fornecidos',
                required: ['handle', 'transaction_nsu', 'external_order_nsu', 'slug']
            });
        }

        console.log('[Infinitepay] Verificando pagamento...');
        console.log('[Infinitepay] Handle:', handle);
        console.log('[Infinitepay] Transaction NSU:', transaction_nsu);
        console.log('[Infinitepay] External Order NSU:', external_order_nsu);
        console.log('[Infinitepay] Slug:', slug);

        // URL da API de verificação da Infinitepay
        const verifyUrl = `https://api.infinitepay.io/invoices/public/checkout/payment_check/${handle}`;
        
        // Parâmetros para verificação
        const verifyParams = new URLSearchParams({
            transaction_nsu: transaction_nsu,
            external_order_nsu: external_order_nsu,
            slug: slug
        });

        // Fazer requisição para a API da Infinitepay
        const response = await fetch(`${verifyUrl}?${verifyParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Erro na API da Infinitepay: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        console.log('[Infinitepay] Resposta da verificação:', result);

        // Resposta da API da Infinitepay tem o formato:
        // { "success": true/false, "paid": true/false }
        
        res.status(200).json({
            success: true,
            verification: result,
            paid: result.paid || false,
            valid: result.success || false
        });

    } catch (error) {
        console.error('[Infinitepay] Erro na verificação:', error);
        
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno do servidor',
            paid: false,
            valid: false
        });
    }
}
