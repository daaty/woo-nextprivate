import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/Layout';
import { useNotification } from '../../src/components/ui/Notification';

export default function PagamentoCartao() {
	const router = useRouter();
	const { orderData, type: paymentType } = router.query;
	const { addNotification } = useNotification();
	
	const [loading, setLoading] = useState(false);
	const [orderInfo, setOrderInfo] = useState(null);
	const [cardType, setCardType] = useState('credit'); // 'credit' ou 'debit'
	const [formData, setFormData] = useState({
		cardNumber: '',
		cardName: '',
		expiryDate: '',
		cvv: '',
		installments: '1'
	});
	const [errors, setErrors] = useState({});

	// Definir tipo de cartão baseado no parâmetro da URL
	useEffect(() => {
		if (paymentType === 'debit') {
			setCardType('debit');
			setFormData(prev => ({ ...prev, installments: '1' })); // Débito sempre à vista
		} else {
			setCardType('credit');
		}
	}, [paymentType]);

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

	const formatCardNumber = (value) => {
		const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
		const matches = v.match(/\d{4,16}/g);
		const match = matches && matches[0] || '';
		const parts = [];
		for (let i = 0, len = match.length; i < len; i += 4) {
			parts.push(match.substring(i, i + 4));
		}
		if (parts.length) {
			return parts.join(' ');
		} else {
			return v;
		}
	};

	const formatExpiryDate = (value) => {
		const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
		if (v.length >= 2) {
			return v.substring(0, 2) + '/' + v.substring(2, 4);
		}
		return v;
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		let formattedValue = value;

		if (name === 'cardNumber') {
			formattedValue = formatCardNumber(value);
		} else if (name === 'expiryDate') {
			formattedValue = formatExpiryDate(value);
		} else if (name === 'cvv') {
			formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4);
		}

		setFormData(prev => ({
			...prev,
			[name]: formattedValue
		}));

		// Limpar erro do campo quando usuário digitar
		if (errors[name]) {
			setErrors(prev => ({
				...prev,
				[name]: ''
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};

		if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
			newErrors.cardNumber = 'Número do cartão inválido';
		}

		if (!formData.cardName || formData.cardName.trim().length < 3) {
			newErrors.cardName = 'Nome no cartão é obrigatório';
		}

		if (!formData.expiryDate || formData.expiryDate.length < 5) {
			newErrors.expiryDate = 'Data de validade inválida';
		}

		if (!formData.cvv || formData.cvv.length < 3) {
			newErrors.cvv = 'CVV inválido';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		setLoading(true);
		try {
			const paymentData = {
				...orderInfo,
				paymentType: cardType, // Usar 'debit' ou 'credit' baseado no tipo
				cardData: {
					...formData,
					cardNumber: formData.cardNumber.replace(/\s/g, ''),
				}
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
				addNotification('Pagamento processado com sucesso!', 'success');
				
				// Redirecionar para página de confirmação
				router.push({
					pathname: '/confirmacao-pedido',
					query: { 
						orderId: result.orderId,
						paymentId: result.paymentId 
					}
				});
			} else {
				throw new Error(result.error || 'Erro no processamento do pagamento');
			}
		} catch (error) {
			console.error('Erro no pagamento:', error);
			addNotification(error.message || 'Erro no processamento do pagamento', 'error');
		} finally {
			setLoading(false);
		}
	};
	const getInstallmentOptions = () => {
		if (!orderInfo?.total) return [];
		
		const total = parseFloat(orderInfo.total);
		const options = [];
		
		// Para débito, apenas à vista
		if (cardType === 'debit') {
			return [{
				value: 1,
				label: `À vista - R$ ${total.toFixed(2)}`
			}];
		}
		
		// Para crédito, opções de parcelamento
		for (let i = 1; i <= 12; i++) {
			const installmentValue = total / i;
			const hasInterest = i > 6;
			const finalValue = hasInterest ? installmentValue * 1.0299 : installmentValue; // 2.99% ao mês após 6x
			
			options.push({
				value: i,
				label: i === 1 
					? `À vista - R$ ${total.toFixed(2)}`
					: `${i}x de R$ ${finalValue.toFixed(2)} ${hasInterest ? 'com juros' : 'sem juros'}`
			});
		}
		
		return options;
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
				<div className="max-w-2xl mx-auto">					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-gray-800 mb-2">
							Pagamento com Cartão de {cardType === 'debit' ? 'Débito' : 'Crédito'}
						</h1>
						<p className="text-gray-600">Finalize seu pedido de forma segura</p>
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
						</div>
					</div>

					{/* Formulário de Pagamento */}
					<div className="bg-white rounded-lg shadow-lg p-6">
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Número do Cartão */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Número do Cartão
								</label>
								<input
									type="text"
									name="cardNumber"
									value={formData.cardNumber}
									onChange={handleInputChange}
									placeholder="0000 0000 0000 0000"
									maxLength="19"
									className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
										errors.cardNumber ? 'border-red-500' : 'border-gray-300'
									}`}
								/>
								{errors.cardNumber && (
									<p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
								)}
							</div>

							{/* Nome no Cartão */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Nome no Cartão
								</label>
								<input
									type="text"
									name="cardName"
									value={formData.cardName}
									onChange={handleInputChange}
									placeholder="Nome como impresso no cartão"
									className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
										errors.cardName ? 'border-red-500' : 'border-gray-300'
									}`}
								/>
								{errors.cardName && (
									<p className="text-red-500 text-sm mt-1">{errors.cardName}</p>
								)}
							</div>

							{/* Data de Validade e CVV */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Validade
									</label>
									<input
										type="text"
										name="expiryDate"
										value={formData.expiryDate}
										onChange={handleInputChange}
										placeholder="MM/AA"
										maxLength="5"
										className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
											errors.expiryDate ? 'border-red-500' : 'border-gray-300'
										}`}
									/>
									{errors.expiryDate && (
										<p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										CVV
									</label>
									<input
										type="text"
										name="cvv"
										value={formData.cvv}
										onChange={handleInputChange}
										placeholder="000"
										maxLength="4"
										className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
											errors.cvv ? 'border-red-500' : 'border-gray-300'
										}`}
									/>
									{errors.cvv && (
										<p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
									)}
								</div>
							</div>

							{/* Parcelamento */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Parcelamento
								</label>
								<select
									name="installments"
									value={formData.installments}
									onChange={handleInputChange}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
								>
									{getInstallmentOptions().map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>

							{/* Botões */}
							<div className="flex space-x-4 pt-6">
								<button
									type="button"
									onClick={() => router.back()}
									className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
								>
									Voltar
								</button>
								<button
									type="submit"
									disabled={loading}
									className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
								>
									{loading ? (
										<>
											<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
											Processando...
										</>
									) : (
										'Finalizar Pagamento'
									)}
								</button>
							</div>
						</form>
					</div>

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
								<span className="mr-1">✅</span>
								SSL Certificado
							</span>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
