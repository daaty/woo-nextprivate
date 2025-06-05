import React, { useState } from 'react';
import Link from 'next/link';
import { useCartContext } from '../../contexts/CartContext';
import LoadingSpinner from '../LoadingSpinner';

// Modal de confirmação de produto adicionado (igual ao AddToCartButton)
const ProductAddedModal = ({ isOpen, onClose, onGoToCart, onContinueShopping, productName, quantity }) => {
    if (!isOpen) return null;

    return (
        <div className="product-added-modal">
            <div className="product-added-modal-content">
                <div className="modal-header">
                    <div className="success-icon">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="modal-title">Produto adicionado ao carrinho!</h2>
                    <p className="modal-subtitle">
                        {quantity}x {productName} foi adicionado com sucesso
                    </p>
                </div>

                <div className="modal-actions">
                    <button 
                        onClick={onGoToCart}
                        className="modal-action-primary"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H20.5" />
                        </svg>
                        Ir para o Carrinho
                    </button>
                    
                    <button 
                        onClick={onContinueShopping}
                        className="modal-action-secondary"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                        Continuar Comprando
                    </button>
                </div>

                <p className="modal-footer">
                    <span className="security-text">
                        🔒 Seus dados estão protegidos com a mais alta segurança
                    </span>
                </p>
            </div>

            <style jsx>{`
                /* ...existing modal styles... */
                .product-added-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: modalFadeIn 0.3s ease-out;
                }

                .product-added-modal-content {
                    background: white;
                    padding: 32px;
                    border-radius: 16px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: modalSlideIn 0.3s ease-out;
                    text-align: center;
                }

                .modal-header {
                    margin-bottom: 24px;
                }

                .success-icon {
                    width: 64px;
                    height: 64px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px auto;
                    animation: successPulse 0.6s ease-out;
                }

                .modal-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 8px;
                }

                .modal-subtitle {
                    color: #6b7280;
                    font-size: 0.9rem;
                }

                .modal-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .modal-action-primary, .modal-action-secondary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    font-size: 1rem;
                }

                .modal-action-primary {
                    background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(255, 105, 0, 0.3);
                }

                .modal-action-primary:hover {
                    background: linear-gradient(135deg, #ff8f00 0%, #ff6900 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 105, 0, 0.4);
                }

                .modal-action-secondary {
                    background: #f9fafb;
                    color: #374151;
                    border: 2px solid #e5e7eb;
                }

                .modal-action-secondary:hover {
                    background: #f3f4f6;
                    border-color: #d1d5db;
                    transform: translateY(-1px);
                }

                .modal-footer {
                    margin: 0;
                    padding-top: 16px;
                    border-top: 1px solid #f3f4f6;
                }

                .security-text {
                    font-size: 0.75rem;
                    color: #6b7280;
                }

                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes modalSlideIn {
                    from { 
                        opacity: 0; 
                        transform: translateY(-20px) scale(0.95); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                }

                @keyframes successPulse {
                    0% { transform: scale(0.8); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }

                @media (max-width: 480px) {
                    .product-added-modal-content {
                        padding: 24px;
                        margin: 16px;
                    }
                    
                    .modal-title {
                        font-size: 1.25rem;
                    }
                    
                    .modal-actions {
                        gap: 8px;
                    }
                    
                    .modal-action-primary, .modal-action-secondary {
                        padding: 14px 20px;
                        font-size: 0.9rem;
                    }
                }
            `}</style>
        </div>
    );
};

const ProductGrid = ({ products }) => {
  const [addingProductId, setAddingProductId] = useState(null);
  const [showProductAddedModal, setShowProductAddedModal] = useState(false);
  const [lastAddedProductName, setLastAddedProductName] = useState('');
  const { addToCart, addingToCart, lastAddedProduct } = useCartContext();
  
  if (!products || products.length === 0) {
    return <p>Nenhum produto encontrado.</p>;
  }

  // Função para formatar o preço em reais
  const formatPrice = (price) => {
    if (!price) return 'Preço indisponível';
    
    // Converte para número se for string
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericPrice);
  };

  // Função para adicionar produto ao carrinho
  const handleAddToCart = async (product) => {
    try {
      setAddingProductId(product.id);
      
      // Usar databaseId preferencial para maior compatibilidade
      const productId = product.databaseId || product.id;
      const result = await addToCart(productId, 1);
      
      if (result.success) {
        console.log('✅ Produto adicionado com sucesso desde o grid!');
        setLastAddedProductName(product.name);
        setShowProductAddedModal(true);
        setAddingProductId(null);
      } else {
        console.error("❌ Erro ao adicionar ao carrinho:", result.error);
        setAddingProductId(null);
      }
    } catch (err) {
      console.error("❌ Exceção ao adicionar ao carrinho:", err);
      setAddingProductId(null);
    }
  };

  // Manipulador para continuar comprando
  const handleContinueShopping = () => {
    setShowProductAddedModal(false);
  };
  // Manipulador para ir ao carrinho
  const handleGoToCart = () => {
    setShowProductAddedModal(false);
    window.location.href = '/cart';
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => {
          const imageUrl = product.image?.sourceUrl || '/placeholder-image.jpg';
          const productUrl = product.slug ? `/produto/${product.slug}` : '#';
          const price = product.price || (product.regularPrice ? product.regularPrice : '0');
          const salePrice = product.salePrice || null;
          const onSale = product.onSale || (salePrice && salePrice !== price);
          
          const isAddingThisProduct = addingProductId === product.id;
          const wasRecentlyAdded = lastAddedProduct && 
            lastAddedProduct.id === (product.databaseId || product.id) && 
            (Date.now() - lastAddedProduct.timestamp) < 3000; // 3 segundos

          return (
            <div key={product.id} className="product-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <Link href={productUrl}>
                <a className="block">
                  <div className="relative pb-[100%] overflow-hidden bg-gray-100">
                    <img 
                      src={imageUrl}
                      alt={product.name}
                      className="absolute top-0 left-0 w-full h-full object-contain p-2"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                    {onSale && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        Oferta
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium mb-2 h-10 overflow-hidden">{product.name}</h3>
                    <div className="flex flex-col">
                      {onSale && product.regularPrice && (
                        <span className="text-gray-500 text-xs line-through">
                          {formatPrice(product.regularPrice)}
                        </span>
                      )}
                      <span className="text-lg font-semibold text-primary">
                        {formatPrice(price)}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        em até <strong>12x</strong> sem juros
                      </div>
                    </div>
                  </div>
                </a>
              </Link>
              <div className="px-4 pb-4">
                <div className="add-to-cart-button-container">
                  {isAddingThisProduct ? (
                    // Mostrar spinner centralizado no lugar do botão
                    <div className="spinner-container">
                      <LoadingSpinner size="normal" />
                    </div>
                  ) : (
                    // Mostrar botão normal
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingToCart}
                      className="w-full py-2 px-4 rounded text-white font-medium transition-all duration-200 bg-primary hover:bg-primary-dark"
                    >
                      {wasRecentlyAdded ? '✓ Adicionado!' : 'Adicionar ao Carrinho'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de produto adicionado */}
      <ProductAddedModal 
        isOpen={showProductAddedModal}
        onClose={() => setShowProductAddedModal(false)}
        onContinueShopping={handleContinueShopping}
        onGoToCart={handleGoToCart}
        productName={lastAddedProductName}
        quantity={1}
      />

      <style jsx>{`
        .add-to-cart-button-container {
          position: relative;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
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

export default ProductGrid;
