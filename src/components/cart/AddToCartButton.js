import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from "next/link";
import cx from 'classnames';
import { useCartContext } from '../../contexts/CartContext';
import LoadingSpinner from '../LoadingSpinner';
import { cartLockHelpers } from '../../utils/cart-lock';

// Import Cart v2 components dynamically
import dynamic from 'next/dynamic';

// Dynamic import of Cart v2 AddToCartButton (only loads when Cart v2 is enabled)
const AddToCartButtonV2 = dynamic(
    () => import('../../v2/cart/components/AddToCartButton.js'),
    { ssr: false }
);

/**
 * Modal de confirmação de produto adicionado ao carrinho
 */
const ProductAddedModal = ({ isOpen, onClose, onGoToCart, onContinueShopping, productName, quantity }) => {
    if (!isOpen) return null;

    return (
        <div className="product-added-modal">
            <div className="product-added-modal-content">
                <div className="modal-header">
                    <div className="success-icon">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="modal-title">Produto adicionado ao carrinho!</h2>
                    <p className="modal-subtitle">
                        {quantity}x {productName} foi adicionado com sucesso
                    </p>
                </div>

                <div className="modal-actions">
                    <button 
                        onClick={onGoToCart}
                        className="modal-action-primary"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H20.5" />
                        </svg>
                        Ir para o Carrinho
                    </button>
                    
                    <button 
                        onClick={onContinueShopping}
                        className="modal-action-secondary"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                        Continuar Comprando
                    </button>
                </div>

                <p className="modal-footer">
                    <span className="security-text">
                        🔒 Seus dados estão protegidos com a mais alta segurança
                    </span>
                </p>
            </div>

            <style jsx>{`
                .product-added-modal {
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
                    animation: modalFadeIn 0.3s ease-out;
                }

                .product-added-modal-content {
                    background: white;
                    padding: 32px;
                    border-radius: 16px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: modalSlideIn 0.3s ease-out;
                    text-align: center;
                }

                .modal-header {
                    margin-bottom: 24px;
                }

                .success-icon {
                    width: 64px;
                    height: 64px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px auto;
                    animation: successPulse 0.6s ease-out;
                }

                .modal-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 8px;
                }

                .modal-subtitle {
                    color: #6b7280;
                    font-size: 0.9rem;
                }

                .modal-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .modal-action-primary, .modal-action-secondary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    font-size: 1rem;
                }

                .modal-action-primary {
                    background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(255, 105, 0, 0.3);
                }

                .modal-action-primary:hover {
                    background: linear-gradient(135deg, #ff8f00 0%, #ff6900 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 105, 0, 0.4);
                }

                .modal-action-secondary {
                    background: #f9fafb;
                    color: #374151;
                    border: 2px solid #e5e7eb;
                }

                .modal-action-secondary:hover {
                    background: #f3f4f6;
                    border-color: #d1d5db;
                    transform: translateY(-1px);
                }

                .modal-footer {
                    margin: 0;
                    padding-top: 16px;
                    border-top: 1px solid #f3f4f6;
                }

                .security-text {
                    font-size: 0.75rem;
                    color: #6b7280;
                }

                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes modalSlideIn {
                    from { 
                        opacity: 0; 
                        transform: translateY(-20px) scale(0.95); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                }

                @keyframes successPulse {
                    0% { transform: scale(0.8); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }

                @media (max-width: 480px) {
                    .product-added-modal-content {
                        padding: 24px;
                        margin: 16px;
                    }
                    
                    .modal-title {
                        font-size: 1.25rem;
                    }
                    
                    .modal-actions {
                        gap: 8px;
                    }
                    
                    .modal-action-primary, .modal-action-secondary {
                        padding: 14px 20px;
                        font-size: 0.9rem;
                    }
                }
            `}</style>
        </div>
    );
};

/**
 * Componente de botão "Adicionar ao Carrinho"
 * Versão atualizada com spinner centralizado e modal de confirmação
 */
