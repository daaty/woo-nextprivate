import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../src/components/Layout';
import SEO from '../src/components/seo/SEO';
import { useAuth } from '../src/hooks/useAuth'; // Importando o hook de autenticação
import { useCartWithFallback as useCart } from '../src/hooks/useCartWithFallback'; // Agora usa Cart v2 com fallback
import { useNotification } from '../src/components/ui/Notification'; // Importando o sistema de notificações
import { formatPrice, priceToNumber } from '../src/utils/format-price';

// Importar CartStateManager para monitorar o estado
import dynamic from 'next/dynamic';
import { 
  getBestSubtotalValue, 
  calculateCartSubtotal, 
  formatPrice as safeFormatPrice 
} from '../src/utils/cart-utils';
import { handleCartError } from '../src/middleware/cart-error-handler';

// Carregamento dinâmico para evitar problemas de SSR
const CartStateManager = dynamic(
  () => import('../src/components/cart/CartStateManager'),
  { ssr: false }
);

// Componentes auxiliares (Debug, ícones, etc.)
const DebugData = ({ title, data }) => (
  <div className="bg-gray-100 p-2 mb-4 rounded text-xs">
    <p className="font-bold">{title}</p>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>
);

const Spinner = () => (
  <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
);

// Ícones simplificados
const TrashIcon = () => <span className="text-red-600">🗑️</span>;
const ArrowIcon = () => <span>←</span>;
const LockIcon = () => <span>🔒</span>;
const RefreshIcon = () => <span>🔄</span>;
const CreditCardIcon = () => <span>💳</span>;
const CheckIcon = () => <span className="text-green-500">✓</span>;
const PlusIcon = () => <span>+</span>;

// Placeholders e constantes
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGRjY5MDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCI+UHJvZHV0bzwvdGV4dD48L3N2Zz4=';

// Cache para armazenar slugs de produtos já buscados (mesma lógica das páginas de marca)
const productSlugCache = {};

// Função para buscar o slug correto do produto usando a mesma API das páginas de marca
const fetchProductSlug = async (productId) => {
  // Verificar se já temos o slug em cache
  if (productSlugCache[productId]) {
    console.log(`🎯 [Slug Cache] Usando slug em cache para ID ${productId}:`, productSlugCache[productId]);
    return productSlugCache[productId];
  }
  
  try {
    console.log(`🔍 [Slug Fetch] Buscando slug para produto ID: ${productId}`);
    const response = await fetch(`/api/products?id=${productId}`);
    
    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }
    
    const data = await response.json();
    const productsArray = Array.isArray(data) ? data : data.products || [];
    const product = productsArray.find(p => p.id === productId || p.databaseId === productId);
    
    if (product && product.slug) {
      // Armazenar no cache para uso futuro
      productSlugCache[productId] = product.slug;
      console.log(`✅ [Slug Fetch] Slug encontrado para ID ${productId}:`, product.slug);
      return product.slug;
    } else {
      console.warn(`⚠️ [Slug Fetch] Produto não encontrado ou sem slug para ID: ${productId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ [Slug Fetch] Erro ao buscar slug para ID ${productId}:`, error);
    return null;
  }
};

