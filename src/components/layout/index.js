import { useState, useEffect } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import { useCartCount } from '../../contexts/CartContext'; // NOVO: Import específico para contador

const Layout = ({ children, headerFooter, className }) => {
  const { cartCount, contextReady, updateCartCount } = useCartCount(); // NOVO: Usar hook específico
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // NOVO: Efeito para atualizar contador quando o componente montar
  useEffect(() => {
    if (contextReady) {
      console.log('[Layout] 🔄 Contexto pronto, contador atual:', cartCount);
      
      // Registrar função global para atualização do contador
      if (typeof window !== 'undefined') {
        window.updateCartCount = updateCartCount;
      }
    }
  }, [contextReady, cartCount, updateCartCount]);

  // NOVO: Efeito para escutar eventos de atualização do carrinho no Layout
  useEffect(() => {
    const handleCartEvent = () => {
      console.log('[Layout] 🔔 Evento de carrinho recebido, atualizando contador');
      if (updateCartCount) {
        updateCartCount();
      }
    };

    // Escutar eventos de carrinho
    window.addEventListener('cartUpdated', handleCartEvent);
    window.addEventListener('productAddedToCart', handleCartEvent);
    window.addEventListener('productRemovedFromCart', handleCartEvent);

    return () => {
      window.removeEventListener('cartUpdated', handleCartEvent);
      window.removeEventListener('productAddedToCart', handleCartEvent);
      window.removeEventListener('productRemovedFromCart', handleCartEvent);
    };
  }, [updateCartCount]);

  return (
    <div className={className}>
      {headerFooter?.header ? (
        <Header 
          header={headerFooter.header} 
          cartCount={cartCount} // NOVO: Passar contador atualizado
          contextReady={contextReady} // NOVO: Passar status de prontidão
        />
      ) : (
        ''
      )}
      <main>{children}</main>
      {headerFooter?.footer && <Footer footer={headerFooter.footer} />}
    </div>
  );
};

export default Layout;