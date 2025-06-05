import React, { useState, useEffect } from 'react';

const InlineCartCounter = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // Fun��o para buscar e atualizar o contador
    const fetchCartCount = async () => {
      try {
        const response = await fetch('/api/v2/cart', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin'
        });
        
        if (!response.ok) return;
        
        const result = await response.json();
        console.log('[InlineCartCounter] API response:', result);
        
        // Calcular total de itens
        if (result.success && Array.isArray(result.data)) {
          const totalItems = result.data.reduce((sum, item) => {
            const qty = parseInt(item.quantity || 0);
            return sum + (isNaN(qty) ? 0 : qty);
          }, 0);
          
          console.log(`[InlineCartCounter] Total items: ${totalItems}`);
          setCount(totalItems);
        }
      } catch (error) {
        console.error('[InlineCartCounter] Error:', error);
      }
    };
    
    // Buscar dados inicialmente
    fetchCartCount();
    
    // Verificar a cada 3 segundos
    const interval = setInterval(fetchCartCount, 3000);
    
    // Ouvir eventos de atualiza��o do carrinho
    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);
  
  // Se n�o tiver itens, n�o mostra nada
  if (count === 0) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        backgroundColor: '#ff6900',
        color: 'white',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 9999,
      }}
    >
      {count}
    </div>
  );
};

export default InlineCartCounter;
