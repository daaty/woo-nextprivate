import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import Layout from "../src/components/Layout";
import CheckoutForm from "../src/components/checkout/CheckoutForm";
import GET_COUNTRIES from "../src/queries/get-countries";
import client from "../src/components/ApolloClient";
import { useAuth } from "../src/hooks/useAuth";
import Link from "next/link";
import LoginForm from "../src/components/auth/LoginForm";
import { useQuery } from "@apollo/client";
import { GET_CUSTOMER } from "../src/queries/customer";
import { useNotification } from '../src/components/ui/Notification';
import SEO from '../src/components/seo/SEO';
import { useCartWithFallback as useCart } from '../src/hooks/useCartWithFallback';
import { 
  formatPrice,
  calculateCartSubtotal,
  priceToNumber
} from '../src/utils/cart-utils';
import {
  calculateInstallmentValue,
  calculateTotalWithInterest,
  INSTALLMENT_INTEREST_RATE,
  MAX_INSTALLMENTS,
  CASH_PAYMENT_DISCOUNT_PERCENT,
  CASH_PAYMENT_MULTIPLIER
} from '../src/utils/installment-utils';
import { handleCartError } from '../src/middleware/cart-error-handler';
import LoadingSpinner from '../src/components/LoadingSpinner';
// Importar logger para debugging (versão frontend)
const { checkoutLogger } = require('../debug-checkout-logs-frontend');

// Componentes auxiliares
const CheckIcon = () => <span className="text-green-500">✓</span>;
const UserIcon = () => <span>👤</span>;
const ArrowIcon = () => <span>←</span>;
const LockIcon = () => <span>🔒</span>;

/**
 * Página de checkout REDESENHADA - Inspirada no design Xiaomi
 * Layout moderno com elementos visuais elegantes e organização clara
 */
