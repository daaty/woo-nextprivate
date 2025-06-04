import React, { useState, useEffect } from 'react';
import Layout from '../src/components/Layout';
import dynamic from 'next/dynamic';
import styles from '../styles/BrandPage.module.css'; // Usando o mesmo CSS das páginas de marca
import verTodosStyles from '../styles/VerTodos.module.css';
import SectionContainer from '../src/components/layout/SectionContainer';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import homeBrandStyles from '../src/components/home/BrandBanner.module.css';
// Importando o componente de botão de navegação
import BrandNavigationButton from '../src/components/BrandNavigationButton';
// Importando componentes de dados estruturados (Schema.org)
import { CategorySchema, OrganizationSchema, BreadcrumbSchema } from '../src/components/seo/SchemaOrg';
import FilterToggleButton from '../src/components/FilterToggleButton';

// Carregar o carrossel dinamicamente para otimizar o carregamento
const Carousel = dynamic(() => import('../src/components/Carousel'), { ssr: false });

const VerTodos = () => {
  // Estados para gerenciar produtos e filtros
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);  const [error, setError] = useState(null);
  
  // Adicionando controle de mobile para estilos responsivos inline
  const [isMobile, setIsMobile] = useState(false);
  
  // Estados para filtros - inicialização segura para SSR
  const [showFilters, setShowFilters] = useState(false); // Começamos com filtros fechados para evitar problemas em mobile
  const [priceRange, setPriceRange] = useState({ min: 0, max: 15000 });
  const [selectedStorage, setSelectedStorage] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("all"); // Filtro especial para marcas
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');
  
  // Controle de paginação
  const [visibleItems, setVisibleItems] = useState(16);
  const [hasMore, setHasMore] = useState(true);
  
  // Dados para o carrossel
  const banners = [
    {
      id: 1,
      videoUrl: '/videos/apple-products-showcase.mp4',
      link: '/marca/apple',
    },
    {
      id: 2,
      videoUrl: '/videos/samsung-products-showcase.mp4',
      link: '/marca/samsung',
    },
    {
      id: 3,
      videoUrl: '/videos/motorola-products-showcase.mp4',
      link: '/marca/motorola',
    },
    {
      id: 4,
      videoUrl: '/videos/xiaomi-products-showcase.mp4',
      link: '/marca/xiaomi',
    },
  ];

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Detecta o tamanho da tela quando componente é montado no cliente
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Verifica inicialmente
    checkIfMobile();
    
    // Adiciona um event listener para mudanças no tamanho da janela
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Função para mostrar mais produtos
  const handleShowMore = () => {
    const newVisibleItems = visibleItems + 16;
    setVisibleItems(newVisibleItems);
    
    if (newVisibleItems >= filteredProducts.length) {
      setHasMore(false);
    }
  };
  
  // Função para alterar e persistir modo de visualização
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    
    // Persistir preferência no localStorage (apenas no cliente)
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredViewMode', mode);
    }
  };
  
  // Carregar preferência do modo de visualização salva no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedViewMode = localStorage.getItem('preferredViewMode');
      if (savedViewMode && (savedViewMode === 'grid' || savedViewMode === 'list')) {
        setViewMode(savedViewMode);
      }
    }
  }, []);

  // Função auxiliar para extrair o preço numérico de um produto
  const getNumericPrice = (product) => {
    try {
      if (!product || !product.price) return 0;
      
      let priceValue = product.price;
      
      // Converter string para número
      if (typeof priceValue === 'string') {
        // Remover símbolos de moeda e espaços
        priceValue = priceValue.replace(/[R$\s]/g, '');
        
        // Lidar com formatos diferentes de número
        if (priceValue.includes('.') && priceValue.includes(',')) {
          // Formato R$ 1.234,56
          priceValue = parseFloat(priceValue.replace(/\./g, '').replace(',', '.'));
        } else if (priceValue.includes(',')) {
          // Formato R$ 1234,56
          priceValue = parseFloat(priceValue.replace(',', '.'));
        } else {
          // Formato numérico padrão ou R$ 1234.56
          priceValue = parseFloat(priceValue);
        }
      }
      
      return isNaN(priceValue) ? 0 : priceValue;
    } catch (error) {
      console.error('Erro ao processar preço do produto:', error);
      return 0;
    }
  };

  // Formatador de preço
  const formatPrice = (price) => {
    if (!price) return 'R$ 0,00';
    try {
      let numericValue;
      if (typeof price === 'string') {
        if (price.includes('.') && price.includes(',')) {
          numericValue = parseFloat(price.replace(/\./g, '').replace(',', '.'));
        } else if (price.includes(',')) {
          numericValue = parseFloat(price.replace(',', '.'));
        } else {
          numericValue = parseFloat(price);
        }
      } else {
        numericValue = price;
      }
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numericValue);
    } catch (e) {
      return `R$ ${price}`;
    }
  };

  // Detectar a marca de um produto pelo nome ou metadata
  const detectBrand = (product) => {
    const name = product.name?.toLowerCase() || '';
    const brands = {
      'apple': ['apple', 'iphone', 'ipad', 'macbook', 'watch'],
      'samsung': ['samsung', 'galaxy'],
      'motorola': ['motorola', 'moto g', 'moto e', 'razr', 'edge'],
      'xiaomi': ['xiaomi', 'redmi', 'poco', 'mi']
    };
    
    // Verificar o nome do produto
    for (const [brand, keywords] of Object.entries(brands)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return brand;
      }
    }
    
    // Verificar dados de categorias se disponíveis
    if (product.categories) {
      const categories = Array.isArray(product.categories) 
        ? product.categories.map(c => c.name?.toLowerCase() || c.toLowerCase())
        : [];
        
      for (const [brand, keywords] of Object.entries(brands)) {
        if (categories.some(cat => keywords.some(keyword => cat.includes(keyword)))) {
          return brand;
        }
      }
    }
    
    // Se não encontrar, usar "other"
    return "other";
  };

  // Produtos filtrados com base nos filtros selecionados
  const filteredProducts = React.useMemo(() => {
    if (!products.length) return [];
    
    // Atribuir marcas aos produtos se ainda não tiverem
    const productsWithBrand = products.map(product => {
      if (!product.brand) {
        return {...product, brand: detectBrand(product)};
      }
      return product;
    });
    
    let filtered = [...productsWithBrand];
    
    // Filtro de marca específica
    if (selectedBrand !== "all") {
      filtered = filtered.filter(product => product.brand === selectedBrand);
    }
    
    // Filtro de preço
    filtered = filtered.filter(product => {
      const price = getNumericPrice(product);
      return price >= priceRange.min && price <= priceRange.max;
    });
    
    // Filtro de armazenamento (se algum foi selecionado)
    if (selectedStorage.length > 0) {
      filtered = filtered.filter(product => {
        const productName = product.name?.toLowerCase() || '';
        return selectedStorage.some(storage => 
          productName.includes(storage.toLowerCase())
        );
      });
    }
    
    // Filtro de cor (se alguma foi selecionada)
    if (selectedColors.length > 0) {
      filtered = filtered.filter(product => {
        const productName = product.name?.toLowerCase() || '';
        return selectedColors.some(color => 
          productName.includes(color.toLowerCase())
        );
      });
    }
    
    // Filtro de disponibilidade
    if (selectedAvailability !== 'all') {
      filtered = filtered.filter(product => {
        const isInStock = product.stock_status === 'instock' || product.in_stock;
        return selectedAvailability === 'in-stock' ? isInStock : !isInStock;
      });
    }
    
    // Ordenação
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => getNumericPrice(a) - getNumericPrice(b));
        break;
      case 'price-desc':
        filtered.sort((a, b) => getNumericPrice(b) - getNumericPrice(a));
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name?.localeCompare(b.name || '') || 0);
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name?.localeCompare(a.name || '') || 0);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.date_created || 0) - new Date(a.date_created || 0));
        break;
      case 'featured':
      default:
        // Mantém a ordem original
        break;
    }
    
    // Atualizar o status de hasMore
    setHasMore(visibleItems < filtered.length);
    
    return filtered;
  }, [products, selectedBrand, priceRange, selectedStorage, selectedColors, selectedAvailability, sortBy, visibleItems]);

  // Toggle para seleção de armazenamento
  const toggleStorage = (storage) => {
    setSelectedStorage(prev => {
      if (prev.includes(storage)) {
        return prev.filter(item => item !== storage);
      } else {
        return [...prev, storage];
      }
    });
  };
  
  // Toggle para seleção de cor
  const toggleColor = (color) => {
    setSelectedColors(prev => {
      if (prev.includes(color)) {
        return prev.filter(item => item !== color);
      } else {
        return [...prev, color];
      }
    });
  };
  
  // Limpar todos os filtros
  const clearFilters = () => {
    setPriceRange({ min: 0, max: 15000 });
    setSelectedStorage([]);
    setSelectedColors([]);
    setSelectedBrand("all");
    setSelectedAvailability('all');
  };

  // Buscar produtos de todas as marcas
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Fetch de todas as marcas principais
    Promise.all([
      fetch('/api/products?category=apple&per_page=50').then(res => res.json()),
      fetch('/api/products?category=samsung&per_page=50').then(res => res.json()),
      fetch('/api/products?category=motorola&per_page=50').then(res => res.json()),
      fetch('/api/products?category=xiaomi&per_page=50').then(res => res.json())
    ])
      .then(([appleProducts, samsungProducts, motorolaProducts, xiaomiProducts]) => {
        // Função auxiliar para formatar e adicionar metadados de marca
        const formatProducts = (products, brand) => {
          // Lidar com possíveis formatos diferentes da API
          const productArray = Array.isArray(products) ? products : products.products || [];
          return productArray.map(product => ({...product, brand}));
        };
        
        // Combinar todos os produtos com suas respectivas marcas
        const allProducts = [
          ...formatProducts(appleProducts, 'apple'),
          ...formatProducts(samsungProducts, 'samsung'),
          ...formatProducts(motorolaProducts, 'motorola'),
          ...formatProducts(xiaomiProducts, 'xiaomi')
        ];
        
        setProducts(allProducts);
        setHasMore(visibleItems < allProducts.length);
      })
      .catch(err => {
        console.error('Erro ao buscar produtos:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [visibleItems]);

  // Adaptação para screen resize
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Define o estado inicial com base na largura da janela
      setShowFilters(window.innerWidth > 768);
      
      const handleResize = () => {
        // Em telas maiores, sempre mostramos os filtros
        if (window.innerWidth > 768) {
          setShowFilters(true);
        } else if (window.innerWidth <= 768) {
          // Em mobile, ocultamos os filtros quando a tela for redimensionada para tamanho mobile
          setShowFilters(false);
        }
      };
      
      // Aplicando debounce ao evento de resize para melhor performance
      let resizeTimer;
      const debouncedResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 100);
      };
      
      window.addEventListener('resize', debouncedResize);
      
      return () => {
        window.removeEventListener('resize', debouncedResize);
        if (resizeTimer) clearTimeout(resizeTimer);
      };
    }
  }, []); // Removido showFilters das dependências para evitar loop

  return (
    <Layout>
      <Head>
        <title>Smartphones de Todas as Marcas | Compre Online</title>
        <meta name="description" content="Encontre smartphones de várias marcas como Apple, Samsung, Motorola e Xiaomi com os melhores preços. Compre online com frete grátis e parcelamento." />
        
        {/* OpenGraph tags para compartilhamento em redes sociais */}
        <meta property="og:title" content="Smartphones de Todas as Marcas | Loja Oficial" />
        <meta property="og:description" content="Compre smartphones de diversas marcas com os melhores preços. Ofertas especiais e garantia de fábrica." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/banners/smartphones-banner.jpg" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://seusite.com'}/vertodos`} />
      </Head>      {/* Banner Hero com estilo consistente com as páginas de marca */}
      <div style={{
        marginTop: '-50px',
        position: 'relative',
        zIndex: 1
      }}>
        <SectionContainer noPadding>          <div className={`${homeBrandStyles.brandBanner}`} style={{ 
            height: '480px', /* Altura fixa para evitar inconsistências */
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#000', /* Fundo preto para evitar diferenças de cor */
            margin: 0,
            padding: 0
          }}>{/* Div para o carrossel - Altura ajustada para cobrir todo o banner */}            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%', 
              zIndex: 1,
              display: 'block',
              overflow: 'hidden'
            }}>
              <Carousel banners={banners} />
              {/* Overlay escuro removido, pois o carrossel já possui seu próprio overlay */}
            </div>{/* Conteúdo do banner - seguindo a mesma estrutura de motorola.js */}            <div style={{
              display: 'flex',
              width: '100%',
              flex: 1,
              position: 'relative',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'stretch',
              zIndex: 3,
              height: '100%',
              pointerEvents: 'none' /* Permite clicar através deste div para o carrossel */
            }}>
              {/* Container flexível apenas para o conteúdo do banner */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                flex: '1',
                height: '100%',
                position: 'relative'
              }}>
                {/* Espaço para conteúdo futuro do banner (se necessário) */}
                <div style={{ flex: '1', minHeight: '160px' }}></div>
                <div style={{ flex: '1' }}></div>
              </div>
            </div>
            {/* Navegação de marcas fixa no pé do banner - agora como irmão do conteúdo principal para corrigir posicionamento */}            <div style={{
              width: '100%',
              zIndex: 10,
              background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0) 100%)',
              padding: isMobile ? '3px 0 3px' : '6px 0 6px', // padding extremamente reduzido
              display: 'flex',
              justifyContent: 'center', 
              alignItems: 'flex-end',
              boxSizing: 'border-box',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0
            }}>              <div
                className={styles.brandNavigation}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: isMobile ? 'nowrap' : 'wrap',
                  gap: isMobile ? '4px' : '10px',
                  overflowX: isMobile ? 'auto' : 'visible',
                  padding: isMobile ? '5px 8px' : '5px 12px', // padding reduzido no mobile
                  margin: 0,
                  width: '100%',
                  maxWidth: '100vw',
                  boxSizing: 'border-box',
                  WebkitOverflowScrolling: 'touch',
                  msOverflowStyle: 'none', 
                  scrollbarWidth: 'none',
                  pointerEvents: 'auto', /* Permite clicar nos botões */
                  // Esconde scrollbar no Chrome, Safari e Opera
                  '&::-webkit-scrollbar': {
                    display: 'none'
                  }
                }}>
                <BrandNavigationButton brand="Apple" />
                <BrandNavigationButton brand="Xiaomi" />
                <BrandNavigationButton brand="Samsung" />
                <BrandNavigationButton brand="Motorola" />
                <BrandNavigationButton brand="Ver todos" isActive={true} />
              </div>
            </div>
          </div>
        </SectionContainer>
      </div>

      {/* Conteúdo principal com filtros laterais e produtos */}
      <SectionContainer>
        <div className={styles.mainContent}>
          {/* Sidebar com filtros */}
          <div className={`${styles.sidebarFilters}`} style={{ 
            background: 'linear-gradient(90deg, rgba(255,105,0,0.03), rgba(0,168,225,0.03))', 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            position: 'relative', // Alterado para evitar interferência no banner
            marginTop: '-20px', // Movido mais para cima
            marginLeft: '10px', // Ajustado para alinhamento
            marginBottom: '30px', // Added marginBottom for bottom spacing manipulation
            padding: '1px',
            overflow: 'hidden'
          }}>
            {/* Pseudo-elemento para criar a borda gradiente */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '12px',
              padding: '2px',
              background: 'linear-gradient(90deg, #ff6900, #00a8e1)',
              content: '""',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              zIndex: 0
            }}></div>
            
            <div style={{
              position: 'relative',
              zIndex: 1,
              background: 'linear-gradient(90deg, rgba(255,105,0,0.03), rgba(0,168,225,0.03))',
              borderRadius: '10px',
              padding: '15px',
              height: 'calc(100% - 30px)'
            }}>
              <div className={styles.sidebarHeader}>
                <h2>Filtros</h2>
                {(selectedStorage.length > 0 || selectedColors.length > 0 || selectedBrand !== 'all' || selectedAvailability !== 'all' || priceRange.max < 15000) && (
                  <button className={styles.clearAllFilters} onClick={clearFilters}>
                    Limpar tudo
                  </button>
                )}              </div>
              
              {/* Botão mobile para mostrar/esconder filtros com componente dedicado */}
              <div style={{ display: isMobile ? 'block' : 'none' }}>
                <FilterToggleButton 
                  showFiltersInitial={showFilters} 
                  onToggle={(newState) => {
                    console.log('Alternando filtros VerTodos para:', newState);
                    setShowFilters(newState);
                  }} 
                  styles={styles}
                />
              </div>
              {/* Fim do bloco mobile, segue para os filtros */}
              <div 
                id="filter-groups"
                className={`${styles.filterGroups}`}
                style={{
                  height: showFilters ? 'auto' : '0',
                  opacity: showFilters ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  overflow: showFilters ? 'visible' : 'hidden',
                  display: 'block',
                  pointerEvents: showFilters ? 'auto' : 'none',
                  marginTop: showFilters ? '10px' : '0'
                }}
              >
                {/* Filtro de Marcas - Único para esta página */}
                <div className={styles.filterGroup}>
                  <h3>Marca</h3>
                  <div className={styles.filterOptions}>
                    <label className={styles.filterCheckbox}>
                      <input 
                        type="radio" 
                        name="brand" 
                        checked={selectedBrand === 'all'}
                        onChange={() => setSelectedBrand('all')} 
                      />
                      <span>Todas as marcas</span>
                      <span className={styles.count}>({products.length})</span>
                    </label>
                    <label className={styles.filterCheckbox}>
                      <input 
                        type="radio" 
                        name="brand" 
                        checked={selectedBrand === 'apple'}
                        onChange={() => setSelectedBrand('apple')} 
                      />
                      <span>Apple</span>
                      <span className={styles.count}>({products.filter(p => p.brand === 'apple').length})</span>
                    </label>
                    <label className={styles.filterCheckbox}>
                      <input 
                        type="radio" 
                        name="brand" 
                        checked={selectedBrand === 'samsung'}
                        onChange={() => setSelectedBrand('samsung')} 
                      />
                      <span>Samsung</span>
                      <span className={styles.count}>({products.filter(p => p.brand === 'samsung').length})</span>
                    </label>
                    <label className={styles.filterCheckbox}>
                      <input 
                        type="radio" 
                        name="brand" 
                        checked={selectedBrand === 'motorola'}
                        onChange={() => setSelectedBrand('motorola')} 
                      />
                      <span>Motorola</span>
                      <span className={styles.count}>({products.filter(p => p.brand === 'motorola').length})</span>
                    </label>
                    <label className={styles.filterCheckbox}>
                      <input 
                        type="radio" 
                        name="brand" 
                        checked={selectedBrand === 'xiaomi'}
                        onChange={() => setSelectedBrand('xiaomi')} 
                      />
                      <span>Xiaomi</span>
                      <span className={styles.count}>({products.filter(p => p.brand === 'xiaomi').length})</span>
                    </label>
                  </div>
                </div>
                
                <div className={styles.filterGroup}>
                  <h3>Disponibilidade</h3>
                  <div className={styles.filterOptions}>
                    <label className={styles.filterCheckbox}>
                      <input 
                        type="radio" 
                        name="availability" 
                        checked={selectedAvailability === 'all'}
                        onChange={() => setSelectedAvailability('all')} 
                      />
                      <span>Todos os produtos</span>
                      <span className={styles.count}>({products.length})</span>
                    </label>
                    <label className={styles.filterCheckbox}>
                      <input 
                        type="radio" 
                        name="availability" 
                        checked={selectedAvailability === 'in-stock'}
                        onChange={() => setSelectedAvailability('in-stock')} 
                      />
                      <span>Em estoque</span>
                      <span className={styles.count}>({products.filter(p => p.stock_status === 'instock' || p.in_stock).length})</span>
                    </label>
                    <label className={styles.filterCheckbox}>
                      <input 
                        type="radio" 
                        name="availability" 
                        checked={selectedAvailability === 'out-of-stock'}
                        onChange={() => setSelectedAvailability('out-of-stock')} 
                      />
                      <span>Fora de estoque</span>
                      <span className={styles.count}>({products.filter(p => p.stock_status !== 'instock' && !p.in_stock).length})</span>
                    </label>
                  </div>
                </div>
                
                <div className={styles.filterGroup}>
                  <h3 id="price-range-label">Preço</h3>
                  <div 
                    role="group"
                    aria-labelledby="price-range-label"
                    style={{
                      padding: '10px 5px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '15px',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        padding: '8px 12px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #eee',
                        fontSize: '14px',
                        fontWeight: '500',
                        width: '45%',
                        textAlign: 'center'
                      }}>
                        {formatPrice(priceRange.min)}
                      </div>
                      
                      <div style={{
                        color: '#888',
                        margin: '0 5px'
                      }}>até</div>
                      
                      <div style={{
                        padding: '8px 12px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #eee',
                        fontSize: '14px',
                        fontWeight: '500',
                        width: '45%',
                        textAlign: 'center'
                      }}>
                        {formatPrice(priceRange.max)}
                      </div>
                    </div>
                    
                    <div style={{
                      position: 'relative',
                      height: '30px',
                      margin: '20px 0 15px',
                      width: '100%'
                    }}>
                      <div style={{
                        position: 'absolute',
                        height: '4px',
                        left: '0',
                        right: '0',
                        background: '#e0e0e0',
                        borderRadius: '2px',
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}></div>
                      
                      <div style={{
                        position: 'absolute',
                        height: '4px',
                        left: `${(priceRange.min / 15000) * 100}%`,
                        right: `${100 - (priceRange.max / 15000) * 100}%`,
                        background: 'linear-gradient(90deg, #ff6900, #00a8e1)',
                        borderRadius: '2px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1
                      }}></div>
                      
                      <div className="price-slider-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                          <input
                            type="range"
                            min="0"
                            max="15000"
                            step="100"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange(prev => ({
                              ...prev,
                              min: Math.min(parseInt(e.target.value), prev.max)
                            }))}
                            aria-label="Preço mínimo"
                            aria-valuemin="0"
                            aria-valuemax="15000"
                            aria-valuenow={priceRange.min}
                            aria-valuetext={`Preço mínimo: ${formatPrice(priceRange.min)}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              appearance: 'none',
                              WebkitAppearance: 'none',
                              background: 'transparent',
                              outline: 'none'
                            }}
                          />
                        </div>
                        
                        <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                          <input
                            type="range"
                            min="0"
                            max="15000"
                            step="100"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange(prev => ({
                              ...prev,
                              max: Math.max(parseInt(e.target.value), prev.min)
                            }))}
                            aria-label="Preço máximo"
                            aria-valuemin="0"
                            aria-valuemax="15000"
                            aria-valuenow={priceRange.max}
                            aria-valuetext={`Preço máximo: ${formatPrice(priceRange.max)}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              appearance: 'none',
                              WebkitAppearance: 'none',
                              background: 'transparent',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <style dangerouslySetInnerHTML={{ __html: `
                      input[type=range]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: white;
                        border: 2px solid #ff6900;
                        cursor: pointer;
                        position: relative;
                        z-index: 5;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        margin-top: -6px; /* O jeito correto para centralizar no Chrome */
                      }
                      
                      input[type=range]::-moz-range-thumb {
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: white;
                        border: 2px solid #ff6900;
                        cursor: pointer;
                        position: relative;
                        z-index: 5;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                      }
                      
                      input[type=range]::-webkit-slider-runnable-track {
                        width: 100%;
                        height: 4px;
                        cursor: pointer;
                        background: transparent;
                        border: none;
                      }
                      
                      input[type=range]::-moz-range-track {
                        width: 100%;
                        height: 4px;
                        cursor: pointer;
                        background: transparent;
                        border: none;
                      }
                      
                      /* Ajusta o alinhamento vertical da bolinha no Chrome */
                      input[type=range] {
                        -webkit-appearance: none;
                        background: transparent;
                        height: 30px; /* Aumentado para melhorar área de clique */
                        position: relative;
                        margin: 0;
                        padding: 0;
                        width: calc(100% - 0px); /* Remover compensação para garantir que alcance as extremidades */
                      }
                    `}} />
                  </div>
                </div>
                
                <div className={styles.filterGroup}>
                  <h3>Armazenamento</h3>
                  <div className={styles.filterOptions}>
                    {['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'].map(storage => (
                      <label key={storage} className={styles.filterCheckbox}>
                        <input 
                          type="checkbox"
                          checked={selectedStorage.includes(storage)}
                          onChange={() => toggleStorage(storage)}
                        />
                        <span>{storage}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className={styles.filterGroup}>
                  <h3>Cor</h3>
                  <div className={styles.filterOptions}>
                    {['Preto', 'Branco', 'Azul', 'Verde', 'Roxo', 'Dourado', 'Prata', 'Vermelho', 'Grafite'].map(color => (
                      <label key={color} className={styles.filterCheckbox}>
                        <input 
                          type="checkbox"
                          checked={selectedColors.includes(color)}
                          onChange={() => toggleColor(color)}
                        />
                        <span>{color}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Área de produtos */}
          <div className={styles.productsArea}>
            <div className={styles.productsToolbar} style={{ 
              position: 'relative',
              borderRadius: '12px',
              padding: '1px',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '12px',
                padding: '2px',
                background: 'linear-gradient(90deg, #ff6900, #00a8e1)',
                content: '""',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                zIndex: 0
              }}></div>
              
              <div style={{
                position: 'relative',
                zIndex: 1,
                background: 'linear-gradient(90deg, rgba(255,105,0,0.03), rgba(0,168,225,0.03))',
                borderRadius: '10px',
                padding: '15px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div className={styles.viewOptions} style={{ marginRight: '20px' }}>
                  <button 
                    className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                    onClick={() => handleViewModeChange('grid')}
                    title="Visualização em grade"
                    aria-label="Visualizar em grade"
                    aria-pressed={viewMode === 'grid'}
                  >
                    <span className={styles.gridIcon}>▦</span>
                  </button>
                  <button 
                    className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                    onClick={() => handleViewModeChange('list')}
                    title="Visualização em lista"
                    aria-label="Visualizar em lista"
                    aria-pressed={viewMode === 'list'}
                  >
                    <span className={styles.listIcon}>≡</span>
                  </button>
                </div>
                
                <div className={styles.sortingOptions}>
                  <label htmlFor="sortSelect">Ordenar por:</label>
                  <select 
                    id="sortSelect"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={styles.sortSelect}
                    aria-label="Ordenar produtos por"
                  >
                    <option value="featured">Em destaque</option>
                    <option value="price-asc">Menor preço</option>
                    <option value="price-desc">Maior preço</option>
                    <option value="name-asc">Nome, A-Z</option>
                    <option value="name-desc">Nome, Z-A</option>
                    <option value="newest">Mais recentes</option>
                  </select>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Carregando produtos...</p>
              </div>
            ) : error ? (
              <div className={styles.error}>
                <p>Erro ao buscar produtos: {error}</p>
                <button className={`${styles.retryButton} ${homeBrandStyles.brandCta}`} onClick={() => window.location.reload()}>
                  Tentar novamente
                </button>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={viewMode === 'grid' ? styles.productsGrid : styles.productsList}>
                {filteredProducts.slice(0, visibleItems).map(product => (
                  <div key={product.id} className={viewMode === 'grid' ? styles.productCard : styles.productCardList}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={styles.productLink}>
                        <div className={styles.productImage} style={{ 
                          height: viewMode === 'grid' ? '240px' : '260px', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px'
                        }}>
                          {(product.image?.sourceUrl || product.images?.[0]?.src) ? (
                            <Image
                              src={product.image?.sourceUrl || product.images?.[0]?.src}
                              alt={product.name || "Produto"}
                              width={240}
                              height={240}
                              style={{ objectFit: "contain" }}
                              loading="lazy"
                              quality={80}
                              className={styles.productImageElement}
                            />
                          ) : (
                            <div className={styles.noImage}>Sem Imagem</div>
                          )}
                          {product.on_sale && <span className={styles.saleTag}>OFERTA</span>}
                        </div>
                        
                        <div className={styles.productInfo} style={{ padding: '10px', maxHeight: viewMode === 'grid' ? '120px' : 'auto' }}>
                          <h3 className={styles.productName} style={{ 
                            fontSize: '0.95rem',
                            lineHeight: '1.25rem',
                            marginBottom: '6px',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>{product.name}</h3>
                          
                          {viewMode === 'list' && product.short_description && (
                            <div 
                              className={styles.productDescription}
                              dangerouslySetInnerHTML={{ __html: product.short_description }}
                              style={{ fontSize: '0.85rem', maxHeight: '60px', overflow: 'hidden' }}
                            />
                          )}
                          
                          <div className={styles.productBrand}>
                            {product.brand === 'apple' && 'Apple'}
                            {product.brand === 'samsung' && 'Samsung'}
                            {product.brand === 'motorola' && 'Motorola'}
                            {product.brand === 'xiaomi' && 'Xiaomi'}
                            {product.brand === 'other' && 'Outros'}
                          </div>
                          
                          <div className={styles.productPricing} style={{ marginTop: '8px' }}>
                            {product.on_sale && product.regular_price && (
                              <span className={styles.regularPrice} style={{ fontSize: '0.8rem', textDecoration: 'line-through' }}>{formatPrice(product.regular_price)}</span>
                            )}
                            <span className={styles.price} style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{formatPrice(product.price)}</span>
                            <span className={styles.installments} style={{ fontSize: '0.75rem', display: 'block', marginTop: '2px' }}>em até <strong>12x</strong> sem juros</span>
                          </div>
                        </div>
                      </a>
                    </Link>
                    
                    <div className={styles.productActions}>
                      <button className={styles.quickviewButton} title="Visualização rápida">
                        <span>Visualização rápida</span>
                      </button>
                      
                      <Link href={`/produto/${product.slug}`}>
                        <a className={`${styles.addToCartButton} ${homeBrandStyles.brandCta}`}>
                          {viewMode === 'grid' ? 'Adicionar' : 'Adicionar ao carrinho'}
                        </a>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noProducts}>
                <p>Nenhum produto encontrado com os filtros selecionados.</p>
                <button className={`${styles.clearFilters} ${homeBrandStyles.brandCta}`} onClick={clearFilters}>Limpar filtros</button>
              </div>
            )}
            
            {filteredProducts.length > 0 && (
              <div className={styles.pagination}>
                <div className={styles.paginationInfo}>
                  <span>Mostrando </span>
                  <span>1</span>
                  <span> - </span>
                  <span>{Math.min(visibleItems, filteredProducts.length)}</span>
                  <span> de {filteredProducts.length} produto(s)</span>
                </div>
                
                {hasMore && (
                  <button 
                    className={`${styles.loadMoreButton} ${homeBrandStyles.brandCta}`}
                    onClick={handleShowMore}
                  >
                    Mostrar mais
                  </button>
                )}
              </div>
            )}
          </div>
        </div>  
      </SectionContainer>

      {/* Rodapé especial da página - similar às páginas de marca */}
      <SectionContainer noPadding>
        <div className={styles.brandFooter}>
          <div className={styles.footerGridContainer}>
            <div className={styles.footerColumn}>
              <h3>Categorias de Smartphones</h3>
              <ul>
                <li><Link href="/smartphones/top-de-linha"><a>Top de Linha</a></Link></li>
                <li><Link href="/smartphones/intermediario"><a>Intermediários</a></Link></li>
                <li><Link href="/smartphones/entrada"><a>Entrada</a></Link></li>
                <li><Link href="/smartphones/dobráveis"><a>Dobráveis</a></Link></li>
              </ul>
            </div>
            
            <div className={styles.footerColumn}>
              <h3>Marcas Populares</h3>
              <ul>
                <li><Link href="/marca/apple"><a>Apple</a></Link></li>
                <li><Link href="/marca/samsung"><a>Samsung</a></Link></li>
                <li><Link href="/marca/motorola"><a>Motorola</a></Link></li>
                <li><Link href="/marca/xiaomi"><a>Xiaomi</a></Link></li>
              </ul>
            </div>
            
            <div className={styles.footerColumn}>
              <h3>Garantia e Suporte</h3>
              <ul>
                <li><Link href="/garantia-oficial"><a>Garantia oficial</a></Link></li>
                <li><Link href="/assistencia-tecnica"><a>Assistência técnica</a></Link></li>
                <li><Link href="/extended-warranty"><a>Garantia estendida</a></Link></li>
                <li><Link href="/trocas-e-devolucoes"><a>Trocas e devoluções</a></Link></li>
              </ul>
            </div>
            
            <div className={styles.footerColumn}>
              <h3>Informações</h3>
              <div className={styles.footerInfo}>
                <p>Encontre smartphones das melhores marcas com preços incríveis e garantia oficial. Seu próximo smartphone está aqui!</p>
                <Link href="/sobre">
                  <a className={styles.footerLink}>Saiba mais sobre nossa loja</a>
                </Link>
              </div>
            </div>
          </div>
          
          <div className={styles.footerCTA}>
            <div className={styles.ctaContent}>
              <h3>Assine nossa newsletter</h3>
              <p>Receba ofertas exclusivas e novidades sobre smartphones de todas as marcas</p>
              <div className={styles.newsletterForm}>
                <input type="email" placeholder="Seu melhor e-mail" />
                <button>Assinar</button>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
      
      {/* Dados estruturados Schema.org */}
      <CategorySchema 
        products={filteredProducts.slice(0, visibleItems)} 
        category="Smartphones" 
      />
      
      <OrganizationSchema />
      
      <BreadcrumbSchema 
        items={[
          { name: 'Home', url: '/' },
          { name: 'Smartphones', url: '/smartphones' }
        ]}
      />
    </Layout>
  );
};

export default VerTodos;