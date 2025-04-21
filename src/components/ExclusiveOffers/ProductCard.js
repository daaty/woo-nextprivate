import React from 'react';
import Link from 'next/link';
import styles from './CountdownOffers.module.css';

const ProductCard = ({ product, discount }) => {
  // Formatar preço para o formato brasileiro
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // Verificar estoque limitado (menos de 10 unidades)
  const isLimitedStock = product.stock_quantity && product.stock_quantity < 10;
  
  return (
    <div className={styles.productCard}>
      {discount > 0 && (
        <div className={styles.discountTag}>
          <span>-{discount}%</span>
        </div>
      )}
      
      <Link href={`/produto/${product.slug}`}>
        <a className={styles.productLink}>
          <div className={styles.productImage}>
            <img src={product.images[0].src} alt={product.name} />
          </div>
          
          <div className={styles.productInfo}>
            <h3 className={styles.productName}>{product.name}</h3>
            
            <div className={styles.productPrices}>
              {product.regular_price && (
                <span className={styles.regularPrice}>
                  {formatPrice(product.regular_price)}
                </span>
              )}
              
              <span className={styles.salePrice}>
                {formatPrice(product.price)}
              </span>
            </div>
            
            <div className={styles.installments}>
              em até <strong>12x</strong> sem juros
            </div>

            {isLimitedStock && (
              <div className={styles.stockWarning}>
                Apenas {product.stock_quantity} {product.stock_quantity === 1 ? 'unidade' : 'unidades'} disponível!
              </div>
            )}
          </div>
        </a>
      </Link>
      
      <button className={styles.addToCart}>
        Adicionar ao Carrinho
      </button>
    </div>
  );
};

export default ProductCard;
