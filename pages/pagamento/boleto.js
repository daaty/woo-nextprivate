import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/Layout';
import { useNotification } from '../../src/components/ui/Notification';

export default function PagamentoBoleto() {
	const router = useRouter();
	const { orderData } = router.query;
	const { addNotification } = useNotification();
	
	const [loading, setLoading] = useState(false);
	const [orderInfo, setOrderInfo] = useState(null);
	const [boletoData, setBoletoData] = useState(null);
	const [processingPayment, setProcessingPayment] = useState(false);

	useEffect(() => {
		if (orderData) {
			try {
				setOrderInfo(JSON.parse(decodeURIComponent(orderData)));
			} catch (error) {
				console.error('Erro ao decodificar dados do pedido:', error);
				addNotification('Dados do pedido inválidos', 'error');
				router.push('/checkout');
			}
		}
	}, [orderData]);

	const generateBoleto = async () => {
		if (!orderInfo) return;

		setProcessingPayment(true);

		try {
			const paymentData = {
				...orderInfo,
				paymentType: 'boleto'
			};

			const response = await fetch('/api/pagbank/process-payment', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(paymentData),
			});

			const result = await response.json();

			if (response.ok && result.success) {
				setBoletoData(result.boletoData);
				addNotification('Boleto gerado com sucesso!', 'success');
			} else {
				throw new Error(result.error || 'Erro na geração do boleto');
			}
		} catch (error) {
			console.error('Erro na geração do boleto:', error);
			addNotification(error.message || 'Erro na geração do boleto', 'error');
		} finally {
			setProcessingPayment(false);
		}
	};

	const downloadBoleto = () => {
		if (boletoData?.pdfUrl) {
			window.open(boletoData.pdfUrl, '_blank');
		}
	};

	const copyBoletoCode = () => {
		if (boletoData?.digitableLine) {
			navigator.clipboard.writeText(boletoData.digitableLine);
			addNotification('Código do boleto copiado!', 'success');
		}
	};

	const formatBoletoCode = (code) => {
		if (!code) return '';
		// Formatar código do boleto em grupos para melhor legibilidade
		return code.match(/.{1,5}/g)?.join(' ') || code;
	};

	// Calcular data de vencimento (3 dias úteis)
	const getDueDate = () => {
		const now = new Date();
		const dueDate = new Date(now);
		dueDate.setDate(now.getDate() + 3);
		
		// Pular fins de semana
		if (dueDate.getDay() === 0) dueDate.setDate(dueDate.getDate() + 1); // Domingo
		if (dueDate.getDay() === 6) dueDate.setDate(dueDate.getDate() + 2); // Sábado
		
		return dueDate.toLocaleDateString('pt-BR');
	};

	if (!orderInfo) {
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
						<h1 className="text-3xl font-bold text-gray-800 mb-2">Pagamento via Boleto</h1>
						<p className="text-gray-600">Seu boleto será gerado instantaneamente</p>
					</div>

					{/* Resumo do Pedido */}
					<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
						<h2 className="text-xl font-semibold mb-4 flex items-center">
							<span className="mr-2">📋</span>
							Resumo do Pedido
						</h2>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span>Subtotal:</span>
								<span>R$ {orderInfo.subtotal}</span>
							</div>
							<div className="flex justify-between">
								<span>Frete:</span>
								<span>R$ {orderInfo.shipping || '0,00'}</span>
							</div>
							<div className="flex justify-between font-bold text-lg border-t pt-2">
								<span>Total:</span>
								<span className="text-orange-600">R$ {orderInfo.total}</span>
							</div>
							<div className="flex justify-between text-sm text-gray-600">
								<span>Vencimento:</span>
								<span>{getDueDate()}</span>
							</div>
						</div>
					</div>

					{/* Informações sobre Boleto */}
					{!boletoData && (
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
							<h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
								<span className="mr-2">ℹ️</span>
								Sobre o Pagamento via Boleto
							</h3>
							<ul className="space-y-2 text-blue-700">
								<li className="flex items-start">
									<span className="mr-2">•</span>
									<span>O boleto pode ser pago em qualquer banco, lotérica ou aplicativo</span>
								</li>
								<li className="flex items-start">
									<span className="mr-2">•</span>
									<span>Prazo de vencimento: 3 dias úteis</span>
								</li>
								<li className="flex items-start">
									<span className="mr-2">•</span>
									<span>Após o pagamento, a compensação ocorre em até 2 dias úteis</span>
								</li>
								<li className="flex items-start">
									<span className="mr-2">•</span>
									<span>Você receberá um e-mail com a confirmação</span>
								</li>
							</ul>
						</div>
					)}

					{/* Gerar Boleto */}
					{!boletoData && (
						<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
							<div className="text-center">
								<h3 className="text-xl font-semibold mb-4">Gerar Boleto Bancário</h3>
								<p className="text-gray-600 mb-6">
									Clique no botão abaixo para gerar seu boleto de pagamento
								</p>
								<button
									onClick={generateBoleto}
									disabled={processingPayment}
									className="px-8 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
								>
									{processingPayment ? (
										<>
											<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
											Gerando Boleto...
										</>
									) : (
										<>
											<span className="mr-2">📄</span>
											Gerar Boleto
										</>
									)}
								</button>
							</div>
						</div>
					)}

					{/* Boleto Gerado */}
					{boletoData && (
						<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
							<div className="text-center mb-6">
								<h3 className="text-xl font-semibold text-green-600 mb-2 flex items-center justify-center">
									<span className="mr-2">✅</span>
									Boleto Gerado com Sucesso!
								</h3>
								<p className="text-gray-600">
									Seu boleto foi gerado e está pronto para pagamento
								</p>
							</div>

							{/* Código do Boleto */}
							<div className="bg-gray-50 p-4 rounded-lg mb-4">
								<h4 className="font-semibold mb-2">Linha Digitável:</h4>
								<div className="bg-white p-3 rounded border">
									<code className="text-sm break-all font-mono">
										{formatBoletoCode(boletoData.digitableLine)}
									</code>
								</div>
								<button
									onClick={copyBoletoCode}
									className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
								>
									📋 Copiar Código
								</button>
							</div>

							{/* Informações do Boleto */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
								<div className="bg-gray-50 p-3 rounded">
									<span className="text-sm text-gray-600">Valor:</span>
									<div className="font-semibold text-lg">R$ {orderInfo.total}</div>
								</div>
								<div className="bg-gray-50 p-3 rounded">
									<span className="text-sm text-gray-600">Vencimento:</span>
									<div className="font-semibold">{getDueDate()}</div>
								</div>
								<div className="bg-gray-50 p-3 rounded">
									<span className="text-sm text-gray-600">Beneficiário:</span>
									<div className="font-semibold">Sua Empresa LTDA</div>
								</div>
								<div className="bg-gray-50 p-3 rounded">
									<span className="text-sm text-gray-600">Pedido:</span>
									<div className="font-semibold">#{boletoData.orderId}</div>
								</div>
							</div>

							{/* Botões de Ação */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<button
									onClick={downloadBoleto}
									className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
								>
									<span className="mr-2">📄</span>
									Baixar Boleto PDF
								</button>
								<button
									onClick={() => router.push('/minha-conta?tab=pedidos')}
									className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
								>
									<span className="mr-2">👤</span>
									Ver Meus Pedidos
								</button>
							</div>
						</div>
					)}

					{/* Instruções de Pagamento */}
					{boletoData && (
						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
							<h4 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
								<span className="mr-2">💡</span>
								Como Pagar seu Boleto
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-yellow-700">
								<div className="text-center">
									<div className="text-2xl mb-2">🏦</div>
									<h5 className="font-semibold mb-1">Internet Banking</h5>
									<p className="text-sm">Acesse o site do seu banco e pague pela linha digitável</p>
								</div>
								<div className="text-center">
									<div className="text-2xl mb-2">📱</div>
									<h5 className="font-semibold mb-1">App do Banco</h5>
									<p className="text-sm">Use o aplicativo do seu banco para escanear ou digitar</p>
								</div>
								<div className="text-center">
									<div className="text-2xl mb-2">🏪</div>
									<h5 className="font-semibold mb-1">Presencial</h5>
									<p className="text-sm">Pague em qualquer agência bancária ou lotérica</p>
								</div>
							</div>
						</div>
					)}

					{/* Botão Voltar */}
					<div className="text-center mt-8">
						<button
							onClick={() => router.push('/checkout')}
							className="text-orange-500 hover:underline flex items-center justify-center mx-auto"
						>
							<span className="mr-1">←</span>
							Voltar ao Checkout
						</button>
					</div>
				</div>
			</div>
		</Layout>
	);
}
