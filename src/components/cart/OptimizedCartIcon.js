import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import styles from '../../styles/OptimizedCartIcon.module.css';
import { useCartContext } from '../../contexts/CartContext';

/**
 * Componente de Mini Carrinho Otimizado
 * - Renderização eficiente com memoização
 * - Animação ao atualizar quantidade
 * - Feedback visual para alterações no carrinho
 */
const OptimizedCartIcon = ({ className, onClick }) => {
    // Obter dados do carrinho do contexto
    const { cartCount } = useCartContext();
    
    // Estado para gerenciar animação de atualização
    const [animateCount, setAnimateCount] = useState(false);
    const [prevCount, setPrevCount] = useState(cartCount);
    
    // Detectar alterações na contagem do carrinho para acionar animação
    useEffect(() => {
        if (prevCount !== cartCount) {
            // Ativar animação apenas se houver mudança real
            setAnimateCount(true);
            
            // Desativar após completar a animação
            const timer = setTimeout(() => {
                setAnimateCount(false);
            }, 800);
            
            // Atualizar contagem anterior
            setPrevCount(cartCount);
            
            return () => clearTimeout(timer);
        }
    }, [cartCount, prevCount]);
    
    // Classes condicionais para animação
    const countClasses = [
        styles.cartCount || "cart-count",
        animateCount ? (styles.cartCountAnimate || "cart-count-animate") : ""
    ].filter(Boolean).join(' ');
    
    // Se onClick é fornecido, renderiza um botão, caso contrário, um link
    if (onClick) {
        return (
            <button 
                onClick={onClick}
                className={`${styles.cartIconContainer || "cart-icon-container"} ${className || ''}`}
                aria-label="Carrinho de compras"
                data-count={cartCount || 0}
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
                    className={styles.cartIcon || "cart-icon"}
                >
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartCount > 0 && (
                    <span className={countClasses}>
                        {cartCount}
                    </span>
                )}
            </button>
        );
    }
    
    return (
        <Link href="/carrinho">
            <a className={`${styles.cartIconContainer || "cart-icon-container"} ${className || ''}`} data-count={cartCount || 0}>
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
                    className={styles.cartIcon || "cart-icon"}
                >
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartCount > 0 && (
                    <span className={countClasses}>
                        {cartCount}
                    </span>
                )}
            </a>
        </Link>
    );
};

export default React.memo(OptimizedCartIcon);
