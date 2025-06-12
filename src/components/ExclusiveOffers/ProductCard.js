import React, { useState } from 'react';
import Link from 'next/link';
import { useCartContext } from '../../contexts/CartContext';
import LoadingSpinner from '../LoadingSpinner';
import styles from './CountdownOffers.module.css';

const ProductCard = ({ product, discount }) => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showProductAddedModal, setShowProductAddedModal] = useState(false);
  const { addToCart } = useCartContext();

  // Formatar preço para o formato brasileiro
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // Verificar estoque limitado (menos de 10 unidades)
  const isLimitedStock = product.stock_quantity && product.stock_quantity < 10;
  
  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      const result = await addToCart(product.id, 1);
      
      if (result.success) {
        setShowProductAddedModal(true);
      }
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleGoToCart = () => {
    setShowProductAddedModal(false);
    window.location.href = '/cart';
  };

  const handleContinueShopping = () => {
    setShowProductAddedModal(false);
  };
  
  return (
    <>
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
        
        <div className="add-to-cart-button-container">
          {isAddingToCart ? (
            <div className="spinner-container">
              <LoadingSpinner size="normal" />
            </div>
          ) : (
            <button 
              className={styles.addToCart}
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              Adicionar ao Carrinho
            </button>
          )}
        </div>
      </div>

      {/* Modal de produto adicionado */}
      {showProductAddedModal && (
        <div className="product-added-modal">
          {/* ...existing modal content... */}
        </div>
      )}

      <style jsx>{`
        .add-to-cart-button-container {
          position: relative;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .spinner-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          min-height: 40px;
        }
      `}</style>
    </>
  );
};

export default ProductCard;
