# AddToCart Components Migration Guide

## Overview

This guide helps migrate from inconsistent add-to-cart implementations to a standardized system that provides:

- Consistent behavior across all components
- Unified styling and user experience
- Better error handling and loading states
- Improved accessibility
- Centralized configuration

## New Components

### 1. StandardAddToCartButton
The core reusable component with consistent styling and behavior.

### 2. useAddToCart Hook
Centralized logic for cart operations with proper error handling.

### 3. EnhancedAddToCartButton
Backward-compatible wrapper that adds modal functionality.

## Migration Examples

### Product Grid Component
**Before:**
```javascript
// Old inconsistent implementation
const handleAddToCart = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId: product.id, quantity: 1 })
    });
    // Custom handling...
  } catch (error) {
    console.log(error);
  }
  setLoading(false);
};

<button onClick={handleAddToCart} disabled={loading}>
  {loading ? 'Adding...' : 'Add to Cart'}
</button>
```

**After:**
```javascript
import StandardAddToCartButton from '../cart/StandardAddToCartButton';
import { ADD_TO_CART_CONFIG } from '../../config/addToCartConfig';

// Use preset configuration
const buttonProps = ADD_TO_CART_CONFIG.BUTTON_PRESETS.productGrid;

<StandardAddToCartButton
  product={product}
  {...buttonProps}
  onSuccess={(product, quantity) => {
    // Optional success callback
    console.log(`Added ${quantity}x ${product.name} to cart`);
  }}
/>
```

### Featured Products Component
**Before:**
```javascript
// GraphQL mutation with custom modal
const [addToCart] = useMutation(ADD_TO_CART);
const [showModal, setShowModal] = useState(false);

const handleAdd = async () => {
  try {
    await addToCart({ variables: { productId: product.databaseId } });
    setShowModal(true);
  } catch (error) {
    alert('Error adding to cart');
  }
};
```

**After:**
```javascript
import { EnhancedAddToCartButton } from '../cart/EnhancedAddToCartButton';

<EnhancedAddToCartButton
  product={product}
  showModal={true}
  size="medium"
  variant="primary"
  fullWidth={true}
/>
```

### Product Page Component
**Before:**
```javascript
// Complex custom implementation with various states
const [cartLoading, setCartLoading] = useState(false);
const [quantity, setQuantity] = useState(1);
// ... lots of custom logic
```

**After:**
```javascript
import { useAddToCart } from '../../hooks/useAddToCart';
import StandardAddToCartButton from '../cart/StandardAddToCartButton';

const { addToCart, loading, error, success } = useAddToCart();
const [quantity, setQuantity] = useState(1);

<div className="flex items-center gap-4">
  <QuantitySelector value={quantity} onChange={setQuantity} />
  <StandardAddToCartButton
    product={product}
    quantity={quantity}
    variation={selectedVariation}
    size="large"
    fullWidth={false}
    showQuantity={true}
    onSuccess={() => {
      // Custom success handling for product page
      router.push('/cart');
    }}
  />
</div>
```

## Configuration Usage

### Using Presets
```javascript
import { ADD_TO_CART_CONFIG } from '../../config/addToCartConfig';

// Apply preset configuration
const buttonConfig = ADD_TO_CART_CONFIG.BUTTON_PRESETS.exclusiveOffers;

<StandardAddToCartButton
  product={product}
  {...buttonConfig}
/>
```

### Custom Configuration
```javascript
<StandardAddToCartButton
  product={product}
  size="large"
  variant="outline"
  fullWidth={true}
  showQuantity={true}
  customText="Adicionar ao Carrinho"
  onSuccess={(product, quantity) => {
    // Track analytics
    if (ADD_TO_CART_CONFIG.FEATURES.enableAnalytics) {
      trackEvent('add_to_cart', { product_id: product.id, quantity });
    }
  }}
/>
```

## Error Handling

The new system provides consistent error handling:

```javascript
const { addToCart, loading, error } = useAddToCart();

// Error is automatically displayed in the UI
// You can also access it programmatically
useEffect(() => {
  if (error) {
    console.error('Cart error:', error);
    // Send to error tracking service
  }
}, [error]);
```

## Accessibility Improvements

All new components include:
- Proper ARIA labels
- Keyboard navigation support
- Screen reader announcements
- Focus management
- Color contrast compliance

## Testing

### Unit Tests
```javascript
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import StandardAddToCartButton from '../StandardAddToCartButton';

test('adds product to cart on click', async () => {
  const mockProduct = { id: 1, name: 'Test Product' };
  
  render(<StandardAddToCartButton product={mockProduct} />);
  
  const button = screen.getByRole('button', { name: /add test product to cart/i });
  fireEvent.click(button);
  
  await waitFor(() => {
    expect(screen.getByText('Adding...')).toBeInTheDocument();
  });
});
```

## Performance Considerations

The new system includes:
- Debounced button clicks to prevent rapid firing
- Optimized re-renders with proper memoization
- Lazy loading of modal components
- Efficient state management

## Breaking Changes

1. **Button Text**: Default text is now "Add to Cart" instead of various Portuguese/English variations
2. **Loading States**: Consistent loading indicators replace custom implementations
3. **Error Display**: Errors now show as inline messages instead of alerts or console logs
4. **Modal Behavior**: Success modals are now opt-in rather than default

## Migration Checklist

- [ ] Replace custom add-to-cart logic with `useAddToCart` hook
- [ ] Update button components to use `StandardAddToCartButton` or `EnhancedAddToCartButton`
- [ ] Remove duplicate modal implementations
- [ ] Update styling to use consistent classes
- [ ] Test all add-to-cart functionality
- [ ] Update tests to match new component API
- [ ] Review and update error handling
- [ ] Configure analytics tracking if needed
- [ ] Update accessibility tests

## Rollback Plan

If issues arise, the old components remain available during migration:
1. Keep existing files temporarily
2. Migrate one component at a time
3. Test thoroughly before removing old implementations
4. Use feature flags to toggle between old and new implementations
