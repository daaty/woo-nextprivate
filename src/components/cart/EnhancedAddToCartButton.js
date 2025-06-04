import React, { useState, useCallback } from 'react';
import Link from "next/link";
import { useRouter } from 'next/router';
import { useAddToCart } from '../../hooks/useAddToCart';
import { ADD_TO_CART_CONFIG } from '../../config/addToCartConfig';
import StandardAddToCartButton from './StandardAddToCartButton';
import LoadingSpinner from '../LoadingSpinner';

/**
 * Enhanced Product Added Modal with consistent styling
 */
const ProductAddedModal = ({ isOpen, onClose, onGoToCart, onContinueShopping, productName, quantity }) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl transform transition-all">
                    <div className="p-6">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">
                            Produto adicionado ao carrinho!
                        </h2>
                        
                        <p className="text-gray-600 text-center mb-6">
                            {quantity}x {productName} foi adicionado com sucesso
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                                onClick={onGoToCart}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H20.5" />
                                </svg>
                                Ir para o Carrinho
                            </button>
                            
                            <button 
                                onClick={onContinueShopping}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
                            >
                                Continuar Comprando
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Fechar modal"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

/**
 * Legacy AddToCartButton wrapper that uses the new standardized approach
 * Maintains backward compatibility while providing enhanced functionality
 */
const AddToCartButton = ({ 
    product, 
    quantity = 1, 
    variation = null,
    showModal = false,
    onSuccess,
    onError,
    className = '',
    buttonText,
    size = 'medium',
    variant = 'primary',
    fullWidth = false,
    ...props 
}) => {
    const router = useRouter();
    const [modalOpen, setModalOpen] = useState(false);
    const { addToCart, loading, error, success } = useAddToCart();

    // Determine if we should show modal based on config and props
    const shouldShowModal = showModal || ADD_TO_CART_CONFIG.SHOW_SUCCESS_MODAL.default;

    const handleAddToCart = useCallback(async () => {
        if (!product || loading) return;

        const result = await addToCart(product, quantity, variation);
        
        if (result) {
            if (shouldShowModal) {
                setModalOpen(true);
            }
            
            if (onSuccess) {
                onSuccess(product, quantity);
            }
        } else if (onError) {
            onError(error);
        }
    }, [product, quantity, variation, loading, addToCart, shouldShowModal, onSuccess, onError, error]);

    const handleGoToCart = useCallback(() => {
        setModalOpen(false);
        router.push('/cart');
    }, [router]);

    const handleContinueShopping = useCallback(() => {
        setModalOpen(false);
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalOpen(false);
    }, []);

    // If product is not available, show disabled state
    if (!product) {
        return (
            <button 
                disabled 
                className={`px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed ${className}`}
            >
                Produto Indisponível
            </button>
        );
    }

    // Check stock status
    const isOutOfStock = product.stockStatus === 'OUT_OF_STOCK' || 
                        (product.stockQuantity !== null && product.stockQuantity <= 0);

    if (isOutOfStock) {
        return (
            <button 
                disabled 
                className={`px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed ${className}`}
            >
                Fora de Estoque
            </button>
        );
    }

    return (
        <>
            <StandardAddToCartButton
                product={product}
                quantity={quantity}
                variation={variation}
                size={size}
                variant={variant}
                fullWidth={fullWidth}
                customText={buttonText}
                onSuccess={handleAddToCart}
                onError={onError}
                className={className}
                {...props}
            />

            <ProductAddedModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                onGoToCart={handleGoToCart}
                onContinueShopping={handleContinueShopping}
                productName={product.name}
                quantity={quantity}
            />
        </>
    );
};

export default AddToCartButton;
