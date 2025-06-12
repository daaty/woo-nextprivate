/**
 * API para atualizar itens do carrinho
 * VERSÃO MELHORADA com proteção contra race conditions e melhor tratamento de erros
 */

import axios from 'axios';
import cookie from 'cookie';
import cartErrorHandler, { cartErrorUtils } from '../../../src/utils/cart-error-handler';

// Rate limiting - track requests per IP
const requestTracker = new Map();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_REQUESTS_PER_WINDOW = 3;

// Cleanup rate limiter periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestTracker.entries()) {
    if (now - data.lastRequest > RATE_LIMIT_WINDOW * 5) {
      requestTracker.delete(ip);
    }
  }
}, 30000); // Cleanup every 30 seconds

export default async function handler(req, res) {
  const startTime = Date.now();
  const requestId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método não permitido',
      error: {
        type: 'METHOD_NOT_ALLOWED',
        code: 'INVALID_METHOD'
      }
    });
  }

  // Rate limiting check
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (requestTracker.has(clientIP)) {
    const clientData = requestTracker.get(clientIP);
    if (now - clientData.lastRequest < RATE_LIMIT_WINDOW) {
      clientData.count++;
      if (clientData.count > MAX_REQUESTS_PER_WINDOW) {
        console.log(`🚫 [update-item] Rate limit exceeded for IP: ${clientIP}`);
        return res.status(429).json({ 
          success: false, 
          message: 'Muitas requisições. Aguarde um momento e tente novamente.',
          error: {
            type: 'RATE_LIMIT_EXCEEDED',
            code: 'TOO_MANY_REQUESTS'
          }
        });
      }
    } else {
      clientData.count = 1;
    }
    clientData.lastRequest = now;
  } else {
    requestTracker.set(clientIP, { count: 1, lastRequest: now });
  }

  try {
    console.log(`🔄 [update-item] Starting request ${requestId} from IP: ${clientIP}`);
    
    // Extract cookies from request to maintain session
    const cookies = req.headers.cookie || '';
    const parsedCookies = cookie.parse(cookies);
    const wooSession = parsedCookies['woocommerce-session'] || '';

    // Get data from request body
    const { key, quantity } = req.body;

    // Enhanced validation
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Key do item é obrigatória e deve ser uma string válida',
        error: {
          type: 'VALIDATION_ERROR',
          code: 'MISSING_KEY'
        }
      });
    }

    const numericQuantity = parseInt(quantity, 10);
    if (isNaN(numericQuantity) || numericQuantity < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantidade deve ser um número maior ou igual a zero',
        error: {
          type: 'VALIDATION_ERROR',
          code: 'INVALID_QUANTITY'
        }
      });
    }

    // WooCommerce API URL
    const wooApiUrl = `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/store/v1/cart/update-item`;
    
    // Prepare data for request
    const data = {
      key,
      quantity: numericQuantity
    };
    
    console.log(`[update-item] ${requestId} - Updating cart item:`, data);
    
    // Configure headers for request
    const headers = {
      'Content-Type': 'application/json',
      'Cookie': cookies, // Important: maintain all cookies to preserve session
      'User-Agent': 'WooNext-Cart-API/1.0'
    };

    // If we have a specific session cookie, also add it to headers
    if (wooSession) {
      headers['woocommerce-session'] = `Session ${wooSession}`;
    }

    // Set timeout for the request (15 seconds)
    const axiosConfig = {
      headers,
      timeout: 15000,
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    };

    // Send request to update cart item
    const response = await axios.put(wooApiUrl, data, axiosConfig);
    
    console.log(`[update-item] ${requestId} - Response status:`, response.status);
    
    // Handle different response statuses
    if (response.status >= 400) {
      const errorMessage = response.data?.message || 'Erro ao atualizar item do carrinho';
      console.error(`[update-item] ${requestId} - HTTP Error:`, {
        status: response.status,
        data: response.data
      });
      
      // Use cart error handler for consistent error processing
      cartErrorHandler.logError('API_ERROR', {
        message: errorMessage,
        endpoint: 'update-item',
        status: response.status,
        data: response.data,
        requestId
      });
      
      return res.status(response.status).json({
        success: false,
        message: errorMessage,
        error: {
          type: 'API_ERROR',
          code: `HTTP_${response.status}`,
          details: response.data
        }
      });
    }

    // Get returned cookies to pass to client
    const setCookieHeaders = response.headers['set-cookie'];
    if (setCookieHeaders) {
      res.setHeader('Set-Cookie', setCookieHeaders);
    }

    // Calculate request duration
    const duration = Date.now() - startTime;
    console.log(`✅ [update-item] ${requestId} - Success in ${duration}ms`);

    return res.status(200).json({
      success: true,
      data: response.data,
      meta: {
        requestId,
        duration,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [update-item] ${requestId} - Error after ${duration}ms:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // Use cart error utilities for consistent error handling
    const errorInfo = cartErrorUtils.categorizeError(error);
    
    // Log error for monitoring
    cartErrorHandler.logError(errorInfo.type, {
      message: error.message,
      endpoint: 'update-item',
      originalError: error,
      requestId,
      duration
    });
    
    // Determine appropriate response based on error type
    let statusCode = 500;
    let errorMessage = 'Erro interno do servidor';
    
    if (error.code === 'ECONNABORTED') {
      statusCode = 408;
      errorMessage = 'Timeout: Operação demorou muito para ser concluída';
    } else if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.message || 'Erro ao atualizar item do carrinho';
    } else if (error.code === 'ECONNREFUSED') {
      statusCode = 503;
      errorMessage = 'Serviço temporariamente indisponível';
    }
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: {
        type: errorInfo.type,
        code: errorInfo.code,
        requestId,
        duration
      }
    });
  }
}