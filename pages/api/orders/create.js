import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Método não permitido' });
	}
	try {
		const { paymentMethod, items, total, customer, shipping, billing } = req.body;

		// Validação básica
		if (!paymentMethod || !items || !total) {
			return res.status(400).json({ 
				error: 'Dados obrigatórios não fornecidos',
				required: ['paymentMethod', 'items', 'total']
			});
		}

		console.log('[Orders] Criando pedido:', { paymentMethod, total, customer: customer?.email });

		// Gerar ID único para o pedido
		const orderId = uuidv4();
		
		// Criar objeto do pedido
		const orderData = {
			id: orderId,
			status: 'pending',
			paymentMethod,
			paymentStatus: paymentMethod === 'cod' ? 'pending' : 'awaiting_payment',
			items: items.map((item, index) => ({
				id: item.id || index,
				name: item.name,
				quantity: parseInt(item.qty) || 1,
				price: parseFloat(item.price) || 0,
				total: parseFloat(item.price) * parseInt(item.qty)
			})),
			subtotal: total - (shipping?.cost || 0),
			shippingCost: shipping?.cost || 0,
			total: parseFloat(total),
			customer: {
				email: customer?.email || 'guest@checkout.com',
				name: customer?.name || 'Cliente Convidado',
				phone: customer?.phone || '',
			},
			billing: {
				address: {
					street: billing?.address1 || shipping?.address?.address1 || '',
					number: billing?.address2 || shipping?.address?.address2 || '',
					complement: billing?.company || shipping?.address?.company || '',
					neighborhood: billing?.address1 || shipping?.address?.address1 || '',
					city: billing?.city || shipping?.address?.city || 'Cuiabá',
					state: billing?.state || shipping?.address?.state || 'MT',
					zipCode: billing?.postcode || shipping?.address?.postcode || '',
					country: 'Brasil'
				}
			},
			shipping: {
				method: shipping?.option || 'standard',
				cost: shipping?.cost || 0,
				address: {
					street: shipping?.address?.address1 || '',
					number: shipping?.address?.address2 || '',
					complement: shipping?.address?.company || '',
					neighborhood: shipping?.address?.address1 || '',
					city: shipping?.address?.city || 'Cuiabá',
					state: shipping?.address?.state || 'MT',
					zipCode: shipping?.address?.postcode || '',
					country: 'Brasil'
				}
			},
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Aqui você pode salvar no banco de dados
		// Por enquanto, apenas loggar e simular sucesso
		console.log('[Orders] Pedido criado:', orderData);

		// Simular processamento baseado no método de pagamento
		let redirectUrl = '/pedido/confirmacao';
		
		switch (paymentMethod) {
			case 'cod':
				// Pagamento na entrega - pedido aprovado automaticamente
				orderData.status = 'processing';
				orderData.paymentStatus = 'pending';
				redirectUrl = `/pedido/confirmacao?order=${orderId}`;
				break;
				
			case 'bank_transfer':
				// Transferência bancária
				orderData.paymentStatus = 'awaiting_payment';
				redirectUrl = `/pagamento/transferencia?order=${orderId}`;
				break;
				
			default:
				// Outros métodos
				orderData.paymentStatus = 'awaiting_payment';
				redirectUrl = `/pedido/confirmacao?order=${orderId}`;
		}

		// Retornar sucesso
		res.status(200).json({
			success: true,
			orderId,
			order: orderData,
			redirectUrl,
			message: 'Pedido criado com sucesso!'
		});

	} catch (error) {
		console.error('[Orders] Erro ao criar pedido:', error);
		res.status(500).json({ 
			error: error.message || 'Erro interno do servidor' 
		});
	}
}