const Checkout = ({countriesData}) => {
	const router = useRouter();
	const { isLoggedIn, loading, user } = useAuth();
	const [checkoutMode, setCheckoutMode] = useState('initial');
	const { notification } = useNotification();
	
	// MODIFICADO: Obter mais valores do contexto do carrinho incluindo subtotal e acrescentando manualTotal
	const { 
		cartItems, 
		cartTotal, 
		cartCount, 
		formattedTotal,
		subtotal,
		formattedSubtotal,
		contextReady,
		clearCart 
	} = useCart();
	
	// ADICIONADO: Estado local para subtotal manual caso o valor do contexto falhe
	const [manualSubtotal, setManualSubtotal] = useState(0);
	const [calculatedTotal, setCalculatedTotal] = useState(0);
	
	// Flag para evitar redirecionamentos indesejados
	const [checkoutMounted, setCheckoutMounted] = useState(false);
	
	// Estados para controlar o progresso do checkout
	const [currentStep, setCurrentStep] = useState(1);
	const [completedSteps, setCompletedSteps] = useState([]);
	const [selectedAddress, setSelectedAddress] = useState(null);
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
	
	// Estados para o cálculo de frete
	const [zipCode, setZipCode] = useState('');
	const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
	const [shippingOptions, setShippingOptions] = useState([]);
	const [selectedShipping, setSelectedShipping] = useState(null);
	const [shippingError, setShippingError] = useState(null);
	const [shippingCost, setShippingCost] = useState(0); // MOVIDO: Declarado antes de ser usado
	const [hasFreightFree, setHasFreightFree] = useState(false);	const [isFinalizingOrder, setIsFinalizingOrder] = useState(false);
	const FREE_SHIPPING_THRESHOLD = 199;
	
	// Calcular subtotal manualmente a partir dos itens do carrinho
	useEffect(() => {
		if (Array.isArray(cartItems) && cartItems.length > 0) {
			try {
				// Calcular valor total baseado nos itens usando a função centralizada
				const calculatedSubtotal = calculateCartSubtotal(cartItems);
				
				if (!isNaN(calculatedSubtotal) && calculatedSubtotal > 0) {
					setManualSubtotal(calculatedSubtotal);
					
					// Armazenar em uma variável global para debugging
					if (typeof window !== 'undefined') {
						window._calculatedSubtotal = calculatedSubtotal;
					}
					
					console.log('[Checkout] 💰 Subtotal calculado manualmente:', calculatedSubtotal);
				}
			} catch (error) {
				console.error('[Checkout] Erro ao calcular subtotal manualmente:', error);
			}
		}
	}, [cartItems]);
	
	// MODIFICADO: Log dos valores para depuração com mais detalhes e incluindo o valor manual
	useEffect(() => {
		console.log('[Checkout] 📊 Valores do carrinho recebidos:', {
			cartTotal,
			subtotal,
			formattedTotal,
			formattedSubtotal,
			manualSubtotal,
			manualFormatted: formatPrice(manualSubtotal),
			isNumeric: !isNaN(parseFloat(subtotal || cartTotal)),
			typeOf: typeof subtotal,
			contextReady,
			valoresConvertidos: {
				subtotalNum: typeof subtotal === 'number' ? subtotal : priceToNumber(subtotal || 0),
				cartTotalNum: typeof cartTotal === 'number' ? cartTotal : priceToNumber(cartTotal || 0),
				formattedTotalNum: priceToNumber(formattedTotal || 0),
				formattedSubtotalNum: priceToNumber(formattedSubtotal || 0),
				manualSubtotalNum: manualSubtotal
			}
		});
	}, [cartTotal, subtotal, formattedTotal, formattedSubtotal, contextReady, manualSubtotal]);
	// Função para obter o melhor formato de preço para exibição (usar manualSubtotal)
	const getBestSubtotalFormatted = () => {
		const value = typeof manualSubtotal === 'number' ? manualSubtotal : 0;
		return formatPrice(value);
	};
	
	// ADICIONADO: Efeito para calcular o total (subtotal + frete) com base nos melhores valores disponíveis
	useEffect(() => {		// Usar manualSubtotal como fonte primária confiável
		const bestSubtotal = typeof manualSubtotal === 'number' ? manualSubtotal : 0;
		const shipping = typeof shippingCost === 'number' ? shippingCost : 0;
		const total = bestSubtotal + shipping;
		
		console.log('[Checkout] 🧮 Total calculado com valores confiáveis:', {
			bestSubtotal,
			shipping,
			total,
			formatted: formatPrice(total)
		});
		
		setCalculatedTotal(total);
		
		// Armazenar em uma variável global para debugging
		if (typeof window !== 'undefined') {
			window._checkoutCalculatedTotal = total;
		}
	}, [manualSubtotal, subtotal, cartTotal, shippingCost]);
	
	// Buscar dados do cliente se estiver logado
	const { data: customerData, loading: customerLoading } = useQuery(GET_CUSTOMER, {
		skip: !isLoggedIn,
		fetchPolicy: 'network-only',
		onCompleted: (data) => {
			console.log("[Checkout] Dados do cliente carregados:", data);
		},
		onError: (error) => {
			console.error("[Checkout] Erro ao carregar dados do cliente:", error);
		}
	});
		// Combinar dados do usuário
	const combinedUserData = useMemo(() => {
		if (!isLoggedIn || !user) return null;
		
		console.log('[Checkout] Combinando dados do usuário...');
		console.log('[Checkout] user:', user);
		console.log('[Checkout] customerData:', customerData);		// Preservar CPF e outros dados importantes do user context		// Função para fazer merge preservando valores válidos
		const mergeData = (userObj, graphqlObj) => {
			const result = { ...(userObj || {}) };
			
			if (graphqlObj && typeof graphqlObj === 'object') {
				// Lista de campos importantes que devem ser mergidos se tiverem valor
				const importantFields = [
					'firstName', 'lastName', 'email', 'phone', 'company',
					'address1', 'address2', 'city', 'state', 'postcode', 'country'
				];
				
				importantFields.forEach(key => {
					const graphqlValue = graphqlObj[key];
					// Só sobrescrever se o valor da GraphQL for válido e não vazio
					if (graphqlValue && graphqlValue !== null && graphqlValue !== undefined && graphqlValue.toString().trim() !== '') {
						result[key] = graphqlValue;
					}
				});
			}
			
			return result;
		};

		const combinedData = {
			...user,
			billing: mergeData(user.billing, customerData?.customer?.billing),
			shipping: mergeData(user.shipping, customerData?.customer?.shipping),
			// Preservar rawMetaData se existir
			rawMetaData: user.rawMetaData || customerData?.customer?.metaData || undefined,
			// Adicionar metaData da query GraphQL
			metaData: customerData?.customer?.metaData || user.metaData || undefined
		};
				console.log('[Checkout] Dados combinados resultado:', combinedData);
		console.log('[Checkout] CPF no billing:', combinedData.billing?.cpf);
		console.log('[Checkout] Telefone no billing:', combinedData.billing?.phone);
		console.log('[Checkout] Telefone no shipping:', combinedData.shipping?.phone);
		console.log('[Checkout] rawMetaData:', combinedData.rawMetaData);
		console.log('[Checkout] metaData:', combinedData.metaData);
		
		return combinedData;
	}, [isLoggedIn, user, customerData]);
	// Efeito para garantir que a página checkout não seja desmontada prematuramente
	useEffect(() => {
		console.log("[Checkout] Componente montado");
		setCheckoutMounted(true);
		
		// Verificar se o acesso a essa página foi iniciado corretamente
		const checkoutInitiated = typeof window !== 'undefined' ? sessionStorage.getItem('checkoutInitiated') : null;
		
		// Registrar que chegamos na página de checkout para evitar redirecionamentos indesejados
		if (typeof window !== 'undefined') {
			sessionStorage.setItem('checkoutPageLoaded', 'true');
			sessionStorage.setItem('checkoutPageLoadTime', Date.now().toString());
			
			// Evitar que a página seja redirecionada para trás imediatamente após carregamento
			// Isso previne o problema de navegação em loop
			const preventBackNavigation = (e) => {
				// Evitar navegação automática de volta para o carrinho
				if (window.location.pathname === '/checkout' && Date.now() - parseInt(sessionStorage.getItem('checkoutPageLoadTime') || '0') < 5000) {
					console.log("[Checkout] Navegação para trás bloqueada durante inicialização do checkout");
					e.preventDefault();
					e.stopPropagation();
					return false;
				}
				return true;
			};
			
			// Adicionar proteção contra navegação indesejada
			window.history.pushState(null, '', window.location.href);
			window.addEventListener('popstate', preventBackNavigation);
			
			return () => {
				window.removeEventListener('popstate', preventBackNavigation);
			};
		}
		
		return () => {
			console.log("[Checkout] Componente desmontado");
			setCheckoutMounted(false);
		};
	}, []);
	
	// Verificar se há itens no carrinho
	useEffect(() => {
		// Só redirecionar para o carrinho se:
		// 1. Não estamos em loading
		// 2. A verificação de carrinho vazio está completa
		// 3. O componente já foi montado completamente
		if (!loading && checkoutMounted && (!cartItems || cartItems.length === 0)) {
			notification.warning('Seu carrinho está vazio. Redirecionando...');
			setTimeout(() => {
				router.push('/cart');
			}, 800);
		}
	}, [cartItems, loading, router, notification, checkoutMounted]);

	// Verificar se o valor da compra qualifica para frete grátis
	useEffect(() => {
		// MODIFICADO: Usar manualSubtotal diretamente como fonte primária
		const baseValue = typeof manualSubtotal === 'number' ? manualSubtotal : 0;
		
		if (baseValue >= FREE_SHIPPING_THRESHOLD) {
			console.log(`[Checkout] ✅ Compra qualifica para frete grátis: ${baseValue} >= ${FREE_SHIPPING_THRESHOLD}`);
			setHasFreightFree(true);
		} else {
			console.log(`[Checkout] ❌ Compra não qualifica para frete grátis: ${baseValue} < ${FREE_SHIPPING_THRESHOLD}`);
			setHasFreightFree(false);
		}
	}, [cartTotal, subtotal, manualSubtotal]);
	
	// Efeito para atualizar o custo do frete quando uma opção é selecionada
	useEffect(() => {
		if (selectedShipping && Array.isArray(shippingOptions)) {
			const selectedOption = shippingOptions.find(option => option.id === selectedShipping);
			if (selectedOption) {
				setShippingCost(parseFloat(selectedOption.price) || 0);
			}
		} else {
			setShippingCost(0);
		}
	}, [selectedShipping, shippingOptions]);
		// Função para calcular o frete
	const handleCalculateShipping = useCallback(async (zipCodeParam) => {
		// Usa o CEP passado como parâmetro ou o do estado
		const cepToUse = zipCodeParam || zipCode;
		
		if (!cepToUse || cepToUse.length < 8) {
			notification.warning('Por favor, digite um CEP válido');
			return;
		}
		
		// Reset de erros anteriores
		setShippingError(null);
		setIsCalculatingShipping(true);
		
		try {
			// Salvar o CEP para uso futuro
			localStorage.setItem('user_zip_code', cepToUse);
			
			// Preparar dados para a API de cálculo de frete
			const produtos = Array.isArray(cartItems) ? cartItems.map(item => {
				// Extrair informações necessárias para cálculo de frete
				// Usar valores padrão se não houver informações de dimensões nos produtos
				const peso = parseFloat(item.weight || 0.3); // Peso em kg (mínimo 0.3kg)
				const comprimento = parseFloat(item.length || 16); // Em cm (mínimo 16cm)
				const altura = parseFloat(item.height || 2); // Em cm (mínimo 2cm)
				const largura = parseFloat(item.width || 11); // Em cm (mínimo 11cm)
				const quantidade = parseInt(item.qty) || 1;
				
				return {
					peso,
					comprimento,
					altura, 
					largura,
					diametro: 0,
					quantidade
				};
			}) : [
				// Fornecer pelo menos um produto padrão se não houver itens no carrinho
				{
					peso: 0.3,
					comprimento: 16,
					altura: 2,
					largura: 11,
					diametro: 0,
					quantidade: 1
				}
			];
					// Log para debug
			console.log('[Checkout] Enviando dados para cálculo de frete:', { cepDestino: cepToUse, produtos });
			
			// Chamar a API de cálculo de frete
			const response = await fetch('/api/shipping/calculate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					cepDestino: cepToUse.replace(/\D/g, ''), // Remover caracteres não numéricos
					produtos
				})
			});
			
			let data;
			try {
				data = await response.json();
			} catch (e) {
				throw new Error('Não foi possível interpretar a resposta do servidor.');
			}
			
			if (!response.ok) {
				throw new Error(data.error || 'Falha ao calcular o frete. Serviço dos Correios indisponível.');
			}
			
			console.log('[Checkout] Resposta API frete:', data);
			
			// Verificar se há opções de frete
			if (!data.opcoes || !Array.isArray(data.opcoes) || data.opcoes.length === 0) {
				setShippingError('Não foi possível calcular o frete para este CEP. Verifique se o CEP está correto.');
				notification.warning('Não foi possível calcular o frete para este CEP.');
				setIsCalculatingShipping(false);
				return;
			}
			
			// Se estamos usando valores de fallback, mostrar uma notificação ao usuário
			if (data.isFallback) {
				const motivoFallback = data.motivoFallback || 'indisponibilidade temporária';
				let mensagemFallback;
				
				switch (motivoFallback) {
					case 'permissão':
						mensagemFallback = 'Valores estimados de frete. A loja está em processo de validação junto aos Correios.';
						setShippingError('Valores estimados enquanto a API é validada.');
						break;
					case 'autenticação':
						mensagemFallback = 'Valores estimados de frete. Problema na autenticação com os Correios.';
						setShippingError('Valores estimados devido a problema de autenticação.');
						break;
					case 'conexão':
						mensagemFallback = 'Valores estimados de frete. O serviço dos Correios está temporariamente indisponível.';
						setShippingError('Valores estimados devido à indisponibilidade dos Correios.');
						break;
					default:
						mensagemFallback = 'Exibindo valores estimados de frete. O serviço oficial não está disponível no momento.';
						setShippingError('Valores estimados. Verifique na finalização do pedido.');
				}
				
				notification.info(mensagemFallback);
			}
			
			// Transformar as opções retornadas pela API no formato esperado pelo checkout
			const options = data.opcoes.map((opcao, index) => ({
				id: opcao.codigo,
				name: opcao.nome,
				price: opcao.valor,
				// Garantir formatação clara do prazo de entrega
				days: `Prazo: ${opcao.prazo} ${opcao.prazo === 1 ? 'dia útil' : 'dias úteis'}`,
				prazo: opcao.prazo, // Adicionar o prazo separado para facilitar a ordenação
				isFallback: opcao.isFallback,
				motivoFallback: data.motivoFallback
			}));
			
			// Se o valor do carrinho qualificar para frete grátis, marcamos o PAC como gratuito
			if (hasFreightFree && options.length > 0) {
				const pacOption = options.find(opt => opt.name === 'PAC' || opt.id === '04510');
				if (pacOption) {
					pacOption.price = 0;
					pacOption.name = 'PAC (Frete Grátis)';
				}
			}
			
			// Ordenar opções primeiro por prazo (do mais rápido para o mais lento) e depois por preço
			options.sort((a, b) => {
				// Se o usuário qualificar para frete grátis, mostrar opções gratuitas primeiro
				if (hasFreightFree) {
					if (a.price === 0 && b.price !== 0) return -1;
					if (a.price !== 0 && b.price === 0) return 1;
				}
				
				// Depois ordenar por prazo de entrega (do mais rápido para o mais lento)
				const prazoA = parseInt(a.prazo) || 0;
				const prazoB = parseInt(b.prazo) || 0;
				
				if (prazoA !== prazoB) {
					return prazoA - prazoB;
				}
				
				// Se os prazos forem iguais, ordenar por preço
				return a.price - b.price;
			});
			
			// Atualizar as opções de frete
			setShippingOptions(options);
			setIsCalculatingShipping(false);
			
			// Preselecionar a opção mais barata
			if (options.length > 0) {
				const cheapestOption = options.reduce((prev, current) => 
					(prev.price < current.price) ? prev : current
				);
				setSelectedShipping(cheapestOption.id);
			}
			
			notification.success('Frete calculado com sucesso!');
			
		} catch (error) {
			console.error('[Checkout] Erro ao calcular frete:', error);
			setShippingError(error.message || 'Erro ao calcular o frete. Por favor, tente novamente.');
			notification.error(error.message || 'Erro ao calcular o frete. Por favor, tente novamente.');
			setIsCalculatingShipping(false);
		}
	}, [zipCode, cartItems, notification, hasFreightFree, setShippingError, setIsCalculatingShipping, setShippingOptions, setSelectedShipping]);
	
	// Manipulador para login bem-sucedido
	const handleLoginSuccess = () => {
		setCheckoutMode('authenticated');
		notification.success('Login realizado com sucesso!');
	};
	
	// Funções para gerenciar o progresso do checkout
	const handleStepComplete = (step) => {
		if (!completedSteps.includes(step)) {
			setCompletedSteps([...completedSteps, step]);
		}
		// Avançar para próxima etapa se não estiver na última
		if (step < 4) {
			setCurrentStep(step + 1);
		}
	};
	
	const handleAddressSelection = (address) => {
		setSelectedAddress(address);
		
		// Extrair o CEP do endereço selecionado e calcular o frete automaticamente
		if (address && address.postcode) {
			// Formatar o CEP para o formato adequado (só números)
			const cleanPostcode = address.postcode.replace(/\D/g, '');
			if (cleanPostcode.length >= 8) {
				console.log(`[Checkout] Endereço selecionado, calculando frete com CEP: ${cleanPostcode}`);
				setZipCode(cleanPostcode);
				
				// Usar setTimeout para garantir que o zipCode foi atualizado
				setTimeout(() => {
					// Mostra a seção de cálculo de frete
					const shippingCalculation = document.getElementById('shipping-calculation-main');
					if (shippingCalculation) {
						shippingCalculation.style.display = 'block';
					}
					
					// Calcular o frete com o CEP do endereço selecionado
					handleCalculateShipping(cleanPostcode);
				}, 300);
			}
		}
		
		// Marcar etapa 3 (entrega) como completa e ir para pagamento
		handleStepComplete(3);
	};
	
	const handlePaymentSelection = (method) => {
		setSelectedPaymentMethod(method);
		// Marcar etapa 4 (pagamento) como completa
		handleStepComplete(4);
	};	const handleFinalizePurchase = async () => {
		console.log('🚀 [DEBUG] handleFinalizePurchase chamada');
		console.log('🚀 [DEBUG] isFinalizingOrder:', isFinalizingOrder);
		console.log('🚀 [DEBUG] selectedPaymentMethod:', selectedPaymentMethod);
		console.log('🚀 [DEBUG] selectedShipping:', selectedShipping);
		console.log('🚀 [DEBUG] shippingCost:', shippingCost);
		console.log('🚨 [DEBUG] notification object:', notification);
		console.log('🚨 [DEBUG] notification.error function:', typeof notification?.error);
				// ADICIONADO: Log detalhado dos valores do carrinho para depuração
		console.log('🛒 [DEBUG] Valores do carrinho:', {
			subtotal,
			cartTotal,
			formattedTotal,
			formattedSubtotal,
			manualSubtotal,
			bestSubtotal: typeof manualSubtotal === 'number' ? manualSubtotal : 0,
			bestFormatted: getBestSubtotalFormatted(),
			cartValueNumeric: typeof subtotal === 'number' ? subtotal : priceToNumber(cartTotal || 0),
			shippingCost,
			totalCalculado: (typeof manualSubtotal === 'number' ? manualSubtotal : 0) + shippingCost,
		});
		
		// Verificar se já está processando para evitar múltiplos cliques
		if (isFinalizingOrder) {
			console.log('🚀 [DEBUG] Já está processando, retornando...');
			return;
		}
		
		// Ativar estado de loading
		console.log('🚀 [DEBUG] Ativando estado de loading...');
		setIsFinalizingOrder(true);
		
		try {
			// === VALIDAÇÕES CRÍTICAS ANTES DE FINALIZAR ===
			
			// 1. Validar método de pagamento
			if (!selectedPaymentMethod) {
				checkoutLogger.log('❌ ERRO: Método de pagamento não selecionado');
				notification.warning('Por favor, selecione um método de pagamento');
				setIsFinalizandoOrder(false);
				return;
			}
			
			// 2. Validar seleção de frete
			if (!selectedShipping) {
				checkoutLogger.log('❌ ERRO: Frete não selecionado', {
					selectedShipping: selectedShipping,
					shippingOptions: shippingOptions,
					shippingOptionsCount: shippingOptions?.length || 0
				});
				notification.warning('Por favor, selecione uma opção de entrega para calcular o frete');
				setIsFinalizandoOrder(false);
				return;
			}

			// 3. Validar valor do frete
			if (shippingCost === null || shippingCost === undefined) {
				checkoutLogger.log('❌ ERRO: Custo de frete não definido', {
					shippingCost: shippingCost,
					selectedShipping: selectedShipping,
					shippingOptions: shippingOptions
				});
				notification.warning('Erro no cálculo do frete. Por favor, recalcule o frete');
				setIsFinalizandoOrder(false);
				return;
			}			// 4. Validar total do pedido
			// MODIFICADO: Usar manualSubtotal diretamente como fonte primária para o cálculo
			const totalCalculated = (typeof manualSubtotal === 'number' ? manualSubtotal : 0) + (typeof shippingCost === 'number' ? shippingCost : 0);
			
			console.log('[Checkout] 💰 Cálculo do total:', {
				manualSubtotal,
				shippingCost,
				totalCalculated
			});
					if (totalCalculated <= 0) {
				checkoutLogger.log('❌ ERRO: Total do pedido inválido', {
					subtotal,
					cartTotal,
					manualSubtotal,
					shippingCost,
					totalCalculated
				});
				notification.error('Erro no total do pedido. Por favor, recarregue a página');
				setIsFinalizandoOrder(false);
				return;
			}

			// 5. Validar telefone do cliente PREVENTIVAMENTE
			const phoneValidation = (() => {
				let phone = null;
				
				// Estratégias para encontrar telefone
				if (combinedUserData?.phone) phone = combinedUserData.phone;
				if (!phone && combinedUserData?.shipping?.phone) phone = combinedUserData.shipping.phone;
				if (!phone && combinedUserData?.billing?.phone) phone = combinedUserData.billing.phone;
				
				// Verificar em rawMetaData
				if (!phone && Array.isArray(combinedUserData?.rawMetaData)) {
					const phoneMeta = combinedUserData.rawMetaData.find(meta => meta.key === 'phone' || meta.key === 'billing_phone' || meta.key === 'shipping_phone');
					if (phoneMeta?.value) phone = phoneMeta.value;
				}
				
				// Validar telefone
				if (phone && typeof phone === 'string') {
					const cleanPhone = phone.replace(/\D/g, '');
					return cleanPhone.length >= 10;
				}
				
				return false;
			})();			if (!phoneValidation) {
				console.log('🚨 [DEBUG] Telefone não encontrado, exibindo notificação...');
				checkoutLogger.log('❌ ERRO: Telefone não encontrado no usuário', {
					combinedUserData: combinedUserData
				});
				
				// Tentar exibir notificação
				try {
					console.log('🚨 [DEBUG] Chamando notification.error...');
					notification.error('📞 É necessário cadastrar um telefone para finalizar a compra. Acesse "Minha Conta" → "Dados Pessoais" para adicionar seu telefone.');
					console.log('🚨 [DEBUG] notification.error chamado com sucesso');
				} catch (error) {
					console.error('🚨 [DEBUG] Erro ao chamar notification.error:', error);
				}
				
				setIsFinalizandoOrder(false);
				return;
			}

		// LOG: Validações aprovadas
		checkoutLogger.log('✅ VALIDAÇÕES APROVADAS - Iniciando finalização', {
			selectedPaymentMethod: selectedPaymentMethod,
			selectedShipping: selectedShipping,
			shippingCost: shippingCost,
			totalCalculated: totalCalculated
		});

		notification.info('Processando pagamento...');
				// Verificar se temos um endereço válido
		let addressToUse = selectedAddress;
		
		// Se não temos endereço selecionado, usar o endereço do usuário autenticado
		if (!addressToUse && combinedUserData?.shipping) {
			console.log('[Checkout] Usando endereço de entrega do usuário:', combinedUserData.shipping);
			addressToUse = combinedUserData.shipping;
		}
		
		// Se ainda não temos endereço, usar o de cobrança
		if (!addressToUse && combinedUserData?.billing) {
			console.log('[Checkout] Usando endereço de cobrança do usuário:', combinedUserData.billing);
			addressToUse = combinedUserData.billing;
		}
		
		// Verificar se temos um endereço válido após todos os fallbacks
		if (!addressToUse || !addressToUse.postcode) {
			notification.error('Por favor, selecione um endereço de entrega válido');
			return;
		}
					console.log('[Checkout] Endereço final a ser usado:', addressToUse);
		console.log('[Checkout] 🏠 DETALHES DO ENDEREÇO DE ENTREGA:');
		console.log('[Checkout] - address1:', addressToUse.address1);
		console.log('[Checkout] - address2:', addressToUse.address2);
		console.log('[Checkout] - city:', addressToUse.city);
		console.log('[Checkout] - state:', addressToUse.state);
		console.log('[Checkout] - postcode:', addressToUse.postcode);
		console.log('[Checkout] - country:', addressToUse.country);
				// Definir endereço de cobrança
		const billingAddress = combinedUserData?.billing || addressToUse;
		console.log('[Checkout] Endereço de cobrança:', billingAddress);
		console.log('[Checkout] Tem billing separado?', !!combinedUserData?.billing);		// === LOG DEBUGGING: Capturar estado real do checkout ===
		checkoutLogger.log('🛒 CHECKOUT - Preparando dados do pedido', {
			cartTotal: cartTotal,
			cartTotalParsed: priceToNumber(cartTotal),
			shippingCost: shippingCost,
			selectedShipping: selectedShipping,
			totalCalculated: priceToNumber(cartTotal) + shippingCost,
			cartItems: cartItems?.length || 0,
			hasShippingSelected: !!selectedShipping,
			hasShippingCost: shippingCost > 0,
			timestamp: new Date().toISOString()
		});
		
		// Validação crítica: verificar se frete foi selecionado
		if (!selectedShipping || shippingCost === 0) {
			checkoutLogger.log('⚠️  AVISO: Frete não selecionado ou com valor zero', {
				selectedShipping: selectedShipping,
				shippingCost: shippingCost,
				hasShippingOptions: shippingOptions?.length > 0,
				cartRequiresShipping: cartItems?.length > 0
			});
		}
		
		// Preparar dados do pedido com todas as informações obrigatórias
		const orderData = {
			paymentMethod: selectedPaymentMethod,
			shipping: {
				...addressToUse, // Usar o endereço validado
				cost: shippingCost // ⭐ CORRIGIDO: Adicionar cost dentro do objeto shipping
			},
			billing: billingAddress, // Endereço de cobrança separado
			shippingOption: selectedShipping,
			shippingCost: shippingCost, // Manter para compatibilidade
			items: cartItems.map(item => {
				// Tentar extrair o preço correto do totalPrice formatado
				let itemPrice = priceToNumber(item.price || item.subtotal || 0);
				
				// Se o price não estiver correto, tentar usar totalPrice
				if (itemPrice <= 0 || itemPrice !== priceToNumber(item.totalPrice)) {
					const totalPriceNum = priceToNumber(item.totalPrice);
					if (totalPriceNum > 0) {
						itemPrice = totalPriceNum / (item.qty || 1); // Dividir pela quantidade para obter preço unitário
					}
				}
				
				const mappedItem = {
					...item,
					price: itemPrice
				};
				console.log('[Checkout Debug] Item mapeado:', mappedItem);
				console.log('[Checkout Debug] Price usado:', itemPrice, 'de totalPrice:', item.totalPrice);
				return mappedItem;				}),			// MODIFICADO: Usar manualSubtotal diretamente para cálculo do total
			total: (typeof manualSubtotal === 'number' ? manualSubtotal : 0) + shippingCost,
			subtotal: typeof manualSubtotal === 'number' ? manualSubtotal : 0,
			customer: combinedUserData ? {
				databaseId: user?.databaseId || 0, // Adicionar databaseId para associar ao cliente
				email: combinedUserData.email,
				name: `${combinedUserData.firstName || ''} ${combinedUserData.lastName || ''}`.trim(),
				firstName: combinedUserData.firstName,
				lastName: combinedUserData.lastName,					phone: (() => {
					// Extrair telefone com múltiplas estratégias
					let phone = null;
					console.log('[Checkout] === INÍCIO EXTRAÇÃO DE TELEFONE ===');
					console.log('[Checkout] combinedUserData completo:', JSON.stringify(combinedUserData, null, 2));
					console.log('[Checkout] combinedUserData.shipping?.phone:', combinedUserData.shipping?.phone);
					console.log('[Checkout] combinedUserData.billing?.phone:', combinedUserData.billing?.phone);
					
					// 1. Telefone no shipping
					if (combinedUserData.shipping?.phone) {
						phone = combinedUserData.shipping.phone;
						console.log('[Checkout] ✓ Telefone encontrado em shipping:', phone);
					}
					
					// 2. Telefone no billing
					if (!phone && combinedUserData.billing?.phone) {
						phone = combinedUserData.billing.phone;
						console.log('[Checkout] ✓ Telefone encontrado em billing:', phone);
					}
					
					// 3. Telefone direto no combinedUserData
					if (!phone && combinedUserData.phone) {
						phone = combinedUserData.phone;
						console.log('[Checkout] ✓ Telefone encontrado direto:', phone);
					}
					
					// 4. Telefone no metaData (array de metaData)
					if (!phone && Array.isArray(combinedUserData.metaData)) {
						console.log('[Checkout] Verificando metaData:', combinedUserData.metaData);
						const phoneMeta = combinedUserData.metaData.find(meta => 
							meta.key === 'phone' || 
							meta.key === 'telefone' || 
							meta.key === 'billing_phone' ||
							meta.key === 'shipping_phone' ||
							meta.key === '_billing_phone' ||
							meta.key === '_shipping_phone' ||
							meta.key.includes('phone') ||
							meta.key.includes('telefone')
						);
						if (phoneMeta?.value) {
							phone = phoneMeta.value;
							console.log('[Checkout] ✓ Telefone encontrado em metaData:', phone);
						}
					}
					
					// 5. Telefone no rawMetaData (array de metaData)
					if (!phone && Array.isArray(combinedUserData.rawMetaData)) {
						console.log('[Checkout] Verificando rawMetaData:', combinedUserData.rawMetaData);
						const phoneMeta = combinedUserData.rawMetaData.find(meta => 
							meta.key === 'phone' || 
							meta.key === 'telefone' || 
							meta.key === 'billing_phone' ||
							meta.key === 'shipping_phone' ||
							meta.key === '_billing_phone' ||
							meta.key === '_shipping_phone' ||
							meta.key.includes('phone') ||
							meta.key.includes('telefone')
						);
						if (phoneMeta?.value) {
							phone = phoneMeta.value;
							console.log('[Checkout] ✓ Telefone encontrado em rawMetaData:', phone);
						}
					}
					
					console.log('[Checkout] Telefone encontrado antes da limpeza:', phone);
					
					// Limpar telefone (apenas números)
					if (phone && typeof phone === 'string') {
						phone = phone.replace(/\D/g, '');
						console.log('[Checkout] Telefone após limpeza:', phone);
						if (phone.length >= 10) {
							console.log('[Checkout] ✅ TELEFONE EXTRAÍDO COM SUCESSO:', phone);
							console.log('[Checkout] === FIM EXTRAÇÃO DE TELEFONE ===');
							return phone;
						} else {
							console.log('[Checkout] ❌ Telefone com tamanho inválido:', phone.length);
						}
					} else {
						console.log('[Checkout] ❌ Telefone não é string válida:', typeof phone, phone);
					}
								console.log('[Checkout] ❌ TELEFONE NÃO ENCONTRADO!');
						console.log('[Checkout] === FIM EXTRAÇÃO DE TELEFONE ===');
						throw new Error('Telefone do cliente não encontrado. Por favor, atualize seus dados no perfil.');
					})(),
					cpf: (() => {
						// Extrair CPF com múltiplas estratégias
						let cpf = null;
						
						// 1. CPF direto no combinedUserData
						if (combinedUserData.cpf) cpf = combinedUserData.cpf;
						
						// 2. CPF no billing
						if (!cpf && combinedUserData.billing?.cpf) cpf = combinedUserData.billing.cpf;
						
						// 3. CPF no rawMetaData (array de metaData)
						if (!cpf && Array.isArray(combinedUserData.rawMetaData)) {
							const cpfMeta = combinedUserData.rawMetaData.find(meta => meta.key === 'cpf');
							if (cpfMeta?.value) cpf = cpfMeta.value;
						}
						
						// 4. rawMetaData como string
						if (!cpf && typeof combinedUserData.rawMetaData === 'string') {
							cpf = combinedUserData.rawMetaData;
						}
						
						// Limpar CPF (apenas números)
						if (cpf && typeof cpf === 'string') {
							cpf = cpf.replace(/\D/g, '');
							if (cpf.length === 11) {
								console.log('[Checkout] CPF extraído com sucesso:', cpf);
								return cpf;
							}
						}
						
						console.log('[Checkout] CPF não encontrado, usando fallback');
						return '00000000000'; // Fallback
					})(),
					rawMetaData: (() => {
						// Incluir customer_id nos rawMetaData para sincronização
						const metaData = Array.isArray(combinedUserData.rawMetaData) 
							? [...combinedUserData.rawMetaData] 
							: [];
						
						// Adicionar customer_id se disponível
						if (combinedUserData.id) {
							metaData.push({
								key: 'customer_id',
								value: combinedUserData.id.toString()
							});
							console.log('[Checkout] Incluindo customer_id nos metaData:', combinedUserData.id);
						}
						
						return metaData;
					})()				} : {
					email: 'guest@checkout.com',
					name: 'Cliente Convidado',
					firstName: 'Cliente',
					lastName: 'Convidado',
					phone: input.billing?.phone || input.shipping?.phone || '',
					cpf: input.billing?.cpf || '00000000000'
				}
			};		console.log('[Checkout] Dados do pedido preparados:', orderData);
		console.log('[Checkout] 📦 ENVIANDO PARA API - SHIPPING:', JSON.stringify(orderData.shipping, null, 2));
		console.log('[Checkout] 💳 ENVIANDO PARA API - BILLING:', JSON.stringify(orderData.billing, null, 2));
		console.log('[Checkout] 💰 ENVIANDO PARA API - VALUES:', {
			subtotal: orderData.subtotal,
			shippingCost: orderData.shippingCost,
			total: orderData.total
		});

		// LOG CRÍTICO: Verificar se shipping.cost está sendo enviado
		checkoutLogger.log('🚀 CHECKOUT - Dados enviados para API', {
			shippingHasCost: !!orderData.shipping?.cost,
			shippingCostValue: orderData.shipping?.cost,
			shippingCostSeparate: orderData.shippingCost,
			totalWithShipping: orderData.total,
			subtotalBase: orderData.subtotal,
			calculation: `${orderData.subtotal} + ${shippingCost} = ${orderData.total}`
		});

		// Processar pagamento baseado no método selecionado
		if (selectedPaymentMethod === 'infinitepay-checkout') {
			await processInfinitepayPayment(orderData);
		} else {
			await processOtherPayment(orderData);
		}		} catch (error) {
			console.error('Erro ao processar pagamento:', error);
			
			// Verificar se é erro de telefone não encontrado
			if (error.message && error.message.includes('Telefone do cliente não encontrado')) {
				notification.error('É necessário cadastrar um telefone para finalizar a compra. Por favor, atualize seus dados no perfil e tente novamente.');
			} else {
				notification.error('Erro ao processar pagamento. Tente novamente.');
			}
		} finally {
			// Sempre desabilitar o estado de loading, mesmo em caso de erro
			setIsFinalizandoOrder(false);
		}
	};const processInfinitepayPayment = async (orderData) => {
	try {
		const response = await fetch('/api/infinitepay/create-link', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(orderData)
		});

		const result = await response.json();
		
		if (!response.ok) {
			throw new Error(result.error || 'Erro ao criar link de pagamento Infinitepay');
		}

		notification.success('Pedido criado com sucesso! Redirecionando para pagamento...');

		// Limpar o carrinho após pedido criado com sucesso
		console.log('[Checkout] Limpando carrinho após criação do pedido...');
		try {
			await clearCart();
			console.log('[Checkout] Carrinho limpo com sucesso');
		} catch (clearError) {
			console.error('[Checkout] Erro ao limpar carrinho:', clearError);
			// Não vamos mostrar erro para o usuário, pois o pedido foi criado com sucesso
		}

		// Salvar dados do pagamento no sessionStorage para a página de confirmação
		if (typeof window !== 'undefined') {
			console.log('[Checkout] Salvando dados no sessionStorage para orderId:', result.orderId);
			sessionStorage.setItem(`infinitepay_order_${result.orderId}`, JSON.stringify(result));
			// Também salvar com a chave genérica como backup
			sessionStorage.setItem('infinitepayOrderData', JSON.stringify(result));
		}

		// Redirecionar diretamente para o link de pagamento da Infinitepay
		console.log('[Checkout] Redirecionando para pagamento Infinitepay:', result.paymentLink);
		window.location.href = result.paymentLink;
		
	} catch (error) {
		throw error;
	}
};

