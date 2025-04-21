import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../Layout.module.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const megaMenuRef = useRef(null);
  const megaBtnRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchBtnRef = useRef(null);
  
  // Fechar o megamenu e barra de pesquisa quando clicado fora ou ao pressionar ESC
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (megaMenuRef.current && 
          !megaMenuRef.current.contains(event.target) &&
          megaBtnRef.current && 
          !megaBtnRef.current.contains(event.target)) {
        setIsMegaMenuOpen(false);
      }
      
      if (searchContainerRef.current && 
          !searchContainerRef.current.contains(event.target) &&
          searchBtnRef.current && 
          !searchBtnRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsMegaMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Lista de benefícios para a barra superior
  const benefits = [
    "Frete grátis para compras acima de R$ 199",
    "Entrega rápida para todo Brasil",
    "Garantia estendida em todos os produtos"
  ];

  // Categorias atualizadas para uma loja de celulares e acessórios
  const categories = [
    {
      title: 'Smartphones',
      items: [
        { name: 'Apple', slug: 'apple' },
        { name: 'Xiaomi', slug: 'xiaomi' },
        { name: 'Samsung', slug: 'samsung' },
        { name: 'Motorola', slug: 'motorola' },
      ]
    },
    {
      title: 'Acessórios',
      items: [
        { name: 'Carregadores e Power Banks', slug: 'carregadores-power-banks' },
        { name: 'Cabos', slug: 'cabos' },
        { name: 'Capas', slug: 'capas' },
        { name: 'Películas', slug: 'peliculas' },
      ]
    },
    {
      title: 'Áudio',
      items: [
        { name: 'Fone de Ouvido sem Fio', slug: 'fone-sem-fio' },
        { name: 'Fone de Ouvido com Fio', slug: 'fone-com-fio' },
        { name: 'Caixa de Som', slug: 'caixa-som' },
        { name: 'Assistente Virtual', slug: 'assistente-virtual' },
      ]
    },
    {
      title: 'Serviços',
      items: [
        { name: 'Assistência Técnica', slug: 'assistencia-tecnica' },
        { name: 'Proteção para Celular', slug: 'protecao-celular' },
        { name: 'Avaliação de Aparelho', slug: 'avaliacao-aparelho' },
        { name: 'Configuração', slug: 'configuracao' },
      ]
    },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isMenuOpen) {
      setIsMegaMenuOpen(false);
    }
  };

  const toggleMegaMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMegaMenuOpen(!isMegaMenuOpen);
  };
  
  const toggleSearch = (e) => {
    e.preventDefault();
    setIsSearchOpen(!isSearchOpen);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const searchInput = e.target.elements.search.value;
    console.log('Pesquisando:', searchInput);
  };

  return (
    <header className={styles.header}>
      {/* Barra de benefícios */}
      <div className={styles.benefitsBar}>
        <div className={styles.benefitsContainer}>
          {benefits.map((benefit, index) => (
            <div key={index} className={styles.benefitItem}>
              <img src="/icon-check.svg" alt="✓" width="16" height="16" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Barra principal */}
      <div className={styles.topBar}>
        <div className={styles.headerContainer}>
          {/* Logo com dimensionamento aprimorado */}
          <div className={styles.logoContainer}>
            <Link href="/">
              <a title="Página Inicial">
                <img 
                  src="/Custom/Content/Themes/xiaomi/Imagens/logo-rota.png" 
                  alt="Rota" 
                />
              </a>
            </Link>
          </div>
          
          {/* Botão de menu mobile */}
          <button className={styles.menuToggle} onClick={toggleMenu} aria-label="Menu">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2">
              <path d={isMenuOpen 
                ? "M6 18L18 6M6 6l12 12" 
                : "M4 6h16M4 12h16M4 18h16"}
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </button>
          
          {/* Navegação principal - removido item "Home" */}
          <nav className={`${styles.nav} ${isMenuOpen ? styles.open : ''}`}>
            <ul className={styles.navList}>
              {/* Item "Home" removido - a logo agora serve como link para a página inicial */}
              
              <li className={styles.navItem}>
                <button 
                  ref={megaBtnRef}
                  className={styles.megaBtn} 
                  onClick={toggleMegaMenu}
                  aria-expanded={isMegaMenuOpen}
                >
                  {/* Ícone de três barras horizontal */}
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" className={styles.menuIcon}>
                    <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  
                  Todos os Produtos
                  
                  {/* Ícone de seta (mantido, mas agora usando className diferente) */}
                  <svg viewBox="0 0 20 20" fill="currentColor" className={styles.arrowIcon}>
                    <path 
                      fillRule="evenodd" 
                      d={isMegaMenuOpen 
                        ? "M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                        : "M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      } 
                      clipRule="evenodd" 
                    />
                  </svg>
                </button>
              </li>
              
              <li className={styles.navItem}>
                <Link href="/promocoes">
                  <a className={styles.navLink}>Promoções</a>
                </Link>
              </li>
              
              <li className={styles.navItem}>
                <Link href="/lancamentos">
                  <a className={styles.navLink}>Lançamentos</a>
                </Link>
              </li>
              
              <li className={styles.navItem}>
                <Link href="/contato">
                  <a className={styles.navLink}>Contato</a>
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Botões de ação */}
          <div className={styles.actions}>
            <div className={styles.searchContainer}>
              {/* Removido o botão de toggle da pesquisa */}
              
              <div className={styles.searchInputContainer}>
                <form onSubmit={handleSearchSubmit}>
                  <input 
                    type="text" 
                    className={styles.searchInput} 
                    placeholder="O que você procura?"
                    name="search"
                    autoComplete="off"
                  />
                  <button 
                    type="submit" 
                    className={styles.searchSubmitBtn} 
                    aria-label="Realizar pesquisa"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
            
            <Link href="/minha-conta">
              <a className={styles.accountBtn} aria-label="Minha conta">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </Link>
            
            <Link href="/carrinho">
              <a className={styles.cartBtn} aria-label="Carrinho">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className={styles.cartCount}>0</span>
              </a>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mega Menu separado do botão para garantir funcionamento */}
      <div 
        ref={megaMenuRef} 
        className={`${styles.megaMenu} ${isMegaMenuOpen ? styles.open : ''}`}
      >
        <div className={styles.megaWrapper}>
          {categories.map((category, idx) => (
            <div key={idx} className={styles.megaColumn}>
              <h3 className={styles.megaTitle}>{category.title}</h3>
              <ul className={styles.megaList}>
                {category.items.map((item, itemIdx) => (
                  <li key={itemIdx} className={styles.megaItem}>
                    <Link href={`/categoria/${item.slug}`}>
                      <a className={styles.megaLink}>{item.name}</a>
                    </Link>
                  </li>
                ))}
                <li className={styles.megaItem}>
                  <Link href={`/categoria/${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <a className={`${styles.megaLink} ${styles.viewAll}`}>
                      Ver todos
                    </a>
                  </Link>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
