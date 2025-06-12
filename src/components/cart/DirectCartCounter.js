import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Componente de contador de carrinho fixo garantido
const DirectCartCounter = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/v2/cart', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin'
        });
        
        if (!response.ok) return;
        
        const result = await response.json();
        
        // Calcular quantidade total
        let totalCount = 0;
        if (result.success && Array.isArray(result.data)) {
          totalCount = result.data.reduce((sum, item) => {
            const qty = parseInt(item.quantity || 0);
            return sum + (isNaN(qty) ? 0 : qty);
          }, 0);
        }
        
        console.log(`[DirectCartCounter] Count: ${totalCount}`);
        setCount(totalCount);
      } catch (error) {
        console.error('Erro ao buscar carrinho:', error);
      }
    };
    
    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <span
      style={{
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        backgroundColor: '#ff6900',
        color: 'white',
        borderRadius: '50%',
        width: '18px',
        height: '18px',
        fontSize: '11px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      {count || '0'}
    </span>
  );
};

export default DirectCartCounter;
