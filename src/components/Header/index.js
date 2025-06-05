import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Header do site, incluindo logo, navegação e carrinho
 */
const Header = ({ header, cartCount = 0, contextReady = false }) => { // NOVO: Receber props do Layout
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // NOVO: Efeito para debug do contador
  useEffect(() => {
    console.log('[Header] 📊 Contador atualizado:', {
      cartCount,
      contextReady,
      type: typeof cartCount
    });
  }, [cartCount, contextReady]);

  return (
    <header className="header">
      {/* Logo e nome do site */}
      <div className="logo-container">
        <Link href="/" className="logo-link">
          <img src="/logo.svg" alt="Logo" className="logo" />
          <span className="site-name">Meu Site</span>
        </Link>
      </div>

      {/* Navegação principal */}
      <nav className="main-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <Link href="/" className="nav-link">
              Início
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/sobre" className="nav-link">
              Sobre
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/produtos" className="nav-link">
              Produtos
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/contato" className="nav-link">
              Contato
            </Link>
          </li>
        </ul>
      </nav>

      {/* Contador do carrinho */}        <div className="cart-counter-container">
        <Link href="/cart">
          <a className="cart-link">
            <svg /* ícone do carrinho */ />
            {contextReady && cartCount > 0 && (
              <span className="Layout_cartCount__PzqLI">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </a>
        </Link>
      </div>

      {/* Menu mobile */}
      <div className="mobile-menu-container">
        <button 
          className="mobile-menu-button" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {/* Ícone do menu */}
          <svg 
            className="menu-icon" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M4 12h16m-7 6h7" 
            />
          </svg>
        </button>

        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <h3>Menu</h3>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-menu-close"
                aria-label="Fechar menu"
              >
                ×
              </button>
            </div>

            <div className="mobile-menu-content">
              <ul className="mobile-nav-list">
                <li className="mobile-nav-item">
                  <Link href="/" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    Início
                  </Link>
                </li>
                <li className="mobile-nav-item">
                  <Link href="/sobre" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    Sobre
                  </Link>
                </li>
                <li className="mobile-nav-item">
                  <Link href="/produtos" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    Produtos
                  </Link>
                </li>
                <li className="mobile-nav-item">
                  <Link href="/contato" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    Contato
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .header {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          height: 60px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          z-index: 1000;
        }

        .logo-container {
          display: flex;
          align-items: center;
        }

        .logo-link {
          display: flex;
          align-items: center;
          text-decoration: none;
        }

        .logo {
          width: 40px;
          height: 40px;
          margin-right: 8px;
        }

        .site-name {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .main-nav {
          flex-grow: 1;
          margin: 0 32px;
        }

        .nav-list {
          display: flex;
          justify-content: center;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .nav-item {
          margin: 0 16px;
        }

        .nav-link {
          text-decoration: none;
          color: #333;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: #ff6900;
        }

        .cart-counter-container {
          position: relative;
          display: inline-block;
        }

        .cart-link {
          position: relative;
          display: inline-block;
          padding: 8px;
        }

        .Layout_cartCount__PzqLI {
          position: absolute;
          top: -8px;
          right: -8px;
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
          animation: ${cartCount > 0 ? 'counterPulse 0.6s ease-out' : 'none'};
          z-index: 10;
        }

        @keyframes counterPulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Menu mobile */
        .mobile-menu-container {
          display: none;
        }

        .mobile-menu-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }

        .menu-icon {
          width: 24px;
          height: 24px;
          color: #333;
        }

        @media (max-width: 768px) {
          .mobile-menu-container {
            display: block;
          }

          .main-nav {
            display: none;
          }
        }

        /* Estilos do menu mobile */
        .mobile-menu {
          position: absolute;
          top: 60px;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          width: 250px;
          z-index: 1000;
          animation: dropdownSlide 0.3s ease-out;
        }

        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #f1f3f4;
          background: #f9fafb;
        }

        .mobile-menu-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .mobile-menu-close {
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

        .mobile-nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .mobile-nav-item {
          border-bottom: 1px solid #f1f3f4;
        }

        .mobile-nav-link {
          display: block;
          padding: 16px;
          text-decoration: none;
          color: #333;
          font-weight: 500;
          transition: background 0.2s;
        }

        .mobile-nav-link:hover {
          background: #f9fafb;
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
      `}</style>
    </header>
  );
};

export default Header;