import React, { useState, useCallback } from 'react';
import Link from "next/link";
import cx from 'classnames';
import { useCartV2 } from '../context/CartProvider';
import LoadingSpinner from '../../../components/LoadingSpinner';

/**
 * Cart v2 AddToCartButton Component
 * Simple version that adds products to cart using the simplified session management
 */
const AddToCartButtonV2 = ({ 
    product, 
    quantity = 1, 
    showModal = true,
    className = '',
    disabled = false,
    onSuccess,
    onError
}) => {
    const { addToCart, loading, error } = useCartV2();
    const [isAdding, setIsAdding] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Handle add to cart action
    const handleAddToCart = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (disabled || isAdding) return;

        console.log('[AddToCartButton v2] Adding product to cart:', {
            productId: product?.id,
            quantity,
            productName: product?.name
        });

        setIsAdding(true);

        try {
            const result = await addToCart(product, quantity);

            if (result.success) {
                console.log('[AddToCartButton v2] Product added successfully');
                
                if (showModal) {
                    setShowConfirmModal(true);
                }
                
                if (onSuccess) {
                    onSuccess(result);
                }
            } else {
                console.error('[AddToCartButton v2] Failed to add product:', result.error);
                if (onError) {
                    onError(result.error);
                }
            }
        } catch (err) {
            console.error('[AddToCartButton v2] Error adding to cart:', err);
            if (onError) {
                onError(err.message);
            }
        } finally {
            setIsAdding(false);
        }
    }, [product, quantity, disabled, isAdding, addToCart, showModal, onSuccess, onError]);

    // Handle modal actions
    const handleGoToCart = () => {
        setShowConfirmModal(false);
        window.location.href = '/cart';
    };

    const handleContinueShopping = () => {
        setShowConfirmModal(false);
    };

    // Don't render if no product
    if (!product) {
        return null;
    }

    const isLoading = loading || isAdding;

    return (
        <>
            <button
                onClick={handleAddToCart}
                disabled={disabled || isLoading}
                className={cx(
                    'add-to-cart-btn-v2',
                    {
                        'loading': isLoading,
                        'disabled': disabled
                    },
                    className
                )}
                type="button"
            >
                {isLoading ? (
                    <>
                        <LoadingSpinner />
                        <span>Adicionando...</span>
                    </>
                ) : (
                    <>
                        <svg className="cart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H20.5" />
                        </svg>
                        <span>Adicionar ao Carrinho</span>
                    </>
                )}
            </button>

            {/* Success Modal */}
            {showConfirmModal && (
                <ProductAddedModal
                    isOpen={showConfirmModal}
                    onClose={handleContinueShopping}
                    onGoToCart={handleGoToCart}
                    onContinueShopping={handleContinueShopping}
                    productName={product.name}
                    quantity={quantity}
                />
            )}

            {/* Error Display */}
            {error && (
                <div className="add-to-cart-error">
                    {error}
                </div>
            )}

            <style jsx>{`
                .add-to-cart-btn-v2 {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    min-height: 48px;
                    text-decoration: none;
                }

                .add-to-cart-btn-v2:hover:not(.disabled):not(.loading) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                }

                .add-to-cart-btn-v2:active:not(.disabled):not(.loading) {
                    transform: translateY(0);
                }

                .add-to-cart-btn-v2.disabled,
                .add-to-cart-btn-v2.loading {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .cart-icon {
                    width: 20px;
                    height: 20px;
                }

                .add-to-cart-error {
                    margin-top: 8px;
                    padding: 8px 12px;
                    background: #fee;
                    color: #c53030;
                    border-radius: 4px;
                    font-size: 14px;
                }
            `}</style>
        </>
    );
};

/**
 * Product Added Confirmation Modal
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
                    margin: 0 auto 16px;
                }

                .modal-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1a202c;
                    margin-bottom: 8px;
                }

                .modal-subtitle {
                    color: #718096;
                    font-size: 16px;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 16px;
                    flex-direction: column;
                }

                .modal-action-primary,
                .modal-action-secondary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 14px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                }

                .modal-action-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .modal-action-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                }

                .modal-action-secondary {
                    background: #f7fafc;
                    color: #4a5568;
                    border: 2px solid #e2e8f0;
                }

                .modal-action-secondary:hover {
                    background: #edf2f7;
                    border-color: #cbd5e0;
                }

                .modal-footer {
                    font-size: 14px;
                    color: #718096;
                    margin: 0;
                }

                .security-text {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes modalSlideIn {
                    from { 
                        opacity: 0;
                        transform: translateY(-50px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @media (min-width: 768px) {
                    .modal-actions {
                        flex-direction: row;
                    }
                }
            `}</style>
        </div>
    );
};

export default AddToCartButtonV2;