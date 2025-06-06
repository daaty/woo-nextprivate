/**
 * WooCommerce Integration Service
 * Provides functions to interact with WooCommerce API and fetch product data
 */

import { WooCommerceApi } from '../../../utils/woocommerce';

/**
 * Get product data by ID
 * @param {number} productId - The product ID
 * @returns {Promise<Object>} Product data
 */
export const getProductData = async (productId) => {
  try {
    const api = WooCommerceApi();
    const response = await api.get(`products/${productId}`);
    
    if (response.data) {
      return {
        id: response.data.id,
        name: response.data.name,
        price: response.data.price,
        regular_price: response.data.regular_price,
        sale_price: response.data.sale_price,
        image: response.data.images?.[0]?.src || null,
        stock_status: response.data.stock_status,
        manage_stock: response.data.manage_stock,
        stock_quantity: response.data.stock_quantity,
        sku: response.data.sku,
        weight: response.data.weight,
        dimensions: response.data.dimensions,
        categories: response.data.categories,
        tags: response.data.tags,
        status: response.data.status,
        type: response.data.type,
        featured: response.data.featured,
        on_sale: response.data.on_sale,
        purchasable: response.data.purchasable,
        virtual: response.data.virtual,
        downloadable: response.data.downloadable,
        slug: response.data.slug,
        permalink: response.data.permalink,
        short_description: response.data.short_description,
        description: response.data.description,
      };
    }
    
    throw new Error(`Product with ID ${productId} not found`);
  } catch (error) {
    console.error(`[WooCommerce Integration] Error fetching product ${productId}:`, error);
    
    // Return a fallback product object with basic info
    return {
      id: productId,
      name: `Product ${productId}`,
      price: '0.00',
      regular_price: '0.00',
      sale_price: null,
      image: null,
      stock_status: 'outofstock',
      manage_stock: false,
      stock_quantity: 0,
      sku: `product-${productId}`,
      weight: '',
      dimensions: { length: '', width: '', height: '' },
      categories: [],
      tags: [],
      status: 'publish',
      type: 'simple',
      featured: false,
      on_sale: false,
      purchasable: false,
      virtual: false,
      downloadable: false,
      slug: `product-${productId}`,
      permalink: '',
      short_description: '',
      description: '',
      error: error.message,
    };
  }
};

/**
 * Get multiple products data by IDs
 * @param {number[]} productIds - Array of product IDs
 * @returns {Promise<Object[]>} Array of product data
 */
export const getProductsData = async (productIds) => {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return [];
    }

    const promises = productIds.map(id => getProductData(id));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`[WooCommerce Integration] Failed to fetch product ${productIds[index]}:`, result.reason);
        return {
          id: productIds[index],
          name: `Product ${productIds[index]}`,
          price: '0.00',
          error: result.reason?.message || 'Failed to fetch product data',
        };
      }
    });
  } catch (error) {
    console.error('[WooCommerce Integration] Error fetching products data:', error);
    return [];
  }
};

/**
 * Search products by name or SKU
 * @param {string} search - Search term
 * @param {number} per_page - Number of results per page (default: 10)
 * @returns {Promise<Object[]>} Array of product data
 */
export const searchProducts = async (search, per_page = 10) => {
  try {
    const api = WooCommerceApi();
    const response = await api.get('products', {
      search,
      per_page,
      status: 'publish'
    });
    
    return response.data.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      image: product.images?.[0]?.src || null,
      stock_status: product.stock_status,
      sku: product.sku,
      slug: product.slug,
      permalink: product.permalink,
      on_sale: product.on_sale,
      featured: product.featured,
    }));
  } catch (error) {
    console.error('[WooCommerce Integration] Error searching products:', error);
    return [];
  }
};

/**
 * Get product categories
 * @param {number} per_page - Number of results per page (default: 100)
 * @returns {Promise<Object[]>} Array of category data
 */
export const getProductCategories = async (per_page = 100) => {
  try {
    const api = WooCommerceApi();
    const response = await api.get('products/categories', {
      per_page,
      hide_empty: true
    });
    
    return response.data.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parent: category.parent,
      description: category.description,
      display: category.display,
      image: category.image,
      menu_order: category.menu_order,
      count: category.count,
    }));
  } catch (error) {
    console.error('[WooCommerce Integration] Error fetching categories:', error);
    return [];
  }
};

/**
 * Check if WooCommerce API is available
 * @returns {Promise<boolean>} True if API is available
 */
export const isWooCommerceAvailable = async () => {
  try {
    const api = WooCommerceApi();
    await api.get('system_status');
    return true;
  } catch (error) {
    console.error('[WooCommerce Integration] WooCommerce API not available:', error);
    return false;
  }
};

/**
 * Get cart data from WooCommerce Store API
 * @returns {Promise<Object>} Cart data
 */
export const getCartData = async () => {
  try {
    // Use the local Next.js API as proxy to avoid CORS issues
    const response = await fetch('/api/cart/get-cart', {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[WooCommerce Integration] Error fetching cart data:', error);
    return {
      items: [],
      totals: {
        total_items: '0',
        total_items_tax: '0',
        total_fees: '0',
        total_fees_tax: '0',
        total_discount: '0',
        total_discount_tax: '0',
        total_shipping: '0',
        total_shipping_tax: '0',
        total_price: '0',
        total_tax: '0',
        currency_code: 'BRL',
        currency_symbol: 'R$',
        currency_minor_unit: 2,
        currency_decimal_separator: ',',
        currency_thousand_separator: '.',
        currency_prefix: 'R$ ',
        currency_suffix: '',
      },
      shipping_address: {},
      billing_address: {},
      needs_payment: false,
      needs_shipping: false,
      has_calculated_shipping: false,
      fees: [],
      taxes: [],
      shipping_rates: [],
      coupons: [],
      errors: [],
    };
  }
};

export default {
  getProductData,
  getProductsData,
  searchProducts,
  getProductCategories,
  isWooCommerceAvailable,
  getCartData,
};