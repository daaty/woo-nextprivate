import React from 'react';
import Link from 'next/link';
import MiniCartCounter from '../../v2/cart/components/MiniCartCounter';
import styles from '../../styles/OptimizedCartIcon.module.css';

/**
 * Componente de ícone do carrinho que integra o contador Cart v2
 * Este componente é uma ponte entre o sistema original e o Cart v2
 */
const CartIconWithV2Counter = ({ className, onClick }) => {
  // Renderiza o componente como botão quando onClick é fornecido, caso contrário como link
  const content = (
    <div className={`${styles.cartIconContainer || "cart-icon-container"} ${className || ''}`}>
      {/* O MiniCartCounter já inclui ícone e contador */}
      <MiniCartCounter className="cart-v2-counter" />
    </div>
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick} 
        className="cart-button-container"
        aria-label="Carrinho de compras"
      >
        {content}
      </button>
    );
  }  return (
    <Link href="/cart" passHref>
      <a className="cart-link-container">
        {content}
      </a>
    </Link>
  );
};

export default React.memo(CartIconWithV2Counter);
