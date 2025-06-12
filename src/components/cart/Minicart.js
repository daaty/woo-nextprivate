import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/**
 * Componente Minicart atualizado para funcionar com a API REST
 * Mostra contador de itens e valor total do carrinho
 */
const Minicart = ({ className = '' }) => {
  const [cartData, setCartData] = useState({
    items: [],
    itemsCount: 0,
    total: 'R$ 0,00',
    totalNumeric: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const updateTimeoutRef = useRef(null);
  const componentMountedRef = useRef(true);

  // Função para buscar dados do carrinho via API REST
  const fetchCartData = async () => {
    if (!componentMountedRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[Minicart] 🔄 Buscando dados do carrinho...');
      
      const response = await fetch('/api/cart/simple-get', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!componentMountedRef.current) return;      if (result.success && result.cart) {
        const newCartData = {
          items: result.cart.items || [],
          itemsCount: result.cart.items_count || 0,
          total: result.cart.total || 'R$ 0,00',
          totalNumeric: result.cart.total_numeric || 0,
          // Novos campos para suportar o sistema de carrinho melhorado
          totalItemTypes: result.cart.totalItemTypes || result.cart.items.length,
          hasMoreItems: result.cart.hasMoreItems || false,
          itemsInCookie: result.cart.itemsInCookie || result.cart.items.length
        };
        
        setCartData(newCartData);
        console.log('[Minicart] ✅ Dados do carrinho atualizados:', newCartData);
        
        // Verificar se há itens que não foram incluídos no cookie por limitações de tamanho
        if (newCartData.hasMoreItems) {
          console.log(`[Minicart] ℹ️ O carrinho tem mais itens (${newCartData.totalItemTypes}) do que os exibidos (${newCartData.items.length})`);
        }
      } else {
        console.log('[Minicart] ⚠️ Carrinho vazio ou inválido');
        setCartData({
          items: [],
          itemsCount: 0,
          total: 'R$ 0,00',
          totalNumeric: 0
        });
      }
    } catch (err) {
      console.error('[Minicart] ❌ Erro ao buscar carrinho:', err);
      setError(err.message);
      
      if (componentMountedRef.current) {
        // Em caso de erro, tentar usar dados do cookie como fallback
        try {
          const cookieCart = document.cookie
            .split('; ')
            .find(row => row.startsWith('simple_cart='));
          
          if (cookieCart) {
            const cartFromCookie = JSON.parse(decodeURIComponent(cookieCart.split('=')[1]));
            if (cartFromCookie && cartFromCookie.items) {
              setCartData({
                items: cartFromCookie.items || [],
                itemsCount: cartFromCookie.items_count || 0,
                total: cartFromCookie.total || 'R$ 0,00',
                totalNumeric: cartFromCookie.total_numeric || 0
              });
              console.log('[Minicart] 📦 Usando dados do cookie como fallback');
            }
          }
        } catch (cookieError) {
          console.error('[Minicart] ❌ Erro ao ler cookie:', cookieError);
        }
      }
    } finally {
      if (componentMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Função para atualizar o carrinho com debounce
  const debouncedUpdate = () => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      fetchCartData();
    }, 300); // Debounce de 300ms
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchCartData();
    
    return () => {
      componentMountedRef.current = false;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Escutar eventos de atualização do carrinho
  useEffect(() => {
    const handleCartUpdate = (event) => {
      console.log('[Minicart] 🔔 Evento de atualização do carrinho recebido:', event.detail);
      debouncedUpdate();
    };

    const handleStorageChange = (event) => {
      if (event.key === 'simple_cart' || event.key === null) {
        console.log('[Minicart] 🔔 Mudança no localStorage detectada');
        debouncedUpdate();
      }
    };

    const handleCookieChange = () => {
      console.log('[Minicart] 🔔 Mudança no cookie detectada');
      debouncedUpdate();
    };

    // Escutar eventos personalizados
    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    // Escutar mudanças no cookie (usando polling como fallback)
    const cookieWatcher = setInterval(handleCookieChange, 2000);
    
    // Escutar eventos específicos de adicionar/remover do carrinho
    window.addEventListener('productAddedToCart', handleCartUpdate);
    window.addEventListener('productRemovedFromCart', handleCartUpdate);
    window.addEventListener('cartCleared', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productAddedToCart', handleCartUpdate);
      window.removeEventListener('productRemovedFromCart', handleCartUpdate);
      window.removeEventListener('cartCleared', handleCartUpdate);
      clearInterval(cookieWatcher);
    };
  }, []);

  // Toggle do minicart
  const toggleMinicart = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Atualizar dados quando abrir
      fetchCartData();
    }
  };

  // Fechar minicart quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      const minicart = document.querySelector('.minicart-dropdown');
      if (minicart && !minicart.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={`minicart-container ${className}`}>
      {/* Botão do carrinho */}
      <button 
        onClick={toggleMinicart}
        className="minicart-trigger"
        aria-label="Abrir carrinho de compras"
      >
        {/* Ícone do carrinho */}
        <svg 
          className="minicart-icon" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H20.5" 
          />
        </svg>
        
        {/* Badge com contador */}
        {cartData.itemsCount > 0 && (
          <span className="minicart-badge">
            {cartData.itemsCount > 99 ? '99+' : cartData.itemsCount}
          </span>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="minicart-loading">
            <div className="loading-dot"></div>
          </div>
        )}
      </button>

      {/* Dropdown do minicart */}
      {isOpen && (
        <div className="minicart-dropdown">
          <div className="minicart-header">
            <h3>Meu Carrinho</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="minicart-close"
              aria-label="Fechar carrinho"
            >
              ×
            </button>
          </div>

          <div className="minicart-content">
            {error && (
              <div className="minicart-error">
                <p>Erro ao carregar carrinho</p>
                <button onClick={fetchCartData} className="minicart-retry">
                  Tentar novamente
                </button>
              </div>
            )}

            {!error && cartData.items.length === 0 ? (
              <div className="minicart-empty">
                <p>Seu carrinho está vazio</p>
                <Link href="/">
                  <a className="minicart-shop-btn">Continuar Comprando</a>
                </Link>
              </div>
            ) : (
              <>                {/* Lista de itens */}
                <div className="minicart-items">
                  {cartData.items.map((item, index) => (
                    <div key={item.cartKey || index} className="minicart-item">
                      <img 
                        src={item.image?.sourceUrl || '/placeholder-product.jpg'} 
                        alt={item.name}
                        className="minicart-item-image"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.jpg';
                        }}
                      />
                      <div className="minicart-item-details">
                        <h4>{item.name}</h4>
                        <p>{item.quantity || item.qty}x {item.price || item.totalPrice}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Mostrar mensagem quando há mais itens no carrinho do que os exibidos */}
                  {cartData.hasMoreItems && cartData.totalItemTypes > cartData.items.length && (
                    <div className="minicart-more">
                      +{cartData.totalItemTypes - cartData.items.length} {cartData.totalItemTypes - cartData.items.length === 1 ? 'item a mais' : 'itens a mais'}
                      <Link href="/cart">
                        <a className="minicart-view-all">Ver todos os itens</a>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="minicart-total">
                  <div className="minicart-total-row">
                    <span>Total:</span>
                    <span className="minicart-total-value">{cartData.total}</span>
                  </div>
                </div>                {/* Ações */}
                <div className="minicart-actions">
                  <Link href="/cart">
                    <a className="minicart-view-cart" onClick={() => setIsOpen(false)}>
                      Ver Carrinho
                    </a>
                  </Link>
                  <Link href="/checkout">
                    <a className="minicart-checkout" onClick={() => setIsOpen(false)}>
                      Finalizar Compra
                    </a>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .minicart-container {
          position: relative;
          display: inline-block;
        }

        .minicart-trigger {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .minicart-trigger:hover {
          background: rgba(255, 105, 0, 0.1);
        }

        .minicart-icon {
          width: 24px;
          height: 24px;
          color: #333;
        }

        .minicart-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%);
          color: white;
          border-radius: 50%;
          min-width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          transform: translate(25%, -25%);
          animation: ${cartData.itemsCount > 0 ? 'badgePulse 0.6s ease-out' : 'none'};
        }

        .minicart-loading {
          position: absolute;
          top: 50%;
          right: -4px;
          transform: translateY(-50%);
        }

        .loading-dot {
          width: 6px;
          height: 6px;
          background: #ff6900;
          border-radius: 50%;
          animation: loadingPulse 1.5s infinite;
        }

        .minicart-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
          width: 320px;
          max-height: 400px;
          z-index: 1000;
          animation: dropdownSlide 0.3s ease-out;
          overflow: hidden;
        }

        .minicart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f3f4;
          background: #f9fafb;
        }

        .minicart-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .minicart-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .minicart-content {
          padding: 20px;
        }

        .minicart-error {
          text-align: center;
          padding: 20px 0;
        }

        .minicart-retry {
          background: #ff6900;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 8px;
        }

        .minicart-empty {
          text-align: center;
          padding: 40px 0;
        }

        .minicart-empty p {
          color: #666;
          margin-bottom: 16px;
        }

        .minicart-shop-btn {
          background: #ff6900;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
        }

        .minicart-shop-btn:hover {
          background: #e55a00;
        }

        .minicart-items {
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 16px;
        }

        .minicart-item {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f1f3f4;
        }

        .minicart-item:last-child {
          border-bottom: none;
        }

        .minicart-item-image {
          width: 50px;
          height: 50px;
          border-radius: 6px;
          object-fit: cover;
          margin-right: 12px;
        }

        .minicart-item-details {
          flex: 1;
        }

        .minicart-item-details h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          line-height: 1.3;
        }

        .minicart-item-details p {
          margin: 0;
          font-size: 12px;
          color: #666;
        }

        .minicart-more {
          text-align: center;
          padding: 8px 0;
          font-size: 12px;
          color: #666;
          font-style: italic;
        }

        .minicart-total {
          border-top: 1px solid #f1f3f4;
          padding-top: 16px;
          margin-bottom: 16px;
        }

        .minicart-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
        }

        .minicart-total-value {
          color: #ff6900;
          font-size: 18px;
        }

        .minicart-actions {
          display: flex;
          gap: 8px;
        }

        .minicart-view-cart,
        .minicart-checkout {
          flex: 1;
          text-align: center;
          padding: 12px 16px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
        }

        .minicart-view-cart {
          background: #f3f4f6;
          color: #374151;
        }

        .minicart-view-cart:hover {
          background: #e5e7eb;
        }

        .minicart-checkout {
          background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%);
          color: white;
        }

        .minicart-checkout:hover {
          background: linear-gradient(135deg, #e55a00 0%, #e57300 100%);
          transform: translateY(-1px);
        }

        @keyframes badgePulse {
          0% { transform: translate(25%, -25%) scale(0.8); }
          50% { transform: translate(25%, -25%) scale(1.2); }
          100% { transform: translate(25%, -25%) scale(1); }
        }

        @keyframes loadingPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes dropdownSlide {
          from { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        /* Responsivo */
        @media (max-width: 768px) {
          .minicart-dropdown {
            width: 280px;
            right: -20px;
          }
        }

        @media (max-width: 480px) {
          .minicart-dropdown {
            width: 260px;
            right: -40px;
          }
        }
      `}</style>
    </div>
  );
};

export default Minicart;