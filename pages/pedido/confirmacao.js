import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/Layout';
import { useCart } from '../../src/hooks/useCart';

export default function ConfirmacaoPedido() {
	const router = useRouter();
	const { order } = router.query;
	const { clearCart } = useCart();
	const [orderData, setOrderData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (order) {
			// Limpar carrinho após confirmação
			clearCart();
			
			// Simular dados do pedido
			setOrderData({
				id: order,
				status: 'processing',
				paymentMethod: 'cod',
				total: 'R$ 299,90',
				estimatedDelivery: '3-5 dias úteis'
			});
			setLoading(false);
		}
	}, [order, clearCart]);

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
			<div className="container mx-auto my-32 px-4 xl:px-0">
				<div className="max-w-2xl mx-auto">
					{/* Header de sucesso */}
					<div className="text-center mb-8">
						<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<span className="text-2xl text-green-600">✓</span>
						</div>
						<h1 className="text-3xl font-bold text-gray-800 mb-2">
							Pedido Confirmado!
						</h1>
						<p className="text-gray-600">
							Obrigado pela sua compra. Seu pedido foi recebido e está sendo processado.
						</p>
					</div>

					{/* Detalhes do pedido */}
					<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
						<h2 className="text-xl font-semibold mb-4">Detalhes do Pedido</h2>
						
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-gray-600">Número do Pedido</p>
								<p className="font-semibold">#{orderData?.id?.slice(0, 8).toUpperCase()}</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Status</p>
								<p className="font-semibold text-green-600">Processando</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Método de Pagamento</p>
								<p className="font-semibold">Pagamento na Entrega</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Total</p>
								<p className="font-semibold text-lg">{orderData?.total}</p>
							</div>
						</div>
					</div>

					{/* Próximos passos */}
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
						<h3 className="text-lg font-semibold text-blue-800 mb-3">
							Próximos Passos
						</h3>
						<ul className="space-y-2 text-blue-700">
							<li className="flex items-center">
								<span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
								Você receberá um e-mail de confirmação em breve
							</li>
							<li className="flex items-center">
								<span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
								Seu pedido será preparado em até 1 dia útil
							</li>
							<li className="flex items-center">
								<span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
								Prazo de entrega: {orderData?.estimatedDelivery}
							</li>
						</ul>
					</div>

					{/* Ações */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<button
							onClick={() => router.push('/')}
							className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
						>
							Continuar Comprando
						</button>
						<button
							onClick={() => router.push('/minha-conta/pedidos')}
							className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
						>
							Ver Meus Pedidos
						</button>
					</div>
				</div>
			</div>
		</Layout>
	);
}
