// Hook especializado para o contador do carrinho V2
import { useState, useEffect } from 'react';

/**
 * Hook para gerenciar o contador do carrinho usando apenas a API V2
 * Totalmente isolado do sistema antigo para evitar conflitos
 */
export const useCartCountV2 = () => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Função para buscar a contagem atual
    const fetchCount = async () => {
        console.log('[CartCountV2] 🔄 Iniciando fetch do contador...');
        try {
            const response = await fetch('/api/v2/cart/', {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('[CartCountV2] 📦 Resposta da API:', data);
            
            // Calcula a contagem total dos itens
            if (data.success && data.items) {
                let newCount = data.items.reduce((total, item) => {
                    return total + (parseInt(item.quantity) || 0);
                }, 0);

                console.log('[CartCountV2] 🔢 Contagem calculada:', newCount);
                setCount(newCount);
                console.log('[CartCountV2] ✅ Contador atualizado:', newCount);
            } else {
                // Reseta para 0 se não houver itens
                setCount(0);
                console.log('[CartCountV2] ℹ️ Nenhum item no carrinho');
            }
            
            setLoading(false);
            setError(null);
            
        } catch (err) {
            console.error('[CartCountV2] ❌ Erro ao buscar contagem:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    // Busca inicial
    useEffect(() => {
        fetchCount();
    }, []);

    // Listener para eventos de atualização do carrinho
    useEffect(() => {
        const handleCartUpdate = () => {
            console.log('[CartCountV2] 🔄 Evento de atualização detectado');
            fetchCount();
        };

        // Escuta todos os eventos relevantes
        window.addEventListener('cartUpdated', handleCartUpdate);
        window.addEventListener('productAddedToCart', handleCartUpdate);
        window.addEventListener('productRemovedFromCart', handleCartUpdate);
        window.addEventListener('cartCleared', handleCartUpdate);
        window.addEventListener('minicartUpdate', handleCartUpdate);

        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
            window.removeEventListener('productAddedToCart', handleCartUpdate);
            window.removeEventListener('productRemovedFromCart', handleCartUpdate);
            window.removeEventListener('cartCleared', handleCartUpdate);
            window.removeEventListener('minicartUpdate', handleCartUpdate);
        };
    }, []);

    return {
        count,
        loading,
        error,
        refresh: fetchCount
    };
};
