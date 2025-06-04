import { isEmpty } from 'lodash';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// WooCommerce API configuration - USAR VARIÁVEIS DO .ENV
const api = new WooCommerceRestApi({
  url: process.env.WOO_SITE_URL,
  consumerKey: process.env.WOO_CONSUMER_KEY,
  consumerSecret: process.env.WOO_CONSUMER_SECRET,
  version: "wc/v3"
});

/**
 * Get products by brand
 *
 * @param {string} brandName - Brand name to filter products
 * @param {number} perPage - Number of products per page
 * @return {Promise<Object>} - Promise resolving to products data
 */
export async function getProductsByBrand(brandName, perPage = 50) {
  try {
    const { data } = await api.get('products', {
      per_page: perPage,
      search: brandName, // <-- volta para search, pois pa_brand não é suportado nativamente
    });
    
    return {
      success: true,
      products: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * API handler for brand-specific product requests
 */
export default async function handler(req, res) {
  const { brand, per_page } = req.query;
  
  if (!brand) {
    return res.status(400).json({
      success: false,
      error: 'Brand parameter is required'
    });
  }
  
  try {
    const response = await getProductsByBrand(brand, per_page || 50);
    
    if (!response.success) {
      return res.status(400).json(response);
    }
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}