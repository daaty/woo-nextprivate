# Cart v2 Implementation Guide

## 🚀 Overview

This guide describes the changes made to fix the Cart v2 display issues and provides instructions for fully migrating to the Cart v2 system. The Cart v2 system now has its own dedicated storage and can function independently of the Cart v1 API.

## 🔧 Fixes Implemented

### 1. Item Structure Adaptation

The main issue was that Cart v2 items had a different structure than what the cart page expected. We fixed this by adapting the Cart v2 items in the `useCartWithFallback.js` hook:

- Added property mapping (`quantity` → `qty`)
- Fixed image structure (`string` → `{sourceUrl: string}`)
- Added cartKey compatibility (`id` → `cartKey`)
- Formatted prices for consistent display

### 2. API Method Compatibility

We updated the Cart v2 API handlers to ensure they maintain compatibility with the expected Cart v1 response formats:

- Fixed method signatures for `updateCartItem`, `removeCartItem`, and `clearCart`
- Added proper error handling and promise resolutions
- Ensured responses follow the expected success/error format

## 🧪 Testing

To validate the fix, we've created two test scripts:

1. `verify-cart-v2-display-fix.js`: Tests the adapter functionality
2. `enable-cart-v2.js`: Script to enable Cart v2 for manual testing

To perform a full test, run:

```bash
# Enable Cart v2
node enable-cart-v2.js

# Verify adapter functionality
node verify-cart-v2-display-fix.js
```

## 🔄 Migration Steps

### Phase 1: Initial Deployment (Completed)

- ✅ Separate Cart v2 storage from Cart v1
- ✅ Update API endpoints for add/update/remove
- ✅ Fix image and item structure compatibility

### Phase 2: Testing & Rollout (Current)

- ✅ Fix display issues in cart page
- ✅ Create test script for verification
- 🔲 Test with real products and WooCommerce integration
- 🔲 Validate checkout flow with Cart v2 items
- 🔲 Test on different devices/browsers

### Phase 3: Full Migration (Future)

- 🔲 Increase Cart v2 rollout percentage (25% → 50% → 75% → 100%)
- 🔲 Monitor for any issues during gradual rollout
- 🔲 Remove Cart v1 code once migration is complete
- 🔲 Update all components to use Cart v2 API directly

## 📝 Implementation Notes

### Feature Flags

The following environment variables control Cart v2 functionality:

```
NEXT_PUBLIC_CART_V2_ENABLED=true
NEXT_PUBLIC_CART_V2_API=true
NEXT_PUBLIC_CART_V2_PERCENTAGE=100
```

- `NEXT_PUBLIC_CART_V2_ENABLED`: Master switch for Cart v2
- `NEXT_PUBLIC_CART_V2_API`: Use Cart v2 API endpoints
- `NEXT_PUBLIC_CART_V2_PERCENTAGE`: Percentage of users to route to Cart v2

### Storage Structure

Cart v2 uses its own storage (`global.cartStorageV2`) with the following structure:

```javascript
{
  [sessionId]: {
    items: [
      {
        id: "1001",
        productId: "1001",
        name: "Product Name",
        price: 99.99,
        quantity: 1,
        total: 99.99,
        image: "https://example.com/image.jpg"
      }
    ],
    total: 99.99,
    itemCount: 1,
    created: "2023-06-04T12:34:56.789Z",
    lastUpdated: 1622798096789
  }
}
```

## ✅ Verification Checklist

Before completing the migration, ensure:

1. [ ] Products added to cart appear correctly on the cart page
2. [ ] Images display correctly for all products
3. [ ] Quantity changes are reflected correctly
4. [ ] Removing items works as expected
5. [ ] Cart total is calculated correctly
6. [ ] Checkout process works with Cart v2 items
7. [ ] No console errors related to cart functionality

## 🔮 Future Improvements

1. **Performance Optimization**: Implement caching for product details
2. **Offline Support**: Add local storage for offline cart functionality
3. **Analytics**: Add more detailed tracking of cart actions
4. **UI Enhancements**: Improve cart interaction and visual feedback

This migration provides a solid foundation for future cart enhancements while maintaining compatibility with the existing UI.
