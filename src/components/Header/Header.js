import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import styles from '../Layout.module.css';
import { CartCounterV2 } from '../../v2/cart/components/CartCounterV2';

const Header = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
    // Contador removido - usando CartCounterV2
  
  const megaMenuRef = useRef(null);
  const megaBtnRef = useRef(null);
  const navItemRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchBtnRef = useRef(null);
  
  // Temporizador para controlar o delay ao sair do menu
  const timeoutRef = useRef(null);
  
  // Manipulador para abrir o menu ao passar o mouse
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsMegaMenuOpen(true);
  };
  
  // Manipulador para fechar o menu com um pequeno delay
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 100); // Pequeno delay para evitar fechamento acidental
  };
  
  // Fechar o megamenu e barra de pesquisa quando pressionar ESC
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsMegaMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
      setExpandedCategory(null); // Resetar categoria expandida ao fechar menu
    } else {
      // Sempre abrir o mega menu quando o menu mobile for aberto
      setIsMegaMenuOpen(true);
    }
  };
  
  const toggleSearch = (e) => {
    e.preventDefault();
    setIsSearchOpen(!isSearchOpen);
  };
  
  // Função para expandir/recolher uma categoria no menu mobile
  const toggleCategory = (categoryIndex) => {
    if (expandedCategory === categoryIndex) {
      setExpandedCategory(null); // Fecha se já estava aberta
    } else {
      setExpandedCategory(categoryIndex); // Abre a categoria clicada
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const searchInput = e.target.elements.search.value.trim();
    
    if (searchInput) {
      // Redirecionar para a página de pesquisa com o termo de busca como parâmetro
      router.push({
        pathname: '/pesquisa',
        query: { s: searchInput }
      });
      
      // Limpar o campo de busca após o envio
      setSearchQuery('');
    }
  };

  return (
    <header className={styles.header}>
      {/* Barra principal */}      <div className={styles.topBar}>
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
          
          {/* Navegação principal */}
          <nav className={`${styles.nav} ${isMenuOpen ? styles.open : ''}`}>
            <ul className={styles.navList}>
              {/* Menu: mobile mostra apenas categorias, desktop mostra botão "Todos os Produtos" */}
              <div className={styles.mobileMenuWrapper}>
                {categories.map((category, idx) => (
                  <div 
                    key={idx} 
                    className={`${styles.megaColumn} ${expandedCategory === idx ? styles.open : ''}`}
                  >
                    <h3 
                      className={`${styles.megaTitle} ${expandedCategory === idx ? styles.open : ''}`}
                      onClick={() => toggleCategory(idx)}
                    >
                      {category.title}
                    </h3>
                    <ul className={styles.megaList} style={{
                      height: expandedCategory === idx ? 'auto' : '0'
                    }}>
                      {category.items.map((item, itemIdx) => (
                        <li key={itemIdx} className={styles.megaItem}>
                          {category.title === 'Smartphones' ? (
                            <Link href={`/marca/${item.slug}`}>
                              <a className={styles.megaLink}>{item.name}</a>
                            </Link>
                          ) : category.title === 'Acessórios' || category.title === 'Áudio' ? (
                            <Link href={`/produto/${item.slug}`}>
                              <a className={styles.megaLink}>{item.name}</a>
                            </Link>
                          ) : (
                            <Link href={`/category/${item.slug}`}>
                              <a className={styles.megaLink}>{item.name}</a>
                            </Link>
                          )}
                        </li>
                      ))}                      <li className={styles.megaItem}>
                        {category.title === 'Acessórios' || category.title === 'Áudio' ? (
                          <Link href={`/produto/${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
                            <a className={`${styles.megaLink} ${styles.viewAll}`}>
                              Ver todos
                            </a>
                          </Link>
                        ) : category.title === 'Smartphones' ? (
                          <Link href="/vertodos">
                            <a className={`${styles.megaLink} ${styles.viewAll}`}>
                              Ver todos
                            </a>
                          </Link>
                        ) : (
                          <Link href={`/category/${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
                            <a className={`${styles.megaLink} ${styles.viewAll}`}>
                              Ver todos
                            </a>
                          </Link>
                        )}
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
              
              {/* Desktop: botão "Todos os Produtos" */}
              <li 
                className={`${styles.navItem} ${styles.desktopOnly}`}
                ref={navItemRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >                <button 
                  ref={megaBtnRef}
                  className={`${styles.megaBtn} ${styles.centeredBtn}`}
                  aria-expanded={isMegaMenuOpen}
                >
                  <div className={styles.btnContent}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" className={styles.menuIcon}>
                      <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    
                    <span className={styles.btnText}>Todos os Produtos</span>
                    
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
                  </div>
                </button>
                
                <div 
                  ref={megaMenuRef} 
                  className={`${styles.megaMenu} ${isMegaMenuOpen ? styles.open : ''}`}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className={styles.megaWrapper}>
                    {categories.map((category, idx) => (
                      <div key={idx} className={styles.megaColumn}>
                        <h3 className={styles.megaTitle}>{category.title}</h3>
                        <ul className={styles.megaList}>
                          {category.items.map((item, itemIdx) => (
                            <li key={itemIdx} className={styles.megaItem}>
                              {category.title === 'Smartphones' ? (
                                <Link href={`/marca/${item.slug}`}>
                                  <a className={styles.megaLink}>{item.name}</a>
                                </Link>
                              ) : category.title === 'Acessórios' || category.title === 'Áudio' ? (
                                <Link href={`/produto/${item.slug}`}>
                                  <a className={styles.megaLink}>{item.name}</a>
                                </Link>
                              ) : (
                                <Link href={`/category/${item.slug}`}>
                                  <a className={styles.megaLink}>{item.name}</a>
                                </Link>
                              )}
                            </li>
                          ))}                          <li className={styles.megaItem}>
                            {category.title === 'Acessórios' || category.title === 'Áudio' ? (
                              <Link href={`/produto/${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
                                <a className={`${styles.megaLink} ${styles.viewAll}`}>
                                  Ver todos
                                </a>
                              </Link>
                            ) : category.title === 'Smartphones' ? (
                              <Link href="/vertodos">
                                <a className={`${styles.megaLink} ${styles.viewAll}`}>
                                  Ver todos
                                </a>
                              </Link>
                            ) : (
                              <Link href={`/category/${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
                                <a className={`${styles.megaLink} ${styles.viewAll}`}>
                                  Ver todos
                                </a>
                              </Link>
                            )}
                          </li>
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
              
              {/* Links de navegação regulares */}
              <li className={styles.navItem}>
                <Link href="/produto/promocoes">
                  <a className={styles.navLink}>Promoções</a>
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/produto/lancamentos">
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
          
          {/* Barra de pesquisa */}
          <div className={styles.searchContainer}>
            <div className={styles.searchInputContainer}>
              <form onSubmit={handleSearchSubmit}>
                <input 
                  type="text" 
                  className={styles.searchInput} 
                  placeholder="O que procura?"
                  name="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                  aria-label="Campo de pesquisa"
                />
                <button 
                  type="submit" 
                  className={styles.searchSubmitBtn} 
                  aria-label="Realizar pesquisa"
                  disabled={!searchQuery.trim()}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
          
          {/* Área de ações - conta e carrinho */}
          <div className={styles.actions}>
            {/* Botão de conta */}
            <Link href="/minha-conta">
              <a className={styles.accountBtn} aria-label="Minha conta">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </Link>              {/* Botão de carrinho com novo contador V2 */}
            <Link href="/cart">
              <a className={styles.cartBtn} aria-label="Carrinho">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <CartCounterV2 />
              </a>
            </Link>
          </div>
          
          {/* Botão de menu mobile */}
          <button 
            className={styles.menuToggle} 
            onClick={toggleMenu} 
            aria-label="Menu"
            aria-expanded={isMenuOpen}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2">
              <path d={isMenuOpen 
                ? "M6 18L18 6M6 6l12 12" 
                : "M4 6h16M4 12h16M4 18h16"}
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
