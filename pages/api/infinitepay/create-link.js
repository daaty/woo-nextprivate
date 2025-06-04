// API para criar links de checkout da Infinitepay
// POST /api/infinitepay/create-link

const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

// Importar logger para debugging
const { apiLogger } = require('../../../debug-checkout-logs');

// Inicializar API do WooCommerce
const wooApi = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
    consumerKey: process.env.WOO_CONSUMER_KEY,
    consumerSecret: process.env.WOO_CONSUMER_SECRET,
    version: "wc/v3"
});

/**
 * Criar link de checkout da Infinitepay
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }    try {
        const { items, customer, shipping, billing, total, paymentMethod } = req.body;        // === LOG DEBUGGING: Capturar dados recebidos pela API ===
        apiLogger.log('📨 API CREATE-LINK - Dados recebidos', {
            itemsCount: items?.length || 0,
            total: total,
            totalType: typeof total,
            totalParsed: parseFloat(total?.toString() || '0'),
            hasShipping: !!shipping,
            shippingStructure: shipping ? Object.keys(shipping) : [],
            shippingCost: shipping?.cost,
            shippingCostType: typeof shipping?.cost,
            hasCustomer: !!customer,
            paymentMethod: paymentMethod,
            timestamp: new Date().toISOString()
        });

        // LOG CRÍTICO: Verificar estrutura completa do shipping recebido
        apiLogger.log('🚚 SHIPPING RECEBIDO - Estrutura completa', {
            shipping: shipping,
            hasShippingCost: !!shipping?.cost,
            shippingCostValue: shipping?.cost,
            shippingAddress1: shipping?.address1,
            shippingPostcode: shipping?.postcode
        });

        // Log detalhado dos itens
        if (items && items.length > 0) {
            apiLogger.log('📦 Itens recebidos detalhados', {
                items: items.map(item => ({
                    name: item.name,
                    price: item.price,
                    qty: item.qty,
                    totalPrice: item.totalPrice
                }))
            });
        }

        // Debug: Log dos dados recebidos
        console.log('[Infinitepay Debug] Dados recebidos no body:');
        console.log('[Infinitepay Debug] - items:', items?.length || 0, 'itens');
        console.log('[Infinitepay Debug] - customer:', customer?.email || 'não informado');
        console.log('[Infinitepay Debug] - shipping:', shipping);
        console.log('[Infinitepay Debug] - billing:', billing);
        console.log('[Infinitepay Debug] - total:', total);
        console.log('[Infinitepay Debug] - paymentMethod:', paymentMethod);

        // Configurações da Infinitepay
        const INFINITEPAY_HANDLE = process.env.INFINITEPAY_HANDLE;
        const INFINITEPAY_BASE_URL = 'https://checkout.infinitepay.io';

        // Validação da configuração
        if (!INFINITEPAY_HANDLE) {
            console.error('[Infinitepay] INFINITEPAY_HANDLE não configurado');
            return res.status(500).json({ 
                error: 'Configuração do Infinitepay incompleta. Configure INFINITEPAY_HANDLE no .env.local' 
            });
        }

        // Validação básica
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                error: 'Itens do pedido são obrigatórios' 
            });
        }

        if (!customer || !customer.email) {
            return res.status(400).json({ 
                error: 'Dados do cliente são obrigatórios (email obrigatório)' 
            });
        }        console.log('[Infinitepay] Criando link de checkout com handle:', INFINITEPAY_HANDLE);
        console.log('[Infinitepay] Itens:', items.length);
        console.log('[Infinitepay] Cliente:', customer.email);
        console.log('[Infinitepay] Shipping address:', JSON.stringify(shipping, null, 2));
        console.log('[Infinitepay] Billing address:', JSON.stringify(billing, null, 2));
        console.log('[Infinitepay] Total recebido:', total);

        // VALIDAÇÃO CRÍTICA: Verificar se shipping tem dados válidos
        if (!shipping || !shipping.address1 || !shipping.postcode) {
            console.error('[Infinitepay] ❌ SHIPPING INVÁLIDO:', shipping);
            return res.status(400).json({ 
                error: 'Endereço de entrega é obrigatório e deve conter endereço e CEP válidos'
            });
        }
        
        console.log('[Infinitepay] ✅ Shipping validado:', {
            address1: shipping.address1,
            city: shipping.city,
            state: shipping.state,
            postcode: shipping.postcode
        });

        // USAR O TOTAL DO SITE - NÃO RECALCULAR!
        // O site já fez todos os cálculos (produto + frete + impostos + descontos)
        const finalOrderTotal = total ? parseFloat(total.toString()) : 0;
        
        console.log('[Infinitepay] USANDO TOTAL DO SITE:', finalOrderTotal);

        // Para itens individuais, assumir que estão sempre em reais (como vem do site)
        const processItemForWooCommerce = (item) => {
            let itemPrice = item.price || 0;
            
            // Se o preço do item for 0, tentar extrair do totalPrice
            if (!itemPrice || isNaN(itemPrice) || itemPrice <= 0) {
                console.warn('[Infinitepay] Preço inválido no item, tentando usar totalPrice:', item);
                if (item.totalPrice) {
                    const priceToNumber = (price) => {
                        if (!price) return 0;
                        if (typeof price === 'number') return price;
                        return parseFloat(price.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
                    };
                    itemPrice = priceToNumber(item.totalPrice) / (item.qty || item.quantity || 1);
                }
            }
            
            return itemPrice; // Retornar em reais
        };        // Primeiro, criar o pedido no WooCommerce
        const wooOrderData = {
            customer_id: customer.databaseId || 0,
            payment_method: 'infinitepay-checkout',
            payment_method_title: 'Infinitepay Checkout',
            status: 'pending',
            // USAR O TOTAL DO SITE DIRETAMENTE
            total: finalOrderTotal.toFixed(2),
            // FORÇAR QUE É UM PEDIDO COM ENTREGA FÍSICA
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
            },line_items: items.map(item => {
                const itemPrice = processItemForWooCommerce(item);
                const quantity = item.quantity || item.qty || 1;
                const lineTotal = itemPrice * quantity;
                
                console.log('[Infinitepay] Item no WooCommerce:', {
                    name: item.name,
                    price: itemPrice,
                    quantity: quantity,
                    total: lineTotal
                });
                
                return {
                    product_id: item.productId || 0,
                    quantity: quantity,
                    name: item.name,
                    price: itemPrice.toFixed(2),
                    total: lineTotal.toFixed(2),
                    // FORÇAR que é um produto físico que precisa de entrega
                    virtual: false,
                    downloadable: false,
                    requires_shipping: true
                };            }),            // === CÁLCULO CRÍTICO DE SHIPPING_LINES ===
            shipping_lines: (() => {
                // LOG CRÍTICO: Verificar se temos dados de shipping
                apiLogger.log('🚚 SHIPPING_LINES - Iniciando cálculo', {
                    hasShippingCost: !!shipping?.cost,
                    shippingCost: shipping?.cost,
                    finalOrderTotal: finalOrderTotal,
                    itemsCount: items.length
                });

                // ⭐ CORRIGIDO: Verificar se temos shipping.cost primeiro
                if (shipping?.cost && shipping.cost > 0) {
                    // Usar o valor do frete enviado pelo frontend
                    const shippingCostValue = parseFloat(shipping.cost);
                    
                    apiLogger.log('✅ SHIPPING_LINES - Usando shipping.cost do frontend', {
                        shippingCostOriginal: shipping.cost,
                        shippingCostParsed: shippingCostValue,
                        shippingFixed: shippingCostValue.toFixed(2)
                    });
                    
                    const shippingLines = [{
                        method_id: 'flat_rate',
                        method_title: 'Frete',
                        total: shippingCostValue.toFixed(2)
                    }];

                    apiLogger.log('✅ SHIPPING_LINES - Resultado usando shipping.cost', {
                        shippingLines: shippingLines
                    });

                    return shippingLines;
                }

                // Fallback: calcular pela diferença (método antigo)
                apiLogger.log('⚠️  FALLBACK: shipping.cost não encontrado, calculando pela diferença', {
                    shipping: shipping
                });
                
                // Calcular total dos itens
                const itemsTotal = items.reduce((sum, item) => {
                    const itemPrice = processItemForWooCommerce(item);
                    return sum + (itemPrice * (item.quantity || item.qty || 1));
                }, 0);
                
                // Shipping = total do site - total dos itens
                const shippingTotal = finalOrderTotal - itemsTotal;
                
                // LOG CRÍTICO: Detalhar cálculo do frete
                apiLogger.log('📊 SHIPPING_LINES - Cálculo detalhado (fallback)', {
                    totalFromSite: finalOrderTotal,
                    itemsTotal: itemsTotal,
                    shippingCalculated: shippingTotal,
                    shippingFixed: Math.max(0, shippingTotal).toFixed(2),
                    calculation: `${finalOrderTotal} - ${itemsTotal} = ${shippingTotal}`
                });
                
                console.log('[Infinitepay] Shipping calculation (fallback):', {
                    totalFromSite: finalOrderTotal,
                    itemsTotal: itemsTotal,
                    shippingCalculated: shippingTotal
                });
                
                if (shippingTotal <= 0) {
                    apiLogger.log('⚠️  AVISO: Shipping calculado <= 0, retornando array vazio', {
                        shippingTotal: shippingTotal
                    });
                    return [];
                }
                
                const shippingLines = [{
                    method_id: 'flat_rate',
                    method_title: 'Frete',
                    total: Math.max(0, shippingTotal).toFixed(2) // Garantir que não seja negativo
                }];

                // LOG FINAL: Resultado do shipping_lines
                apiLogger.log('✅ SHIPPING_LINES - Resultado final (fallback)', {
                    shippingLines: shippingLines
                });

                return shippingLines;
            })(),meta_data: [
                {
                    key: 'infinitepay_processing',
                    value: 'true'
                },
                {
                    key: 'payment_method_type',
                    value: paymentMethod || 'infinitepay'
                },
                {
                    key: 'customer_cpf',
                    value: customer.cpf || ''
                },
                {
                    key: 'site_total_used',
                    value: finalOrderTotal.toString()
                },
                {
                    key: '_requires_shipping',
                    value: 'yes'
                },
                {
                    key: '_shipping_address_index',
                    value: shipping?.address1 || ''
                },
                {
                    key: '_shipping_city',
                    value: shipping?.city || ''
                },
                {
                    key: '_shipping_state',
                    value: shipping?.state || ''
                },
                {
                    key: '_shipping_postcode',
                    value: shipping?.postcode || ''
                },
                {
                    key: '_shipping_country',
                    value: shipping?.country || 'BR'
                }
            ]
        };        console.log('[Infinitepay] Criando pedido no WooCommerce...');
        console.log('[Infinitepay] 🚚 DADOS DE ENTREGA A SEREM ENVIADOS:');
        console.log('[Infinitepay] - Nome:', customer.firstName, customer.lastName);
        console.log('[Infinitepay] - Endereço:', shipping?.address1);
        console.log('[Infinitepay] - Complemento:', shipping?.address2);
        console.log('[Infinitepay] - Cidade:', shipping?.city);
        console.log('[Infinitepay] - Estado:', shipping?.state);
        console.log('[Infinitepay] - CEP:', shipping?.postcode);
        console.log('[Infinitepay] - País:', shipping?.country);
          const wooOrder = await wooApi.post('orders', wooOrderData);
        const orderId = wooOrder.data.id;
        const orderNumber = wooOrder.data.number;

        console.log('[Infinitepay] Pedido WooCommerce criado:', orderId, orderNumber);
        
        // VERIFICAR SE O PEDIDO FOI CRIADO COM DADOS DE SHIPPING
        console.log('[Infinitepay] 🔍 VERIFICANDO DADOS DO PEDIDO CRIADO:');
        console.log('[Infinitepay] - Billing criado:', wooOrder.data.billing);
        console.log('[Infinitepay] - Shipping criado:', wooOrder.data.shipping);
        
        if (!wooOrder.data.shipping || !wooOrder.data.shipping.address_1) {
            console.error('[Infinitepay] ❌ ERRO: Pedido criado SEM dados de entrega!');
            console.error('[Infinitepay] - Dados enviados:', JSON.stringify(wooOrderData.shipping, null, 2));
            console.error('[Infinitepay] - Dados retornados:', JSON.stringify(wooOrder.data.shipping, null, 2));
        } else {
            console.log('[Infinitepay] ✅ Pedido criado com sucesso com dados de entrega!');
        }// Preparar itens para o formato da Infinitepay (preço em centavos)
        const infinitepayItems = items.map(item => {
            console.log('[Infinitepay Debug] Item recebido:', item);
            
            const itemPrice = processItemForWooCommerce(item); // Já em reais
            const totalItemPrice = itemPrice * (item.quantity || item.qty || 1);
            const priceInCents = Math.round(totalItemPrice * 100); // Converter para centavos
            
            const mappedItem = {
                name: item.name,
                price: priceInCents, // Infinitepay usa centavos
                quantity: 1 // Infinitepay usa quantity = 1 e ajusta o price
            };
            
            console.log('[Infinitepay Debug] Item mapeado:', {
                originalPrice: itemPrice,
                priceInCents: priceInCents,
                itemName: item.name
            });
            
            return mappedItem;
        });

        // Para o frete, usar a diferença entre o total e os itens
        const itemsTotal = items.reduce((sum, item) => {
            const itemPrice = processItemForWooCommerce(item);
            return sum + (itemPrice * (item.quantity || item.qty || 1));
        }, 0);
        
        const shippingCost = finalOrderTotal - itemsTotal;
        
        // Adicionar frete como item se existe
        if (shippingCost > 0) {
            const shippingInCents = Math.round(shippingCost * 100);
            infinitepayItems.push({
                name: 'Frete',
                price: shippingInCents,
                quantity: 1
            });
            
            console.log('[Infinitepay Debug] Frete adicionado:', {
                shippingCost: shippingCost,
                shippingInCents: shippingInCents
            });
        }

        // Gerar NSU único do pedido
        const orderNsu = `${orderNumber}_${Date.now()}`;

        // URL de redirecionamento após pagamento
        // CORRIGIDO: Usar domínio específico para Infinitepay (configurado na conta)
        const infinitepaySiteUrl = process.env.INFINITEPAY_SITE_URL || 'https://site.rotadoscelulares.com';
        const redirectUrl = `${infinitepaySiteUrl}/confirmacao/infinitepay?order=${orderId}`;        // Construir URL do checkout da Infinitepay
        const baseUrl = `${INFINITEPAY_BASE_URL}/${INFINITEPAY_HANDLE}`;
        const params = new URLSearchParams();
          // CORREÇÃO CRÍTICA: Infinitepay espera formato JSON stringificado para itens
        console.log('[Infinitepay] Formatando itens como JSON para a Infinitepay...');
        const itemsJson = JSON.stringify(infinitepayItems);
        params.append('items', itemsJson);
        
        console.log('[Infinitepay] Items JSON:', itemsJson);
        console.log('[Infinitepay] Items individuais:', infinitepayItems);
        
        // Parâmetros obrigatórios
        params.append('order_nsu', orderNsu); // CORRIGIDO: usar 'order_nsu' (nome correto)
        params.append('redirect_url', redirectUrl);        // Parâmetros opcionais do cliente (se disponíveis)
        if (customer.firstName && customer.lastName) {
            params.append('customer_name', `${customer.firstName} ${customer.lastName}`.trim());
        }
        
        if (customer.email) {
            params.append('customer_email', customer.email);
        }
        
        if (customer.phone) {
            // Limpar telefone para formato aceito
            const cleanPhone = customer.phone.replace(/\D/g, '');
            if (cleanPhone.length >= 10) {
                params.append('customer_cellphone', cleanPhone);
            }
        }

        // ADICIONAR CPF se disponível
        if (customer.cpf) {
            const cleanCpf = customer.cpf.replace(/\D/g, '');
            if (cleanCpf.length === 11) {
                params.append('customer_cpf', cleanCpf);
            }
        }

        // Parâmetros de endereço (se disponíveis)
        if (shipping?.postcode) {
            const cleanCep = shipping.postcode.replace(/\D/g, '');
            if (cleanCep.length === 8) {
                params.append('address_cep', cleanCep);
            }
        }

        if (shipping?.address1) {
            params.append('address_street', shipping.address1);
        }

        if (shipping?.address2) {
            params.append('address_complement', shipping.address2);
        }

        if (shipping?.number) {
            params.append('address_number', shipping.number);
        }

        if (shipping?.city) {
            params.append('address_city', shipping.city);
        }

        if (shipping?.state) {
            params.append('address_state', shipping.state);
        }

        // URL final do checkout
        const checkoutUrl = `${baseUrl}?${params.toString()}`;

        console.log('[Infinitepay] Link de checkout gerado');
        console.log('[Infinitepay] URL:', checkoutUrl);

        // Salvar dados do link no meta_data do pedido
        await wooApi.put(`orders/${orderId}`, {
            meta_data: [
                ...wooOrderData.meta_data,
                {
                    key: 'infinitepay_checkout_url',
                    value: checkoutUrl
                },
                {
                    key: 'infinitepay_order_nsu',
                    value: orderNsu
                }
            ]
        });        // Resposta de sucesso
        res.status(200).json({
            success: true,
            orderId: orderId,
            orderNumber: orderNumber,
            checkoutUrl: checkoutUrl,
            paymentLink: checkoutUrl, // Adicionar para compatibilidade com o frontend
            orderNsu: orderNsu,
            message: 'Link de checkout criado com sucesso'
        });

    } catch (error) {
        console.error('[Infinitepay] Erro ao criar link:', error);
        
        // Retornar erro detalhado
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno do servidor',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
