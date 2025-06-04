/**
 * API Route para atualizar dados do cliente via WooCommerce REST API
 * PUT /api/customer/update
 */
export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Método não permitido' });
    }    try {
        const { customerId, userData, billingData, shippingData } = req.body;

        console.log('[Customer Update] Dados recebidos no body:', JSON.stringify(req.body, null, 2));
        console.log('[Customer Update] billingData específico:', JSON.stringify(billingData, null, 2));
        console.log('[Customer Update] shippingData específico:', JSON.stringify(shippingData, null, 2));        if (!customerId) {
            return res.status(400).json({ error: 'ID do cliente é obrigatório' });
        }

        // Verificar se o ID não é "guest" (usuário não autenticado corretamente)
        if (customerId === 'guest') {
            console.error('[Customer Update] ID de cliente inválido: "guest"');
            return res.status(400).json({ 
                error: 'ID do cliente inválido. O usuário parece não estar autenticado corretamente.', 
                message: 'Sessão inválida. Por favor, faça login novamente.' 
            });
        }

        // Decodificar o ID do GraphQL (base64) para obter o ID numérico do WooCommerce
        let numericCustomerId;
        try {
            if (typeof customerId === 'string' && customerId.includes('dXNlcjo')) {
                // ID está em formato GraphQL base64 (user:5 -> dXNlcjo1)
                const decoded = Buffer.from(customerId, 'base64').toString('utf-8');
                numericCustomerId = decoded.split(':')[1];
                console.log('[Customer Update] ID decodificado de GraphQL:', decoded, '-> ID numérico:', numericCustomerId);
            } else {
                // ID já é numérico
                numericCustomerId = customerId;
            }
        } catch (error) {
            console.error('[Customer Update] Erro ao decodificar ID:', error);
            return res.status(400).json({ error: 'ID do cliente inválido' });
        }

        // Se após o processamento ainda não temos um ID numérico válido
        if (!numericCustomerId || numericCustomerId === 'guest' || numericCustomerId === 'undefined') {
            console.error('[Customer Update] ID processado ainda é inválido:', numericCustomerId);
            return res.status(400).json({ 
                error: 'ID de cliente inválido após processamento', 
                message: 'Não foi possível identificar seu cadastro. Por favor, faça login novamente.'
            });
        }

        console.log('[Customer Update] Atualizando cliente ID:', numericCustomerId, userData);// Configurações da API WooCommerce - USAR VARIÁVEIS DO .ENV
        const WC_BASE_URL = process.env.WOO_SITE_URL;
        const WC_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
        const WC_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;

        console.log('[Customer Update] URL da API WooCommerce:', WC_BASE_URL);

        if (!WC_BASE_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
            console.error('[Customer Update] Credenciais WooCommerce não configuradas');
            console.error('WC_BASE_URL:', WC_BASE_URL);
            console.error('WC_CONSUMER_KEY:', WC_CONSUMER_KEY ? 'Definido' : 'Não definido');
            console.error('WC_CONSUMER_SECRET:', WC_CONSUMER_SECRET ? 'Definido' : 'Não definido');
            return res.status(500).json({ error: 'Credenciais WooCommerce não configuradas' });
        }// Preparar dados para atualização
        const updateData = {};        // Dados pessoais básicos
        if (userData.firstName) updateData.first_name = userData.firstName;
        if (userData.lastName) updateData.last_name = userData.lastName;
        // Só incluir email se for válido e não vazio
        console.log('[Customer Update] Email do userData:', userData.email);
        if (userData.email && userData.email.trim() && userData.email.includes('@')) {
            updateData.email = userData.email;
            console.log('[Customer Update] Email principal incluído:', userData.email);
        } else {
            console.log('[Customer Update] Email principal ignorado (inválido ou vazio):', userData.email);
        }// Dados de billing (incluindo telefone)
        if (billingData) {
            updateData.billing = {
                first_name: userData.firstName || '',
                last_name: userData.lastName || '',
                phone: billingData.phone || '',
                // Outros campos de billing podem ser adicionados aqui
                ...(billingData.address1 && { address_1: billingData.address1 }),
                ...(billingData.address2 && { address_2: billingData.address2 }),
                ...(billingData.city && { city: billingData.city }),
                ...(billingData.state && { state: billingData.state }),
                ...(billingData.postcode && { postcode: billingData.postcode }),
                ...(billingData.country && { country: billingData.country }),
                ...(billingData.company && { company: billingData.company }),
            };
              // Só incluir email se for válido e não vazio
            const emailToUse = billingData.email || userData.email;
            console.log('[Customer Update] Email para usar:', emailToUse);
            if (emailToUse && emailToUse.trim() && emailToUse.includes('@')) {
                updateData.billing.email = emailToUse;
                console.log('[Customer Update] Email incluído no billing:', emailToUse);
            } else {
                console.log('[Customer Update] Email ignorado (inválido ou vazio):', emailToUse);
            }
        }

        // Dados de shipping (endereço de entrega)
        if (shippingData) {
            updateData.shipping = {
                first_name: userData.firstName || shippingData.firstName || '',
                last_name: userData.lastName || shippingData.lastName || '',
                ...(shippingData.address1 && { address_1: shippingData.address1 }),
                ...(shippingData.address2 && { address_2: shippingData.address2 }),
                ...(shippingData.city && { city: shippingData.city }),
                ...(shippingData.state && { state: shippingData.state }),
                ...(shippingData.postcode && { postcode: shippingData.postcode }),
                ...(shippingData.country && { country: shippingData.country }),
                ...(shippingData.company && { company: shippingData.company }),
            };
        }

        // Adicionar CPF como meta_data se fornecido
        if (billingData && billingData.cpf) {
            updateData.meta_data = [
                {
                    key: 'cpf',
                    value: billingData.cpf
                }
            ];
        }        console.log('[Customer Update] Dados para atualização:', JSON.stringify(updateData, null, 2));

        // Fazer requisição para WooCommerce REST API usando ID numérico
        const auth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
        const apiUrl = `${WC_BASE_URL}/wp-json/wc/v3/customers/${numericCustomerId}`;
        
        console.log('[Customer Update] URL da requisição:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Customer Update] Erro na API WooCommerce:', data);
            throw new Error(data.message || 'Erro ao atualizar dados do cliente');
        }        console.log('[Customer Update] Cliente atualizado com sucesso:', data.id);
        console.log('[Customer Update] Meta data salvo:', data.meta_data);

        return res.status(200).json({
            success: true,
            message: 'Dados atualizados com sucesso',
            customer: {
                id: data.id,
                firstName: data.first_name,
                lastName: data.last_name,
                email: data.email,
                billing: data.billing,
                shipping: data.shipping,
                meta_data: data.meta_data
            }
        });

    } catch (error) {
        console.error('[Customer Update] Erro interno:', error);
        return res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: error.message 
        });
    }
}