const AddToCartButton = ({ product, buttonClassName, showQuantity = false }) => {
    // Check Cart v2 feature flags
    const cartV2Enabled = process.env.NEXT_PUBLIC_CART_V2_ENABLED === 'true';
    const cartV2API = process.env.NEXT_PUBLIC_CART_V2_API === 'true';
    const cartV2Percentage = parseInt(process.env.NEXT_PUBLIC_CART_V2_PERCENTAGE || '0');
    const shouldUseCartV2 = cartV2Enabled && cartV2API && cartV2Percentage >= 100;

    // Enhanced debug logging
    console.log('[AddToCartButton] Feature Flag Check:', {
        CART_V2_ENABLED: process.env.NEXT_PUBLIC_CART_V2_ENABLED,
        CART_V2_API: process.env.NEXT_PUBLIC_CART_V2_API,
        CART_V2_PERCENTAGE: process.env.NEXT_PUBLIC_CART_V2_PERCENTAGE,
        cartV2Enabled,
        cartV2API,
        cartV2Percentage,
        shouldUseCartV2
    });

    // Use Cart v2 component if feature flags are enabled
    if (shouldUseCartV2) {
        console.log('[AddToCartButton] Using Cart v2 component 🚀');
        
        // Estados locais só para o modal
        const [showProductAddedModal, setShowProductAddedModal] = useState(false);
        const [addedProductQuantity, setAddedProductQuantity] = useState(1);
        
        return (
            <>
                <AddToCartButtonV2 
                    product={product} 
                    className={buttonClassName}
                    quantity={showQuantity ? undefined : 1}
                    onSuccess={(product, quantity) => {
                        console.log(`[AddToCartButton v2] ✅ Produto adicionado: ${product.name} x${quantity}`);
                        
                        // Mostrar modal de confirmação
                        setAddedProductQuantity(quantity);
                        setShowProductAddedModal(true);
                        
                        // Disparar eventos para atualizar o minicart e outros componentes
                        window.dispatchEvent(new CustomEvent('cartUpdated'));
                        window.dispatchEvent(new CustomEvent('minicartUpdate'));
                        
                        // Evento adicional para o contador do Layout
                        window.dispatchEvent(new CustomEvent('productAddedToCart', {
                            detail: {
                                productId: product.id || product.productId,
                                productName: product.name,
                                quantity: quantity,
                                timestamp: Date.now()
                            }
                        }));
                        
                        // Vibração de sucesso no mobile
                        if (navigator.vibrate) {
                            navigator.vibrate(100);
                        }
                        
                        // Usar API de notificações se disponível
                        if (window.showNotification) {
                            window.showNotification('Produto adicionado ao carrinho!', 'success');
                        }
                    }}
                    onError={(error, product) => {
                        console.error(`[AddToCartButton v2] ❌ Erro ao adicionar ${product?.name || 'produto'}:`, error);
                        
                        // Vibração de erro no mobile
                        if (navigator.vibrate) {
                            navigator.vibrate([100, 100, 100]);
                        }
                        
                        // Usar API de notificações se disponível
                        if (window.showNotification) {
                            window.showNotification(
                                error?.message || 'Erro ao adicionar produto ao carrinho',
                                'error'
                            );
                        }
                    }}
                />
                
                {/* Modal de produto adicionado */}
                <ProductAddedModal 
                    isOpen={showProductAddedModal}
                    onClose={() => setShowProductAddedModal(false)}
                    onContinueShopping={() => {
                        setShowProductAddedModal(false);
                        window.dispatchEvent(new CustomEvent('cartUpdated'));
                    }}
                    onGoToCart={() => {
                        setShowProductAddedModal(false);
                        window.location.href = '/cart';
                    }}
                    productName={product?.name}
                    quantity={addedProductQuantity}
                />
            </>
        );
    }

    console.log('[AddToCartButton] Using Cart v1 component (fallback)');
    // Continue with Cart v1 implementation
    
    // Estados locais para o componente
    const [quantity, setQuantity] = useState(1);
    const [showProductAddedModal, setShowProductAddedModal] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Ref para evitar multiple clicks
    const lastClickTimeRef = useRef(0);
    const componentMountedRef = useRef(true);
    const buttonContainerRef = useRef(null);
    
    // Obter funções e estado do contexto do carrinho
    const { 
        addToCart, 
        addingToCart, 
        lastAddedProduct, 
        error,
        continueIterating
    } = useCartContext();

    // Combinação de erro local e global para exibição
    const displayError = localError || (typeof error === 'object' && error?.message) || error;
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            componentMountedRef.current = false;
        };
    }, []);
    
    // Resetar o erro quando o produto muda
    useEffect(() => {
        setLocalError(null);
    }, [product]);

    /**
     * Lida com o clique no botão de adicionar ao carrinho
     * Versão atualizada para usar API REST simples
     */
    const handleAddToCartClick = useCallback(async () => {
        // Proteção contra múltiplos clicks rápidos
        const now = Date.now();
        if (now - lastClickTimeRef.current < 500) {
            console.log('🚫 [AddToCartButton] Click muito rápido, ignorando');
            return;
        }
        lastClickTimeRef.current = now;

        // Verificar se já está processando
        if (isProcessing || addingToCart) {
            console.log('🚫 [AddToCartButton] Já processando, ignorando click');
            return;
        }

        setLocalError(null);
        setIsProcessing(true);
        
        try {
            // Validação de quantidade
            if (quantity <= 0) {
                setLocalError('A quantidade deve ser maior que zero');
                return;
            }

            // Determina o ID correto do produto baseado na estrutura disponível
            let productId;
            
            if (product?.databaseId) {
                productId = product.databaseId;
            } else if (product?.id) {
                // Se o ID for uma string do tipo "cG9zdDoxMjM=", tentar extrair o número
                if (typeof product.id === 'string' && product.id.includes('=')) {
                    console.warn('[AddToCartButton] ID em formato Base64 detectado, usando databaseId como fallback');
                    productId = product.databaseId || null;
                } else {
                    productId = product.id;
                }
            }
            
            if (!productId) {
                setLocalError('Produto inválido - ID não encontrado');
                console.error('[AddToCartButton] Produto inválido, estrutura:', product);
                return;
            }
            
            console.log(`[AddToCartButton] 🛒 Adicionando ao carrinho via API REST:`);
            console.log(`[AddToCartButton] - Produto: ${product?.name || 'Desconhecido'}`);
            console.log(`[AddToCartButton] - ID: ${productId}`);
            console.log(`[AddToCartButton] - Quantidade: ${quantity}`);
            console.log(`[AddToCartButton] - Tipo do produto: ${product?.__typename || 'Desconhecido'}`);
            
            // Verificar se é um produto variável que precisa de variação selecionada
            if (product?.__typename === 'VariableProduct' && !product?.defaultAttributes) {
                setLocalError('Por favor, selecione as opções do produto antes de adicionar ao carrinho');
                return;
            }
              // ATUALIZADO: Usar a API REST v2 diretamente
            const response = await fetch('/api/v2/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: quantity,
                    // Dados extras do produto para melhor experiência
                    name: product?.name || `Produto ${productId}`,
                    price: product?.price || product?.regularPrice || 220.00,
                    image: product?.image?.sourceUrl || product?.featuredImage?.node?.sourceUrl || null
                })
            });

            const result = await response.json();
            
            // Verificar se o componente ainda está montado antes de atualizar estado
            if (!componentMountedRef.current) {
                console.log('⚠️ [AddToCartButton] Componente desmontado, cancelando atualização');
                return;
            }
            
            console.log('[AddToCartButton] Resultado da operação REST:', result);
            
            // NOVO: Disparar evento específico para o contador do Layout
            window.dispatchEvent(new CustomEvent('productAddedToCart', {
                detail: {
                    productId: productId,
                    productName: product?.name,
                    quantity: quantity,
                    timestamp: Date.now()
                }
            }));

            // NOVO: Atualizar contador global se disponível
            if (window.updateCartCount && typeof window.updateCartCount === 'function') {
                try {
                    await window.updateCartCount();
                    console.log('[Homepage Button] ✅ Contador global atualizado');
                } catch (updateError) {
                    console.log('[Homepage Button] ⚠️ Erro ao atualizar contador global:', updateError);
                }
            }

            // NOVO: Atualizar o contexto do carrinho se disponível
            if (typeof addToCart === 'function') {
                try {
                    // Tentar atualizar o contexto também para manter sincronização
                    await addToCart(productId, quantity);
                } catch (contextError) {
                    console.log('⚠️ [AddToCartButton] Erro ao atualizar contexto, mas item foi adicionado via REST:', contextError);
                }
            }
        } catch (err) {
            console.error('[AddToCartButton] Exceção ao adicionar ao carrinho via REST:', err);
            
            if (componentMountedRef.current) {
                setLocalError('Ocorreu um erro inesperado ao adicionar o produto ao carrinho');
            }
            
            // Vibração de erro no mobile
            if (navigator.vibrate) {
                navigator.vibrate([100, 100, 100]);
            }
        } finally {
            if (componentMountedRef.current) {
                setIsProcessing(false);
            }
        }
    }, [product, quantity, addToCart, isProcessing, addingToCart]);

    // Manipulador para continuar comprando
    const handleContinueShopping = () => {
        setShowProductAddedModal(false);
        // NOVO: Forçar atualização do carrinho após fechar modal
        if (typeof continueIterating === 'function') {
            continueIterating(false);
        }
        
        // NOVO: Disparar eventos para sincronizar todos os componentes
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        window.dispatchEvent(new CustomEvent('minicartUpdate'));
    };

    // Manipulador para ir ao carrinho  
    const handleGoToCart = () => {
        setShowProductAddedModal(false);
        // NOVO: Forçar atualização do carrinho antes de navegar
        if (typeof continueIterating === 'function') {
            continueIterating(true);
        }
        
        // NOVO: Disparar eventos para sincronizar todos os componentes
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        window.dispatchEvent(new CustomEvent('minicartUpdate'));
        
        // Redirecionar para o carrinho
        window.location.href = '/cart';
    };

    // Manipulador de alteração de quantidade
    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        if (value > 0) {
            setQuantity(value);
        }
    };

    // Exibir mensagem de erro, se houver
    const renderError = () => {
        if (!displayError) return null;
        
        const errorMessage = typeof displayError === 'string' 
            ? displayError 
            : (displayError?.message || 'Erro ao processar operação');
            
        return (
            <div className="text-red-600 text-sm mb-2">
                {errorMessage}
            </div>
        );
    };

    // Se for um produto externo, mostrar link para compra externa
    if (product?.__typename === "ExternalProduct") {
        return (
            <div>
                {renderError()}
                <a 
                    href={product?.externalUrl ?? '/'} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClassName || "px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"}
                >
                    Comprar agora
                </a>
            </div>
        );
    }

    // Verificar se deve mostrar o spinner no lugar do botão
    const showSpinner = isProcessing || addingToCart;

    return (
        <div ref={buttonContainerRef}>
            {renderError()}
            
            {/* Campo de quantidade, se showQuantity for true */}
            {showQuantity && !showSpinner && (
                <div className="flex items-center mb-4">
                    <label htmlFor="quantity" className="mr-3 text-gray-600">
                        Quantidade:
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-md">
                        <button 
                            onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                            type="button"
                            disabled={showSpinner}
                        >
                            -
                        </button>
                        <input
                            id="quantity"
                            type="number"
                            min="1"
                            max="999"
                            value={quantity}
                            onChange={handleQuantityChange}
                            className="w-12 text-center border-0 focus:outline-none focus:ring-0"
                            disabled={showSpinner}
                        />
                        <button 
                            onClick={() => setQuantity(quantity + 1)}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                            type="button"
                            disabled={showSpinner}
                        >
                            +
                        </button>
                    </div>
                </div>
            )}

            {/* Container para botão ou spinner */}
            <div className="add-to-cart-container">
                {showSpinner ? (
                    // Mostrar spinner centralizado no lugar do botão
                    <div className="spinner-container">
                        <LoadingSpinner size="normal" />
                    </div>
                ) : (
                    // Mostrar botão normal
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            disabled={showSpinner}
                            onClick={handleAddToCartClick}
                            className={buttonClassName || cx(
                                'px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-all duration-200',
                                {
                                    'opacity-50 cursor-not-allowed': showSpinner,
                                    'transform hover:scale-105': !showSpinner,
                                }
                            )}
                            aria-label={`Adicionar ${product?.name || 'produto'} ao carrinho`}
                        >
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H20.5" />
                                </svg>
                                Adicionar ao Carrinho
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de produto adicionado */}
            <ProductAddedModal 
                isOpen={showProductAddedModal}
                onClose={() => setShowProductAddedModal(false)}
                onContinueShopping={handleContinueShopping}
                onGoToCart={handleGoToCart}
                productName={product?.name}
                quantity={quantity}
            />

            <style jsx>{`
                .add-to-cart-container {
                    position: relative;
                    min-height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .spinner-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    min-height: 48px;
                    z-index: 10;
                }

                /* NOVO: Estilos específicos para botões da homepage FeaturedProducts */
                :global(.FeaturedProducts_addToCartBtn__vEsKP) {
                    position: relative !important;
                    min-height: 48px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.3s ease !important;
                }

                /* Quando está processando, esconder o conteúdo do botão da homepage */
                :global(.FeaturedProducts_addToCartBtn__vEsKP.processing) {
                    color: transparent !important;
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                }

                :global(.FeaturedProducts_addToCartBtn__vEsKP.processing span) {
                    opacity: 0 !important;
                    visibility: hidden !important;
                }

                /* Container do spinner para botões da homepage */
                :global(.FeaturedProducts_addToCartBtn__vEsKP .homepage-spinner) {
                    position: absolute !important;
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    z-index: 100 !important;
                }
            `}</style>
        </div>
    );
};

