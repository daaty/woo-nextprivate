import {useState, useContext, useEffect, useMemo, useCallback} from 'react';
import {useMutation, useQuery} from '@apollo/client';
import cx from 'classnames'

import YourOrder from "./YourOrder";
import PaymentModes from "./PaymentModes";
import { useCart } from "../../v2/cart/hooks/useCart";
import validateAndSanitizeCheckoutForm from '../../validator/checkout';
import {getFormattedCart, createCheckoutData,} from "../../functions";
import OrderSuccess from "./OrderSuccess";
import { GET_CART } from "../../queries/get-cart";
import CHECKOUT_MUTATION from "../../mutations/checkout";
import Address from "./Address";
import {
    handleBillingDifferentThanShipping,
    handleCreateAccount, handleStripeCheckout,
    setStatesForCountry
} from "../../utils/checkout";
import CheckboxField from "./form-elements/CheckboxField";
import CLEAR_CART_MUTATION from "../../mutations/clear-cart";
import SavedAddresses from './SavedAddresses';
import AdditionalDataModal from './AdditionalDataModal';

// Componente de spinner
const Spinner = () => (
  <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
);

/**
 * Calcular total do carrinho
 */
const calculateCartTotal = (cartItems) => {
    return cartItems.reduce((total, item) => {
        return total + (parseFloat(item.price) * parseInt(item.qty));
    }, 0);
};

const defaultCustomerInfo = {
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    country: 'BR', // Default para Brasil
    state: '',
    postcode: '',
    email: '',
    phone: '',
    company: '',
    errors: null
}

/**
 * Componente de formulário de checkout com suporte para usuários autenticados
 * Permite usar endereços salvos ou inserir novos endereços
 */
