/**
 * Melhor Envio API Service
 * This module provides functions to interact with the Melhor Envio API
 * for shipping rate calculations
 */
import axios from 'axios';

// Default dimensions and weights (Correios minimums)
const DEFAULT_DIMENSIONS = {
  weight: 0.3, // in kg
  length: 16, // in cm
  width: 11,  // in cm
  height: 2,  // in cm
};

/**
 * Calculates shipping rates using Melhor Envio API
 * 
 * @param {Object} params - The shipping calculation parameters
 * @param {string} params.zipCodeFrom - Origin postal code
 * @param {string} params.zipCodeTo - Destination postal code
 * @param {Array} params.products - Array of products with dimensions and quantities
 * @param {boolean} params.isSandbox - Whether to use sandbox environment (default: false)
 * @param {string} params.token - Authentication token for Melhor Envio API
 * @returns {Promise<Array>} - Array of shipping options with prices and delivery times
 */
export async function calculateShippingRates({
  zipCodeFrom,
  zipCodeTo,
  products = [],
  isSandbox = false,
  token = process.env.MELHORENVIO_TOKEN
}) {
  // Validate inputs
  if (!zipCodeFrom || !zipCodeTo) {
    throw new Error('Origin and destination zip codes are required');
  }

  if (!products.length) {
    throw new Error('At least one product is required');
  }

  // Clean zip codes - remove any non-digit characters
  const fromZip = zipCodeFrom.replace(/\D/g, '');
  const toZip = zipCodeTo.replace(/\D/g, '');

  // Format the products as required by Melhor Envio API
  const formattedProducts = products.map((product, index) => {
    // Use default values if not provided
    const weight = product.peso || DEFAULT_DIMENSIONS.weight;
    const width = product.largura || DEFAULT_DIMENSIONS.width;
    const height = product.altura || DEFAULT_DIMENSIONS.height;
    const length = product.comprimento || DEFAULT_DIMENSIONS.length;
    const quantity = product.quantidade || 1;

    return {
      id: `prod-${index}`, // Generate a unique id
      width,
      height,
      length,
      weight,
      insurance_value: product.valor || 10.0, // Default insurance value
      quantity
    };
  });

  // Prepare the API request body
  const requestBody = {
    from: {
      postal_code: fromZip,
    },
    to: {
      postal_code: toZip,
    },
    products: formattedProducts,
    options: {
      receipt: false,
      own_hand: false,
      collect: false,
    },
  };

  try {
    // Define API base URL (sandbox or production)
    const baseURL = isSandbox
      ? 'https://sandbox.melhorenvio.com.br/api/v2'
      : 'https://www.melhorenvio.com.br/api/v2';

    // Set up headers with authentication if token is provided
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'WooCommerce Integration (your-email@example.com)'
    };
    
    // Add authorization header if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the API request
    const response = await axios.post(`${baseURL}/me/shipment/calculate`, requestBody, {
      headers,
      timeout: 15000 // 15 seconds timeout
    });

    // Process and return the shipping options
    if (response.status === 200 && response.data) {
      return formatShippingOptions(response.data);
    } else {
      throw new Error('Unexpected response from Melhor Envio API');
    }
  } catch (error) {
    console.error('Error calling Melhor Envio API:', error);
    
    // Provide more detailed error messages
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      const errorMessage = error.response.data?.message || 'Error from Melhor Envio API';
      throw new Error(`Melhor Envio API error: ${errorMessage}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from Melhor Envio API. Please try again later.');
    } else {
      // Something happened in setting up the request
      throw new Error(`Error setting up Melhor Envio request: ${error.message}`);
    }
  }
}

/**
 * Formats the Melhor Envio API response to match the format used in the application
 * 
 * @param {Array} apiResponse - The raw API response from Melhor Envio
 * @returns {Array} - Formatted shipping options
 */
function formatShippingOptions(apiResponse) {
  if (!Array.isArray(apiResponse)) {
    return [];
  }
  
  return apiResponse
    .filter(option => 
      option && 
      option.price !== null && 
      option.price !== undefined && 
      !option.error
    )
    .map(option => {
      // Delivery time in business days
      const deliveryTime = option.delivery_time || 7;
        // Map company codes to match the codes used previously with correios-brasil
      let code = option.id.toString();
      let name = option.name || 'Serviço de Entrega';
      
      // Add special mappings for Correios services to maintain compatibility
      if (option.company && option.company.name === 'Correios') {
        if (option.name.includes('PAC')) {
          code = '04510';
          name = 'PAC';
        } else if (option.name.includes('SEDEX')) {
          code = '04014';
          name = 'SEDEX';
        }
      }
      
      // Melhorar os nomes genéricos para exibição mais amigável
      if (name === '.Package') {
        name = 'Correios Package';
      } else if (name === '.Com') {
        name = 'Correios Express';
      } else if (name.startsWith('.')) {
        name = `${option.company?.name || 'Entrega'} ${name.substring(1)}`;
      }
      
      return {
        Codigo: code,
        Valor: option.price.toString().replace('.', ','),
        PrazoEntrega: deliveryTime.toString(),
        ValorSemAdicionais: option.price.toString().replace('.', ','),
        Erro: '0',
        MsgErro: '',
        nome: name,
        isFallback: false
      };
    })
    .sort((a, b) => {
      // Sort by price (convert string with comma to number)
      const priceA = parseFloat(a.Valor.replace(',', '.'));
      const priceB = parseFloat(b.Valor.replace(',', '.'));
      return priceA - priceB;
    });
}

/**
 * Simple function to check if the Melhor Envio API is reachable
 * 
 * @param {boolean} isSandbox - Whether to use sandbox environment
 * @param {string} token - Authentication token for Melhor Envio API
 * @returns {Promise<boolean>} - True if the API is reachable
 */
export async function checkMelhorEnvioStatus(isSandbox = false, token = process.env.MELHORENVIO_TOKEN) {
  try {
    const baseURL = isSandbox
      ? 'https://sandbox.melhorenvio.com.br/api/v2'
      : 'https://www.melhorenvio.com.br/api/v2';
    
    // Set up headers with authentication if token is provided
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
      
    const response = await axios.get(`${baseURL}/me/shipment/companies`, {
      headers,
      timeout: 5000
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Error checking Melhor Envio API status:', error);
    
    // If we get a 401 Unauthorized, it means the API is reachable but the token is invalid
    if (error.response && error.response.status === 401) {
      console.error('Authentication failed. Check your Melhor Envio token.');
      return false;
    }
    
    return false;
  }
}
