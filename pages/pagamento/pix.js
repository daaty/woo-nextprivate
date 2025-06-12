import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/Layout';
import { useNotification } from '../../src/components/ui/Notification';

export default function PagamentoPix() {
	const router = useRouter();
	const { order } = router.query;
	const { addNotification } = useNotification();
	
	const [orderData, setOrderData] = useState(null);
	const [qrCode, setQrCode] = useState(null);
	const [loading, setLoading] = useState(true);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (order) {
			fetchOrderData();
		}
	}, [order]);

	const fetchOrderData = async () => {
		try {
			// Em um cenário real, você buscaria os dados do pedido da sua API/database
			// Por enquanto, vamos simular com dados do localStorage ou criar dados de exemplo
			
			const mockOrderData = {
				id: order,
				total: '199.99',
				items: [
					{ name: 'Smartphone XYZ', quantity: 1, price: 199.99 }
				],
				customer: {
					name: 'Cliente Teste',
					email: 'cliente@teste.com'
				},
				qr_codes: [{
					id: `qr_${order}`,
					text: `00020126580014br.gov.bcb.pix0136${order}52040000530398654${String(199.99).replace('.', '')}5802BR5925Rota dos Celulares LTDA6009Sao Paulo61080540900062070503***6304`,
					amount: { value: 19999 },
					expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
					links: [{
						media: 'image/png',
						href: `/api/pagbank/qr-code/${order}`
					}]
				}]
			};
			
			setOrderData(mockOrderData);
			setQrCode(mockOrderData.qr_codes[0]);
			setLoading(false);
			
		} catch (error) {
			console.error('Erro ao buscar dados do pedido:', error);
			addNotification('Erro ao carregar dados do pedido', 'error');
			setLoading(false);
		}
	};
	const copyPixCode = async () => {
		if (qrCode?.text) {
			try {
				await navigator.clipboard.writeText(qrCode.text);
				setCopied(true);
				addNotification('Código PIX copiado!', 'success');
				
				setTimeout(() => {
					setCopied(false);
				}, 3000);
			} catch (error) {
				console.error('Erro ao copiar código PIX:', error);
				addNotification('Erro ao copiar código PIX', 'error');
			}
		}
	};

	const checkPaymentStatus = async () => {
		if (!order) {
			addNotification('ID do pedido não encontrado', 'error');
			return;
		}

		try {
			addNotification('Verificando status do pagamento...', 'info');
			
			const response = await fetch(`/api/pagbank/status/${order}`);
			const result = await response.json();

			if (response.ok) {
				console.log('[PIX Payment] Status recebido:', result);
				
				// Atualizar status do pedido no WooCommerce
				try {
					const updateResponse = await fetch('/api/pagbank/update-order-status', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							pagbankOrderId: result.orderId || result.id,
							status: result.status || result.paymentStatus || 'WAITING'
						})
					});
					
					const updateResult = await updateResponse.json();
					
					if (updateResponse.ok) {
						console.log('[PIX Payment] Status do pedido WooCommerce atualizado:', updateResult);
					} else {
						console.warn('[PIX Payment] Falha ao atualizar status do WooCommerce:', updateResult.error);
					}
				} catch (updateError) {
					console.error('[PIX Payment] Erro ao atualizar status do WooCommerce:', updateError);
				}
				
				// Verificar se o pagamento foi confirmado
				if (result.charges && result.charges.some(charge => charge.status === 'PAID')) {
					addNotification('🎉 Pagamento confirmado! Redirecionando...', 'success');
					setTimeout(() => {
						window.location.href = `/thank-you?order_id=${order}`;
					}, 2000);
				} else {
					addNotification('Pagamento ainda não foi detectado', 'warning');
				}
			} else {
				console.error('[PIX Payment] Erro na verificação:', result);
				addNotification(result.error || 'Erro ao verificar status do pagamento', 'error');
			}
		} catch (error) {
			console.error('[PIX Payment] Erro na requisição:', error);
			addNotification('Erro de conexão ao verificar pagamento', 'error');
		}
	};
	if (loading) {
		return (
			<Layout>
				<div className="container mx-auto my-32 px-4 xl:px-0 flex justify-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			<div className="container mx-auto my-16 px-4 xl:px-0">
				<div className="max-w-2xl mx-auto">
					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-gray-800 mb-2">
							Pagamento via PIX
						</h1>
						<p className="text-gray-600">Escaneie o QR Code ou copie o código para pagar</p>
					</div>

					{/* Resumo do Pedido */}
					{orderData && (
						<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
							<h2 className="text-xl font-semibold mb-4 flex items-center">
								<span className="mr-2">📋</span>
								Resumo do Pedido
							</h2>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span>Pedido:</span>
									<span className="font-mono text-sm">#{orderData.id}</span>
								</div>
								<div className="flex justify-between font-bold text-lg border-t pt-2">
									<span>Total:</span>
									<span className="text-orange-600">R$ {orderData.total}</span>
								</div>
							</div>
						</div>
					)}
					
					{qrCode && (
						<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
							<div className="text-center">
								{/* QR Code */}
								<div className="bg-gray-50 p-6 rounded-lg mb-6">
									<img 
										src={qrCode.links?.[0]?.href || `/api/pagbank/qr-code/${order}`}
										alt="QR Code PIX" 
										className="mx-auto mb-4 border-2 border-gray-200 rounded"
										style={{ width: '200px', height: '200px' }}
										onError={(e) => {
											e.target.style.display = 'none';
											e.target.nextSibling.style.display = 'block';
										}}
									/>
									<div style={{ display: 'none' }} className="w-48 h-48 mx-auto bg-gray-200 rounded flex items-center justify-center">
										<span className="text-gray-500">QR Code não disponível</span>
									</div>
									
									<p className="text-sm text-gray-600 mb-4">
										Escaneie este código com o app do seu banco
									</p>
								</div>

								{/* Código PIX */}
								<div className="bg-gray-50 p-4 rounded-lg mb-4">
									<p className="text-sm text-gray-600 mb-2">Ou copie o código PIX:</p>
									<div className="flex items-center space-x-2">
										<code className="flex-1 text-xs bg-white p-3 rounded border break-all font-mono">
											{qrCode.text}
										</code>
										<button
											onClick={copyPixCode}
											className={`px-4 py-2 rounded font-medium transition-colors ${
												copied 
													? 'bg-green-100 text-green-700 border border-green-300' 
													: 'bg-orange-500 text-white hover:bg-orange-600'
											}`}
										>
											{copied ? '✓ Copiado!' : 'Copiar'}
										</button>
									</div>
								</div>

								{/* Informações do PIX */}
								<div className="bg-blue-50 p-4 rounded-lg mb-6">
									<h3 className="font-semibold text-blue-800 mb-2">Como pagar com PIX:</h3>
									<ol className="text-sm text-blue-700 text-left space-y-1">
										<li>1. Abra o app do seu banco</li>
										<li>2. Escolha a opção PIX</li>
										<li>3. Escaneie o QR Code ou cole o código</li>
										<li>4. Confirme o pagamento</li>
									</ol>
								</div>

								{/* Informações de expiração */}
								{qrCode.expiration_date && (
									<div className="bg-yellow-50 p-4 rounded-lg mb-6">
										<p className="text-sm text-yellow-800">
											⏰ Este PIX expira em: {new Date(qrCode.expiration_date).toLocaleString('pt-BR')}
										</p>
									</div>
								)}

								{/* Botões de ação */}
								<div className="flex space-x-4">
									<button
										onClick={checkPaymentStatus}
										className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
									>
										Verificar Pagamento
									</button>
									<button
										onClick={() => router.push('/checkout')}
										className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
									>
										Voltar ao Checkout
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Informações de Segurança */}
					<div className="mt-6 text-center">
						<div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
							<span className="flex items-center">
								<span className="mr-1">🔒</span>
								Pagamento Seguro
							</span>
							<span className="flex items-center">
								<span className="mr-1">🏛️</span>
								PagBank
							</span>
							<span className="flex items-center">
								<span className="mr-1">⚡</span>
								PIX Instantâneo
							</span>
						</div>					</div>
				</div>
			</div>
		</Layout>
	);
}
