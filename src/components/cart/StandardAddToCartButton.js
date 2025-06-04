import React from 'react';
import { useAddToCart } from '../hooks/useAddToCart';
import LoadingSpinner from './LoadingSpinner';

/**
 * Standardized AddToCart Button Component
 * Consistent styling, behavior, and accessibility across the site
 */
const StandardAddToCartButton = ({ 
  product, 
  quantity = 1, 
  variation = null,
  size = 'medium',
  variant = 'primary',
  fullWidth = false,
  showQuantity = false,
  customText = null,
  onSuccess = null,
  onError = null,
  disabled = false,
  className = ''
}) => {
  const { addToCart, loading, error, success } = useAddToCart();

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || loading) return;

    const result = await addToCart(product, quantity, variation);
    
    if (result && onSuccess) {
      onSuccess(product, quantity);
    } else if (!result && onError) {
      onError(error);
    }
  };

  // Size classes
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
    ghost: 'text-blue-600 hover:bg-blue-50'
  };

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const getButtonText = () => {
    if (customText) return customText;
    if (loading) return 'Adding...';
    if (success) return 'Added!';
    return 'Add to Cart';
  };

  const isDisabled = disabled || loading || !product;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={baseClasses}
        aria-label={`Add ${product?.name || 'product'} to cart`}
        type="button"
      >
        {loading && (
          <LoadingSpinner 
            size="small" 
            className="mr-2" 
            color="currentColor" 
          />
        )}
        
        <span>{getButtonText()}</span>
        
        {showQuantity && quantity > 1 && (
          <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded text-xs">
            {quantity}
          </span>
        )}

        {success && (
          <svg 
            className="ml-2 w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm z-10">
          {error}
        </div>
      )}
    </div>
  );
};

export default StandardAddToCartButton;
