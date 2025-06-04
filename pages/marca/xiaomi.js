import React, { useEffect, useState } from 'react';
import Layout from '../../src/components/Layout';
import styles from '../../styles/BrandPage.module.css';
import Link from 'next/link';
import Image from 'next/image';
import SectionContainer from '../../src/components/layout/SectionContainer';
import homeBrandStyles from '../../src/components/home/BrandBanner.module.css';
import Head from 'next/head';
// Importando o componente de botão de navegação
import BrandNavigationButton from '../../src/components/BrandNavigationButton';
// Importando o componente especializado para toggle de filtros
import FilterToggleButton from '../../src/components/FilterToggleButton';
// Importando componentes de dados estruturados (Schema.org)
import { CategorySchema, OrganizationSchema, BreadcrumbSchema } from '../../src/components/seo/SchemaOrg';
// Importando apenas o componente do spinner (removido useCartContext - causa corrupção do cookie)
import LoadingSpinner from '../../src/components/LoadingSpinner';
// Importando Apollo Client e queries
import client from '../../src/components/ApolloClient';
import { gql } from '@apollo/client';

// Query GraphQL para buscar produtos da Xiaomi
const XIAOMI_PRODUCTS_QUERY = gql`
  query XiaomiProducts {
    products(
      first: 50
      where: {
        categoryIn: ["xiaomi"]
      }
    ) {
      nodes {
        id
        databaseId
        name
        slug
        description
        shortDescription
        price
        regularPrice
        salePrice
        onSale
        stockStatus
        stockQuantity
        averageRating
        reviewCount
        image {
          id
          sourceUrl
          altText
        }
        productCategories {
          nodes {
            id
            name
            slug
          }
        }
        ... on SimpleProduct {
          price
          regularPrice
          salePrice
        }
        ... on VariableProduct {
          price
          regularPrice
          salePrice
        }
      }
    }
  }
`;