const CheckoutForm = ({countriesData, isUserLoggedIn = false, userData = null}) => {
    // Log para depuração
    console.log("[CheckoutForm] userData recebido:", userData);
    console.log("[CheckoutForm] Endereço de entrega:", userData?.shipping);
    console.log("[CheckoutForm] Endereço de cobrança:", userData?.billing);

    const {billingCountries, shippingCountries} = countriesData || {}

    // Inicializar state com dados do usuário se disponível
    const getUserData = () => {
        if (isUserLoggedIn && userData) {
            return {
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                // Outros campos podem ser adicionados à medida que estiverem disponíveis
                ...defaultCustomerInfo,
            }
        }
        return {...defaultCustomerInfo};
    }

    const initialState = {
        billing: getUserData(),
        shipping: getUserData(),
        createAccount: false,
        orderNotes: '',
        billingDifferentThanShipping: false,
        paymentMethod: 'cod',
        useShippingSaved: isUserLoggedIn, // Nova opção para usar endereço salvo
        useBillingSaved: isUserLoggedIn, // Nova opção para usar endereço de cobrança salvo
        selectedShippingAddress: null, // Endereço de entrega selecionado
        selectedBillingAddress: null, // Endereço de cobrança selecionado
    };
      const { cartItems, cartTotal, clearCart } = useCart();
    const [input, setInput] = useState(initialState);
    const [orderData, setOrderData] = useState(null);
    const [requestError, setRequestError] = useState(null);
    const [theShippingStates, setTheShippingStates] = useState([]);
    const [isFetchingShippingStates, setIsFetchingShippingStates] = useState(false);
    const [theBillingStates, setTheBillingStates] = useState([]);
    const [isFetchingBillingStates, setIsFetchingBillingStates] = useState(false);    const [isStripeOrderProcessing, setIsStripeOrderProcessing] = useState(false);
    const [createdOrderData, setCreatedOrderData] = useState({});
    const [showAdditionalDataModal, setShowAdditionalDataModal] = useState(false);
    const [additionalDataCallback, setAdditionalDataCallback] = useState(null);

    // Não precisamos mais buscar o carrinho aqui, pois agora ele vem do contexto
    // O CartContext já cuida da atualização dos dados

    // Create New order: Checkout Mutation.
    const [checkout, {
        data: checkoutResponse,
        loading: checkoutLoading,
    }] = useMutation(CHECKOUT_MUTATION, {
        variables: {
            input: orderData
        },
        onError: (error) => {
            if (error) {
                setRequestError(error?.graphQLErrors?.[0]?.message ?? '');
            }
        }
    });

    const [ clearCartMutation ] = useMutation( CLEAR_CART_MUTATION );
      // Track if user data has already been processed to prevent loops
    const [userDataProcessed, setUserDataProcessed] = useState(false);
      // Memoize user data to prevent unnecessary re-renders
    const memoizedUserData = useMemo(() => {
        if (!userData) return null;
        
        // Enhanced validation for incomplete data scenarios
        const validateAndFillAddress = (address, addressType = 'unknown') => {
            if (!address) return null;
            
            // Check for minimal required fields
            const hasMinimalData = address.firstName || address.address1 || address.city || address.postcode;
            if (!hasMinimalData) {
                console.log(`[CheckoutForm] ${addressType} address has no usable data`);
                return null;
            }
            
            // Fill in missing required fields with safe defaults
            return {
                firstName: address.firstName || '',
                lastName: address.lastName || '',
                email: address.email || userData?.email || '',
                address1: address.address1 || '',
                address2: address.address2 || '',
                city: address.city || '',
                state: address.state || '',
                postcode: address.postcode || '',
                country: address.country || 'BR',
                phone: address.phone || ''
            };
        };
        
        const processedShipping = validateAndFillAddress(userData.shipping, 'shipping');
        const processedBilling = validateAndFillAddress(userData.billing, 'billing');
        
        return {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            shipping: processedShipping,
            billing: processedBilling
        };
    }, [
        userData?.firstName, 
        userData?.lastName, 
        userData?.email, 
        userData?.shipping?.firstName,
        userData?.shipping?.address1,
        userData?.shipping?.city,
        userData?.shipping?.postcode,
        userData?.shipping?.state,
        userData?.shipping?.country,
        userData?.billing?.firstName,
        userData?.billing?.address1,
        userData?.billing?.city,
        userData?.billing?.postcode,
        userData?.billing?.state,
        userData?.billing?.country
    ]);    // Usar endereço salvo do usuário quando disponível e selecionado
    useEffect(() => {
        if (isUserLoggedIn && memoizedUserData && !userDataProcessed) {
            console.log("[CheckoutForm] Processando dados do usuário no useEffect");
            
            // Mark as processed to prevent re-runs
            setUserDataProcessed(true);
            
            // Pré-preencher campos de email e nome apenas se não estiverem preenchidos
            setInput(prevInput => {
                const needsUpdate = 
                    !prevInput.billing.firstName || 
                    !prevInput.billing.lastName || 
                    !prevInput.billing.email ||
                    !prevInput.shipping.firstName || 
                    !prevInput.shipping.lastName || 
                    !prevInput.shipping.email;
                
                if (!needsUpdate) return prevInput;
                
                return {
                    ...prevInput,
                    billing: {
                        ...prevInput.billing,
                        firstName: prevInput.billing.firstName || memoizedUserData.firstName || '',
                        lastName: prevInput.billing.lastName || memoizedUserData.lastName || '',
                        email: prevInput.billing.email || memoizedUserData.email || '',
                    },
                    shipping: {
                        ...prevInput.shipping,
                        firstName: prevInput.shipping.firstName || memoizedUserData.firstName || '',
                        lastName: prevInput.shipping.lastName || memoizedUserData.lastName || '',
                        email: prevInput.shipping.email || memoizedUserData.email || '',
                    }
                };
            });
            
            // Se o usuário tem endereços de entrega e cobrança salvos, use-os (com validação aprimorada)
            const hasValidShippingAddress = memoizedUserData.shipping && 
                (memoizedUserData.shipping.firstName || 
                 memoizedUserData.shipping.address1 || 
                 memoizedUserData.shipping.city ||
                 memoizedUserData.shipping.postcode);
                 
            const hasValidBillingAddress = memoizedUserData.billing && 
                (memoizedUserData.billing.firstName || 
                 memoizedUserData.billing.address1 || 
                 memoizedUserData.billing.city ||
                 memoizedUserData.billing.postcode);
            
            console.log("[CheckoutForm] Tem endereço de entrega válido?", hasValidShippingAddress);
            console.log("[CheckoutForm] Tem endereço de cobrança válido?", hasValidBillingAddress);
            
            // Show warning for incomplete address data
            if (memoizedUserData.shipping && !hasValidShippingAddress) {
                console.warn("[CheckoutForm] Dados de entrega incompletos detectados:", memoizedUserData.shipping);
            }
            
            if (memoizedUserData.billing && !hasValidBillingAddress) {
                console.warn("[CheckoutForm] Dados de cobrança incompletos detectados:", memoizedUserData.billing);
            }

            if (hasValidShippingAddress) {
                handleSavedShippingAddressSelect(memoizedUserData.shipping);
            }

            if (hasValidBillingAddress) {
                handleSavedBillingAddressSelect(memoizedUserData.billing);
            }
        }
    }, [isUserLoggedIn, memoizedUserData, userDataProcessed]);

    // Reset processed flag when user logs out
    useEffect(() => {
        if (!isUserLoggedIn) {
            setUserDataProcessed(false);
        }
    }, [isUserLoggedIn]);    /**
     * Manipula a seleção de um endereço de entrega salvo
     * @param {Object} address Endereço selecionado
     */
    const handleSavedShippingAddressSelect = useCallback((address) => {
        if (!address) return;
        
        // Enhanced validation for incomplete addresses
        const validateField = (value, fallback = '') => {
            return (value && value.trim() !== '') ? value : fallback;
        };
        
        // Extraindo número da rua do address1
        const addressParts = address.address1 ? address.address1.split(',') : ['', ''];
        const street = addressParts[0]?.trim() || '';
        const number = addressParts[1]?.trim() || '';
        
        setInput(prevInput => {
            // Prevent unnecessary updates if data is the same
            const currentShipping = prevInput.shipping;
            if (currentShipping.address1 === address.address1 && 
                currentShipping.firstName === address.firstName &&
                currentShipping.city === address.city) {
                return prevInput;
            }
            
            return {
                ...prevInput,
                shipping: {
                    ...prevInput.shipping,
                    firstName: validateField(address.firstName, prevInput.shipping.firstName),
                    lastName: validateField(address.lastName, prevInput.shipping.lastName),
                    address1: validateField(address.address1, prevInput.shipping.address1),
                    address2: validateField(address.address2, prevInput.shipping.address2),
                    city: validateField(address.city, prevInput.shipping.city),
                    state: validateField(address.state, prevInput.shipping.state),
                    postcode: validateField(address.postcode, prevInput.shipping.postcode),
                    country: validateField(address.country, 'BR'),
                    email: validateField(address.email, prevInput.shipping.email),
                    phone: validateField(address.phone, prevInput.shipping.phone),
                    // Campos adicionais para formulário brasileiro
                    street: validateField(street, prevInput.shipping.street),
                    number: validateField(number, prevInput.shipping.number),
                },
                selectedShippingAddress: address
            };
        });
    }, []);

    /**
     * Manipula a seleção de um endereço de cobrança salvo
     * @param {Object} address Endereço selecionado
     */
    const handleSavedBillingAddressSelect = useCallback((address) => {
        if (!address) return;
        
        // Extraindo número da rua do address1
        const addressParts = address.address1 ? address.address1.split(',') : ['', ''];
        const street = addressParts[0]?.trim() || '';
        const number = addressParts[1]?.trim() || '';
        
        setInput(prevInput => {
            // Prevent unnecessary updates if data is the same
            const currentBilling = prevInput.billing;
            if (currentBilling.address1 === address.address1 && 
                currentBilling.firstName === address.firstName &&
                currentBilling.city === address.city) {
                return prevInput;
            }
            
            return {
                ...prevInput,
                billing: {
                    ...prevInput.billing,
                    firstName: address.firstName || prevInput.billing.firstName,
                    lastName: address.lastName || prevInput.billing.lastName,
                    address1: address.address1 || prevInput.billing.address1,
                    address2: address.address2 || prevInput.billing.address2,
                    city: address.city || prevInput.billing.city,
                    state: address.state || prevInput.billing.state,
                    postcode: address.postcode || prevInput.billing.postcode,
                    country: address.country || 'BR',
                    // Campos adicionais para formulário brasileiro
                    street: street || prevInput.billing.street,
                    number: number || prevInput.billing.number,
                },
                selectedBillingAddress: address
            };        });
    }, []);

    /**
     * Handle form submit.
     */
    const handleFormSubmit = async (event) => {
        event.preventDefault();

        // Validação dos endereços
        const billingValidationResult = input?.billingDifferentThanShipping ? validateAndSanitizeCheckoutForm(input?.billing, theBillingStates?.length) : {errors: null, isValid: true};
        const shippingValidationResult = validateAndSanitizeCheckoutForm(input?.shipping, theShippingStates?.length);

        if (!shippingValidationResult.isValid || !billingValidationResult.isValid) {
            setInput({
                ...input,
                billing: {...input.billing, errors: billingValidationResult.errors},
                shipping: {...input.shipping, errors: shippingValidationResult.errors}
            });            return;
        }

        // Verificar se é um pagamento Infinitepay - Redirecionamento para páginas específicas
        if (input.paymentMethod === 'infinitepay-checkout') {
            try {
                setIsStripeOrderProcessing(true);                // Função para extrair CPF do usuário autenticado
                const extractCpfFromUserData = () => {
                    console.log('[CheckoutForm] Iniciando extração de CPF. userData:', userData);
                    
                    if (!userData) {
                        console.log('[CheckoutForm] userData é null/undefined');
                        return null;
                    }
                    
                    // Tentar extrair CPF de diferentes locais
                    let cpf = null;
                    
                    // 1. Tentar pegar CPF do billing
                    if (userData.billing?.cpf) {
                        cpf = userData.billing.cpf;
                        console.log('[CheckoutForm] CPF encontrado em userData.billing.cpf:', cpf);
                    }
                    
                    // 2. Tentar pegar CPF do rawMetaData
                    if (!cpf && userData.rawMetaData) {
                        console.log('[CheckoutForm] Verificando rawMetaData:', userData.rawMetaData);
                        
                        if (Array.isArray(userData.rawMetaData)) {
                            const cpfMeta = userData.rawMetaData.find(meta => meta.key === 'cpf');
                            if (cpfMeta && cpfMeta.value) {
                                cpf = cpfMeta.value;
                                console.log('[CheckoutForm] CPF encontrado no array rawMetaData:', cpf);
                            }
                        } else if (typeof userData.rawMetaData === 'string') {
                            cpf = userData.rawMetaData;
                            console.log('[CheckoutForm] CPF encontrado como string em rawMetaData:', cpf);
                        } else if (userData.rawMetaData.cpf) {
                            cpf = userData.rawMetaData.cpf;
                            console.log('[CheckoutForm] CPF encontrado em rawMetaData.cpf:', cpf);
                        }
                    }
                    
                    // 3. Tentar pegar CPF direto do user
                    if (!cpf && userData.cpf) {
                        cpf = userData.cpf;
                        console.log('[CheckoutForm] CPF encontrado em userData.cpf:', cpf);
                    }
                    
                    // Limpar CPF (apenas números)
                    if (cpf && typeof cpf === 'string') {
                        cpf = cpf.replace(/\D/g, '');
                        if (cpf.length === 11) {
                            console.log('[CheckoutForm] CPF válido extraído:', cpf);
                            return cpf;
                        } else {
                            console.log('[CheckoutForm] CPF com tamanho inválido:', cpf, 'tamanho:', cpf.length);
                        }
                    }
                    
                    console.log('[CheckoutForm] Nenhum CPF válido encontrado nos dados do usuário');
                    return null;
                };                // Função para extrair telefone do usuário autenticado
                const extractPhoneFromUserData = () => {
                    console.log('[CheckoutForm] Iniciando extração de telefone. userData:', userData);
                    
                    if (!userData) {
                        console.log('[CheckoutForm] userData é null/undefined');
                        return null;
                    }
                    
                    // Tentar extrair telefone de diferentes locais
                    let phone = null;
                    
                    // 1. Tentar pegar telefone do billing
                    if (userData.billing?.phone) {
                        phone = userData.billing.phone;
                        console.log('[CheckoutForm] Telefone encontrado em userData.billing.phone:', phone);
                    }
                    
                    // 2. Tentar pegar telefone do shipping
                    if (!phone && userData.shipping?.phone) {
                        phone = userData.shipping.phone;
                        console.log('[CheckoutForm] Telefone encontrado em userData.shipping.phone:', phone);
                    }
                      // 3. Tentar pegar telefone do metaData
                    if (!phone && Array.isArray(userData.metaData)) {
                        console.log('[CheckoutForm] Verificando metaData para telefone:', userData.metaData);
                        const phoneMeta = userData.metaData.find(meta => 
                            meta.key === 'phone' || 
                            meta.key === 'telefone' || 
                            meta.key === 'billing_phone' ||
                            meta.key === 'shipping_phone' ||
                            meta.key === '_billing_phone' ||
                            meta.key === '_shipping_phone' ||
                            meta.key.includes('phone') ||
                            meta.key.includes('telefone')
                        );
                        if (phoneMeta && phoneMeta.value) {
                            phone = phoneMeta.value;
                            console.log('[CheckoutForm] Telefone encontrado no metaData:', phone);
                        }
                    }
                    
                    // 4. Tentar pegar telefone do rawMetaData
                    if (!phone && userData.rawMetaData) {
                        console.log('[CheckoutForm] Verificando rawMetaData para telefone:', userData.rawMetaData);
                        if (Array.isArray(userData.rawMetaData)) {
                            const phoneMeta = userData.rawMetaData.find(meta => 
                                meta.key === 'phone' || 
                                meta.key === 'telefone' || 
                                meta.key === 'billing_phone' ||
                                meta.key === 'shipping_phone' ||
                                meta.key === '_billing_phone' ||
                                meta.key === '_shipping_phone' ||
                                meta.key.includes('phone') ||
                                meta.key.includes('telefone')
                            );
                            if (phoneMeta && phoneMeta.value) {
                                phone = phoneMeta.value;
                                console.log('[CheckoutForm] Telefone encontrado no array rawMetaData:', phone);
                            }
                        } else if (typeof userData.rawMetaData === 'string' && userData.rawMetaData.match(/^\d{10,11}$/)) {
                            // Se rawMetaData é uma string que parece ser um telefone
                            phone = userData.rawMetaData;
                            console.log('[CheckoutForm] Telefone encontrado como string em rawMetaData:', phone);
                        } else if (userData.rawMetaData.phone) {
                            phone = userData.rawMetaData.phone;
                            console.log('[CheckoutForm] Telefone encontrado em rawMetaData.phone:', phone);
                        }
                    }
                    
                    // 5. Tentar pegar telefone direto do user
                    if (!phone && userData.phone) {
                        phone = userData.phone;
                        console.log('[CheckoutForm] Telefone encontrado em userData.phone:', phone);
                    }
                    
                    // Limpar telefone (apenas números)
                    if (phone && typeof phone === 'string') {
                        phone = phone.replace(/\D/g, '');
                        if (phone.length >= 10) {
                            console.log('[CheckoutForm] Telefone válido extraído:', phone);
                            return phone;
                        } else {
                            console.log('[CheckoutForm] Telefone com tamanho inválido:', phone, 'tamanho:', phone.length);
                        }
                    }
                    
                    console.log('[CheckoutForm] Nenhum telefone válido encontrado nos dados do usuário');
                    return null;
                };                // Extrair CPF do usuário
                const userCpf = extractCpfFromUserData();
                
                // Extrair telefone do usuário
                const userPhone = extractPhoneFromUserData();
                
                console.log('[CheckoutForm] Resultado da extração de telefone:', userPhone);
                console.log('[CheckoutForm] userData completo para debug:', userData);                // Preparar dados do pedido
                const orderData = {
                    paymentMethod: input.paymentMethod,
                    shipping: input.shipping, // Passar endereço diretamente
                    shippingOption: props.selectedShipping,
                    shippingCost: props.shippingCost || 0,                    items: cartItems.map(item => ({
                        ...item,
                        price: parseFloat(item.price || item.subtotal || 0)
                    })),
                    total: parseFloat(cartTotal || 0) + (props.shippingCost || 0),
                    customer: {
                        email: input.shipping.email || input.billing?.email,
                        name: `${input.shipping.firstName || ''} ${input.shipping.lastName || ''}`.trim(),
                        firstName: input.shipping.firstName,
                        lastName: input.shipping.lastName,
                        phone: userPhone || input.shipping.phone || input.billing?.phone || '',
                        cpf: userCpf || input.shipping.cpf || input.billing?.cpf || '11144477735', // Priorizar CPF do usuário autenticado
                        rawMetaData: userData?.rawMetaData // Incluir rawMetaData para o backend
                    }
                };

                // Verificar se CPF e telefone estão preenchidos adequadamente
                const needsCpf = !orderData.customer.cpf || orderData.customer.cpf === '00000000000' || orderData.customer.cpf === '11144477735';
                const needsPhone = !orderData.customer.phone || orderData.customer.phone.length < 10;
                
                if (needsCpf || needsPhone) {
                    // Mostrar modal para coletar dados adicionais
                    setIsStripeOrderProcessing(false);
                    setShowAdditionalDataModal(true);
                    setAdditionalDataCallback(() => async (additionalData) => {
                        // Atualizar dados do cliente com as informações coletadas
                        const updatedOrderData = {
                            ...orderData,
                            customer: {
                                ...orderData.customer,
                                cpf: additionalData.cpf || orderData.customer.cpf,
                                phone: additionalData.phone || orderData.customer.phone,
                                document: additionalData.cpf || orderData.customer.cpf
                            }                        };
                        
                        // PagBank removido - usar apenas Infinitepay
                        console.log('[Checkout] PagBank foi removido, use Infinitepay');
                        setRequestError('Método de pagamento não disponível. Use PIX via Infinitepay.');
                        setIsStripeOrderProcessing(false);
                        return;
                    });
                    return;
                }

                // PagBank removido - usar apenas Infinitepay
                console.log('[Checkout] PagBank foi removido, use Infinitepay');
                setRequestError('Método de pagamento não disponível. Use PIX via Infinitepay.');
                setIsStripeOrderProcessing(false);
                return;
                
            } catch (error) {
                console.error('[Checkout] Erro no checkout (PagBank removido):', error);
                setRequestError('Método de pagamento não disponível. Use PIX via Infinitepay.');
                setIsStripeOrderProcessing(false);
                return;
            }
        }if ('stripe-mode' === input.paymentMethod) {
            const createdOrderData = await handleStripeCheckout(input, cartItems, setRequestError, clearCartMutation, setIsStripeOrderProcessing, setCreatedOrderData);
        	return null;
        }

        const checkOutData = createCheckoutData(input);
        setRequestError(null);
        setOrderData(checkOutData);
    };

    /**
     * Handle toggle para usar endereço salvo ou inserir novo
     */
    const handleToggleUseSavedAddress = (type) => {
        if (type === 'shipping') {
            setInput({
                ...input,
                useShippingSaved: !input.useShippingSaved
            });
        } else {
            setInput({
                ...input,
                useBillingSaved: !input.useBillingSaved
            });
        }
    };

    /**
     * Handle onchange input.
     */
    const handleOnChange = async (event, isShipping = false, isBillingOrShipping = false) => {
        const {target} = event || {};

        if ('createAccount' === target.name) {
            handleCreateAccount(input, setInput, target)
        } else if ('billingDifferentThanShipping' === target.name) {
            handleBillingDifferentThanShipping(input, setInput, target);
        } else if (isBillingOrShipping) {
            if (isShipping) {
                await handleShippingChange(target)
            } else {
                await handleBillingChange(target)
            }
        } else {
            const newState = {...input, [target.name]: target.value};
            setInput(newState);
        }
    };

    const handleShippingChange = async (target) => {
        const newState = {...input, shipping: {...input?.shipping, [target.name]: target.value}};
        setInput(newState);
        await setStatesForCountry(target, setTheShippingStates, setIsFetchingShippingStates);
    }

    const handleBillingChange = async (target) => {
        const newState = {...input, billing: {...input?.billing, [target.name]: target.value}};
        setInput(newState);
        await setStatesForCountry(target, setTheBillingStates, setIsFetchingBillingStates);
    }

    useEffect(() => {
        if (null !== orderData) {
            // Call the checkout mutation when the value for orderData changes/updates.
            checkout();
        }
    }, [orderData]);

    // Loading state
    const isOrderProcessing = checkoutLoading || isStripeOrderProcessing;

    return (
        <>
            {cartItems && cartItems.length > 0 ? (
                <form onSubmit={handleFormSubmit} className="woo-next-checkout-form">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Coluna da Esquerda - Formulários de endereço */}
                        <div className="shipping-billing-details">
                            {/* Dados de Entrega */}
                            <div className="shipping-details mb-8 bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-xl font-medium mb-4 flex items-center">
                                    <span className="mr-2 text-orange-500">📦</span>
                                    Dados de Entrega
                                </h2>
                                
                                {/* Toggle para usuários autenticados */}
                                {isUserLoggedIn && (
                                    <div className="mb-6">
                                        <div className="flex items-center mb-4">
                                            <input
                                                id="use-shipping-saved"
                                                type="checkbox"
                                                checked={input.useShippingSaved}
                                                onChange={() => handleToggleUseSavedAddress('shipping')}
                                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="use-shipping-saved" className="ml-2 block text-sm text-gray-700">
                                                Usar endereço de entrega salvo
                                            </label>
                                        </div>
                                        
                                        {input.useShippingSaved && userData?.shipping && (userData.shipping.firstName || userData.shipping.address1) && (
                                            <SavedAddresses
                                                addresses={[userData.shipping]}
                                                selectedAddress={input.selectedShippingAddress}
                                                onSelectAddress={handleSavedShippingAddressSelect}
                                            />
                                        )}
                                        
                                        {input.useShippingSaved && (!userData?.shipping || !userData.shipping.firstName && !userData.shipping.address1) && (
                                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                                <p className="text-yellow-700 text-sm">
                                                    Você ainda não tem endereços de entrega salvos. Por favor, preencha o formulário abaixo.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Formulário de endereço de entrega */}
                                {(!isUserLoggedIn || !input.useShippingSaved || !userData?.shipping) && (
                                    <Address
                                        states={theShippingStates}
                                        countries={shippingCountries}
                                        input={input?.shipping}
                                        handleOnChange={(event) => handleOnChange(event, true, true)}
                                        isFetchingStates={isFetchingShippingStates}
                                        isShipping
                                        isBillingOrShipping
                                    />
                                )}
                            </div>
                            
                            {/* Opção para endereço de cobrança diferente */}
                            <div className="mb-6">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <CheckboxField
                                        name="billingDifferentThanShipping"
                                        type="checkbox"
                                        checked={input?.billingDifferentThanShipping}
                                        handleOnChange={handleOnChange}
                                        label="Endereço de cobrança diferente do endereço de entrega"
                                        containerClassNames="flex items-center"
                                    />
                                </div>
                            </div>
                            
                            {/* Dados de Cobrança */}
                            {input?.billingDifferentThanShipping && (
                                <div className="billing-details mb-8 bg-white p-6 rounded-lg shadow-sm">
                                    <h2 className="text-xl font-medium mb-4 flex items-center">
                                        <span className="mr-2 text-orange-500">📝</span>
                                        Dados de Cobrança
                                    </h2>
                                    
                                    {/* Toggle para usuários autenticados */}
                                    {isUserLoggedIn && (
                                        <div className="mb-6">
                                            <div className="flex items-center mb-4">
                                                <input
                                                    id="use-billing-saved"
                                                    type="checkbox"
                                                    checked={input.useBillingSaved}
                                                    onChange={() => handleToggleUseSavedAddress('billing')}
                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="use-billing-saved" className="ml-2 block text-sm text-gray-700">
                                                    Usar endereço de cobrança salvo
                                                </label>
                                            </div>
                                            
                                            {input.useBillingSaved && userData?.billing && (userData.billing.firstName || userData.billing.address1) && (
                                                <SavedAddresses
                                                    addresses={[userData.billing]}
                                                    selectedAddress={input.selectedBillingAddress}
                                                    onSelectAddress={handleSavedBillingAddressSelect}
                                                />
                                            )}
                                            
                                            {input.useBillingSaved && (!userData?.billing || !userData.billing.firstName && !userData.billing.address1) && (
                                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                                    <p className="text-yellow-700 text-sm">
                                                        Você ainda não tem endereços de cobrança salvos. Por favor, preencha o formulário abaixo.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Formulário de endereço de cobrança */}
                                    {(!isUserLoggedIn || !input.useBillingSaved || !userData?.billing) && (
                                        <Address
                                            states={theBillingStates}
                                            countries={billingCountries}
                                            input={input?.billing}
                                            handleOnChange={(event) => handleOnChange(event, false, true)}
                                            isFetchingStates={isFetchingBillingStates}
                                            isShipping={false}
                                            isBillingOrShipping
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Coluna da Direita - Resumo e Pagamento */}
                        <div className="your-orders">                            {/* Resumo do Pedido movido para sidebar - seção removida */}
                            
                            {/* Removido: Formas de Pagamento - movidas para sidebar */}
                              {/* Botão de Finalizar Pedido removido - funcionalidade movida para sidebar */}

                            {/* Mensagens de erro */}
                            {requestError && (
                                <div className="mt-4 bg-red-50 p-4 rounded-md border-l-4 border-red-500">
                                    <p className="text-red-700">Erro: {requestError}</p>
                                    <p className="text-sm text-red-600 mt-1">Por favor, tente novamente ou entre em contato conosco.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            ) : (
                <div className="text-center py-8">
                    <p className="text-lg text-gray-600">Seu carrinho está vazio. Adicione produtos para finalizar a compra.</p>
                    <a href="/" className="mt-4 inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
                        Continuar comprando
                    </a>
                </div>            )}
            
            {/* Modal de Dados Adicionais */}
            <AdditionalDataModal
                isOpen={showAdditionalDataModal}
                onClose={() => {
                    setShowAdditionalDataModal(false);
                    setAdditionalDataCallback(null);
                }}
                onSubmit={async (additionalData) => {
                    if (additionalDataCallback) {
                        await additionalDataCallback(additionalData);
                    }
                }}                initialData={{
                    cpf: (() => {
                        // Tentar extrair CPF do userData primeiro
                        if (userData?.billing?.cpf) return userData.billing.cpf;
                        if (userData?.rawMetaData?.cpf) return userData.rawMetaData.cpf;
                        if (userData?.rawMetaData && typeof userData.rawMetaData === 'string') return userData.rawMetaData;
                        if (userData?.cpf) return userData.cpf;
                        // Fallback para input fields
                        return input.shipping.cpf || input.billing?.cpf || '';
                    })(),
                    phone: (() => {
                        // Tentar extrair telefone do userData primeiro
                        if (userData?.billing?.phone) return userData.billing.phone;
                        if (userData?.shipping?.phone) return userData.shipping.phone;
                        // Fallback para input fields
                        return input.shipping.phone || input.billing?.phone || '';
                    })()
                }}
            />
            
            {/* Show message if Order Success */}
            <OrderSuccess response={checkoutResponse} />
        </>
    );
};

export default CheckoutForm;
