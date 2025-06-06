import React from 'react';
import { useCartV2 } from '../context/CartProvider';

/**
 * Simple Mini Cart Counter Component
 * Shows cart item count with Cart v2 integration
 */
const MiniCartCounter = ({ className = '' }) => {
  const { cartCount, loading } = useCartV2();

  return (
    <div className={`mini-cart-counter ${className}`}>
      {/* Cart Icon */}
      <div className="relative inline-block">
        {/* Shopping Cart SVG Icon */}
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-700 hover:text-gray-900 transition-colors"
        >
          <path 
            d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13M17 13H7" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <circle cx="9" cy="20" r="1" stroke="currentColor" strokeWidth="2"/>
          <circle cx="20" cy="20" r="1" stroke="currentColor" strokeWidth="2"/>
        </svg>
        
        {/* Cart Counter Badge */}
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <span className="absolute -top-1 -right-1 animate-spin">
            <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
};

export default MiniCartCounter;