const Cart = () => {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth(); // Obtendo informações de autenticação
  const [debug, setDebug] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);
  const [zipCode, setZipCode] = useState('');
  const [showDeliveryField, setShowDeliveryField] = useState(false);
  const [showCouponField, setShowCouponField] = useState(false);
  const [couponCode, setCouponCode] = useState(''); 
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false); // Estado para controlar o modal de login
  const [shippingError, setShippingError] = useState(null); // Estado para controlar erros de cálculo de frete
  const couponRef = useRef(null);
  const notificationMessageShown = useRef(false);
  
  // ADICIONADO: Novos estados para calcular valores com precisão
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [hasFreightFree, setHasFreightFree] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  // Manual total calculation for better precision
  const [manualSubtotal, setManualSubtotal] = useState(0);
  
  // Estado para armazenar slugs dos produtos do carrinho
  const [productSlugs, setProductSlugs] = useState({});
  
  // Constantes de configuração - Usando variáveis de ambiente
  const FREE_SHIPPING_THRESHOLD = 199;
  const MAX_INSTALLMENTS = process.env.NEXT_PUBLIC_MAX_INSTALLMENTS ? parseInt(process.env.NEXT_PUBLIC_MAX_INSTALLMENTS) : 12;
  const INSTALLMENT_INTEREST_RATE = process.env.NEXT_PUBLIC_INSTALLMENT_INTEREST_RATE ? parseFloat(process.env.NEXT_PUBLIC_INSTALLMENT_INTEREST_RATE) : 1.99;
  const CASH_PAYMENT_DISCOUNT_PERCENT = process.env.NEXT_PUBLIC_CASH_PAYMENT_DISCOUNT ? parseFloat(process.env.NEXT_PUBLIC_CASH_PAYMENT_DISCOUNT) : 8;
  const CASH_PAYMENT_MULTIPLIER = (100 - CASH_PAYMENT_DISCOUNT_PERCENT) / 100;

  // Função para calcular valor da parcela com juros
  const calculateInstallmentValue = (total) => {
    const rate = INSTALLMENT_INTEREST_RATE / 100;
    const coefficient = (rate * Math.pow(1 + rate, MAX_INSTALLMENTS)) / (Math.pow(1 + rate, MAX_INSTALLMENTS) - 1);
    const installmentValue = total * coefficient;
    return installmentValue;
  };

  // Função para calcular valor total com juros
  const calculateTotalWithInterest = (total) => {
    return calculateInstallmentValue(total) * MAX_INSTALLMENTS;
  };
  
  // Use nosso sistema de notificações personalizado
  const { notification } = useNotification();
  
  // MELHORADO: Obter mais valores do contexto do carrinho
  const { 
    loading, 
    error, 
    cartItems,
    cartTotal,
    formattedTotal,
    subtotal,  // Novo campo adicionado no contexto
    formattedSubtotal, // Novo campo formatado adicionado no contexto
    updateCartItem, 
    removeCartItem, 
    clearCart, 
    operationInProgress,
    contextReady, // Se o contexto está pronto
    refetchCart
  } = useCart(); // Agora é REST puro!
  // 🔧 FIX: Estados para resolver problema de hidratação e cache
  const [hydrated, setHydrated] = useState(false);
  const [clientCartItems, setClientCartItems] = useState([]);
    // 🔧 FIX: Hidratação adequada para evitar problemas de SSR
  useEffect(() => {
    setHydrated(true);
    
    // CORRIGIDO: Verificar Cart v2 session storage em vez do localStorage v1
    if (typeof window !== 'undefined') {
      try {
        // Primeiro, tentar verificar se há dados do Cart v2
        const cartV2SessionId = localStorage.getItem('cart_v2_session_id');
        if (cartV2SessionId) {
          console.log('[Cart Fix] Cart v2 session ID encontrado:', cartV2SessionId);
          // Carregar dados do Cart v2 via API
          fetch('/api/v2/cart', {
            headers: {
              'X-Cart-Session-Id': cartV2SessionId
            }
          })
          .then(response => response.json())
          .then(data => {
            if (data.success && data.items && data.items.length > 0) {
              console.log('[Cart Fix] Cart v2 items carregados via API:', data.items.length);
              // Os items serão carregados pelo contexto, não precisamos setar aqui
            }
          })
          .catch(error => {
            console.warn('[Cart Fix] Erro ao carregar Cart v2 via API:', error);
          });
        } else {
          // Fallback: verificar localStorage v1 antigo (apenas para debug)
          const storedCart = localStorage.getItem('woo-next-cart');
          if (storedCart) {
            console.log('[Cart Fix] Detectado carrinho v1 antigo, mas estamos usando v2');
          }
        }
      } catch (error) {
        console.warn('[Cart Fix] Erro ao verificar storage:', error);
      }
    }
  }, []);
    // 🔧 FIX: Sincronizar cart items do contexto com estado local
  useEffect(() => {
    if (contextReady && Array.isArray(cartItems)) {
      // Deep comparison
      const hasChanges = JSON.stringify(cartItems) !== JSON.stringify(clientCartItems);
      if (hasChanges) {
        console.log('[Cart] Detectada mudança nos itens, atualizando estado local');
        setClientCartItems(cartItems);
        // Também atualiza o subtotal
        const newSubtotal = calculateCartSubtotal(cartItems);
        setManualSubtotal(newSubtotal);
      }
    }
  }, [contextReady, cartItems, clientCartItems]);
  
  // 🔧 FIX: Carregar slugs corretos dos produtos (mesma lógica das páginas de marca)
  useEffect(() => {
    const loadProductSlugs = async () => {
      if (!cartItems || cartItems.length === 0) return;
      
      console.log('🔍 [Product Slugs] Carregando slugs para produtos do carrinho...');
      const newSlugs = {};
      
      for (const item of cartItems) {
        if (item.productId && !productSlugs[item.productId]) {
          const slug = await fetchProductSlug(item.productId);
          if (slug) {
            newSlugs[item.productId] = slug;
          }
        }
      }
      
      if (Object.keys(newSlugs).length > 0) {
        console.log('✅ [Product Slugs] Slugs carregados:', newSlugs);
        setProductSlugs(prevSlugs => ({ ...prevSlugs, ...newSlugs }));
      }
    };
    
    loadProductSlugs();
  }, [cartItems]);
    // 🔧 FIX: Sistema de recuperação de carrinho melhorado para Cart v2
  useEffect(() => {
    if (!hydrated) return;
    
    const recoverCart = async () => {
      // Se o contexto está pronto mas não temos items, tentar recuperar
      if (contextReady && (!cartItems || cartItems.length === 0)) {
        const sessionId = localStorage.getItem('cart_v2_session_id');
        
        if (sessionId && refetchCart) {
          console.log('[Cart Fix] Recuperando carrinho v2 para session:', sessionId);
          await refetchCart();
        } else if (sessionId) {
          console.log('[Cart Fix] Session ID encontrado mas refetchCart não disponível');
        } else {
          console.log('[Cart Fix] Nenhuma session v2 encontrada');
        }
      }
    };
    
    const timer = setTimeout(recoverCart, 100);
    return () => clearTimeout(timer);
  }, [hydrated, contextReady, cartItems, refetchCart]);

  // Funções para controlar a visibilidade dos campos de frete e cupom
  const toggleDeliveryField = () => setShowDeliveryField(!showDeliveryField);
  const toggleCouponField = () => setShowCouponField(!showCouponField);

  // Carregar CEP salvo anteriormente
  useEffect(() => {
    const savedZipCode = localStorage.getItem('user_zip_code');
    if (savedZipCode) {
      setZipCode(savedZipCode);
    }
    
    // Exibir uma mensagem de boas-vindas ao carrinho apenas uma vez
    if (!notificationMessageShown.current) {
      setTimeout(() => {        notification.info(`${Array.isArray(clientCartItems) ? clientCartItems.length : 0} itens no carrinho`);
        notificationMessageShown.current = true;
      }, 500);
    }    }, [notification, clientCartItems]);
    // ADICIONADO: Efeito para verificar se o valor da compra qualifica para frete grátis
  useEffect(() => {
    // Se temos valor do carrinho válido, verifica limite para frete grátis
    // Primeiro verificamos se o cartTotal é válido
    if (cartTotal && !isNaN(parseFloat(cartTotal))) {
      setHasFreightFree(parseFloat(cartTotal) >= FREE_SHIPPING_THRESHOLD);
    } else if (window._fixedCartTotal !== undefined) {
      // Se o cartTotal for inválido mas temos um valor substituto calculado, usamos ele
      setHasFreightFree(window._fixedCartTotal >= FREE_SHIPPING_THRESHOLD);
    } else if (manualSubtotal && !isNaN(manualSubtotal)) {
      // Terceira opção: usar o subtotal calculado manualmente
      setHasFreightFree(manualSubtotal >= FREE_SHIPPING_THRESHOLD);
    }
  }, [cartTotal, manualSubtotal]);
  // ADICIONADO: Efeito para atualizar o custo do frete quando uma opção é selecionada
  useEffect(() => {
    if (selectedShipping) {
      const selectedOption = shippingOptions.find(option => option.id === selectedShipping);
      if (selectedOption) {
        // Garantir que o valor do frete seja um número
        let freightValue = 0;
        
        if (typeof selectedOption.price === 'number') {
          freightValue = selectedOption.price;
        } else if (typeof selectedOption.price === 'string') {
          // Limpar a string e garantir que estamos convertendo para número corretamente
          const cleanPrice = selectedOption.price.replace(/[^\d.,\-]/g, '').replace(',', '.');
          freightValue = parseFloat(cleanPrice || '0');
          
          // Verificar se o valor é um número válido
          if (isNaN(freightValue)) {
            console.error('Valor de frete inválido após conversão:', selectedOption.price, cleanPrice, freightValue);
            freightValue = 0;
          }
        }
        
        console.log('Atualizando custo de frete para:', freightValue, 'tipo:', typeof freightValue);
        setShippingCost(freightValue);
      } else {
        console.log('Opção de frete selecionada não encontrada');
        setShippingCost(0);
      }
    } else {
      setShippingCost(0);
    }
  }, [selectedShipping, shippingOptions]);
  // Efeito para atualizar o status do botão de finalização quando o frete for selecionado
  useEffect(() => {
    if (selectedShipping) {
      const checkoutBtn = document.querySelector('.bt-checkout');
      if (checkoutBtn) {
        checkoutBtn.classList.add('animate-pulse');
        setTimeout(() => {
          checkoutBtn.classList.remove('animate-pulse');
        }, 2000);
      }
    }
  }, [selectedShipping]);
    // Efeito para validar o cartTotal e garantir que é um número válido
  useEffect(() => {
    if (cartTotal !== undefined && cartTotal !== null) {
      const parsedTotal = parseFloat(cartTotal);
      if (isNaN(parsedTotal)) {
        console.log('Detectado cartTotal NaN:', cartTotal);
        // Tentar usar o subtotal manual calculado se disponível
        if (manualSubtotal && !isNaN(manualSubtotal)) {
          console.log('Usando manualSubtotal para correção:', manualSubtotal);
          // Criar uma variável local que substitui o cartTotal inválido para usar nos cálculos
          window._fixedCartTotal = manualSubtotal;
        }
      } else {
        // Limpar a variável de substituição se o cartTotal for válido
        window._fixedCartTotal = undefined;
      }
    }
  }, [cartTotal, manualSubtotal]);

  // Timeout de segurança e demais efeitos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 3000); 
    
    return () => clearTimeout(timer);
  }, []);  // Efeito para sair do estado de carregamento quando os itens estiverem disponíveis
  useEffect(() => {
    // REMOVIDO: Log excessivo que causava spam
    // console.log('CartContext data:', { loading, error, cartItems: cartItems || [], cartTotal });
    
    if (Array.isArray(cartItems) || loading === false) {
      setIsInitialLoading(false);
    }
    
    // Verificar se temos uma sessão de carrinho no localStorage mas sem itens no carrinho
    // Isso pode indicar que o carrinho não foi carregado corretamente
    if (typeof window !== 'undefined' && 
        localStorage.getItem('cart_session_id') && 
        Array.isArray(cartItems) && 
        cartItems.length === 0 && 
        !loading) {
      
      // REMOVIDO: Log excessivo
      // console.log('[Cart] Detectada possível desincronização do carrinho. Forçando refresh...');
      // Tentar recarregar os dados do carrinho
      if (refetchCart) {
        refetchCart();
      }
    }
  }, [loading, cartItems?.length, refetchCart]); // CORREÇÃO: Dependência apenas do length
  // REMOVIDO: Logs excessivos que causavam loop infinito
  // useEffect(() => {
  //   console.log(`🔄 [Cart Monitor] CartItems mudaram! Quantidade: ${Array.isArray(cartItems) ? cartItems.length : 'não é array'}`);
  // }, [cartItems]);  // MODIFICADO: Efeito mais robusto para cálculo do subtotal - COM GUARD PARA EVITAR LOOP
  useEffect(() => {
    if (Array.isArray(clientCartItems) && clientCartItems.length > 0) {
      // Usar função centralizada para calcular subtotal
      const calculatedSubtotal = calculateCartSubtotal(clientCartItems);
      
      // GUARD: Só atualizar se realmente mudou e por uma diferença significativa
      if (Math.abs(calculatedSubtotal - manualSubtotal) > 0.01 && !isNaN(calculatedSubtotal)) {
        setManualSubtotal(calculatedSubtotal);
        
        // Armazenar para uso em outros componentes
        if (typeof window !== 'undefined') {
          window._calculatedSubtotal = calculatedSubtotal;
        }
      }
    } else if (manualSubtotal !== 0) {
      setManualSubtotal(0);
    }
  }, [clientCartItems.length]); // CORREÇÃO: Dependência apenas do length para evitar loops

  // Verificar se o carrinho está vazio com segurança
  // 🔧 FIX: Cálculo de carrinho vazio que considera hidratação
  const cartEmpty = !hydrated || (!clientCartItems || !Array.isArray(clientCartItems) || clientCartItems.length === 0);
  
  // MODIFICADO: Função para lidar com erros do carrinho
  const handleCartOperation = async (operation, ...args) => {
    try {
      return await operation(...args);
    } catch (error) {
      // Usar handler centralizado de erros
      return handleCartError(error, { 
        notification,
        context: { 
          page: 'cart', 
          operation: operation.name
        },        setCartItems: Array.isArray(clientCartItems) ? (items) => {
          refetchCart();
        } : null
      });
    }
  };

  // Handlers com tratamento de erro centralizado
  const handleClearCart = () => {
    try {
      if (window.confirm('Tem certeza que deseja limpar o carrinho?')) {
        console.log('Limpando carrinho...');
        handleCartOperation(clearCart);
        notification.success('Carrinho limpo com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao limpar carrinho:', err);
      notification.error('Falha ao limpar o carrinho');
    }
  };
  const handleUpdateCartItem = async (key, quantity, productName = '') => {
    try {
      // Salvar o estado atual para caso precise reverter
      const currentItem = clientCartItems.find(item => item.cartKey === key);
      const currentQty = currentItem?.qty || 0;

      // Atualização otimista do estado local
      setClientCartItems(prevItems => 
        prevItems.map(item => 
          item.cartKey === key 
            ? { ...item, qty: quantity, quantity: quantity }
            : item
        )
      );

      const result = await updateCartItem(key, quantity, productName);

      if (result?.success) {
        // Buscar os dados mais recentes do carrinho
        await refetchCart();
        
        notification.success(`${productName || 'Item'} atualizado para ${quantity} unidades`);
      } else {
        // Reverter para o estado anterior em caso de erro
        setClientCartItems(prevItems => 
          prevItems.map(item => 
            item.cartKey === key 
              ? { ...item, qty: currentQty, quantity: currentQty }
              : item
          )
        );
        
        notification.error('Falha ao atualizar quantidade');
      }
    } catch (err) {
      console.error('Erro ao atualizar item:', err);
      notification.error('Falha ao atualizar quantidade');
    }
  };

  const handleRemoveCartItem = (key, productName = '') => {
    try {
      if (!key) {
        console.error('❌ Chave do produto inválida para remoção:', key);
        notification.error('Erro: Chave do produto inválida');
        return;
      }
      
      if (operationInProgress) {
        console.log('Operação já em andamento, ignorando...');
        return;
      }
      
      console.log('✅ Removendo item - Key:', key);
      
      handleCartOperation(removeCartItem, key).then((result) => {
        if (result?.success) {
          const message = result.message || `${productName || 'Item'} removido do carrinho`;
          notification.success(message);
        } else {
          const errorMsg = result?.error || 'Falha ao remover item do carrinho';
          notification.error(errorMsg);
        }
      }).catch((err) => {
        console.error('❌ Erro na promessa de remoção:', err);
        notification.error('Erro inesperado ao remover item');
      });
    } catch (err) {
      console.error('Erro ao remover item:', err);
      notification.error('Falha ao remover item do carrinho');
    }  };
  // Função para gerar slug do produto a partir do nome
  const generateProductSlug = (name) => {
    if (!name) return '';
    
    // Remove caracteres especiais e acentos
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // Remove acentos
      .replace(/[']/g, '')          // Remove apóstrofes
      .replace(/[^\w\s-]/g, '')     // Remove caracteres especiais (exceto letras, números, espaços e hífens)
      .replace(/\s+/g, '-')         // Substitui espaços por hífens
      .replace(/-+/g, '-')          // Remove hífens duplicados
      .replace(/^-+|-+$/g, '')      // Remove hífens no início e fim
      .trim();                      // Remove espaços no início e fim
  };// Função para navegar para a página do produto (mantida para compatibilidade, mas preferencialmente use Link)
  const handleProductNavigation = (item) => {
    if (!item) {
      notification.warning('Produto não encontrado');
      return;
    }
    // Debug: vamos ver a estrutura real do item
    console.log('🔍 DEBUG: Estrutura do item do carrinho:', JSON.stringify(item, null, 2));
    
    // WooCommerce: o campo correto é item.slug OU item.product.slug OU item.data.slug OU item.product_data?.slug
    const productSlug = item.slug || item.product?.slug || item.data?.slug || item.product_data?.slug || (item.name ? generateProductSlug(item.name) : '');
    if (!productSlug) {
      notification.warning('Produto sem slug válido');
      return;
    }
    router.push(`/produto/${productSlug}`);
  };

  const handleGoToCheckout = async () => {
    try {
      // Verificar se o usuário informou o CEP
      if (!zipCode || zipCode.length < 8) {
        notification.warning('Por favor, informe seu CEP para cálculo do frete antes de continuar');
        
        // Destacamos a seção de frete e fazemos scroll até ela
        setShowDeliveryField(true);
        const freteSection = document.querySelector('.wd-checkout-basket-deliveryoptions');
        if (freteSection) {
          freteSection.classList.add('animate-shake');
          freteSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            freteSection.classList.remove('animate-shake');
          }, 600);
        }
        return;
      }
      
      // Validação de frete quando houver opções
      if (shippingOptions.length > 0 && !selectedShipping) {
        notification.warning('Por favor, selecione uma opção de entrega antes de continuar');
        
        // Destacamos a seção de frete e fazemos scroll até ela
        setShowDeliveryField(true);
        const freteSection = document.querySelector('.wd-checkout-basket-deliveryoptions');
        if (freteSection) {
          freteSection.classList.add('animate-shake');
          freteSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            freteSection.classList.remove('animate-shake');
          }, 600);
        }
        return;
      }
      
      // Verificar se o usuário está autenticado
      if (!isLoggedIn) {
        // Mostrar modal de opções de checkout
        setShowLoginModal(true);
        return;
      }
      
      // Evitar navegações duplas ou múltiplas
      if (isAnimating) {
        console.log('Já existe uma navegação em andamento, bloqueando dupla navegação');
        return;
      }
      
      // Flag para evitar navegação duplicada
      setIsAnimating(true);
      
      // Salvar informações importantes no sessionStorage para o checkout
      if (typeof window !== 'undefined') {
        try {
          // Salvar dados críticos para o checkout
          sessionStorage.setItem('cartZipCode', zipCode);
          sessionStorage.setItem('checkoutInitiated', 'true');
          sessionStorage.setItem('checkoutTimestamp', Date.now().toString());
          if (selectedShipping) {          sessionStorage.setItem('selectedShipping', JSON.stringify(selectedShipping));
          }
          
          // Salvar o carrinho atual em caso de precaução
          if (clientCartItems && Array.isArray(clientCartItems)) {
            sessionStorage.setItem('cartItemsBackup', JSON.stringify(clientCartItems));
          }
        } catch (storageError) {
          console.error('Erro ao salvar dados na sessionStorage:', storageError);
        }
      }
        // Se o usuário estiver autenticado, prosseguir diretamente para o checkout
      console.log('Usuário autenticado, navegando para checkout');
      notification.success('Redirecionando para o checkout...');
        
      // Criar um formulário temporário para navegação mais confiável (funciona melhor com proxies como ngrok)
      const tempForm = document.createElement('form');
      tempForm.method = 'POST';
      tempForm.action = '/checkout';
      tempForm.style.display = 'none';
      
      // Adicionar timestamp para evitar cache
      const timestampField = document.createElement('input');
      timestampField.type = 'hidden';
      timestampField.name = '_t';
      timestampField.value = Date.now().toString();
      tempForm.appendChild(timestampField);
      
      // Adicionar o CEP selecionado
      const zipCodeField = document.createElement('input');
      zipCodeField.type = 'hidden';
      zipCodeField.name = 'zipCode';
      zipCodeField.value = zipCode;
      tempForm.appendChild(zipCodeField);
      
      // Se houver opção de frete selecionada, incluir
      if (selectedShipping) {
        const shippingField = document.createElement('input');
        shippingField.type = 'hidden';
        shippingField.name = 'shipping';
        shippingField.value = JSON.stringify(selectedShipping);
        tempForm.appendChild(shippingField);
      }
      
      // Anexar o formulário ao body e submetê-lo
      document.body.appendChild(tempForm);
      
      try {
        console.log('Redirecionando via formulário POST para garantir compatibilidade com proxies');
        tempForm.submit();
        
        // Fallback: Se o formulário não redirecionar após 1s, tentar métodos alternativos
        setTimeout(() => {          if (window.location.pathname.includes('cart')) {
            console.log('Redirecionamento via formulário falhou, tentando método alternativo');
            
            // Criar um iframe oculto para navegação (funciona melhor em certos ambientes de proxy)
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.name = 'checkout_iframe_' + Date.now();
            document.body.appendChild(iframe);
            
            // Criar outro formulário para usar com o iframe
            const iframeForm = document.createElement('form');
            iframeForm.method = 'POST';
            iframeForm.action = '/checkout';
            iframeForm.target = iframe.name;
            iframeForm.style.display = 'none';
            
            // Adicionar os mesmos campos do formulário anterior
            const tsField = document.createElement('input');
            tsField.type = 'hidden';
            tsField.name = '_t';
            tsField.value = Date.now().toString();
            iframeForm.appendChild(tsField);
            
            const zipField = document.createElement('input');
            zipField.type = 'hidden';
            zipField.name = 'zipCode';
            zipField.value = zipCode;
            iframeForm.appendChild(zipField);
            
            if (selectedShipping) {
              const shipField = document.createElement('input');
              shipField.type = 'hidden';
              shipField.name = 'shipping';
              shipField.value = JSON.stringify(selectedShipping);
              iframeForm.appendChild(shipField);
            }
            
            document.body.appendChild(iframeForm);
            iframeForm.submit();
            
            // Último recurso: redirecionar manualmente após um tempo
            setTimeout(() => {
              if (window.location.pathname.includes('cart')) {
                console.log('Todos os métodos de redirecionamento falharam, tentando navegação direta');
                window.location.href = '/checkout';
              }
            }, 1000);
          }
        }, 500);
      } catch (navError) {
        console.error('Erro na navegação:', navError);
        // Tenta uma última vez com navegação simples
        window.location.href = '/checkout';
      }
    } catch (err) {
      console.error('Erro ao navegar para checkout:', err);
      notification.error('Falha ao ir para o checkout');
      setIsAnimating(false); // Resetar animação em caso de erro
    }
  };  // Função para ir para a página de criação de conta
  const handleCreateAccount = async () => {
    // Evitar navegações duplas
    if (isAnimating) {
      console.log('Já existe uma navegação em andamento, bloqueando dupla navegação');
      return;
    }
    
    setIsAnimating(true);
    setShowLoginModal(false);
    notification.info('Redirecionando para criação de conta...');
    
    try {
      // Salvar o estado do carrinho para recuperar após o registro
      if (typeof window !== 'undefined') {
        try {
          // Salvar informações importantes para recuperação pós-registro
          sessionStorage.setItem('redirectAfterLogin', '/checkout');
          sessionStorage.setItem('cartZipCode', zipCode);
          sessionStorage.setItem('registerCheckoutInitiated', 'true');
          sessionStorage.setItem('registerCheckoutTimestamp', Date.now().toString());
          
          if (selectedShipping) {
            sessionStorage.setItem('selectedShipping', JSON.stringify(selectedShipping));
          }
            // Salvar o carrinho atual em caso de precaução
          if (clientCartItems && Array.isArray(clientCartItems)) {
            sessionStorage.setItem('cartItemsBackup', JSON.stringify(clientCartItems));
          }
        } catch (storageError) {
          console.error('Erro ao salvar dados na sessionStorage:', storageError);
        }
      }
      
      // Redirecionar diretamente para a página de registro
      const origin = window.location.origin;
      const registerUrl = `${origin}/registrar/?redirect=checkout&_t=${Date.now()}`;
      window.location.href = registerUrl;
      
    } catch (navError) {
      console.error('Erro na navegação para criação de conta:', navError);
      // Fallback para redirecionamento direto
      const origin = window.location.origin;
      window.location.href = `${origin}/registrar/?redirect=checkout&_t=${Date.now()}`;
      setIsAnimating(false); // Resetar estado em caso de erro
    }
  };

  // Função para ir para a página de login
  const handleLoginCheckout = async () => {
    // Evitar navegações duplas
    if (isAnimating) {
      console.log('Já existe uma navegação em andamento, bloqueando dupla navegação');
      return;
    }
    
    setIsAnimating(true);
    setShowLoginModal(false);
    notification.info('Redirecionando para login...');
    
    try {
      // Salvar o estado do carrinho para recuperar após o login
      if (typeof window !== 'undefined') {
        try {
          // Salvar informações importantes para recuperação pós-login
          sessionStorage.setItem('redirectAfterLogin', '/checkout');
          sessionStorage.setItem('cartZipCode', zipCode);
          sessionStorage.setItem('loginCheckoutInitiated', 'true');
          sessionStorage.setItem('loginCheckoutTimestamp', Date.now().toString());
          
          if (selectedShipping) {
            sessionStorage.setItem('selectedShipping', JSON.stringify(selectedShipping));
          }
            // Salvar o carrinho atual em caso de precaução
          if (clientCartItems && Array.isArray(clientCartItems)) {
            sessionStorage.setItem('cartItemsBackup', JSON.stringify(clientCartItems));
          }
        } catch (storageError) {
          console.error('Erro ao salvar dados na sessionStorage:', storageError);
        }
      }
      
      // Criar um formulário temporário para navegação mais confiável
      const tempForm = document.createElement('form');
      tempForm.method = 'POST';
      tempForm.action = '/minha-conta';
      tempForm.style.display = 'none';
      
      // Adicionar timestamp para evitar cache
      const timestampField = document.createElement('input');
      timestampField.type = 'hidden';
      timestampField.name = '_t';
      timestampField.value = Date.now().toString();
      tempForm.appendChild(timestampField);
      
      // Adicionar parâmetro de redirecionamento
      const redirectField = document.createElement('input');
      redirectField.type = 'hidden';
      redirectField.name = 'redirect';
      redirectField.value = 'checkout';
      tempForm.appendChild(redirectField);
      
      // Anexar o formulário ao body e submetê-lo
      document.body.appendChild(tempForm);
      
      console.log('Submetendo formulário POST para login');
      tempForm.submit();
      
      // Fallback: Se o formulário não redirecionar após 1s, tentar com URL direta
      setTimeout(() => {
        if (window.location.pathname.includes('cart')) {
          console.log('Redirecionamento via formulário falhou, tentando método alternativo');
          
          // URL de fallback
          const origin = window.location.origin;
          const loginUrl = `${origin}/minha-conta?redirect=checkout&_t=${Date.now()}`;
          window.location.href = loginUrl;
        }
      }, 500);
    } catch (navError) {
      console.error('Erro na navegação para login:', navError);
      // Fallback para redirecionamento direto
      const origin = window.location.origin;
      window.location.href = `${origin}/minha-conta?redirect=checkout&_t=${Date.now()}`;
      setIsAnimating(false); // Resetar estado em caso de erro
    }
  };  // Lidar com cálculo de frete
  const handleCalculateShipping = async () => {
    if (!zipCode || zipCode.length < 8) {
      notification.warning('Por favor, digite um CEP válido');
      return;
    }
    
    // Reset de erros anteriores
    setShippingError(null);
    setIsCalculatingShipping(true);
    
    try {
      // Salvar o CEP para uso futuro
      localStorage.setItem('user_zip_code', zipCode);      // Preparar dados para a API de cálculo de frete
      const produtos = Array.isArray(clientCartItems) ? clientCartItems.map(item => {
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
        // para evitar erro de "produtos insuficientes"
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
      console.log('Enviando dados para cálculo de frete:', { cepDestino: zipCode, produtos });
      
      // Chamar a API de cálculo de frete
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cepDestino: zipCode.replace(/\D/g, ''), // Remover caracteres não numéricos
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
        console.log('Resposta API frete:', data);
      
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
        
        notification.info(mensagemFallback);      }
      
      // Transformar as opções retornadas pela API no formato esperado pelo carrinho
      const options = data.opcoes.map((opcao, index) => {
        // Garantir que o preço seja convertido para número de forma segura
        let price = 0;
        
        try {
          if (typeof opcao.valor === 'number') {
            price = opcao.valor;
          } else if (typeof opcao.valor === 'string') {
            // Removes everything that is not a number, dot or comma
            const cleanPrice = opcao.valor.replace(/[^0-9.,]/g, '');
            
            // Handle different formats (R$ 10,50 or R$ 10.50)
            if (cleanPrice.includes(',')) {
              // Brazilian format: use comma as decimal
              price = parseFloat(cleanPrice.replace('.', '').replace(',', '.')) || 0;
            } else {
              // Format with decimal point or without separator
              price = parseFloat(cleanPrice) || 0;
            }
          }
          
          // Extra check to ensure the result is a valid number
          if (isNaN(price)) {
            console.error('Valor do frete inválido após conversão:', opcao.valor, price);
            price = 0;
          }
        } catch (err) {
          console.error('Erro ao converter preço do frete:', err, opcao.valor);
          price = 0;
        }
        
        // Log para debug
        console.log(`Opção de frete: ${opcao.nome}, valor original: ${opcao.valor}, convertido: ${price}`);
        
        return {
          id: opcao.codigo,
          name: opcao.nome,
          price: price,  // Valor já convertido para número
          days: `Prazo: ${opcao.prazo} ${opcao.prazo === 1 ? 'dia útil' : 'dias úteis'}`,
          prazo: opcao.prazo, // Adicionar o prazo separado para facilitar a ordenação
          isFallback: opcao.isFallback,
          motivoFallback: data.motivoFallback
        };
      });
      
      // Se o valor do carrinho qualificar para frete grátis, marcamos o PAC como gratuito
      if (hasFreightFree && options.length > 0) {
        const pacOption = options.find(opt => opt.nome === 'PAC' || opt.codigo === '04510');
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
      setShowDeliveryField(true);
      
      // Preselecionar a opção mais barata
      if (options.length > 0) {
        const cheapestOption = options.reduce((prev, current) => 
          (prev.price < current.price) ? prev : current
        );
        setSelectedShipping(cheapestOption.id);
      }
      
      notification.success('Frete calculado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      setShippingError(error.message || 'Erro ao calcular o frete. Por favor, tente novamente.');
      notification.error(error.message || 'Erro ao calcular o frete. Por favor, tente novamente.');
      setIsCalculatingShipping(false);
    }
  };

  // Lidar com cupom
  const handleApplyCoupon = () => {
    if (!couponCode) {
      notification.warning('Por favor, digite um código de cupom');
      return;
    }
    
    setIsApplyingCoupon(true);
    
    // Simulamos a aplicação de cupom (substitua por chamada real à API)
    setTimeout(() => {
      setIsApplyingCoupon(false);
      
      // Simular cupom válido ou inválido
      if (couponCode.toUpperCase() === 'DESCONTO10') {
        // Aplicar desconto de 10% no valor subtotal
        const discountValue = cartTotal * 0.1; // 10% de desconto
        setDiscountAmount(discountValue);
        setAppliedCoupon({
          code: couponCode.toUpperCase(),
          value: discountValue,
          percentage: 10
        });
        
        notification.success('Cupom DESCONTO10 aplicado com sucesso!');
        
        // Visual feedback na área de cupom
        const couponSuccess = document.querySelector('.new-discount-added');
        if (couponSuccess) {
          couponSuccess.classList.remove('hidden');
          setTimeout(() => {
            couponSuccess.classList.add('hidden');
          }, 4000);
        }
        
        // Reset do campo de cupom
        setCouponCode('');
      } else {
        notification.error('Cupom inválido ou expirado');
        
        // Shake animation em caso de erro
        if (couponRef.current) {
          couponRef.current.classList.add('animate-shake');
          setTimeout(() => {
            couponRef.current.classList.remove('animate-shake');
          }, 600);
        }
      }
    }, 1000);
  };  // UI handlers
  const dismissNetworkError = () => setNetworkError(null);
  
  // MODIFICADO: Função ajustada para uso preferencial do subtotal do contexto
  const safeFormatPrice = (value) => {
    if (value === undefined || value === null) {
      // Se o valor do parâmetro for inválido, verificar se temos um subtotal do contexto
      if (subtotal && typeof subtotal === 'number' && !isNaN(subtotal)) {
        return formatPrice(subtotal);
      }
      // Ou usar o valor calculado manualmente
      if (manualSubtotal && !isNaN(manualSubtotal)) {
        return formatPrice(manualSubtotal);
      }
      return formatPrice(0);
    }
    
    // Se for string, extrair valor numérico
    if (typeof value === 'string') {
      const numericValue = priceToNumber(value);
      return formatPrice(isNaN(numericValue) ? 0 : numericValue);
    }
    
    // Se for número, usar diretamente
    if (typeof value === 'number') {
      return formatPrice(isNaN(value) ? 0 : value);
    }
    
    return formatPrice(0);
  };

  // DEBUG: Efeito para monitorar os valores usados no cálculo do total
  useEffect(() => {
    // Este efeito roda quando qualquer um dos valores usados para calcular o total muda
    const subtotal = typeof cartTotal === 'string' ? priceToNumber(cartTotal) : cartTotal;
    const shipping = typeof shippingCost === 'number' ? shippingCost : priceToNumber(shippingCost || 0);
    const discount = typeof discountAmount === 'number' ? discountAmount : priceToNumber(discountAmount || 0);
    const total = subtotal + shipping - discount;
    
    console.log('DEBUG - Valores para cálculo do total:', {
      subtotal,
      shipping,
      discount,
      total,
      totalFormatado: formatPrice(total),
      selectedShipping,
      typesInfo: {
        cartTotalType: typeof cartTotal,
        shippingCostType: typeof shippingCost,
        discountAmountType: typeof discountAmount
      }
    });
  }, [cartTotal, shippingCost, discountAmount, selectedShipping]);

  // Forçar atualização do carrinho ao entrar na página se estiver vazio, mas houver sessão/localStorage
  useEffect(() => {
    // Só tenta forçar se o contexto está pronto e o carrinho está vazio
    if (contextReady && (!cartItems || cartItems.length === 0)) {
      // Verifica se existe sessão/cart no localStorage
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('cart_v2_session_id') : null;
      const legacyCart = typeof window !== 'undefined' ? localStorage.getItem('woo-next-cart') : null;
      if ((sessionId || legacyCart) && refetchCart && typeof refetchCart === 'function') {
        // Força atualização do carrinho
        refetchCart();
      }
    }
  }, [contextReady, cartItems, refetchCart]);
  // 🔧 FIX: Estados de loading considerando hidratação
  if (!hydrated || (isInitialLoading && loading && !Array.isArray(clientCartItems))) {
    return (
      <Layout>
        <div className="container mx-auto py-12 px-6 text-center">
          <Spinner />
          <p className="text-lg mt-2">Carregando seu carrinho...</p>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto py-12 px-6 text-center">
          <p className="text-2xl font-bold mb-4">Ops! Algo deu errado</p>
          <p className="mb-8">{typeof error === 'object' ? error.message : error}</p>
          <button 
            onClick={() => refetchCart()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md"
          >
            Tentar novamente
          </button>
        </div>
      </Layout>
    );
  }
  
  // Carrinho vazio
  if (cartEmpty) {
    return (
      <Layout>
        <SEO 
          title="Carrinho de Compras"
          description="Seu carrinho de compras está vazio."
        />
        
        <div className="container mx-auto py-12 px-6">
          <h1 className="text-3xl font-bold mb-6 text-center">Meu Carrinho</h1>
          
          <div className="bg-white rounded-xl shadow-md p-12 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Seu carrinho está vazio</h2>
            <p className="text-gray-600 mb-8">
              Parece que você ainda não adicionou produtos ao seu carrinho.
            </p>
            
            <Link href="/">
              <a className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg text-lg font-medium inline-block">
                Continuar Comprando
              </a>
            </Link>
          </div>
        </div>
      </Layout>
    );  }
  // REMOVIDO: Logs excessivos que causavam loop infinito
  // console.log("🎯 [Cart Render] === INÍCIO DA RENDERIZAÇÃO ===");
  // console.log("🎯 [Cart Render] Estado do cartItems:", { ... });
  
  if (Array.isArray(cartItems) && cartItems.length > 0) {
    console.log("🎯 [Cart Render] ITEMS DETALHADOS:");
    cartItems.forEach((item, index) => {
      console.log(`🎯 [Cart Render] Item ${index + 1}:`, {
        name: item.name,
        imageData: {
          hasDirectImage: !!item.image,
          hasProductImage: !!item.product?.image,
          directImageUrl: item.image?.sourceUrl || item.image,
          productImageUrl: item.product?.image?.sourceUrl,
          willUseImage: item.product?.image?.sourceUrl || 
                       item.image?.sourceUrl || 
                       item.product_data?.image?.sourceUrl || 
                       item.data?.image?.sourceUrl || 
                       item.image || 
                       'DEFAULT_PLACEHOLDER'
        }
      });
    });  }

  // REMOVIDO: Log excessivo que causava spam no console
  // console.log("Renderizando carrinho com itens:", cartItems);

  // Carrinho com itens - Layout restruturado
  return (
    <Layout>
      <SEO 
        title="Carrinho de Compras" 
        description="Revise seus itens e prossiga para o checkout"
      />
      
      {/* CSS específico para este componente */}
      <style jsx global>{`
        /* Estilos gerais do carrinho */
        .cart-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
        }
        
        .cart-title {
          font-size: 1.8rem;
          margin-bottom: 1.5rem;
          color: #333;
          font-weight: 600;
        }
        
        /* Grid para desktop */
        .cart-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          align-items: start;
        }
        
        /* Responsivo para mobile */
        @media (max-width: 768px) {
          .cart-container {
            padding: 16px !important;
          }
          
          .cart-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          .cart-title {
            font-size: 1.5rem !important;
            text-align: center !important;
            margin-bottom: 1.5rem !important;
            color: #ff6900 !important;
          }
          
          .cart-item {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            padding: 24px 20px !important;
            gap: 16px !important;
            border-radius: 16px !important;
          }

          .cart-item-image {
            width: 140px !important;
            height: 140px !important;
            margin-right: 0 !important;
            margin-bottom: 0 !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
          }

          .cart-item-image:hover {
            transform: scale(1.08) !important;
            box-shadow: 0 6px 20px rgba(255, 105, 0, 0.3) !important;
          }
          
          .cart-item-details {
            width: 100% !important;
            align-items: center !important;
            text-align: center !important;
            margin-bottom: 0 !important;
          }
          
          .cart-item-title {
            font-size: 17px !important;
            line-height: 1.4 !important;
            margin-bottom: 12px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
          }

          .cart-item-title:hover {
            color: #ff6900 !important;
            transform: translateY(-2px) !important;
          }
          
          .cart-item-price {
            font-size: 20px !important;
            font-weight: 700 !important;
            margin-top: 0 !important;
            color: #ff6900 !important;
          }
          
          .cart-item-actions {
            width: 100% !important;
            justify-content: space-between !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 16px !important;
            margin-top: 8px !important;
          }
          
          .quantity-selector {
            margin: 0 !important;
            min-width: 140px !important;
            flex: 1 !important;
            border-radius: 12px !important;
            border: 2px solid #e5e7eb !important;
          }
          
          .quantity-btn {
            width: 44px !important;
            height: 44px !important;
            font-size: 18px !important;
            font-weight: 600 !important;
            border-radius: 10px !important;
          }
          
          .quantity-input {
            width: 50px !important;
            height: 44px !important;
            font-size: 16px !important;
            font-weight: 600 !important;
          }
          
          .remove-btn {
            flex-shrink: 0 !important;
            min-width: 110px !important;
            font-size: 12px !important;
            padding: 10px 14px !important;
            border-radius: 12px !important;
            font-weight: 600 !important;
          }
          
          .cart-box {
            padding: 24px 20px !important;
            margin-bottom: 20px !important;
            border-radius: 20px !important;
          }
          
          .cart-summary {
            position: static !important;
            width: 100% !important;
            margin-top: 32px !important;
          }
          
          .clear-cart-btn {
            font-size: 12px !important;
            padding: 10px 14px !important;
            border-radius: 12px !important;
          }
          
          .bt-checkout {
            font-size: 18px !important;
            padding: 18px 24px !important;
            border-radius: 16px !important;
            min-height: 56px !important;
          }
        }
        
        /* Extra pequeno - otimização para smartphones pequenos */
        @media (max-width: 480px) {
          .cart-container {
            padding: 12px !important;
          }
          
          .cart-item {
            padding: 20px 16px !important;
            gap: 14px !important;
          }
            .cart-item-image {
            width: 120px !important;
            height: 120px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
          }

          .cart-item-image:hover {
            transform: scale(1.05) !important;
            box-shadow: 0 4px 16px rgba(255, 105, 0, 0.25) !important;
          }

          .cart-item-title:hover {
            color: #ff6900 !important;
          }
          
          .cart-item-actions {
            flex-direction: column !important;
            gap: 12px !important;
          }
          
          .quantity-selector {
            min-width: 120px !important;
          }
          
          .remove-btn {
            width: 100% !important;
            min-width: auto !important;
          }
          
          .cart-box {
            padding: 20px 16px !important;
            border-radius: 16px !important;
          }
        }
        
        /* Cards e boxes */
        .cart-box {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #e9ecef;
        }
          /* Itens do carrinho - design melhorado e responsivo */
        .cart-item {
          display: flex;
          padding: 20px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #f1f3f4;
          margin-bottom: 16px;
          position: relative;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        
        .cart-item:hover {
          border-color: #ff6900;
          box-shadow: 0 4px 16px rgba(255, 105, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .cart-item:last-child {
          margin-bottom: 0;
        }
          .cart-item-image {
          width: 100px;
          height: 100px;
          border-radius: 8px;
          object-fit: cover;
          margin-right: 16px;
          border: 1px solid #f0f0f0;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cart-item-image:hover {
          transform: scale(1.05);
          border-color: #ff6900;
          box-shadow: 0 4px 12px rgba(255, 105, 0, 0.2);
        }

        .cart-item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .cart-item-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 4px;
          color: #333;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .cart-item-title:hover {
          color: #ff6900;
          text-decoration: underline;
        }
        
        .cart-item-price {
          font-size: 18px;
          font-weight: 600;
          color: #ff6900;
          margin-top: 8px;
        }
        
        .cart-item-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        /* Seletor de quantidade */
        .quantity-selector {
          display: flex;
          align-items: center;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          margin: 0 12px;
          min-width: 120px;
        }
        
        .quantity-btn {
          background: #f9f9f9;
          border: none;
          width: 36px;
          height: 36px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .quantity-btn:hover {
          background: #f1f1f1;
        }
        
        .quantity-input {
          width: 40px;
          border: none;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
        }
          /* Botão de remover - design melhorado */
        .remove-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
          min-height: 36px;
          gap: 6px;
        }
        
        .remove-btn:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
        }
        
        .remove-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.25);
        }
          .remove-btn:disabled {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 2px 4px rgba(156, 163, 175, 0.2);
        }
        
        /* Botão limpar carrinho - design melhorado */
        .clear-cart-btn {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 10px;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 3px 10px rgba(249, 115, 22, 0.25);
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .clear-cart-btn:hover {
          background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4);
        }
        
        .clear-cart-btn:active {
          transform: translateY(0);
          box-shadow: 0 3px 8px rgba(249, 115, 22, 0.3);
        }
        
        .clear-cart-btn:disabled {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 2px 6px rgba(156, 163, 175, 0.2);
        }
          /* Seção de frete - estilos de transição removidos para evitar conflitos */
        .delivery-section {
          padding: 20px;
          border-radius: 12px;
          margin-top: 24px;
          background: #f8f9fa;
        }
        
        .delivery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .shipping-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
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
        }
        
        .shipping-option.selected {
          border: 2px solid #ff6900;
          background: #fff8f3;
        }
        
        .shipping-option:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        /* Resumo do carrinho */
        .cart-summary {
          position: sticky;
          top: 24px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f1f3f4;
        }
        
        .summary-row:last-child {
          border-bottom: none;
        }
        
        .summary-row.total {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 2px solid #f1f3f4;
          font-size: 20px;
          font-weight: 600;
        }
          /* Botão de comprar */
        .bt-checkout {
          background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          border: none;
          width: 100%;
          font-weight: 700;
          font-size: 18px;
          margin-top: 24px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }        /* Botões de frete e cupom - estilos específicos */
        .btn-calculate-desktop, .btn-apply-desktop {
          background: #f97316;
          color: white;
          border-radius: 0.375rem;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          line-height: 1rem;
          gap: 0.25rem;
        }
        
        .btn-apply-desktop {
          border-radius: 0 0.375rem 0.375rem 0;
        }
        
        .btn-calculate-desktop:hover, .btn-apply-desktop:hover {
          background: #ea580c;
        }
        
        .btn-calculate-desktop:disabled, .btn-apply-desktop:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Versão ainda menor para desktop */
        @media (min-width: 769px) {
          .btn-calculate-desktop, .btn-apply-desktop {
            padding: 0.25rem 0.5rem !important;
            font-size: 0.625rem !important;
            line-height: 0.875rem !important;
            min-height: 32px !important;
            height: 32px !important;
          }
        }
        
        .bt-checkout:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(255, 105, 0, 0.3);
        }
        
        /* Animações */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        /* Modal de login */
        .login-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .login-modal-content {
          background: white;
          padding: 32px;
          border-radius: 16px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          animation: modalFadeIn 0.3s;
        }
        
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .login-option {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .login-option:hover {
          border-color: #ff6900;
          background: #fff8f3;
        }
          .login-icon {
          margin-right: 16px;
          width: 40px;
          height: 40px;
          background: #f9f9f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Estilos para seções de frete e cupom - Desktop */
        .shipping-section, .coupon-section {
          background: white;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: all 0.3s ease;
        }

        .shipping-section:hover, .coupon-section:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          border-color: #ff6900;
        }

        .section-header {
          padding: 20px 24px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
          border-radius: 16px;
          user-select: none;
        }

        .section-header:hover {
          background: rgba(255, 105, 0, 0.02);
        }

        .section-title {
          display: flex;
          align-items: center;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .section-icon {
          margin-right: 12px;
          font-size: 20px;
        }

        .section-text {
          font-weight: 600;
        }

        .expand-arrow {
          font-size: 14px;
          color: #6b7280;
          transition: transform 0.3s ease;
          font-weight: bold;
        }

        .expand-arrow.expanded {
          transform: rotate(180deg);
        }

        .section-content {
          padding: 0 24px 24px 24px;
          border-top: 1px solid #f3f4f6;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .input-group {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          align-items: center;
        }

        .section-input {
          flex: 1;
          max-width: 200px;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .section-input:focus {
          outline: none;
          border-color: #ff6900;
          box-shadow: 0 0 0 3px rgba(255, 105, 0, 0.1);
        }

        .section-button {
          background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%);
         
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 120px;
          justify-content: center;
        }

        .section-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #ea580c  0%, #f97316 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 105, 0, 0.3);
        }

        .section-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .button-text {
          font-weight: 600;
       
        }

        /* Responsividade Mobile para seções de frete e cupom */
        @media (max-width: 768px) {
          .shipping-section, .coupon-section {
            border-radius: 20px !important;
            margin-bottom: 20px !important;
            border: 2px solid #f1f3f4 !important;
          }

          .section-header {
            padding: 24px 20px !important;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .section-title {
            font-size: 20px !important;
            width: 100%;
            justify-content: space-between;
          }

          .section-icon {
            margin-right: 16px !important;
            font-size: 24px !important;
          }

          .expand-arrow {
            font-size: 16px !important;
            margin-left: auto;
          }

          .section-content {
            padding: 0 20px 24px 20px !important;
            border-top: 2px solid #f8f9fa !important;
            margin-top: 16px;
          }

          .input-group {
            flex-direction: column !important;
            gap: 16px !important;
            align-items: stretch !important;
          }

          .section-input {
            max-width: none !important;
            width: 100% !important;
            padding: 16px 20px !important;
            font-size: 16px !important;
            border-radius: 16px !important;
            border: 2px solid #e5e7eb !important;
          }

          .section-button {
            width: 100% !important;
            min-width: auto !important;
            padding: 18px 24px !important;
            font-size: 16px !important;
            border-radius: 16px !important;
            min-height: 56px !important;
          }

          .button-text {
            font-size: 16px !important;
            font-weight: 700 !important;
          }
        }

        /* Extra pequeno - smartphones */
        @media (max-width: 480px) {
          .shipping-section, .coupon-section {
            margin: 0 -4px 16px -4px !important;
            border-radius: 16px !important;
          }

          .section-header {
            padding: 20px 16px !important;
          }

          .section-title {
            font-size: 18px !important;
          }

          .section-icon {
            font-size: 22px !important;
          }

          .section-content {
            padding: 0 16px 20px 16px !important;
          }

          .section-input {
            padding: 14px 16px !important;
            font-size: 15px !important;
          }

          .section-button {
            padding: 16px 20px !important;
            min-height: 52px !important;
            font-size: 15px !important;
          }
        }
      `}</style>
        <div className="cart-container py-8">
        {/* Heading */}
        <div className="mb-6">
          <h1 className="cart-title mb-0">Carrinho de Compras</h1>
        </div>
        
        {/* Área de debug condicional */}
        {debug && (
          <div className="mb-4">
            <DebugData title="Dados do Carrinho" data={cartItems} />
            <DebugData title="Chaves dos Itens" data={Array.isArray(cartItems) ? cartItems.map(item => ({ 
              name: item.name, 
              cartKey: item.cartKey, 
              key: item.key,
              productId: item.productId 
            })) : []} />
            <DebugData title="Opções de Frete" data={shippingOptions} />
            <DebugData title="Usuário" data={user} />
          </div>
        )}
        
        {/* Erros de rede */}
        {networkError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro de comunicação</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{networkError}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={dismissNetworkError}
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Layout de grid para desktop, responsivo para mobile */}
        <div className="cart-grid">
          {/* Coluna principal (itens, entregas, cupom) */}
          <div className="cart-main">
            {/* Caixa de itens do carrinho */}
            <div className="cart-box">
              <div className="flex justify-between items-center mb-6">                <h2 className="text-xl font-semibold text-gray-800">
                  Itens do Carrinho ({Array.isArray(clientCartItems) ? clientCartItems.length : 0})
                </h2>{!cartEmpty && (
                  <button 
                    onClick={handleClearCart} 
                    className="clear-cart-btn"
                    disabled={operationInProgress}
                  >
                    <TrashIcon />
                    <span>{operationInProgress ? 'Processando...' : 'Limpar carrinho'}</span>
                    {operationInProgress && <Spinner />}
                  </button>
                )}
              </div>
                {/* Lista de produtos no carrinho */}
              <div className="cart-items">
                {Array.isArray(clientCartItems) && clientCartItems.map((item, index) => (                  <div key={item.cartKey || index} className="cart-item" id={`basket-item-${item.cartKey}`}>                    {/* Imagem do produto */}
                    {(() => {
                      // LOGS DETALHADOS: Investigando por que as imagens não carregam
                      console.log(`🔍 [Cart Debug] Processando imagem para produto: "${item.name}"`);
                      console.log(`🔍 [Cart Debug] Estrutura completa do item:`, JSON.stringify(item, null, 2));
                      
                      // Verificar todas as possíveis localizações de imagem
                      const imageStructures = {
                        'item.product?.image?.sourceUrl': item.product?.image?.sourceUrl,
                        'item.image?.sourceUrl': item.image?.sourceUrl,
                        'item.product_data?.image?.sourceUrl': item.product_data?.image?.sourceUrl,
                        'item.data?.image?.sourceUrl': item.data?.image?.sourceUrl,
                        'item.image': item.image,
                        'item.product?.image': item.product?.image,
                        'item.productImage': item.productImage,
                        'item.thumbnail': item.thumbnail,
                        'item.src': item.src,
                        'item.url': item.url
                      };
                      
                      console.log(`🔍 [Cart Debug] Estruturas de imagem encontradas:`, imageStructures);
                      
                      // Busca a imagem do produto em diferentes formatos possíveis
                      const imgSrc =
                        item.product?.image?.sourceUrl ||
                        item.image?.sourceUrl ||
                        item.product_data?.image?.sourceUrl ||
                        item.data?.image?.sourceUrl ||
                        item.image ||
                        item.productImage ||
                        item.thumbnail ||
                        item.src ||
                        item.url ||
                        DEFAULT_PLACEHOLDER;
                        
                      const altText =
                        item.product?.image?.altText ||
                        item.image?.altText ||
                        item.name || 'Produto';
                      
                      console.log(`🔍 [Cart Debug] Imagem selecionada: "${imgSrc}"`);
                      console.log(`🔍 [Cart Debug] Alt text: "${altText}"`);
                      console.log(`🔍 [Cart Debug] Usando placeholder? ${imgSrc === DEFAULT_PLACEHOLDER ? 'SIM' : 'NÃO'}`);
                      
                      // CORRIGIDO: Usar slug correto da API (mesma lógica das páginas de marca)
                      const correctSlug = productSlugs[item.productId];
                      const productSlug = correctSlug || item.slug || item.product?.slug || item.data?.slug || item.product_data?.slug || (item.name ? generateProductSlug(item.name) : '');
                      
                      return (
                        <Link href={`/produto/${productSlug}`}>
                          <a>
                            <img
                              src={imgSrc}
                              alt={altText}
                              className="cart-item-image"
                              onLoad={(e) => {
                                console.log(`✅ [Cart Debug] Imagem carregada com sucesso para "${item.name}": ${e.target.src}`);
                              }}
                              onError={e => {
                                console.error(`❌ [Cart Debug] Erro ao carregar imagem para "${item.name}": ${e.target.src}`);
                                console.error(`❌ [Cart Debug] Trocando para placeholder: ${DEFAULT_PLACEHOLDER}`);
                                e.target.onerror = null;
                                e.target.src = DEFAULT_PLACEHOLDER;
                              }}
                              title="Clique para ver detalhes do produto"
                            />
                          </a>
                        </Link>
                      );
                    })()}
                    
                    {/* Detalhes do produto */}
                    <div className="cart-item-details">
                      <Link href={`/produto/${productSlugs[item.productId] || item.slug || item.product?.slug || item.data?.slug || item.product_data?.slug || (item.name ? generateProductSlug(item.name) : '')}`}>
                        <a>
                          <h3 
                            className="cart-item-title"
                            title="Clique para ver detalhes do produto"
                          >
                            {item.name}
                          </h3>
                        </a>
                      </Link>
                      <div className="text-sm text-gray-600 mt-1">
                        {item.attributes && item.attributes.length > 0 && (
                          <div className="product-attrs">
                            {item.attributes.map(attr => (
                              <span key={attr.name}>{attr.name}: {attr.value}</span>
                            ))}

                          </div>
                        )}
                      </div>                      <div className="cart-item-price">
                        {item.totalPrice ? item.totalPrice.replace(/&nbsp;/g, ' ') : (item.price ? `R$ ${parseFloat(item.price).toFixed(2).replace('.', ',')}` : 'Preço não disponível')}
                      </div>
                    </div>
                    
                    {/* Ações do produto (quantidade, remover) */}
                    <div className="cart-item-actions">
                      <div className="quantity-selector">                        <button 
                          className="quantity-btn" 
                          onClick={() => handleUpdateCartItem(item.cartKey, Math.max(1, parseInt(item.qty) - 1), item.name)}
                          disabled={operationInProgress || parseInt(item.qty) <= 1}
                        >−</button>
                        <input 
                          type="text" 
                          className="quantity-input" 
                          value={item.qty} 
                          readOnly
                        />                        <button 
                          className="quantity-btn" 
                          onClick={() => handleUpdateCartItem(item.cartKey, parseInt(item.qty) + 1, item.name)}
                          disabled={operationInProgress}
                        >+</button>
                      </div>                      <button 
                        className="remove-btn" 
                        onClick={() => handleRemoveCartItem(item.cartKey, item.name)}
                        disabled={operationInProgress}
                      >
                        <TrashIcon />&nbsp;Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>              {/* Seção de cálculo de frete */}
            <div className="cart-box shipping-section">              <div 
                className="section-header"
                onClick={toggleDeliveryField}
              >
                <h2 className="section-title">
                  <span className="section-icon">🚚</span> 
                  <span className="section-text">Cálculo do Frete</span>
                </h2>
                <span className={`expand-arrow ${showDeliveryField ? 'expanded' : ''}`}>▼</span>
              </div>
                {showDeliveryField && (
                <div className="section-content">
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Digite seu CEP"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').substring(0, 8))}
                      className="section-input"
                      maxLength={8}
                    />
                    <button 
                      onClick={handleCalculateShipping}
                      className="section-button"
                      disabled={isCalculatingShipping}
                    >
                      {isCalculatingShipping ? <Spinner /> : <span>🔄</span>}
                      <span className="button-text">Calcular</span>
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    <a 
                      href="https://buscacepinter.correios.com.br/app/endereco/index.php" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-orange-600 hover:underline"
                    >
                      Não sei meu CEP
                    </a>
                  </div>
                  
                  {/* Mostrar erro de cálculo de frete */}
                  {shippingError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-600 text-sm">{shippingError}</p>
                    </div>
                  )}
                  
                  {/* Mostrar opções de frete */}
                  {isCalculatingShipping ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
                      <p className="mt-2 text-sm text-gray-600">Calculando opções de entrega...</p>
                    </div>
                  ) : (
                    shippingOptions.length > 0 && (
                      <div className="shipping-options">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Selecione uma opção de entrega:</h3>
                        {shippingOptions.map((option) => (
                          <div 
                            key={option.id}
                            className={`shipping-option ${selectedShipping === option.id ? 'selected' : ''}`}
                            onClick={() => setSelectedShipping(option.id)}
                          >
                            <div>
                              <div className="text-sm font-medium">{option.name}</div>
                              <div className="text-xs text-gray-500">{option.days}</div>
                            </div>
                            <div className="font-bold">                              {option.price === 0 ? (
                                <span className="text-green-600">GRÁTIS</span>
                              ) : (
                                safeFormatPrice(option.price)
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                  
                  {/* Mensagem de frete grátis */}
                  {hasFreightFree && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-600 text-sm flex items-center">
                        <CheckIcon /> 
                        <span className="ml-2">
                          Parabéns! Seu pedido tem frete grátis para envios PAC.
                        </span>
                      </p>
                    </div>
                  )}
                    {/* Se não tem frete grátis, mostrar limite */}
                  {!hasFreightFree && !cartEmpty && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-600 text-sm">
                        Adicione mais {safeFormatPrice(Math.max(0, FREE_SHIPPING_THRESHOLD - parseFloat(cartTotal || 0)))} ao seu pedido e ganhe frete grátis!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>              {/* Seção de cupom de desconto */}
            <div className="cart-box coupon-section">
              <div 
                className="section-header"
                onClick={toggleCouponField}
              >
                <h2 className="section-title">
                  <span className="section-icon">🏷️</span> 
                  <span className="section-text">Cupom de Desconto</span>
                </h2>
                <span className={`expand-arrow ${showCouponField ? 'expanded' : ''}`}>▼</span>
              </div>              {showCouponField && (
                <div className="section-content">
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Digite o código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="section-input"
                      ref={couponRef}
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      className="section-button"
                      disabled={isApplyingCoupon || !couponCode}
                    >
                      {isApplyingCoupon ? <Spinner /> : <span>🏷️</span>}
                      <span className="button-text">Aplicar</span>
                    </button>
                  </div>
                  
                  {/* Cupom aplicado */}
                  {appliedCoupon && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                      <div className="text-green-600 text-sm flex items-center">
                        <CheckIcon />
                        <span className="ml-2">
                          Cupom {appliedCoupon.code} aplicado com sucesso!
                        </span>
                      </div>
                      <div className="text-green-600 font-medium">
                        -{appliedCoupon.discount}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Coluna do resumo (dados financeiros e checkout) */}
          <div className="cart-sidebar">            
            <div className="cart-box cart-summary">
              <h2 className="text-xl font-semibold text-orange-600 mb-6">Resumo do Pedido</h2>
                {/* Linhas de resumo - MODIFICADO para usar preferencialmente o valor do contexto */}
              <div className="summary-row">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {/* Se houver itens e manualSubtotal > 0, sempre priorize ele */}
                  {(Array.isArray(clientCartItems) && clientCartItems.length > 0 && manualSubtotal > 0)
                    ? formatPrice(manualSubtotal)
                    : (formattedSubtotal && formattedSubtotal !== 'R$ 0,00')
                      ? formattedSubtotal
                      : (subtotal && subtotal > 0)
                        ? formatPrice(subtotal)
                        : (formattedTotal && formattedTotal !== 'R$ 0,00')
                          ? formattedTotal
                          : 'R$ 0,00'}
                </span>
              </div>
              
              <div className="summary-row">
                <span className="text-gray-600">Frete:</span>                
                <span>                  
                  {selectedShipping ? (
                    shippingCost === 0 ? (
                      <span className="text-green-600 font-medium">Grátis</span>
                    ) : (
                      safeFormatPrice(shippingCost)
                    )
                  ) : (
                    <span className="text-sm italic text-gray-500">
                      Calcule acima
                    </span>
                  )}
                </span>
              </div>
              
              {appliedCoupon && (
                <div className="summary-row">
                  <span className="text-gray-600">Desconto:</span>
                  <span className="text-green-600">
                    -{appliedCoupon.discount}
                  </span>
                </div>
              )}
                <div className="summary-row total">                
                <span className="text-orange-600 font-semibold">Total:</span>                <span className="text-orange-600">
                  {(Array.isArray(clientCartItems) && clientCartItems.length > 0 && manualSubtotal > 0)
                    ? formatPrice(manualSubtotal + (typeof shippingCost === 'number' ? shippingCost : priceToNumber(shippingCost || 0)) - (typeof discountAmount === 'number' ? discountAmount : priceToNumber(discountAmount || 0)))
                    : selectedShipping ? (
                      (() => {
                        let baseValue = 0;
                        if (subtotal && typeof subtotal === 'number' && subtotal > 0) {
                          baseValue = subtotal;
                        } else if (manualSubtotal && manualSubtotal > 0) {
                          baseValue = manualSubtotal;
                        } else if (typeof cartTotal === 'string') {
                          baseValue = priceToNumber(cartTotal);
                        } else if (typeof cartTotal === 'number' && cartTotal > 0) {
                          baseValue = cartTotal;
                        }
                        const shipping = typeof shippingCost === 'number' ? shippingCost : priceToNumber(shippingCost || 0);
                        const discount = typeof discountAmount === 'number' ? discountAmount : priceToNumber(discountAmount || 0);
                        const total = baseValue + shipping - discount;
                        return formatPrice(total);
                      })()
                    ) : (
                      (formattedTotal && formattedTotal !== 'R$ 0,00') ? formattedTotal :
                      (formattedSubtotal && formattedSubtotal !== 'R$ 0,00') ? formattedSubtotal :
                      'R$ 0,00'
                    )}
                </span>
              </div>
              
              {/* Opções de pagamento */}
              <div className="mt-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                    <CreditCardIcon />
                    <span className="ml-2">Opções de pagamento:</span>
                  </h3>
                  
                  <div className="space-y-2 text-xs text-gray-600">                    <p className="flex items-center">
                      <CheckIcon />                      <span className="ml-2">
                        <strong className="text-green-600">À vista:</strong> {' '}                        {(() => {
                          // Calcular o valor à vista com desconto
                          let subtotal = 0;
                          if (typeof cartTotal === 'string') {
                            subtotal = priceToNumber(cartTotal);
                          } else {
                            subtotal = cartTotal || 0;
                          }
                          
                          // Garantir que o frete seja um número
                          const shipping = typeof shippingCost === 'number' ? shippingCost : priceToNumber(shippingCost || 0);
                          const discount = typeof discountAmount === 'number' ? discountAmount : priceToNumber(discountAmount || 0);
                          
                          const totalBeforeDiscount = subtotal + shipping - discount;
                          const cashTotal = totalBeforeDiscount * CASH_PAYMENT_MULTIPLIER;
                          
                          return formatPrice(cashTotal);
                        })()}
                        <span className="text-green-600 ml-1">
                          ({CASH_PAYMENT_DISCOUNT_PERCENT}% de desconto)
                        </span>
                      </span>
                    </p>
                      <p className="flex items-center">
                      <CheckIcon />
                      <span className="ml-2">
                        <strong>Parcelado:</strong>
                        <div className="flex flex-col">
                          {/* Opção com juros */}
                          <div>
                            Em {MAX_INSTALLMENTS}x de {' '}
                            {(() => {
                              let subtotal = 0;
                              if (typeof cartTotal === 'string') {
                                subtotal = priceToNumber(cartTotal);
                              } else {
                                subtotal = cartTotal || 0;
                              }
                              
                              const shipping = typeof shippingCost === 'number' ? shippingCost : priceToNumber(shippingCost || 0);
                              const discount = typeof discountAmount === 'number' ? discountAmount : priceToNumber(discountAmount || 0);
                              
                              const total = subtotal + shipping - discount;
                              const installmentValue = calculateInstallmentValue(total);
                              
                              return formatPrice(installmentValue);
                            })()}
                            <span className="ml-1">com juros de {INSTALLMENT_INTEREST_RATE}% ao mês</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Total: {' '}
                            {(() => {
                              let subtotal = 0;
                              if (typeof cartTotal === 'string') {
                                subtotal = priceToNumber(cartTotal);
                              } else {
                                subtotal = cartTotal || 0;
                              }
                              
                              const shipping = typeof shippingCost === 'number' ? shippingCost : priceToNumber(shippingCost || 0);
                              const discount = typeof discountAmount === 'number' ? discountAmount : priceToNumber(discountAmount || 0);
                              
                              const total = subtotal + shipping - discount;
                              return formatPrice(calculateTotalWithInterest(total));
                            })()}
                          </div>
                        </div>
                      </span>
                    </p>
                    
                    <p className="flex items-center">
                                           <CheckIcon />
                      <span className="ml-2">
                        <strong>Métodos:</strong> PIX, cartão ou boleto
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Botão de checkout */}
              <button 
                onClick={handleGoToCheckout}
                disabled={cartEmpty || isAnimating}
                className={`bt-checkout ${cartEmpty ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <LockIcon />
                <span>
                  {isAnimating ? 'Processando...' : 'Comprar Agora'}
                </span>
                {isAnimating && <Spinner />}
              </button>              {/* Links de navegação */}
              <div className="mt-6">
                <Link href="/">
                  <a className="bt-checkout flex items-center justify-center" style={{background: "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)"}}>
                    <ArrowIcon />
                    <span className="ml-2">Continuar Comprando</span>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
          {/* Modal de opções de checkout quando não está logado */}
        {showLoginModal && (
          <div className="login-modal" onClick={() => setShowLoginModal(false)}>
            <div className="login-modal-content" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-6 text-center">Como deseja continuar?</h2>
              
              <div className="login-option" onClick={handleLoginCheckout}>
                <div className="login-icon">🔑</div>
                <div>
                  <h3 className="font-semibold">Entrar na Minha Conta</h3>
                  <p className="text-sm text-gray-600">Acesse para usar seus dados salvos</p>
                </div>
              </div>
              
              <div className="login-option" onClick={handleCreateAccount}>
                <div className="login-icon">✨</div>
                <div>
                  <h3 className="font-semibold">Criar Conta</h3>
                  <p className="text-sm text-gray-600">Cadastre-se rapidamente e finalize sua compra</p>
                </div>
              </div>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                Seus dados estão protegidos com a mais alta segurança
              </p>
            </div>
          </div>
        )}
        
        {/* Formulário oculto para fallback de checkout */}
        <form 
          id="checkout-form-fallback" 
          method="POST" 
          action="/checkout" 
          style={{display: 'none'}}
        >
          <input type="hidden" name="_t" value={Date.now()} />
          <input type="hidden" name="zipCode" value={zipCode} />
          {selectedShipping && (
            <input type="hidden" name="shipping" value={JSON.stringify(selectedShipping)} />
          )}
        </form>
      </div>
      
      {/* Styles for the finalize order button to match checkout.js */}
      <style jsx>{`
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
        
        .finalize-order-btn.disabled,
        .finalize-order-btn:disabled {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          cursor: not-allowed;
          box-shadow: 0 4px 16px rgba(156, 163, 175, 0.2);
          transform: none;
        }
          .finalize-order-btn.disabled:hover,        .finalize-order-btn:disabled:hover {
          transform: none;
          box-shadow: 0 4px 16px rgba(156, 163, 175, 0.2);
        }

        /* Forçar cores laranja no resumo do pedido */
        .cart-summary h2 {
          color: #ea580c !important; /* text-orange-600 */
        }
        
        .summary-row.total span {
          color: #ea580c !important; /* text-orange-600 */
          font-weight: 600 !important;
        }
      `}</style>
    </Layout>
  );
};

export default Cart;