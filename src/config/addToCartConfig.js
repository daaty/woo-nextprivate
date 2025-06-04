/**
 * AddToCart Configuration
 * Centralized configuration for consistent behavior across all components
 */

export const ADD_TO_CART_CONFIG = {
  // Animation and timing settings
  LOADING_MIN_DURATION: 500, // Minimum loading time for better UX
  SUCCESS_DISPLAY_DURATION: 3000, // How long to show success state
  ERROR_DISPLAY_DURATION: 5000, // How long to show error message
  
  // Debounce settings
  BUTTON_DEBOUNCE_TIME: 300, // Prevent rapid clicking
  
  // Default quantities and limits
  DEFAULT_QUANTITY: 1,
  MAX_QUANTITY_PER_ADD: 10,
  
  // Modal and notification settings
  SHOW_SUCCESS_MODAL: {
    default: false,
    productPage: true,
    featuredProducts: true,
    exclusiveOffers: false
  },
  
  // Button text variations
  BUTTON_TEXT: {
    default: 'Add to Cart',
    loading: 'Adding...',
    success: 'Added!',
    outOfStock: 'Out of Stock',
    unavailable: 'Unavailable'
  },
  
  // Styling presets
  BUTTON_PRESETS: {
    productGrid: {
      size: 'small',
      variant: 'primary',
      fullWidth: true,
      showQuantity: false
    },
    productPage: {
      size: 'large',
      variant: 'primary',
      fullWidth: false,
      showQuantity: true
    },
    featuredProducts: {
      size: 'medium',
      variant: 'primary',
      fullWidth: true,
      showQuantity: false
    },
    exclusiveOffers: {
      size: 'medium',
      variant: 'outline',
      fullWidth: false,
      showQuantity: false
    },
    quickView: {
      size: 'small',
      variant: 'ghost',
      fullWidth: false,
      showQuantity: false
    }
  },
  
  // Analytics and tracking
  TRACK_EVENTS: {
    addToCart: true,
    addToCartFailed: true,
    buttonClicked: false // Set to true if you want to track all button clicks
  },
  
  // Error handling
  ERROR_MESSAGES: {
    PRODUCT_NOT_FOUND: 'Product not found',
    OUT_OF_STOCK: 'Product is out of stock',
    INVALID_QUANTITY: 'Please select a valid quantity',
    NETWORK_ERROR: 'Network error. Please try again.',
    GENERIC_ERROR: 'Something went wrong. Please try again.'
  },
  
  // Feature flags
  FEATURES: {
    enableSuccessAnimation: true,
    enableErrorToast: true,
    enableLoadingSpinner: true,
    enableAccessibilityAnnouncements: true,
    enableAnalytics: false // Set to true when analytics are configured
  }
};