const processOtherPayment = async (orderData) => {
	try {
		// Para pagamento na entrega e outros métodos
		const response = await fetch('/api/orders/create', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(orderData)
		});

		const result = await response.json();
		
		if (!response.ok) {
			throw new Error(result.error || 'Erro ao criar pedido');
		}			console.log('[Checkout] Pedido criado:', result);
			
			notification.success(result.message || 'Pedido criado com sucesso!');
			
			// Limpar o carrinho após pedido criado com sucesso
			console.log('[Checkout] Limpando carrinho após criação do pedido...');
			try {
				await clearCart();
				console.log('[Checkout] Carrinho limpo com sucesso');
			} catch (clearError) {
				console.error('[Checkout] Erro ao limpar carrinho:', clearError);
				// Não vamos mostrar erro para o usuário, pois o pedido foi criado com sucesso
			}
			
			// Redirecionar baseado na resposta
			if (result.redirectUrl) {
				router.push(result.redirectUrl);
			} else {
				router.push(`/pedido/confirmacao?order=${result.orderId}`);
			}
			
		} catch (error) {
			console.error('[Checkout] Erro ao processar pagamento:', error);
			throw error;
		}
	};	// Atualizar modo quando usuário estiver logado
	useEffect(() => {
		if (!loading && isLoggedIn) {
			setCheckoutMode('authenticated');
			// Se o usuário está logado, marcar etapa 1 como completa e ir para etapa 2
			setCompletedSteps([1]);
			setCurrentStep(2);
			
			// Se tem dados de endereço do cliente, pular para etapa 4 (pagamento)
			if (combinedUserData?.billing || combinedUserData?.shipping) {
				setCompletedSteps([1, 2, 3]);
				setCurrentStep(4);
			}
		}
	}, [loading, isLoggedIn, combinedUserData]);

	// Detectar checkout como convidado baseado em parâmetros de URL e sessionStorage
	useEffect(() => {
		if (!isLoggedIn && typeof window !== 'undefined') {
			// Verificar parâmetro de URL
			const urlParams = new URLSearchParams(window.location.search);
			const isGuestFromURL = urlParams.get('guest') === 'true';
			
			// Verificar sessionStorage
			const isGuestFromStorage = sessionStorage.getItem('checkoutAsGuest') === 'true';
			
			// Se algum dos dois indicar checkout como convidado, definir o modo
			if (isGuestFromURL || isGuestFromStorage) {
				console.log('[Checkout] Detectado checkout como convidado:', { 
					fromURL: isGuestFromURL, 
					fromStorage: isGuestFromStorage 
				});
				
				setCheckoutMode('guest');
				notification.info('Continuando como convidado');
				
				// Marcar etapa 1 como completa e ir para etapa 2
				setCompletedSteps([1]);
				setCurrentStep(2);
				
				// Limpar parâmetro da URL para evitar loops
				if (isGuestFromURL) {
					const newUrl = window.location.pathname;
					window.history.replaceState({}, '', newUrl);
				}
			}
		}
	}, [isLoggedIn, notification]);
		// Definir método de pagamento padrão
	useEffect(() => {
		setSelectedPaymentMethod('infinitepay-checkout'); // Infinitepay como padrão
	}, []);
		// Carregar CEP salvo e calcular frete automaticamente
	useEffect(() => {
		if (typeof window !== 'undefined') {
			// Primeiro verificamos se já temos um endereço selecionado
			if (selectedAddress && selectedAddress.postcode) {
				const cleanPostcode = selectedAddress.postcode.replace(/\D/g, '');
				if (cleanPostcode.length >= 8) {
					console.log(`[Checkout] Usando CEP do endereço selecionado: ${cleanPostcode}`);
					setZipCode(cleanPostcode);
					
					// Calculamos o frete apenas se estamos na etapa de entrega ou posterior
					if (currentStep >= 3) {
						setTimeout(() => {
							const shippingCalculation = document.getElementById('shipping-calculation-main');
							if (shippingCalculation) {
								shippingCalculation.style.display = 'block';
							}
							handleCalculateShipping(cleanPostcode);
						}, 500);
					}
					return; // Não prossegue com o CEP do localStorage se já usou o do endereço
				}
			}
			
			// Se não temos endereço com CEP, tentamos usar o CEP salvo no localStorage
			const savedZipCode = localStorage.getItem('user_zip_code');
			if (savedZipCode) {
				console.log(`[Checkout] Usando CEP salvo do localStorage: ${savedZipCode}`);
				setZipCode(savedZipCode);
				
				// Se o usuário já tem um CEP salvo e está na etapa de entrega ou posterior,
				// mostramos automaticamente a seção de cálculo de frete e calculamos
				if (currentStep >= 3) {
					setTimeout(() => {
						const shippingCalculation = document.getElementById('shipping-calculation-main');
						if (shippingCalculation) {
							shippingCalculation.style.display = 'block';
						}
						handleCalculateShipping(savedZipCode);
					}, 500);
				}
			}
		}
	}, [currentStep, selectedAddress]);
	
	// Efeito para detectar endereço de entrega existente e calcular frete automaticamente
	useEffect(() => {
		// Verifica se temos dados do usuário com endereço de entrega
		if (combinedUserData?.shipping?.postcode && isLoggedIn && !selectedAddress) {
			const shippingAddress = combinedUserData.shipping;
			
			// Log para debug
			console.log('[Checkout] Endereço de entrega detectado:', shippingAddress);
			
			// Extrair o CEP do endereço de entrega
			const cepEntrega = shippingAddress.postcode;
			
			if (cepEntrega && cepEntrega.length >= 8) {
				console.log(`[Checkout] Usando CEP do endereço de entrega: ${cepEntrega}`);
				
				// Definir o endereço como selecionado
				setSelectedAddress(shippingAddress);
				setZipCode(cepEntrega);
				
				// Se estamos na etapa de entrega ou posterior, calcular o frete
				if (currentStep >= 3) {
					setTimeout(() => {
						// Mostra a seção de cálculo de frete
						const shippingCalculation = document.getElementById('shipping-calculation-main');
						if (shippingCalculation) {
							shippingCalculation.style.display = 'block';
						}
						
						// Calcular o frete automaticamente
						handleCalculateShipping(cepEntrega);
					}, 500);
				}
			}
		}
	}, [combinedUserData, isLoggedIn, currentStep]); // Removido handleCalculateShipping e adicionado !selectedAddress na condição
	
	// Loading state
	if (loading || customerLoading) {
		return (
			<Layout>
				<div className="container mx-auto my-32 px-4 xl:px-0 flex justify-center">
					<div className="animate-pulse flex flex-col items-center">
						<div className="w-12 h-12 rounded-full bg-orange-400 mb-4"></div>
						<div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
						<div className="h-3 w-24 bg-gray-200 rounded"></div>
					</div>
				</div>
			</Layout>
		);
	}
		// Tela de opções de checkout para usuários não logados
	if (!isLoggedIn && checkoutMode === 'initial') {
		return (
			<Layout>
				<SEO 
					title="Checkout - Finalizar Pedido"
					description="Escolha como deseja prosseguir com seu pedido."
				/>
				
				{/* Styles inline para design moderno inspirado na Xiaomi */}
				<style jsx>{`
					.xiaomi-checkout-container {
						background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
						min-height: 100vh;
						padding: 20px 0;
					}
					
					.checkout-header {
						background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
						color: white;
						padding: 20px 0;
						margin-bottom: 30px;
						border-radius: 12px;
						box-shadow: 0 8px 32px rgba(255, 105, 0, 0.2);
					}
					
					.progress-steps {
						display: flex;
						justify-content: center;
						align-items: center;
						margin-bottom: 24px;
						gap: 16px;
					}
					
					.step-item {
						display: flex;
						align-items: center;
						font-size: 14px;
						color: rgba(255, 255, 255, 0.8);
					}
					
					.step-number {
						width: 28px;
						height: 28px;
						border-radius: 50%;
						background: rgba(255, 255, 255, 0.2);
						color: white;
						display: flex;
						align-items: center;
						justify-content: center;
						font-weight: 600;
						margin-right: 8px;
						font-size: 12px;
					}
					
					.step-number.active {
						background: white;
						color: #ff6900;
						box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
					}
					
					.step-connector {
						width: 32px;
						height: 2px;
						background: rgba(255, 255, 255, 0.3);
						margin: 0 8px;
					}
					
					.checkout-options {
						background: white;
						border-radius: 16px;
						box-shadow: 0 12px 48px rgba(0, 0, 0, 0.08);
						overflow: hidden;
						margin-bottom: 24px;
					}
					
					.option-card {
						padding: 32px;
						border-bottom: 1px solid #f1f5f9;
						transition: all 0.3s ease;
						position: relative;
						overflow: hidden;
					}
					
					.option-card:last-child {
						border-bottom: none;
					}
					
					.option-card:hover {
						background: linear-gradient(135deg, #fff8f3 0%, #f0f9ff 100%);
						transform: translateY(-2px);
					}
					
					.option-card::before {
						content: '';
					 position: absolute;
					 top: 0;
					 left: 0;
					 width: 4px;
					 height: 100%;
					 background: linear-gradient(180deg, #ff6900 0%, #00a8e1 100%);
					 opacity: 0;
					 transition: opacity 0.3s ease;
					}
					
					.option-card:hover::before {
						opacity: 1;
					}
					
					.option-icon {
						width: 48px;
						height: 48px;
						border-radius: 12px;
						background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 24px;
						margin-bottom: 16px;
						box-shadow: 0 4px 16px rgba(255, 105, 0, 0.2);
					}
					
					.option-title {
						font-size: 20px;
						font-weight: 600;
						color: #1e293b;
						margin-bottom: 8px;
					}
					
					.option-description {
						color: #64748b;
						line-height: 1.6;
						margin-bottom: 20px;
					}
							.option-button {
						background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%);
						color: white;
						border: none;
						padding: 16px 32px;
						border-radius: 12px;
						font-weight: 600;
						cursor: pointer;
						transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
						display: flex;
						align-items: center;
						justify-content: center;
						gap: 12px;
						box-shadow: 0 6px 24px rgba(255, 105, 0, 0.25);
						text-transform: uppercase;
						letter-spacing: 0.5px;
						font-size: 14px;
						position: relative;
						overflow: hidden;
						min-height: 56px;
					}
					
					.option-button::before {
						content: '';
						position: absolute;
						top: 0;
						left: -100%;
						width: 100%;
						height: 100%;
						background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
						transition: left 0.5s;
					}
					
					.option-button:hover::before {
						left: 100%;
					}
					
					.option-button:hover {
						background: linear-gradient(135deg, #ff8f00 0%, #ff6900 100%);
						transform: translateY(-3px) scale(1.02);
						box-shadow: 0 10px 40px rgba(255, 105, 0, 0.4);
					}
					
					.option-button:active {
						transform: translateY(-1px) scale(0.98);
						box-shadow: 0 4px 16px rgba(255, 105, 0, 0.3);
					}
					
					.guest-option {
						background: #f8fafc;
						border: 2px dashed #cbd5e1;
						border-radius: 12px;
						padding: 24px;
						text-align: center;
						transition: all 0.3s ease;
					}
					
					.guest-option:hover {
						border-color: #ff6900;
						background: #fff8f3;
					}
							.guest-button {
						background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%);
						border: none;
						color: white;
						padding: 16px 32px;
						border-radius: 12px;
						font-weight: 600;
						cursor: pointer;
						transition: all 0.3s ease;
						display: flex;
						align-items: center;
						justify-content: center;
						gap: 12px;
						width: 100%;
						box-shadow: 0 4px 16px rgba(255, 105, 0, 0.25);
						text-transform: uppercase;
						letter-spacing: 0.5px;
						font-size: 14px;
						position: relative;
						overflow: hidden;
					}
					
					.guest-button:hover {
						background: linear-gradient(135deg, #ff8f00 0%, #ff6900 100%);
						box-shadow: 0 8px 32px rgba(255, 105, 0, 0.4);
						transform: translateY(-2px);
					}
					
					.guest-button:active {
						transform: translateY(0);
						box-shadow: 0 2px 8px rgba(255, 105, 0, 0.3);
					}
					
					.security-section {
						background: white;
						border-radius: 12px;
						padding: 24px;
						box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
					}
					
					.security-grid {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
						gap: 20px;
						margin-top: 16px;
					}
					
					.security-item {
						text-align: center;
						padding: 16px;
						border-radius: 8px;
						background: #f8fafc;
						transition: all 0.3s ease;
					}
					
					.security-item:hover {
						background: #f1f5f9;
						transform: translateY(-2px);
					}
					
					.security-icon {
						font-size: 24px;
						margin-bottom: 8px;
					}
					
					.security-text {
						font-size: 12px;
						color: #64748b;
						font-weight: 500;
					}
					
					@media (max-width: 768px) {
						.xiaomi-checkout-container {
							padding: 10px;
						}
						
						.option-card {
							padding: 24px 20px;
						}
						
						.progress-steps {
							flex-direction: column;
							gap: 12px;
						}
						
						.step-connector {
							width: 2px;
							height: 20px;
							margin: 4px 0;
						}
					}
				`}</style>

				<div className="xiaomi-checkout-container">
					<div className="container mx-auto px-4 xl:px-0">
						{/* Header moderno com gradiente */}
						<div className="checkout-header">
							<div className="text-center">
								<h1 className="text-2xl font-bold mb-2">Finalizar Pedido</h1>
								<p className="text-sm opacity-90">Escolha como deseja prosseguir com sua compra</p>
							</div>
							
							{/* Steps progress */}
							<div className="progress-steps">
								<div className="step-item">
									<div className="step-number active">1</div>
									<span>Identificação</span>
								</div>
								<div className="step-connector"></div>
								<div className="step-item">
									<div className="step-number">2</div>
									<span>Endereço</span>
								</div>
								<div className="step-connector"></div>
								<div className="step-item">
									<div className="step-number">3</div>
									<span>Pagamento</span>
								</div>
							</div>
						</div>
						
						{/* Opções de checkout com design moderno */}
						<div className="checkout-options">
							<div className="option-card">
								<div className="option-icon">🔑</div>
								<h3 className="option-title">Já tem uma conta?</h3>
								<p className="option-description">
									Faça login para acessar seus endereços salvos e finalizar sua compra mais rapidamente. 
									Tenha acesso ao histórico de pedidos e ofertas exclusivas.
								</p>
								<button 
									onClick={() => setCheckoutMode('login')}
									className="option-button"
								>
									<span>Fazer Login</span>
									<span>→</span>
								</button>
							</div>
							
							<div className="option-card">
								<div className="option-icon">✨</div>
								<h3 className="option-title">Novo por aqui?</h3>
								<p className="option-description">
									Crie uma conta para acompanhar pedidos, salvar endereços e obter vantagens exclusivas. 
									É rápido e você ganha benefícios imediatos.
								</p>
								<Link href={`/registro?redirect=${encodeURIComponent('/checkout')}`}>
									<a className="option-button" style={{textDecoration: 'none'}}>
										<span>Criar Conta</span>
										<span>→</span>
									</a>
								</Link>
							</div>
						</div>
						
						{/* Opção convidado */}
						<div className="guest-option">
							<div style={{marginBottom: '16px'}}>
								<div className="option-icon" style={{margin: '0 auto 12px'}}>👤</div>
								<h4 style={{fontSize: '16px', fontWeight: '600', color: '#475569', marginBottom: '8px'}}>
									Continuar como Convidado
								</h4>
								<p style={{color: '#64748b', fontSize: '14px', marginBottom: '16px'}}>
									Prossiga sem criar uma conta. Você poderá criar uma depois.
								</p>
							</div>
							<button
								onClick={() => {
									setCheckoutMode('guest');
									notification.info('Continuando como convidado');
								}}
								className="guest-button"
							>
								<span>👤</span>
								<span>Continuar sem conta</span>
							</button>
						</div>
						
						{/* Seção de segurança */}
						<div className="security-section">
							<h4 style={{textAlign: 'center', fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '4px'}}>
								Compra 100% Segura
							</h4>
							<p style={{textAlign: 'center', fontSize: '13px', color: '#64748b'}}>
								Seus dados estão protegidos com a melhor tecnologia
							</p>
							<div className="security-grid">
								<div className="security-item">
									<div className="security-icon">🔒</div>
									<div className="security-text">SSL Seguro</div>
								</div>
								<div className="security-item">
									<div className="security-icon">🔄</div>
									<div className="security-text">Troca Fácil</div>
								</div>
								<div className="security-item">
									<div className="security-icon">💳</div>
									<div className="security-text">Pix & Cartão</div>
								</div>
								<div className="security-item">
									<div className="security-icon">🚚</div>
									<div className="security-text">Frete Grátis</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Layout>
		);
	}
		// Tela de login
	if (checkoutMode === 'login') {
		return (
			<Layout>
				<SEO 
					title="Login para Checkout"
					description="Faça login para continuar sua compra."
				/>
				
				<style jsx>{`
					.login-container {
						background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
						min-height: 100vh;
						padding: 20px 0;
					}
					
					.login-header {
						background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
						color: white;
						padding: 20px 0;
						margin-bottom: 30px;
						border-radius: 12px;
						box-shadow: 0 8px 32px rgba(255, 105, 0, 0.2);
						text-align: center;
					}
					
					.login-card {
						background: white;
						border-radius: 16px;
						box-shadow: 0 12px 48px rgba(0, 0, 0, 0.08);
						padding: 40px;
						max-width: 440px;
						margin: 0 auto;
					}
							.back-button {
						background: linear-gradient(135deg, #64748b 0%, #475569 100%);
						border: none;
						color: white;
						padding: 16px 24px;
						border-radius: 12px;
						font-weight: 600;
						cursor: pointer;
						transition: all 0.3s ease;
						display: flex;
						align-items: center;
						justify-content: center;
						gap: 12px;
						margin-top: 24px;
						box-shadow: 0 4px 16px rgba(100, 116, 139, 0.25);
						text-transform: uppercase;
						letter-spacing: 0.5px;
						font-size: 14px;
						position: relative;
						overflow: hidden;
					}
					
					.back-button:hover {
						background: linear-gradient(135deg, #475569 0%, #64748b 100%);
						box-shadow: 0 8px 32px rgba(100, 116, 139, 0.4);
						transform: translateY(-2px);
					}
					
					.back-button:active {
						transform: translateY(0);
						box-shadow: 0 2px 8px rgba(100, 116, 139, 0.3);
					}
					
					@media (max-width: 768px) {
						.login-container {
							padding: 10px;
						}
						
						.login-card {
							padding: 24px 20px;
						}
					}
				`}</style>

				<div className="login-container">
					<div className="container mx-auto px-4 xl:px-0">
						{/* Header */}
						<div className="login-header">
							<h1 className="text-2xl font-bold mb-2">Acesse sua Conta</h1>
							<p className="text-sm opacity-90">Entre para continuar sua compra com mais segurança</p>
						</div>
						
						{/* Card de login */}
						<div className="login-card">
							<div style={{textAlign: 'center', marginBottom: '24px'}}>
								<div style={{
									width: '48px',
									height: '48px',
									borderRadius: '12px',
									background: 'linear-gradient(135deg, #ff6900 0%, #00a8e1 100%)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '24px',
									margin: '0 auto 16px',
									boxShadow: '0 4px 16px rgba(255, 105, 0, 0.2)'
								}}>
									🔑
								</div>
								<h2 style={{fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '8px'}}>
									Fazer Login
								</h2>
								<p style={{color: '#64748b', fontSize: '14px'}}>
									Digite suas credenciais para acessar sua conta
								</p>
							</div>
							
							<LoginForm 
								onSuccess={handleLoginSuccess}
								redirectTo={null}
							/>
							
							<button
								onClick={() => setCheckoutMode('initial')}
								className="back-button"
								style={{width: '100%'}}
							>
								<span>←</span>
								<span>Voltar para opções</span>
							</button>
						</div>
					</div>
				</div>
			</Layout>
		);
	}
		// Formulário de checkout principal - Estilo Xiaomi moderno
	return (
		<Layout>
			<SEO 
				title="Finalizar Pedido"
				description="Complete seus dados para finalizar sua compra."
			/>
			
			{/* Estilos globais inspirados no design da Xiaomi */}
			<style jsx global>{`
				/* Estilo geral da página de checkout */
				.xiaomi-checkout {
					background: #f8f9fa;
					min-height: 100vh;
				}
				
				/* Header com segurança */
				.checkout-header {
					background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
					padding: 12px 0;
					color: white;
					text-align: center;
					font-size: 14px;
					margin-bottom: 24px;
				}
				
				/* Container principal do checkout */
				.checkout-main-container {
					max-width: 1200px;
					margin: 0 auto;
					padding: 0 16px;
				}
				
				/* Layout em grid para desktop */
				.checkout-grid {
					display: grid;
					grid-template-columns: 1fr 380px;
					gap: 32px;
									align-items: start;
				}
				
				@media (max-width: 1024px) {
					.checkout-grid {
						grid-template-columns: 1fr;
						gap: 24px;
					}
				}
				
				/* Caixas do checkout */
				.checkout-box {
					background: white;
					border-radius: 12px;
					padding: 24px;
					margin-bottom: 20px;
					box-shadow: 0 2px 8px rgba(0,0,0,0.08);
					border: 1px solid #e9ecef;
					transition: all 0.3s ease;
				}
				
				.checkout-box:hover {
					box-shadow: 0 4px 16px rgba(0,0,0,0.12);
					transform: translateY(-2px);
				}
				
				/* Títulos das seções */
				.checkout-box-title {
					display: flex;
					align-items: center;
					margin-bottom: 20px;
					padding-bottom: 12px;
					border-bottom: 2px solid #f1f3f4;
				}
				
				.checkout-box-number {
					width: 28px;
					height: 28px;
					background: linear-gradient(135deg, #ff6900, #00a8e1);
					color: white;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-weight: bold;
					font-size: 14px;
					margin-right: 12px;
							}
				
				.checkout-box-title h2 {
					margin: 0;
					font-size: 18px;
					font-weight: 600;
					color: #2c3e50;
				}
				
				/* Status badges */
				.status-badge {
					padding: 4px 12px;
					border-radius: 20px;
					font-size: 12px;
					font-weight: 500;
					margin-left: auto;
				}
				
				.status-badge.completed {
					background: #d4edda;
					color: #155724;
			
				}
				
				.status-badge.active {
					background: #fff3cd;
					color: #856404;
				}
				
				.status-badge.pending {
					background: #f8d7da;
					color: #721c24;
				}
				
				/* Resumo lateral */
				.order-summary {
					position: sticky;
					top: 24px;
				}
				
				.order-summary .summary-header {
					background: linear-gradient(135deg, rgba(255,105,0,0.1), rgba(0,168,225,0.1));
					margin: -24px -24px 20px -24px;
					padding: 20px 24px;
					border-radius: 12px 12px 0 0;
				}
				
				.order-summary .summary-total {
					font-size: 24px;
					font-weight: bold;
					color: #ff6900;
				}
				
				/* Produtos no resumo */
				.summary-product {
					display: flex;
					align-items: center;
					padding: 12px 0;
					border-bottom: 1px solid #f1f3f4;
				}
				
				.summary-product:last-child {
					border-bottom: none;
				}
				
				.summary-product-image {
					width: 50px;
					height: 50px;
					border-radius: 8px;
					object-fit: cover;
					margin-right: 12px;
					border: 1px solid #e9ecef;
				}
				
				.summary-product-info {
					flex: 1;
				}
				
				.summary-product-name {
					font-size: 14px;
					font-weight: 500;
					color: #2c3e50;
					margin-bottom: 4px;
				}
				
				.summary-product-qty {
					font-size: 12px;
					color: #6c757d;
				}
				
				/* Progress steps */
				.checkout-progress {
					display: flex;
					justify-content: space-between;
					margin-bottom: 32px;
					padding: 0 20px;
				}
				
				.progress-step {
					display: flex;
					flex-direction: column;
					align-items: center;
					flex: 1;
					position: relative;
				}
				
				.progress-step:not(:last-child)::after {
					content: '';
					position: absolute;
					top: 14px;
					left: calc(50% + 14px);
					right: calc(-50% + 14px);
					height: 2px;
					background: #e9ecef;
					z-index: 1;
				}
				
				.progress-step.completed:not(:last-child)::after {
					background: #28a745;
				}
				
				.progress-circle {
					width: 28px;
					height: 28px;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-weight: bold;
					font-size: 12px;
					margin-bottom: 8px;
					z-index: 2;
					position: relative;
				}
				
				.progress-step.completed .progress-circle {
					background: #28a745;
					color: white;
				}
				
				.progress-step.active .progress-circle {
					background: linear-gradient(135deg, #ff6900, #00a8e1);
					color: white;
				}
				
				.progress-step .progress-circle {
					background: #e9ecef;
					color: #6c757d;
				}
				
				.progress-label {
					font-size: 12px;
					text-align: center;
					color: #6c757d;
				}
				
				.progress-step.active .progress-label {
					color: #2c3e50;
					font-weight: 500;
				}
				
				/* Força reordenação do checkout form */
				.checkout form[name="checkout"] {
					display: flex !important;
					flex-direction: column !important;
				}
				
				.checkout .woocommerce-checkout-review-order,
				.checkout #order_review {
					order: -2 !important;
					margin-bottom: 2rem !important;
				}
				
				.checkout .woocommerce-billing-fields {
					order: -1 !important;
					margin-bottom: 1.5rem !important;
				}
				
				.checkout .woocommerce-shipping-fields {
					order: 0 !important;
					margin-bottom: 1.5rem !important;
				}
				
				.checkout .woocommerce-checkout-payment {
					order: 1 !important;
				}
				
				/* Payment methods in sidebar */
				.payment-methods {
					margin-top: 20px;
				}
				
				.payment-option {
					margin-bottom: 12px;
				}
				
				.payment-option label {
					display: flex;
					align-items: center;
					padding: 12px;
					background: white;
					border-radius: 8px;
					border: 1px solid #e5e7eb;
					cursor: pointer;
					transition: all 0.2s ease;
				}
				
				.payment-option label:hover {
					border-color: #ff6900;
					background: #fff7f0;
				}
				
				.payment-option input[type="radio"] {
					width: 16px;
					height: 16px;
					accent-color: #ff6900;
					margin-right: 12px;
				}
				
				.payment-option input[type="radio"]:checked + div {
					color: #ff6900;
				}
				
				.payment-option .payment-info {
					flex: 1;
				}
				
				.payment-option .payment-name {
					font-size: 14px;
					font-weight: 500;
					margin-bottom: 4px;
				}
				
				.payment-option .payment-desc {
					font-size: 12px;
					color: #6c757d;
				}
						.payment-badge {
					background: #d4edda;
					color: #155724;
					font-size: 10px;
				 padding: 2px 8px;
					border-radius: 12px;
					font-weight: 500;
				}
						/* Shipping options styling matching cart.js */
				.shipping-methods {
					margin-top: 16px;
				}
				
				.shipping-methods .grid {
					display: flex;
					flex-direction: column;
					gap: 12px;
				}
				
				.shipping-option {
					display: flex;
					align-items: center;
					justify-content: space-between;
					background: white;
					padding: 12px 16px;
					border-radius: 8px;
					box-shadow: 0 2px 4px rgba(0,0,0,0.05);
					cursor: pointer;
					transition: all 0.2s;
					border: 2px solid transparent;
				}
				
				.shipping-option:hover {
					transform: translateY(-2px);
					box-shadow: 0 4px 8px rgba(0,0,0,0.1);
				}
				
				.shipping-option-label {
					display: flex;
					align-items: center;
					justify-content: space-between;
					width: 100%;
					cursor: pointer;
				}
				
				.shipping-option-content {
					display: flex;
					align-items: center;
					justify-content: space-between;
					width: 100%;
					padding: 0;
					border-radius: 8px;
					transition: all 0.2s;
				}
				
				.shipping-option input[type="radio"]:checked + .shipping-option-content {
					color: #ff6900;
				}
				
				.shipping-option input[type="radio"]:checked ~ .shipping-option-content {
					color: #ff6900;
				}
				
				/* Aplicar estilo selecionado no container pai quando radio está checked */
				.shipping-option:has(input[type="radio"]:checked) {
					border: 2px solid #ff6900;
					background: #fff8f3;
				}
				
				.shipping-info {
					flex: 1;
				}
				
				.shipping-name {
					font-size: 14px;
					font-weight: 500;
					margin-bottom: 4px;
				}
				
				.shipping-desc {
					font-size: 12px;
					color: #6c757d;
				}
						.shipping-price {
					font-size: 16px;
					font-weight: 600;
					color: #333;
				}
				
				/* Estilo do radio button circular */
				.shipping-option input[type="radio"] {
					appearance: none;
					width: 20px;
					height: 20px;
					border: 2px solid #ddd;
					border-radius: 50%;
					background: white;
					margin-right: 12px;
					position: relative;
					cursor: pointer;
					transition: all 0.2s;
					flex-shrink: 0;
				}
				
				.shipping-option input[type="radio"]:checked {
					border-color: #ff6900;
					background: white;
				}
				
				.shipping-option input[type="radio"]:checked::after {
					content: '';
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					width: 10px;
					height: 10px;
					background: #ff6900;
					border-radius: 50%;
				}
				
				/* Botão Finalizar Pedido - Estilo Moderno */
				.finalize-order-btn {
					background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%);
					border: none;
					color: white;
					padding: 18px 32px;
					border-radius: 16px;
					font-weight: 700;
					cursor: pointer;
					transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 12px;
					width: 100%;
					box-shadow: 0 8px 32px rgba(255, 105, 0, 0.3);
					text-transform: uppercase;
					letter-spacing: 1px;
					font-size: 16px;
					position: relative;
					overflow: hidden;
					min-height: 60px;
				}
				
				.finalize-order-btn::before {
					content: '';
					position: absolute;
					top: 0;
					left: -100%;
					width: 100%;
					height: 100%;
					background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
					transition: left 0.5s;
				}
				
				.finalize-order-btn:hover::before {
					left: 100%;
				}
				
				.finalize-order-btn:hover {
					background: linear-gradient(135deg, #ff8f00 0%, #ff6900 100%);
					box-shadow: 0 12px 48px rgba(255, 105, 0, 0.5);
					transform: translateY(-4px) scale(1.02);
				}
				
				.finalize-order-btn:active {
					transform: translateY(-2px) scale(0.98);
					box-shadow: 0 6px 24px rgba(255, 105, 0, 0.4);
				}
				
				.finalize-order-btn:disabled {
					background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
					cursor: not-allowed;
					box-shadow: 0 4px 16px rgba(156, 163, 175, 0.2);
					transform: none;
				}
				
				.finalize-order-btn:disabled:hover {
					transform: none;
					box-shadow: 0 4px 16px rgba(156, 163, 175, 0.2);
				}
			`}</style>			<div className="xiaomi-checkout">
				<div className="checkout-main-container">
					{/* Breadcrumbs */}
					<div className="flex items-center text-sm text-gray-500 mb-6">
						<Link href="/"><a className="hover:text-orange-500">Início</a></Link>
						<span className="mx-2">›</span>
						<Link href="/cart"><a className="hover:text-orange-500">Carrinho</a></Link>
						<span className="mx-2">›</span>
						<span className="text-gray-800 font-medium">Checkout</span>
					</div>					{/* Progress Steps */}
					<div className="checkout-progress">
						<div className={`progress-step ${completedSteps.includes(1) ? 'completed' : ''}`}>
							<div className="progress-circle">{completedSteps.includes(1) ? '✓' : '1'}</div>
							<div className="progress-label">Carrinho</div>
						</div>
						<div className={`progress-step ${currentStep === 2 ? 'active' : ''} ${completedSteps.includes(2) ? 'completed' : ''}`}>
							<div className="progress-circle">{completedSteps.includes(2) ? '✓' : '2'}</div>
							<div className="progress-label">Dados Pessoais</div>
						</div>
						<div className={`progress-step ${currentStep === 3 ? 'active' : ''} ${completedSteps.includes(3) ? 'completed' : ''}`}>
							<div className="progress-circle">{completedSteps.includes(3) ? '✓' : '3'}</div>
							<div className="progress-label">Entrega</div>
						</div>
						<div className={`progress-step ${currentStep === 4 ? 'active' : ''} ${completedSteps.includes(4) ? 'completed' : ''}`}>
							<div className="progress-circle">{completedSteps.includes(4) ? '✓' : '4'}</div>
							<div className="progress-label">Pagamento</div>
						</div>
					</div>

					{/* Status do usuário */}
					{isLoggedIn ? (
						<div className="checkout-box" style={{ background: 'linear-gradient(135deg, rgba(40,167,69,0.1), rgba(40,167,69,0.05))' }}>
							<p className="text-green-700 flex items-center m-0">
								<CheckIcon />
								<span className="ml-2">
									Olá, <span className="font-semibold">{user?.firstName || 'usuário'}</span>! Você está logado e pode usar seus endereços salvos.
								</span>
							</p>
						</div>
					) : (
						<div className="checkout-box" style={{ background: 'linear-gradient(135deg, rgba(108,117,125,0.1), rgba(108,117,125,0.05))' }}>
							<p className="text-gray-700 flex justify-between items-center m-0">
								<span className="flex items-center">
									<UserIcon />
									<span className="ml-2">Você está finalizando como convidado</span>
								</span>
								<button 
									onClick={() => setCheckoutMode('initial')}
									className="text-orange-600 hover:underline text-sm bg-orange-50 px-3 py-1 rounded-full hover:bg-orange-100 transition-colors"
								>
									Alterar
								</button>
							</p>
						</div>
					)}

					{/* Verificação de telefone para usuários logados */}
					{isLoggedIn && combinedUserData && (() => {
						// Verificar se tem telefone
						let hasPhone = false;
						
						// Verificar telefone nos diferentes locais
						if (combinedUserData?.phone || 
							combinedUserData?.shipping?.phone || 
							combinedUserData?.billing?.phone) {
							const phone = combinedUserData.phone || 
										 combinedUserData.shipping?.phone || 
										 combinedUserData.billing?.phone;
							
							if (phone && typeof phone === 'string') {
								const cleanPhone = phone.replace(/\D/g, '');
								hasPhone = cleanPhone.length >= 10;
							}
						}
						
						// Verificar em rawMetaData se não encontrou
						if (!hasPhone && Array.isArray(combinedUserData?.rawMetaData)) {
							const phoneMeta = combinedUserData.rawMetaData.find(meta => 
								meta.key === 'phone' || 
								meta.key === 'billing_phone' ||
								meta.key === 'shipping_phone' ||
								meta.key.includes('phone')
							);
							if (phoneMeta?.value) {
								const cleanPhone = phoneMeta.value.replace(/\D/g, '');
								hasPhone = cleanPhone.length >= 10;
							}
						}
						
						// Se não tem telefone, mostrar aviso
						if (!hasPhone) {
							return (
								<div className="checkout-box" style={{ background: 'linear-gradient(135deg, rgba(255,193,7,0.1), rgba(255,193,7,0.05))' }}>
									<p className="text-yellow-700 flex justify-between items-center m-0">
										<span className="flex items-center">
											<span className="mr-2">📞</span>
											<span>Telefone necessário para finalizar a compra</span>
										</span>
										<Link href="/minha-conta">
											<a className="text-orange-600 hover:underline text-sm bg-orange-50 px-3 py-1 rounded-full hover:bg-orange-100 transition-colors">
												Adicionar Telefone
											</a>
										</Link>
									</p>
								</div>
							);
						}
						
						return null;
					})()}
					
					{/* Layout Grid */}
					<div className="checkout-grid">
						{/* Coluna Principal - Formulário */}
						<div className="checkout-main-form">
							<div className="checkout-box">
								<div className="checkout-box-title">
									<div className="checkout-box-number">1</div>
									<h2>Dados Pessoais</h2>
									<span className={`status-badge ${completedSteps.includes(2) ? 'completed' : (currentStep === 2 ? 'active' : 'pending')}`}>
										{completedSteps.includes(2) ? 'Concluído' : (currentStep === 2 ? 'Em andamento' : 'Pendente')}
									</span>
								</div>
								
								{currentStep >= 2 && (
									<CheckoutForm 
										countriesData={countriesData} 
										isUserLoggedIn={isLoggedIn}
										userData={combinedUserData}
										cartItems={cartItems}
										cartTotal={cartTotal}
										cartCount={cartCount}
										onFormComplete={() => handleStepComplete(2)}									onAddressSelected={handleAddressSelection}
										selectedShipping={selectedShipping}
										shippingOptions={shippingOptions}
										shippingCost={shippingCost}
									/>
								)}
							</div>

							{/* Nova seção de Opções de Entrega */}
							{currentStep >= 3 && (
								<div className="checkout-box">
									<div className="checkout-box-title">
										<div className="checkout-box-number">2</div>
										<h2>Opções de Entrega</h2>
										<span className={`status-badge ${completedSteps.includes(3) ? 'completed' : (currentStep === 3 ? 'active' : 'pending')}`}>
											{completedSteps.includes(3) ? 'Concluído' : (currentStep === 3 ? 'Em andamento' : 'Pendente')}
										</span>
									</div>

									{/* Cálculo de frete */}
									<div 
										id="shipping-calculation-main" 
										className="mb-4"
									>
										<div className="shipping-section">
											{isCalculatingShipping && (
												<div className="text-center py-6">
													<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
													<span className="ml-3 text-sm">Calculando opções de entrega...</span>
												</div>
											)}

											{shippingError && (
												<div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
													<p className="text-red-600 text-sm flex items-center">
														<span className="mr-2">⚠️</span>
														{shippingError}
													</p>
												</div>
											)}

											{shippingOptions.length > 0 && (
												<div className="shipping-methods">
													<h4 className="text-lg font-medium mb-4 flex items-center">
														🚚 Escolha a forma de entrega
													</h4>
													<div className="grid gap-3">
														{shippingOptions.map((option) => (
															<div key={option.id} className="shipping-option">
																<label className="shipping-option-label">
																	<input 
																		type="radio"
																		name="shippingOption"
																		value={option.id}
																		checked={selectedShipping === option.id}
																		onChange={() => setSelectedShipping(option.id)}
																		className="sr-only"
																	/>
																	<div className="shipping-option-content">
																		<div className="shipping-info">
																			<div className="shipping-name">{option.name}</div>
																			<div className="shipping-desc">{option.days}</div>
																		</div>
																		<div className="shipping-price">
																			{option.price === 0 ? (
																				<span className="text-green-600 font-bold">GRÁTIS</span>
																			) : (
																				<span className="text-gray-800 font-bold">{formatPrice(option.price)}</span>
																			)}
																		</div>
																	</div>
																</label>
															</div>
														))}
													</div>
												</div>
											)}

											{!isCalculatingShipping && shippingOptions.length === 0 && !shippingError && (
												<div className="text-center py-6 text-gray-500">
													<div className="text-4xl mb-2">📦</div>
													<p>Selecione um endereço para calcular o frete</p>
												</div>
											)}
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Coluna Lateral - Resumo do Pedido */}
						<div className="checkout-sidebar">
							<div className="checkout-box order-summary">
								<div className="summary-header">
									<h3 className="text-lg font-bold mb-2 flex items-center">
										📋 Resumo do Pedido
									</h3>
									<div className="summary-total">
										{/* MODIFICADO: Usar getBestSubtotalFormatted para garantir um valor não nulo */}
										{getBestSubtotalFormatted()}
									</div>
									<div className="text-sm opacity-75">
										{cartCount || 0} {(cartCount || 0) === 1 ? 'item' : 'itens'}
									</div>
								</div>
								
								{/* Lista de produtos */}
								<div className="summary-products">
									{cartItems && cartItems.length > 0 ? (
										cartItems.map((item, index) => (
											<div key={index} className="summary-product">
												<img
													src={item.image?.sourceUrl || '/placeholder.svg'}
													alt={item.name}
													className="summary-product-image"
													style={{
														width: '120px',
														height: '120px',
														objectFit: 'cover',
														borderRadius: '8px'
													}}
													onError={(e) => {
														e.target.src = '/placeholder.svg';
													}}
												/>
												<div className="summary-product-info">
													<div className="summary-product-name">{item.name}</div>
													<div className="summary-product-qty">Qtd: {item.qty}</div>
												</div>
											</div>
										))
									) : (
										<div className="text-center text-gray-500 py-4">
											<p>Carrinho vazio</p>
										</div>
									)}
								</div>								{/* Totais */}
								<div className="mt-4 pt-4 border-t border-gray-200">
									<div className="flex justify-between mb-2">
										<span className="text-sm text-gray-600">Subtotal:</span>
										<span className="text-sm font-medium">
											{/* MODIFICADO: Usar getBestSubtotalFormatted para garantir um valor não nulo */}
											{getBestSubtotalFormatted()}
										</span>
									</div>
									
									<div className="flex justify-between mb-2">
										<span className="text-sm text-gray-600">Frete:</span>
										<span className="text-sm">
											{selectedShipping ? (
												<>
													{shippingOptions.find(o => o.id === selectedShipping)?.price === 0 
														? <span className="text-green-600 font-medium">Grátis</span> 
														: formatPrice(shippingCost)}
												</>
											) : (
												<span className="text-gray-500 italic text-xs">
													Selecione um endereço
												</span>
											)}
										</span>
									</div>
									<div className="flex justify-between mb-3">
										<span className="text-sm text-gray-600">Descontos:</span>
										<span className="text-sm text-green-600">R$ 0,00</span>
									</div>
									
									<div className="flex justify-between text-lg font-bold border-t pt-3">
										<span>Total:</span>
										<span className="text-orange-500">
											{selectedShipping 
												? (() => {														// MODIFICADO: Usar manualSubtotal diretamente para cálculo mais preciso
														const baseValue = typeof manualSubtotal === 'number' ? manualSubtotal : 0;
														
														// Garantir que o frete seja um número válido
														const freightValue = typeof shippingCost === 'number' ? shippingCost : priceToNumber(shippingCost || 0);
														
														// Calcular total
														const calculatedTotal = baseValue + freightValue;
														console.log('[Checkout] 🧮 Cálculo total exibido:', {baseValue, freightValue, calculatedTotal});
														
														return formatPrice(calculatedTotal);
												  })()
												: getBestSubtotalFormatted()
											}
										</span>
									</div>
									
									{/* Opções de pagamento - MODIFICADAS para usar valor mais confiável */}
									<div className="mt-3 p-3 bg-gray-50 rounded-lg">
										<div className="text-xs text-gray-600">											<p>💳 À vista: <span className="font-medium text-green-600">
												{(() => {
													// Garantir que o valor seja calculado corretamente
													const baseValue = typeof manualSubtotal === 'number' ? manualSubtotal : 0;
													
													// Garantir que o frete seja um número válido
													const freightValue = typeof shippingCost === 'number' ? shippingCost : priceToNumber(shippingCost || 0);
													
													// Calcular total com desconto (8% à vista)
													const total = baseValue + freightValue;
													return formatPrice(total * 0.92);
												})()}											</span> (8% desc.)</p>
											<p>📅 Em 12x de <span className="font-medium">
												{(() => {
													const baseValue = typeof manualSubtotal === 'number' ? manualSubtotal : 0;
													const freightValue = typeof shippingCost === 'number' ? shippingCost : priceToNumber(shippingCost || 0);
													const total = baseValue + freightValue;
													return formatPrice(calculateInstallmentValue(total));
												})()}
											</span> com juros de {INSTALLMENT_INTEREST_RATE}% ao mês
											</p>
											<p className="text-sm text-gray-600">
												Total com juros: {' '}
												{(() => {
													const baseValue = typeof manualSubtotal === 'number' ? manualSubtotal : 0;
													const freightValue = typeof shippingCost === 'number' ? shippingCost : priceToNumber(shippingCost || 0);
													const total = baseValue + freightValue;
													return formatPrice(calculateTotalWithInterest(total));
												})()}
											</p>
										</div>
									</div>
								</div>
								
								{/* Formas de Pagamento - Movidas do formulário */}
								<div className="mt-6 pt-4 border-t border-gray-200">
									<h4 className="text-lg font-medium mb-4 flex items-center">
										💳 Formas de Pagamento
									</h4>									<div className="payment-methods">
										<div className="payment-option">
											<label>
												<input 
													type="radio" 
													name="paymentMethod" 
													value="infinitepay-checkout"
													defaultChecked
													onChange={(e) => handlePaymentSelection(e.target.value)}
												/>
												<div className="payment-info">
													<div className="payment-name">Infinitepay Checkout</div>
													<div className="payment-desc">PIX, Cartão de Crédito e Débito</div>
												</div>
												<span className="payment-badge">Recomendado</span>
											</label>
										</div>
										<div className="payment-option">
											<label>
												<input 
													type="radio" 
													name="paymentMethod" 
													value="cod" 
													onChange={(e) => handlePaymentSelection(e.target.value)}
												/>
												<div className="payment-info">
													<div className="payment-name">Pagamento na Entrega</div>
													<div className="payment-desc">Dinheiro ou cartão</div>
												</div>
											</label>
										</div>
									</div>
											{/* Botão de Finalizar Pedido */}
									{currentStep === 4 && (
										<div className="mt-6 pt-4 border-t border-gray-200">											<button
												onClick={handleFinalizePurchase}
												className={`finalize-order-btn ${!selectedPaymentMethod || isFinalizingOrder ? 'disabled' : ''}`}
												disabled={!selectedPaymentMethod || isFinalizingOrder}
											>
												{isFinalizingOrder ? (
													<LoadingSpinner size="small" />
												) : selectedPaymentMethod ? (
													<>
														<span>🚀</span>
														<span>Finalizar Pedido</span>
														<span>→</span>
													</>
												) : (
													<>
														<span>⚠️</span>
														<span>Selecione um método de pagamento</span>
													</>
												)}
											</button>
																	{selectedPaymentMethod && (
												<p className="text-center text-sm text-gray-500 mt-3">
													Você será redirecionado para finalizar o pagamento
												</p>
											)}
										</div>
									)}
								</div>
							</div>
						</div>
					</div>				</div>			</div>
		</Layout>
	);
};

export default Checkout;

export async function getStaticProps() {
	const { data } = await client.query({
		query: GET_COUNTRIES
	});

	return {
		props: {
			countriesData: data?.countries || []
		},
		revalidate: 600,
	};
}