import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

/**
 * Componente AddToCart
 * 
 * @param {Object} props
 * @param {Object} props.product - Dados do produto (id, nome, preço, etc)
 * @param {Number} props.variationId - ID da variação (opcional)
 * @param {Number} props.defaultQuantity - Quantidade padrão (default: 1)
 * @param {String} props.buttonClass - Classe CSS para o botão
 * @param {String} props.buttonText - Texto do botão
 * @param {Function} props.onAddedToCart - Callback após adicionar ao carrinho (opcional)
 */
const AddToCart = ({
  product,
  variationId = null,
  defaultQuantity = 1,
  buttonClass = "btn btn-primary",
  buttonText = "Adicionar ao Carrinho",
  onAddedToCart = null
}) => {
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Usando o contexto do carrinho
  const { addToCart } = useCart();

  // Verifica se o produto é válido
  if (!product || !product.id) {
    return null;
  }

  // Produto completo para adicionar ao carrinho
  const productToAdd = {
    ...product,
    variationId: variationId
  };

  // Função para lidar com clique no botão
  const handleAddToCart = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      
      // Adicionar ao carrinho via contexto
      const result = await addToCart(productToAdd, quantity);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: `${product.name} adicionado ao carrinho!`
        });
        
        // Chamar callback se fornecido
        if (onAddedToCart && typeof onAddedToCart === 'function') {
          onAddedToCart(result.cart);
        }
      } else {
        setMessage({
          type: 'error',
          text: 'Erro ao adicionar produto ao carrinho.'
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      setMessage({
        type: 'error',
        text: 'Ocorreu um erro. Tente novamente.'
      });
    } finally {
      setIsLoading(false);
      
      // Limpar mensagem de sucesso após 3 segundos
      if (message && message.type === 'success') {
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    }
  };

  // Renderização do componente
  return (
    <div className="add-to-cart-container">
      {/* Seletor de quantidade para produtos não variáveis */}
      {!variationId && (
        <div className="quantity-selector mb-2">
          <label htmlFor="quantity" className="me-2">Quantidade:</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            max="99"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="form-control form-control-sm d-inline-block"
            style={{ width: '70px' }}
          />
        </div>
      )}

      {/* Botão de adicionar ao carrinho */}
      <button
        onClick={handleAddToCart}
        className={buttonClass}
        disabled={isLoading}
      >
        {isLoading ? 'Adicionando...' : buttonText}
      </button>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`mt-2 alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default AddToCart;