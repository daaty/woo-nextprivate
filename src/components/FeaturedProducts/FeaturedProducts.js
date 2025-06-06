import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './FeaturedProducts.module.css';
import { useCartContext } from '../../contexts/CartContext';
import { calculateInstallmentValue, INSTALLMENT_INTEREST_RATE, MAX_INSTALLMENTS } from '../../utils/installment-utils';
import { priceToNumber, formatPrice } from '../../utils/format-price';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [addingProductId, setAddingProductId] = useState(null);
  
  // Conectando ao contexto do carrinho
  const { addToCart, isAddingToCart, addToCartSuccess } = useCartContext();
  
  // Função para adicionar produto ao carrinho
  const handleAddToCart = async (product) => {
    try {
      setAddingProductId(product.id);
      // Usar databaseId em vez de id para compatibilidade com GraphQL
      await addToCart(product.databaseId || product.id, 1);
      
      // Reset do estado após 2 segundos
      setTimeout(() => {
        setAddingProductId(null);
      }, 2000);
    } catch (err) {
      console.error('Erro ao adicionar ao carrinho:', err);
      setAddingProductId(null);
    }
  };
  
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Buscar produtos em destaque
        console.log("Buscando produtos em destaque...");
        const response = await fetch('/api/products?featured=true&per_page=6');
        
        if (!response.ok) {
          throw new Error(`API retornou status ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Produtos recebidos:", data);
        
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
          console.log("Produtos processados:", processedProducts);
        } else {
          console.warn("Nenhum produto em destaque encontrado");
          setProducts([]);
        }
      } catch (err) {
        console.error("Erro ao buscar produtos em destaque:", err);
        setError(`Falha ao carregar os produtos: ${err.message}`);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedProducts();
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
  
  // Calcular o valor da parcela usando priceToNumber
  const calculateInstallment = (price) => {
    const numericPrice = priceToNumber(price);
    const installmentValue = calculateInstallmentValue(numericPrice, MAX_INSTALLMENTS);
    return formatPrice(installmentValue);
  };
  
  return (
    <div className={styles.featuredBlock} id="featured-products">
      <div className={styles.container}>
        <div className={styles.blockHeader}>
          <h3 className={styles.title}>
            <span className={styles.text}>Produtos em destaque</span>
          </h3>
        </div>
        
        {loading ? (
          <div className={styles.loading}>Carregando produtos...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : products.length === 0 ? (
          <div className={styles.noProducts}>
            Nenhum produto em destaque disponível.
            <br />
            <small>Adicione produtos à categoria "destaque" no WooCommerce</small>
          </div>
        ) : (
          <div className={styles.sliderContainer}>
            <div className={styles.productSlider}>
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div 
                  key={`slide-${slideIndex}`}
                  className={`${styles.slide} ${slideIndex === activeSlide ? styles.activeSlide : ''}`}
                  style={{ 
                    transform: `translateX(${(slideIndex - activeSlide) * 100}%)` 
                  }}
                >
                  <div className={styles.slideContent}>
                    {products
                      .slice(slideIndex * 3, (slideIndex + 1) * 3)
                      .map(product => (
                        <div 
                          key={product.id} 
                          className={styles.productItem}
                          data-product-id={product.databaseId || product.id}
                          data-product-name={product.name}
                          data-product-price={product.price}
                        >
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
                              <div className={styles.installments}>
                                em até <strong>{MAX_INSTALLMENTS}x</strong> de {calculateInstallment(product.price)}
                              </div>
                            </div>
                              <div className={styles.addToCartWrapper}>
                              <button 
                                className={`${styles.addToCartBtn} ${addingProductId === product.id && isAddingToCart ? styles.loading : ''} ${addingProductId === product.id && addToCartSuccess ? styles.success : ''}`} 
                                onClick={() => handleAddToCart(product)}
                                disabled={addingProductId === product.id && (isAddingToCart || addToCartSuccess)}
                                data-product-id={product.databaseId || product.id}
                                data-product-name={product.name}
                                data-product-price={product.price}
                                data-product-image={product.images[0]?.src}
                              >
                                {addingProductId === product.id && isAddingToCart ? (
                                  <span>Adicionando...</span>
                                ) : addingProductId === product.id && addToCartSuccess ? (
                                  <span>✓ Adicionado</span>
                                ) : (
                                  <span>Adicionar ao Carrinho</span>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Controles do slider */}
            {totalSlides > 1 && (
              <>
                <button 
                  className={styles.sliderButtonPrev} 
                  onClick={prevSlide}
                  aria-label="Slide anterior"
                >
                  &lsaquo;
                </button>
                <button 
                  className={styles.sliderButtonNext} 
                  onClick={nextSlide}
                  aria-label="Próximo slide"
                >
                  &rsaquo;
                </button>
                
                <div className={styles.sliderDots}>
                  {Array.from({ length: totalSlides }).map((_, index) => (
                    <button
                      key={`dot-${index}`}
                      className={`${styles.dot} ${index === activeSlide ? styles.activeDot : ''}`}
                      onClick={() => goToSlide(index)}
                      aria-label={`Slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedProducts;
