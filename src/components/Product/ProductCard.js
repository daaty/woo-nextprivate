import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './ProductCard.module.css';

const ProductCard = ({ product, className = '' }) => {
  // Verificar se o produto está em promoção
  const isOnSale = product.onSale || 
    (product.regularPrice && product.price && product.regularPrice !== product.price);
  
  // Calcular desconto quando aplicável
  const discount = isOnSale ? 
    Math.round((1 - parseFloat(product.price) / parseFloat(product.regularPrice)) * 100) : 0;
  
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
    <div className={`${styles.productCard} ${className}`}>
      <div className={styles.productCardInner}>
        {/* Tags de status */}
        {isOnSale && discount > 0 && (
          <span className={styles.productDiscountTag}>-{discount}%</span>
        )}
        
        {product.featured && (
          <span className={styles.productFeaturedTag}>Destaque</span>
        )}
        
        {/* Imagem do produto com container de proporção fixa */}
        <Link href={`/produto/${product.slug}`}>
          <a className={styles.productImageContainer}>
            <div className={styles.productImageWrapper}>
              {product.image?.src || product.images?.[0]?.src ? (
                <Image 
                  src={product.image?.src || product.images?.[0]?.src || "/placeholder-product.jpg"}
                  alt={product.name}
                  layout="fill"
                  objectFit="contain"
                  quality={85}
                />
              ) : (
                <div className={styles.noImage}>Sem Imagem</div>
              )}
            </div>
            
            {/* Overlay com ações extras no hover */}
            <div className={styles.productActionOverlay}>
              <button className={styles.quickViewBtn} aria-label="Visualização rápida">
                <span className={styles.iconEye}>👁️</span>
              </button>
              <button className={styles.wishlistBtn} aria-label="Adicionar aos favoritos">
                <span className={styles.iconHeart}>❤️</span>
              </button>
            </div>
          </a>
        </Link>
        
        {/* Informações do produto */}
        <div className={styles.productInfo}>
          <Link href={`/produto/${product.slug}`}>
            <a className={styles.productTitle}>{product.name}</a>
          </Link>
          
          <div className={styles.productPrice}>
            {isOnSale && product.regularPrice && (
              <span className={styles.productPriceRegular}>
                {formatPrice(product.regularPrice)}
              </span>
            )}
            <span className={styles.productPriceCurrent}>
              {formatPrice(product.price)}
            </span>
          </div>
          
          <div className={styles.productInstallment}>
            em até <strong>12x</strong> no cartão
          </div>
          
          <button className={styles.addToCartBtn} onClick={(e) => {
            e.preventDefault();
            // Adicionar lógica para adicionar ao carrinho aqui
            console.log('Adicionando ao carrinho:', product);
          }}>
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;