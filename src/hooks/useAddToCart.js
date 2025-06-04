import { useState, useContext } from 'react';
import { CartContext } from '../contexts/CartContext';
import { useMutation } from '@apollo/client';
import { ADD_TO_CART } from '../mutations/add-to-cart';

/**
 * Unified hook for add to cart functionality
 * Provides consistent behavior across all components
 */
export const useAddToCart = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { updateCartCount, setCart } = useContext(CartContext);

  const [addToCartMutation] = useMutation(ADD_TO_CART, {
    onCompleted: (data) => {
      if (data?.addToCart?.cartItems) {
        setCart(data.addToCart);
        updateCartCount(data.addToCart.contents?.itemCount || 0);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    },
    onError: (error) => {
      console.error('Add to cart error:', error);
      setError(error.message || 'Failed to add item to cart');
      setTimeout(() => setError(null), 5000);
    }
  });

  const addToCart = async (product, quantity = 1, variation = null) => {
    if (loading) return false;

    setLoading(true);
    setError(null);

    try {
      // Normalize product ID handling
      const productId = product.databaseId || product.id;
      
      if (!productId) {
        throw new Error('Product ID is required');
      }

      const variables = {
        productId: parseInt(productId),
        quantity: parseInt(quantity)
      };

      // Handle variations
      if (variation && product.type === 'VARIABLE') {
        variables.variationId = parseInt(variation.databaseId || variation.id);
      }

      await addToCartMutation({ variables });
      return true;

    } catch (err) {
      console.error('Add to cart failed:', err);
      setError(err.message || 'Failed to add item to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    addToCart,
    loading,
    error,
    success,
    resetState
  };
};
