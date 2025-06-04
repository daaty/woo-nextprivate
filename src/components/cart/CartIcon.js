import React, { useMemo } from 'react';
import { useCartContext } from '../../contexts/CartContext';
import Link from 'next/link';
import styles from '../../styles/CartIcon.module.css'; // Make sure to create this CSS module

const CartIcon = ({ className, onClick }) => {
    const { cartCount, cartItems, loading } = useCartContext();
    
    // Memoize cart count calculation for better performance
    const displayCount = useMemo(() => {
        // Fallback calculation if cartCount is not available or seems incorrect
        if (cartItems && Array.isArray(cartItems)) {
            const calculatedCount = cartItems.reduce((total, item) => {
                const qty = parseInt(item.qty || 0);
                return total + (isNaN(qty) ? 0 : qty);
            }, 0);
            
            // Use calculated count if cartCount seems incorrect
            if (cartCount !== calculatedCount) {
                console.log(`[CartIcon] Count mismatch - cartCount: ${cartCount}, calculated: ${calculatedCount}`);
                return calculatedCount;
            }
        }
        
        return cartCount || 0;
    }, [cartCount, cartItems]);
    
    // If onClick is provided, render a button, otherwise render a link
    if (onClick) {
        return (
            <button 
                onClick={onClick}
                className={`${styles.cartIconContainer || "cart-icon-container"} ${className || ''}`}
                aria-label={`Carrinho de compras com ${displayCount} ${displayCount === 1 ? 'item' : 'itens'}`}
                disabled={loading}
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`${styles.cartIcon || "cart-icon"} ${loading ? 'loading' : ''}`}
                >
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {displayCount > 0 && (
                    <span className={`${styles.cartCount || "cart-count"} ${loading ? 'updating' : ''}`}>
                        {displayCount}
                    </span>
                )}
            </button>
        );
    }
    
    return (
        <Link href="/carrinho">
            <a className={`${styles.cartIconContainer || "cart-icon-container"} ${className || ''}`}>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`${styles.cartIcon || "cart-icon"} ${loading ? 'loading' : ''}`}
                >
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {displayCount > 0 && (
                    <span className={`${styles.cartCount || "cart-count"} ${loading ? 'updating' : ''}`}>
                        {displayCount}
                    </span>
                )}
            </a>
        </Link>
    );
};

export default CartIcon;