export default function XiaomiPage({ initialProducts = [] }) {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    // Estados para funcionalidade do carrinho
  const [addingProductId, setAddingProductId] = useState(null);
  const [successProductId, setSuccessProductId] = useState(null);
  const [errorProductId, setErrorProductId] = useState(null); // Novo estado para controlar falhas
  const [addingToCart, setAddingToCart] = useState(false); // Estado local em vez de contexto
  
    // Estados para filtros - inicialização segura para SSR
  const [showFilters, setShowFilters] = useState(false); // Começamos com filtros fechados para evitar problemas em mobile
  const [priceRange, setPriceRange] = useState({ min: 0, max: 15000 });
  const [selectedStorage, setSelectedStorage] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedAvailability, setSelectedAvailability] = useState('all'); // 'all', 'in-stock', 'out-of-stock'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'price-asc', 'price-desc', 'name-asc', 'name-desc', 'newest'
  
  // Adicionando controle de paginação
  const [itemsPerPage, setItemsPerPage] = useState(8); // Reduzido para 8 itens por página inicialmente
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleItems, setVisibleItems] = useState(8); // Número de itens visíveis atualmente
  const [hasMore, setHasMore] = useState(true); // Controla se há mais itens para mostrar
  // Adicionando estado para detectar se é mobile ou não - evita problemas de hidratação com window
  const [isMobile, setIsMobile] = useState(false);
  
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
    const newVisibleItems = visibleItems + 8;
    setVisibleItems(newVisibleItems);
    
    // Verifica se ainda há mais produtos para serem exibidos
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
  
  // Produtos filtrados com base nos filtros selecionados
  const filteredProducts = React.useMemo(() => {
    if (!products.length) return [];
    
    let filtered = [...products];
    
    // Filtro de preço - usando a função auxiliar para garantir consistência
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
    
    // Ordenação - ajustando para usar a mesma função para garantir consistência
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
        // Supõe que exista um campo date_created ou similar
        filtered.sort((a, b) => new Date(b.date_created || 0) - new Date(a.date_created || 0));
        break;
      case 'featured':
      default:
        // Mantém a ordem original que presumivelmente prioriza os produtos em destaque
        break;
    }
    
    // Atualiza o status de hasMore com base nos produtos filtrados
    setHasMore(visibleItems < filtered.length);

    return filtered;
  }, [products, priceRange, selectedStorage, selectedColors, selectedAvailability, sortBy, visibleItems]);

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
    setSelectedAvailability('all');
  };
  
  // Função para adicionar produto ao carrinho - ATUALIZADA PARA USAR ARMAZENAMENTO DO SERVIDOR
  const handleAddToCart = async (product, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Verificar se já está processando
    if (addingProductId === product.id || addingToCart) {
      console.log('🚫 [Xiaomi Page] Já processando, ignorando click');
      return;
    }

    console.log('🛒 [Xiaomi Page] Iniciando adição ao carrinho:', product.name);
    
    try {
      setAddingProductId(product.id);
      setAddingToCart(true);
      // Limpar estados de sucesso/erro anteriores
      setSuccessProductId(null);
      setErrorProductId(null);
      
      // Usar o ID correto do produto
      const productId = product.databaseId || product.id;
      
      try {
        // Chamar a API REST simples diretamente - evita corrupção do cookie causada pelo useCartContext
        console.log(`[Xiaomi Page] 🛒 Adicionando ao carrinho via API REST:`);
        
        // CORREÇÃO: sanitização mais robusta para evitar corrupção do cookie
        let safeProductName = '';
        if (typeof product?.name === 'string') {
          safeProductName = product.name
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove caracteres de controle
            .replace(/\\/g, '\\\\')  // Escapa barras invertidas
            .replace(/"/g, '\\"')    // Escapa aspas duplas
            .replace(/\n/g, ' ')     // Remove quebras de linha
            .replace(/\r/g, ' ')     // Remove retornos de carro
            .replace(/\t/g, ' ');    // Remove tabulações
        } else {
          safeProductName = `Produto ${productId}`;
        }
        
        // Log para depuração
        console.log(`[Xiaomi Page] 🔍 Nome sanitizado: "${safeProductName.substring(0, 30)}${safeProductName.length > 30 ? '...' : ''}"`);
        
        const safeProductPrice = parseFloat(product?.price || product?.regularPrice || 0);
        
        // CORREÇÃO: sanitização mais robusta para URLs de imagem
        let safeProductImage = null;
        if (typeof product?.image?.sourceUrl === 'string') {
          safeProductImage = product.image.sourceUrl
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');
        } else if (typeof product?.featuredImage?.node?.sourceUrl === 'string') {
          safeProductImage = product.featuredImage.node.sourceUrl
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');
        }
            
        const response = await fetch('/api/cart/simple-add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cart-source': 'xiaomi-page', // Adiciona identificador de origem
            'x-request-time': Date.now().toString() // Adicionar timestamp para evitar cache
          },
          body: JSON.stringify({
            product_id: productId,
            quantity: 1,
            product_name: safeProductName,
            product_price: safeProductPrice,
            product_image: safeProductImage,
            append_to_server_storage: true // NOVO: Flag para garantir que produtos sejam adicionados, não substituídos
          })
        });
        
        const result = await response.json();
            
        // Processar resultado
        if (result.success) {
          console.log('✅ [Xiaomi Page] Produto adicionado com sucesso via REST API!');
          console.log(`[Xiaomi Page] ℹ️ Detalhes do carrinho: ${result.cart.items?.length || 0} tipos de produtos, ${result.cart.items_count || 0} unidades totais`);
          
          // Dados simplificados para eventos - evita objetos circulares e caracteres problemáticos
          const safeProduct = {
            id: productId,
            name: typeof product?.name === 'string' 
              ? product.name.replace(/[^\w\s\-.,]/g, '') // Manter apenas caracteres seguros
              : `Produto ${productId}`,
            price: parseFloat(product?.price || product?.regularPrice || 0) || 0,
            image: typeof product?.image?.sourceUrl === 'string' 
              ? product.image.sourceUrl.replace(/[^\w\s\-.:\/]/g, '') // URL segura
              : null
          };
          
          console.log('[Xiaomi Page] 🛒 Evento com dados sanitizados:', {
            id: safeProduct.id,
            name: safeProduct.name.substring(0, 30) + (safeProduct.name.length > 30 ? '...' : ''),
            price: safeProduct.price
          });
          
          // IMPORTANTE: Disparar eventos para sincronizar contador global com dados limpos
          window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { 
              product: safeProduct, 
              quantity: 1,
              timestamp: Date.now(),
              // Dados completos para suportar o sistema de carrinho melhorado
              fullCart: result.cart,
              totalItems: result.cart.items_count || result.cart.items?.length || 0,
              totalItemTypes: result.cart.totalItemTypes || result.cart.items?.length || 0
            } 
          }));
            
          window.dispatchEvent(new CustomEvent('productAddedToCart', {
            detail: {
              productId: productId,
              productName: safeProduct.name,
              quantity: 1,
              timestamp: Date.now(),
              // Incluir dados completos para processamento de eventos
              fullCart: result.cart
            }
          }));
            
          // Atualizar contador global se disponível
          if (window.updateCartCount && typeof window.updateCartCount === 'function') {
            try {
              // Usar timeout para evitar problemas de concorrência
              setTimeout(async () => {
                await window.updateCartCount();
                console.log('[Xiaomi Page] ✅ Contador global atualizado');
              }, 100);
            } catch (updateError) {
              console.log('[Xiaomi Page] ⚠️ Erro ao atualizar contador global:', updateError);
            }
          }
          
          // NOVO: Atualizar contador no botão minicart do cabeçalho, se existir
          try {
            const minicartCounterEl = document.querySelector('.minicart-count');
            if (minicartCounterEl) {
              minicartCounterEl.textContent = result.cart.items_count || result.cart.items?.length || '?';
              minicartCounterEl.classList.add('pulse-animation');
              setTimeout(() => minicartCounterEl.classList.remove('pulse-animation'), 2000);
            }
          } catch (uiError) {
            console.log('[Xiaomi Page] ⚠️ Erro ao atualizar UI:', uiError);
          }
          
          // Mostrar ícone de sucesso por 2 segundos
          setSuccessProductId(product.id);
          setTimeout(() => {
            setSuccessProductId(null);
          }, 2000);
          
          // Vibração de sucesso no mobile
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
        } else {
          console.error('❌ [Xiaomi Page] Erro ao adicionar ao carrinho via REST:', result?.error || 'Erro desconhecido');
          alert('Não foi possível adicionar o produto ao carrinho. Tente novamente.');
          
          // Definir estado de erro
          setErrorProductId(product.id);
          setTimeout(() => {
            setErrorProductId(null);
          }, 2000);
        }
      } catch (error) {
        console.error('❌ [Xiaomi Page] Exceção ao adicionar ao carrinho:', error);
        
        // Use notificação em vez de alert para melhor experiência do usuário
        if (window.showNotification && typeof window.showNotification === 'function') {
          window.showNotification('Erro ao adicionar produto ao carrinho. Tente novamente.', 'error');
        } else {
          alert('Erro ao adicionar produto ao carrinho. Tente novamente.');
        }
        
        // Definir estado de erro
        setErrorProductId(product.id);
        setTimeout(() => {
          setErrorProductId(null);
        }, 2000);
      }
    } finally {
      // Garantir que os estados de processamento sejam limpos com um pequeno delay
      // para permitir que a animação de loading seja vista pelo usuário
      setTimeout(() => {
        setAddingProductId(null);
        setAddingToCart(false);
      }, 300);
    }
  };

  // Buscar produtos da categoria/marca Xiaomi
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Console log para debug
    console.log('🔍 Buscando produtos da Xiaomi...');
    
    fetch('/api/products?category=xiaomi&per_page=50')
      .then(async (res) => {
        if (!res.ok) throw new Error(`API retornou status ${res.status}`);
        console.log('✅ Resposta da API recebida');
        
        const data = await res.json();
        console.log('📦 Dados recebidos:', {
          tipo: Array.isArray(data) ? 'array' : typeof data,
          produtos: Array.isArray(data) ? data.length : (data.products ? data.products.length : 'N/A'),
          exemplo: data[0] || data.products?.[0] || 'sem produtos'
        });
        
        // Suporte para resposta { products: [...] } ou array direto
        const productsArray = Array.isArray(data) ? data : data.products || [];
        setProducts(productsArray);
        
        // Atualiza hasMore de acordo com a quantidade de produtos
        setHasMore(visibleItems < productsArray.length);
        
        if (productsArray.length === 0) {
          console.warn('⚠️ Nenhum produto encontrado para a categoria Xiaomi');
        } else {
          console.log(`✨ ${productsArray.length} produtos encontrados`);
        }
      })
      .catch((err) => {
        console.error('❌ Erro ao buscar produtos:', err);
        setError(err.message);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [visibleItems]);
  // Adaptação para screen resize com debounce
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
  }, []);

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

  return (
    <Layout>
      {/* SEO e Metadados */}
      <Head>
        <title>Smartphones Xiaomi | Loja Oficial</title>
        <meta name="description" content="Compre smartphones Xiaomi originais com os melhores preços. Mi, Redmi, POCO e mais modelos com entrega rápida e garantia oficial." />
        
        {/* OpenGraph tags para compartilhamento em redes sociais */}
        <meta property="og:title" content="Smartphones Xiaomi | Loja Oficial" />
        <meta property="og:description" content="Compre smartphones Xiaomi originais com os melhores preços. Todos os modelos com garantia oficial e entrega rápida." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/Custom/Content/Themes/xiaomi/Imagens/xiaomi-products.png" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://seusite.com'}/marca/xiaomi`} />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Smartphones Xiaomi | Loja Oficial" />
        <meta name="twitter:description" content="Compre smartphones Xiaomi originais com os melhores preços." />
        <meta name="twitter:image" content="/Custom/Content/Themes/xiaomi/Imagens/xiaomi-products.png" />
      </Head>

      {/* Banner Hero para a marca Xiaomi */}
      <div style={{
        marginTop: '-50px',
        position: 'relative',
        zIndex: 1
      }}>
        <SectionContainer noPadding>
          <div className={`${homeBrandStyles.brandBanner} ${homeBrandStyles.xiaomi}`} style={{ 
            minHeight: '450px',
            display: 'flex',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Vídeo como fundo de todo o banner */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1
            }}>
              <video
                src="/videos/xiaomi-products-showcase.mp4"
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: "cover",
                  objectPosition: "center center"
                }}
                autoPlay
                muted
                loop
                playsInline
              />
              {/* Overlay escuro para melhorar contraste com o texto */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)',
                zIndex: 2
              }}></div>
            </div>

            {/* Conteúdo do banner */}
            <div style={{
              display: 'flex',
              width: '100%',
              position: 'relative',
              flexDirection: 'row',
              alignItems: 'stretch',
              zIndex: 3
            }}>
              {/* Conteúdo do lado esquerdo - Texto e botões */}
              <div style={{
                flex: '0 0 100%',
                padding: '40px 30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{ flex: '1' }}></div>
              </div>
            </div>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              padding: isMobile ? '10px 0 18px' : '20px 15px 30px',
              zIndex: 10,
              background: isMobile ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 100%)' : 'transparent',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <div
                className={styles.brandNavigation}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: isMobile ? 'nowrap' : 'wrap',
                  gap: isMobile ? '4px' : '10px',
                  overflowX: isMobile ? 'auto' : 'visible',
                  padding: isMobile ? '6px 4px' : '5px',
                  marginTop: isMobile ? '0' : '0',
                  marginBottom: isMobile ? '0' : '0',
                  WebkitOverflowScrolling: 'touch',
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                }}
              >
                <BrandNavigationButton brand="Apple" />
                <BrandNavigationButton brand="Xiaomi" isActive={true} />
                <BrandNavigationButton brand="Samsung" />
                <BrandNavigationButton brand="Motorola" />
                <BrandNavigationButton brand="Ver todos" />
              </div>
            </div>
          </div>
        </SectionContainer>
      </div>
      
      {/* Conteúdo principal com filtros laterais e produtos */}
      <SectionContainer>
        <div className={styles.mainContent}>
          {/* Sidebar com filtros - Aplicando a borda gradiente com cantos arredondados */}
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
              background: 'linear-gradient(90deg, #ff6700, #000000)',
              content: '""',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              zIndex: 0
            }}></div>
            
            {/* Conteúdo do filtro - com z-index para ficar acima da borda */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              background: 'linear-gradient(90deg, rgba(255,103,0,0.03), rgba(0,0,0,0.03))',
              borderRadius: '10px',
              padding: '15px',
              height: 'calc(100% - 30px)'
            }}>
              <div className={styles.sidebarHeader}>
                <h2>Filtros</h2>
                {(selectedStorage.length > 0 || selectedColors.length > 0 || selectedAvailability !== 'all' || priceRange.max < 15000) && (
                  <button className={styles.clearAllFilters} onClick={clearFilters}>
                    Limpar tudo
                  </button>
                )}
              </div>
              
              {/* Botão mobile para mostrar/esconder filtros - Estilizado com o gradiente */}              <div style={{ display: isMobile ? 'block' : 'none' }}>
                <FilterToggleButton 
                  showFiltersInitial={showFilters} 
                  onToggle={(newState) => {
                    console.log('Alternando filtros Xiaomi para:', newState);
                    setShowFilters(newState);
                  }} 
                  styles={styles}
                />
              </div>
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
                    {/* Preço mínimo e máximo */}
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
                    
                    {/* Slider corrigido - garantindo que alcance as extremidades */}
                    <div style={{
                      position: 'relative',
                      height: '30px',
                      margin: '20px 0 15px',
                      width: '100%'
                    }}>
                      {/* Linha de fundo para o slider */}
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
                      
                      {/* Linha preenchida com gradiente */}
                      <div style={{
                        position: 'absolute',
                        height: '4px',
                        left: `${(priceRange.min / 15000) * 100}%`,
                        right: `${100 - (priceRange.max / 15000) * 100}%`,
                        background: 'linear-gradient(90deg, #ff6700, #000000)',
                        borderRadius: '2px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1
                      }}></div>
                      
                      {/* Implementação separada para cada input, empilhados com pointerEvents corretos */}
                      <div className="price-slider-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {/* Slider mínimo */}
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
                        
                        {/* Slider máximo */}
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
                    
                    {/* Estilos para os thumbs dos sliders agora usando CSS convencional inline */}
                    <style dangerouslySetInnerHTML={{ __html: `
                      input[type=range]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: white;
                        border: 2px solid #ff6700;
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
                        border: 2px solid #ff6700;
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
                    {['64GB', '128GB', '256GB', '512GB'].map(storage => (
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
                    {['Preto', 'Branco', 'Azul', 'Verde', 'Cinza', 'Dourado'].map(color => (
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
              {/* Pseudo-elemento para criar a borda gradiente */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '12px',
                padding: '2px',
                background: 'linear-gradient(90deg, #ff6700, #000000)',
                content: '""',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                zIndex: 0
              }}></div>
              
              {/* Conteúdo da toolbar - com melhorias de acessibilidade */}
              <div style={{
                position: 'relative',
                zIndex: 1,
                background: 'linear-gradient(90deg, rgba(255,103,0,0.03), rgba(0,0,0,0.03))',
                borderRadius: '10px',
                padding: '15px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {/* Botões de visualização com aria-labels para acessibilidade */}
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
                
                {/* Opções de ordenação com melhorias de acessibilidade */}
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
                              alt={product.name || "Produto Xiaomi"}
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
                      <div className={styles.productActions}>                      <button 
                        className={`${styles.addToCartButton} ${homeBrandStyles.brandCta}`}
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={addingProductId === product.id || addingToCart}
                        data-product-id={product.id}
                        data-product-name={product.name}
                        data-product-price={product.price}
                        data-product-image={product.image?.sourceUrl || product.images?.[0]?.src}
                        style={{
                          position: 'relative',
                          minHeight: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: successProductId === product.id ? 
                            'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 
                            errorProductId === product.id ?
                            'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                            'linear-gradient(135deg, #ff6900 0%, #00a8e1 100%)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {addingProductId === product.id ? (
                          <LoadingSpinner size="small" />
                        ) : successProductId === product.id ? (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '50%',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}>
                            <span style={{
                              color: '#16a34a', 
                              fontSize: '16px',
                              fontWeight: 'bold'
                            }}>✓</span>
                          </span>
                        ) : errorProductId === product.id ? (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '50%',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}>
                            <span style={{
                              color: '#dc2626', 
                              fontSize: '16px',
                              fontWeight: 'bold'
                            }}>✕</span>
                          </span>
                        ) : (
                          <span>Adicionar ao Carrinho</span>
                        )}
                      </button>
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
            
            {/* Paginação e botão "Mostrar mais" */}
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
        
      {/* Rodapé especial da página */}
      <SectionContainer noPadding>
        <div className={styles.brandFooter}>
          <div className={styles.footerGridContainer}>
            <div className={styles.footerColumn}>
              <h3>Categorias Xiaomi</h3>
              <ul>
                <li><Link href="/marca/xiaomi/redmi"><a>Redmi Series</a></Link></li>
                <li><Link href="/marca/xiaomi/mi"><a>Mi Series</a></Link></li>
                <li><Link href="/marca/xiaomi/poco"><a>POCO Series</a></Link></li>
                <li><Link href="/marca/xiaomi/acessorios"><a>Acessórios</a></Link></li>
              </ul>
            </div>
            
            <div className={styles.footerColumn}>
              <h3>Principais Produtos</h3>
              <ul>
                <li><Link href="/produto/xiaomi-redmi-note-12"><a>Redmi Note 12</a></Link></li>
                <li><Link href="/produto/xiaomi-13t"><a>Xiaomi 13T</a></Link></li>
                <li><Link href="/produto/poco-x5-pro"><a>POCO X5 Pro</a></Link></li>
                <li><Link href="/produto/xiaomi-redmi-12"><a>Redmi 12</a></Link></li>
                <li><Link href="/produto/xiaomi-13-ultra"><a>Xiaomi 13 Ultra</a></Link></li>
              </ul>
            </div>
            
            <div className={styles.footerColumn}>
              <h3>Garantia e Suporte</h3>
              <ul>
                <li><Link href="/garantia-xiaomi"><a>Garantia oficial Xiaomi</a></Link></li>
                <li><Link href="/assistencia-tecnica"><a>Assistência técnica</a></Link></li>
                <li><Link href="/mi-services"><a>Mi Services</a></Link></li>
                <li><Link href="/trocas-e-devolucoes"><a>Trocas e devoluções</a></Link></li>
              </ul>
            </div>
            
            <div className={styles.footerColumn}>
              <h3>Informações</h3>
              <div className={styles.footerInfo}>
                <p>A Xiaomi oferece smartphones com excelente custo-benefício, combinando tecnologia avançada, câmeras de alta resolução e performance superior.</p>
                <div className={styles.footerBrandLogo}>
                  <Image
                    src="/Custom/Content/Themes/xiaomi/Imagens/xiaomi-logo-gray.png"
                    alt="Logo Xiaomi"
                    width={80}
                    height={50}
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <Link href="/sobre-xiaomi">
                  <a className={styles.footerLink}>Saiba mais sobre a Xiaomi</a>
                </Link>
              </div>
            </div>
          </div>
          
          <div className={styles.footerCTA}>
            <div className={styles.ctaContent}>
              <h3>Assine nossa newsletter</h3>
              <p>Receba ofertas exclusivas e novidades sobre os lançamentos Xiaomi</p>
              
              <div className={styles.newsletterForm}>
                <input type="email" placeholder="Seu melhor e-mail" />
                <button className={homeBrandStyles.brandCta}>Assinar</button>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
      
      {/* Dados estruturados Schema.org */}
      <CategorySchema 
        products={filteredProducts} 
        category="Xiaomi" 
      />
      
      <OrganizationSchema />
      
      <BreadcrumbSchema 
        items={[
          { name: 'Home', url: '/' },
          { name: 'Smartphones', url: '/smartphones' },
          { name: 'Xiaomi', url: '/marca/xiaomi' }
        ]}
      />
    </Layout>
  );
}