// NOVO: Função utilitária para adicionar spinner aos botões da homepage
export const initializeHomepageButtons = () => {
    if (typeof window !== 'undefined') {
        // Aguardar o DOM estar carregado
        const initButtons = () => {
            const homepageButtons = document.querySelectorAll('.FeaturedProducts_addToCartBtn__vEsKP');
            
            homepageButtons.forEach(button => {
                // Evitar múltiplas inicializações
                if (button.dataset.initialized === 'true') return;
                
                button.dataset.initialized = 'true';
                
                // Salvar o conteúdo original do botão
                const originalContent = button.innerHTML;
                const originalStyles = {
                    background: button.style.background || window.getComputedStyle(button).background,
                    color: button.style.color || window.getComputedStyle(button).color,
                    border: button.style.border || window.getComputedStyle(button).border,
                    padding: button.style.padding || window.getComputedStyle(button).padding,
                    borderRadius: button.style.borderRadius || window.getComputedStyle(button).borderRadius,
                    fontSize: button.style.fontSize || window.getComputedStyle(button).fontSize,
                    fontWeight: button.style.fontWeight || window.getComputedStyle(button).fontWeight,
                    textTransform: button.style.textTransform || window.getComputedStyle(button).textTransform,
                    boxShadow: button.style.boxShadow || window.getComputedStyle(button).boxShadow
                };
                
                // Adicionar handler de click personalizado
                const originalHandler = button.onclick;
                
                button.onclick = async function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('🛒 [Homepage Button] Botão FeaturedProducts clicado');
                    
                    // FASE 1: ESCONDER COMPLETAMENTE O BOTÃO E MOSTRAR SPINNER
                    button.innerHTML = '';
                    button.style.background = 'transparent';
                    button.style.border = 'none';
                    button.style.boxShadow = 'none';
                    button.style.color = 'transparent';
                    button.style.padding = '0';
                    button.style.minHeight = '48px';
                    button.style.display = 'flex';
                    button.style.alignItems = 'center';
                    button.style.justifyContent = 'center';
                    button.style.position = 'relative';
                    
                    // Criar container do spinner que ocupa todo o espaço do botão
                    const spinnerContainer = document.createElement('div');
                    spinnerContainer.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                    `;
                    
                    // Usar o mesmo spinner do LoadingSpinner.js
                    spinnerContainer.innerHTML = `
                        <div style="
                            position: relative;
                            width: 50px;
                            height: 50px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <div style="
                                width: 40px;
                                height: 40px;
                                border: 3px solid transparent;
                                border-top: 3px solid #ff6900;
                                border-right: 3px solid #00a8e1;
                                border-radius: 50%;
                                animation: spin 1s linear infinite, gradient-shift 3s ease-in-out infinite;
                                background: radial-gradient(circle, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
                                box-shadow: 0 0 12px rgba(255, 105, 0, 0.6), 0 0 24px rgba(0, 168, 225, 0.6), inset 0 0 8px rgba(255, 255, 255, 0.8);
                            "></div>
                            <div style="
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                border: 2px solid rgba(0, 168, 225, 0.3);
                                border-radius: 50%;
                                animation: pulse 2s infinite;
                            "></div>
                            <div style="
                                position: absolute;
                                width: 24px;
                                height: 24px;
                                border: 2px solid transparent;
                                border-left: 2px solid #00a8e1;
                                border-bottom: 2px solid #ff6900;
                                border-radius: 50%;
                                animation: spin-reverse 1.5s linear infinite;
                            "></div>
                        </div>
                    `;
                    
                    button.appendChild(spinnerContainer);
                    
                    try {                        // Extrair dados do produto do botão ou elemento pai
                        let productData = {};
                        
                        // Primeiro: Tentar extrair dados diretamente do botão
                        if (button.dataset.productId) {
                            productData.id = button.dataset.productId;
                            productData.name = button.dataset.productName;
                            productData.price = button.dataset.productPrice;
                            productData.image = button.dataset.productImage;
                        }
                        
                        // Segundo: Tentar encontrar dados do produto no elemento pai
                        if (!productData.id) {
                            const productCard = button.closest('[data-product-id]') || 
                                              button.closest('.product-card') || 
                                              button.closest(`.${styles?.productItem || 'product-item'}`);
                            
                            if (productCard) {
                                productData.id = productCard.dataset.productId;
                                productData.name = productCard.dataset.productName || 
                                                productCard.querySelector('.product-title, .product-name, h3')?.textContent?.trim();
                                productData.price = productCard.dataset.productPrice || 
                                                  productCard.querySelector('.price, .product-price')?.textContent?.trim();
                                productData.image = productCard.querySelector('img')?.src;
                            }
                        }
                        
                        // Terceiro: Fallback para busca manual nos elementos
                        if (!productData.id) {
                            productData.id = button.closest('form')?.querySelector('[name="product_id"]')?.value ||
                                            button.getAttribute('data-product-id');
                        }
                        
                        // Garantir que temos pelo menos um ID válido
                        if (!productData.id) {
                            console.warn('⚠️ [Homepage Button] Não foi possível extrair ID do produto, usando fallback');
                            productData.id = 137; // Fallback para produto teste
                        }
                        
                        console.log('🔍 [Homepage Button] Dados do produto extraídos:', {
                            id: productData.id,
                            name: productData.name,
                            price: productData.price,
                            image: productData.image,
                            buttonElement: button.className,
                            parentElement: button.parentElement?.className
                        });                        // Chamar a API REST v2
                        const response = await fetch('/api/v2/cart', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                product: {
                                    id: productData.id || 137, // Fallback para produto teste
                                    name: productData.name || 'Produto da Homepage',
                                    price: productData.price || 220.00,
                                    image: productData.image || null
                                },
                                quantity: 1
                            })
                        });

                        const result = await response.json();
                        
                        if (result.success) {
                            console.log('✅ [Homepage Button] Produto adicionado com sucesso!');
                            
                            // FASE 2: MOSTRAR FEEDBACK DE SUCESSO (ainda sem botão)
                            button.innerHTML = '';
                            button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                            button.style.border = 'none';
                            button.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                            button.style.color = 'white';
                            button.style.borderRadius = originalStyles.borderRadius;
                            button.style.minHeight = '48px';
                            
                            // Container do ícone de sucesso
                            const successContainer = document.createElement('div');
                            successContainer.style.cssText = `
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                width: 100%;
                                height: 100%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                z-index: 1000;
                            `;
                            
                            successContainer.innerHTML = `
                                <div style="
                                    width: 40px;
                                    height: 40px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    background: white;
                                    border-radius: 50%;
                                    animation: successPulse 0.6s ease-out;
                                ">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            `;
                            
                            button.appendChild(successContainer);
                            
                            // Vibração de sucesso no mobile
                            if (navigator.vibrate) {
                                navigator.vibrate(100);
                            }
                            
                            // Mostrar notificação de sucesso se disponível
                            if (window.showNotification) {
                                window.showNotification('Produto adicionado ao carrinho!', 'success');
                            }
                            
                            // Atualizar contador do carrinho se disponível
                            if (window.updateCartCount) {
                                window.updateCartCount();
                            }
                            
                            // Disparar evento personalizado para atualizar outras partes da aplicação
                            window.dispatchEvent(new CustomEvent('cartUpdated', { 
                                detail: { product: productData, quantity: 1 } 
                            }));
                            
                            // NOVO: Disparar evento específico para o contador do Layout
                            window.dispatchEvent(new CustomEvent('productAddedToCart', {
                                detail: {
                                    productId: productData.id,
                                    productName: productData.name,
                                    quantity: 1,
                                    timestamp: Date.now()
                                }
                            }));

                            // NOVO: Atualizar contador global se disponível
                            if (window.updateCartCount && typeof window.updateCartCount === 'function') {
                                try {
                                    await window.updateCartCount();
                                    console.log('[Homepage Button] ✅ Contador global atualizado');
                                } catch (updateError) {
                                    console.log('[Homepage Button] ⚠️ Erro ao atualizar contador global:', updateError);
                                }
                            }

                            // FASE 3: AGUARDAR 2 SEGUNDOS E RESTAURAR O BOTÃO ORIGINAL
                            setTimeout(() => {
                                button.innerHTML = originalContent;
                                button.style.background = originalStyles.background;
                                button.style.color = originalStyles.color;
                                button.style.border = originalStyles.border;
                                button.style.padding = originalStyles.padding;
                                button.style.borderRadius = originalStyles.borderRadius;
                                button.style.fontSize = originalStyles.fontSize;
                                button.style.fontWeight = originalStyles.fontWeight;
                                button.style.textTransform = originalStyles.textTransform;
                                button.style.boxShadow = originalStyles.boxShadow;
                                button.style.minHeight = '';
                                button.style.position = '';
                            }, 2000);
                            
                        } else {
                            throw new Error(result.error || 'Erro ao adicionar produto');
                        }
                        
                    } catch (error) {
                        console.error('❌ [Homepage Button] Erro:', error);
                        
                        // FASE 2 (ERRO): MOSTRAR FEEDBACK DE ERRO (ainda sem botão)
                        button.innerHTML = '';
                        button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                        button.style.border = 'none';
                        button.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                        button.style.color = 'white';
                        button.style.borderRadius = originalStyles.borderRadius;
                        button.style.minHeight = '48px';
                        
                        // Container do ícone de erro
                        const errorContainer = document.createElement('div');
                        errorContainer.style.cssText = `
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 100%;
                            height: 100%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 1000;
                        `;
                        
                        errorContainer.innerHTML = `
                            <div style="
                                width: 40px;
                                height: 40px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                background: white;
                                border-radius: 50%;
                                animation: errorPulse 0.6s ease-out;
                            ">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        `;
                        
                        button.appendChild(errorContainer);
                        
                        // Vibração de erro no mobile
                        if (navigator.vibrate) {
                            navigator.vibrate([100, 100, 100]);
                        }
                        
                        // Mostrar notificação de erro se disponível
                        if (window.showNotification) {
                            window.showNotification('Erro ao adicionar produto ao carrinho', 'error');
                        }
                        
                        // FASE 3 (ERRO): AGUARDAR 2 SEGUNDOS E RESTAURAR O BOTÃO ORIGINAL
                        setTimeout(() => {
                            button.innerHTML = originalContent;
                            button.style.background = originalStyles.background;
                            button.style.color = originalStyles.color;
                            button.style.border = originalStyles.border;
                            button.style.padding = originalStyles.padding;
                            button.style.borderRadius = originalStyles.borderRadius;
                            button.style.fontSize = originalStyles.fontSize;
                            button.style.fontWeight = originalStyles.fontWeight;
                            button.style.textTransform = originalStyles.textTransform;
                            button.style.boxShadow = originalStyles.boxShadow;
                            button.style.minHeight = '';
                            button.style.position = '';
                        }, 2000);
                    }
                };
            });
        };
        
        // Inicializar imediatamente se o DOM já estiver carregado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initButtons);
        } else {
            initButtons();
        }
        
        // Também observar mudanças no DOM para novos botões (produtos carregados dinamicamente)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const newButtons = node.querySelectorAll ? 
                            node.querySelectorAll('.FeaturedProducts_addToCartBtn__vEsKP') : 
                            [];
                        
                        if (newButtons.length > 0) {
                            setTimeout(initButtons, 100); // Delay para garantir que o elemento esteja completamente renderizado
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        // Adicionar estilos CSS para animações
        if (!document.getElementById('homepage-button-styles')) {
            const style = document.createElement('style');
            style.id = 'homepage-button-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes spin-reverse {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(-360deg); }
                }
                
                @keyframes gradient-shift {
                    0%, 100% {
                        border-top-color: #ff6900;
                        border-right-color: #00a8e1;
                    }
                    50% {
                        border-top-color: #00a8e1;
                        border-right-color: #ff6900;
                    }
                }
                
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.6;
                    }
                    50% {
                        transform: scale(1.2);
                        opacity: 0.3;
                    }
                }
                
                @keyframes successPulse {
                    0% { transform: scale(0.8); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                @keyframes errorPulse {
                    0% { transform: scale(0.8); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }
};

export default AddToCartButton;
