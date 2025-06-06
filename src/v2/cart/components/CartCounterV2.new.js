import React from 'react';
import { useCartCountV2 } from '../hooks/useCartCountV2';
import styles from './CartCounterV2.module.css';

/**
 * Componente do contador do carrinho V2
 * Isolado e simplificado, usando apenas a API V2
 */
export const CartCounterV2 = () => {
    const { count, loading } = useCartCountV2();
    
    // Debug para verificar os valores
    console.log('[CartCounterV2] 🎯 Renderizando com:', { count, loading });
    
    // Durante o loading, mostramos um placeholder
    if (loading) {
        return <span className={styles.counter}>...</span>;
    }
    
    // Sempre mostramos o contador, mesmo quando for 0
    return (
        <span className={styles.counter}>
            {count}
        </span>
    );
};
