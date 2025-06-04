import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './AppleProducts.module.css';

const AppleProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  
  useEffect(() => {
    const fetchAppleProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Buscar produtos da marca Apple
        console.log("Buscando produtos Apple...");
        const response = await fetch('/api/brand?brand=apple&per_page=12');
        
        if (!response.ok) {
          throw new Error(`API retornou status ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Produtos Apple recebidos:", data);
        
        if (Array.isArray(data) && data.length > 0) {
          // Pré-processar produtos para garantir consistência
          const processedProducts = data.map(product => {
            // Garantir que imagens existam e sejam acessíveis
            console.log(`Processando produto ${product.name}, imagens:`, product.images);
            
            if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
              product.images = [{ src: '/banners/placeholder.jpg', alt: product.name }];
            }
            
            // Garantir propriedades essenciais
            return {
              ...product,
              price: product.price || '0',
              regular_price: product.regular_price || product.price || '0',
              images: product.images.map(img => ({
                ...img,
                src: img.src || '/banners/placeholder.jpg',
                alt: img.alt || product.name || 'Produto'
              }))
            };
          });
          
          setProducts(processedProducts);
          console.log("Produtos Apple processados:", processedProducts);
        } else {
          console.warn("Nenhum produto Apple encontrado");
          setProducts([]);
        }
      } catch (err) {
        console.error("Erro ao buscar produtos Apple:", err);
        setError(`Falha ao carregar os produtos: ${err.message}`);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppleProducts();
  }, []);
  
  // Navegar para o slide anterior
  const prevSlide = () => {
    setActiveSlide(prev => (prev === 0 ? Math.ceil(products.length / 3) - 1 : prev - 1));
  };
  
  // Navegar para o próximo slide
  const nextSlide = () => {
    setActiveSlide(prev => (prev === Math.ceil(products.length / 3) - 1 ? 0 : prev + 1));
  };
  
  // Ir para um slide específico
  const goToSlide = (index) => {
    setActiveSlide(index);
  };
  
  // Calcular quantos slides precisamos baseado no número de produtos (3 por slide)
  const totalSlides = Math.max(1, Math.ceil(products.length / 3));
  
  // Formatador de preço
  const formatPrice = (price) => {
    if (!price) return 'R$ 0,00';
    
    try {
      // Limpa o preço e converte para número
      let numericValue;
      
      // Detectar formato do preço
      if (typeof price === 'string') {
        // Se tem ponto de milhar e vírgula decimal (formato BR: 1.000,00)
        if (price.includes('.') && price.includes(',')) {
          numericValue = parseFloat(price.replace(/\./g, '').replace(',', '.'));
        } 
        // Se tem apenas vírgula (1000,00)
        else if (price.includes(',')) {
          numericValue = parseFloat(price.replace(',', '.'));
        } 
        // Se tem apenas ponto (1000.00) ou é numérico
        else {
          numericValue = parseFloat(price);
        }
      } else {
        numericValue = price;
      }
      
      // Formatar o preço no padrão brasileiro
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numericValue);
    } catch (e) {
      console.error("Erro ao formatar preço:", e);
      return `R$ ${price}`;
    }
  };
  
  return (
    <div className={styles.featuredBlock} id="apple-products">
      <div className={styles.container}>
        <div className={styles.blockHeader}>
          <h3 className={styles.title}>
            <span className={styles.text}>Produtos Apple</span>
          </h3>
        </div>
        
        {loading ? (
          <div className={styles.loading}>Carregando produtos...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : products.length === 0 ? (
          <div className={styles.noProducts}>
            Nenhum produto Apple disponível.
            <br />
            <small>Adicione produtos com a tag ou categoria "Apple" no WooCommerce</small>
          </div>
        ) : (
          <div className={styles.sliderContainer}>
            <div className={styles.productGrid}>
              {products.map(product => (
                <div key={product.id} className={styles.productItem}>
                  <div className={styles.imageContainer}>
                    <div className={styles.imgBox}>
                      <Link href={`/produto/${product.slug}`}>
                        <a className={styles.imageLink} title={product.name}>
                          <img 
                            src={product.images[0]?.src || '/banners/placeholder.jpg'} 
                            alt={product.images[0]?.alt || product.name} 
                            className={styles.productImage}
                            onError={(e) => {
                              console.warn(`Erro ao carregar imagem: ${e.target.src}`);
                              e.target.src = '/banners/placeholder.jpg';
                            }}
                            loading="lazy"
                          />
                          <span className={styles.lazyLoading}></span>
                        </a>
                      </Link>
                    </div>
                  </div>
                  
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>
                      <Link href={`/produto/${product.slug}`}>
                        <a>{product.name}</a>
                      </Link>
                    </h3>
                    
                    <div className={styles.productPrices}>
                      {product.on_sale ? (
                        <>
                          <div className={styles.regularPrice}>
                            {formatPrice(product.regular_price)}
                          </div>
                          <div className={styles.salePrice}>
                            {formatPrice(product.price)}
                          </div>
                        </>
                      ) : (
                        <div className={styles.price}>
                          {formatPrice(product.price)}
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.addToCartWrapper}>
                      <button className={styles.addToCartBtn}>
                        Adicionar ao Carrinho
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Se houver muitos produtos, podemos adicionar paginação aqui */}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppleProducts;