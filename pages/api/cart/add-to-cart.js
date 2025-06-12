/**
 * API para adicionar itens ao carrinho - VERSÃO MELHORADA
 * Usa a API REST do WooCommerce com proteção contra race conditions
 */

import axios from 'axios';
import cookie from 'cookie';

// Sistema de throttling simples para evitar múltiplas chamadas simultâneas
const requestThrottle = new Map();
const THROTTLE_WINDOW = 1000; // 1 segundo

export default async function handler(req, res) {
  // Permitir apenas requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método não permitido',
      error: 'METHOD_NOT_ALLOWED'
    });
  }

  // Extrair dados do corpo da requisição
  const { id, quantity = 1, variation = null } = req.body;

  // Validações de entrada melhoradas
  if (!id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID do produto é obrigatório',
      error: 'MISSING_PRODUCT_ID'
    });
  }

  if (quantity < 1 || quantity > 999) {
    return res.status(400).json({ 
      success: false, 
      message: 'Quantidade deve estar entre 1 e 999',
      error: 'INVALID_QUANTITY'
    });
  }

  try {
    // Sistema de throttling para evitar spam de requisições
    const clientIdentifier = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const throttleKey = `${clientIdentifier}-${id}`;
    const now = Date.now();
    
    if (requestThrottle.has(throttleKey)) {
      const lastRequest = requestThrottle.get(throttleKey);
      if (now - lastRequest < THROTTLE_WINDOW) {
        console.log(`🚫 [REST API] Throttling request from ${clientIdentifier} for product ${id}`);
        return res.status(429).json({ 
          success: false, 
          message: 'Muitas requisições em pouco tempo. Tente novamente em um momento.',
          error: 'RATE_LIMITED'
        });
      }
    }
    
    requestThrottle.set(throttleKey, now);
    
    // Limpeza do cache de throttling (manter apenas últimas 1000 entradas)
    if (requestThrottle.size > 1000) {
      const oldestEntries = Array.from(requestThrottle.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, requestThrottle.size - 900);
      
      oldestEntries.forEach(([key]) => requestThrottle.delete(key));
    }    // Extrair cookies da requisição para manter a sessão
    const cookies = req.headers.cookie || '';
    const parsedCookies = cookie.parse(cookies);
    const wooSession = parsedCookies['woocommerce-session'] || '';

    // URL da API WooCommerce
    const wooApiUrl = `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/store/v1/cart/add-item`;

    // Preparar dados para a requisição
    const data = {
      id: parseInt(id, 10),
      quantity: parseInt(quantity, 10)
    };

    // Adicionar variação se fornecida
    if (variation) {
      data.variation = variation;
    }
    
    console.log('[REST API] Adicionando item ao carrinho:', data);
    
    // Configurando headers para a requisição
    const headers = {
      'Content-Type': 'application/json',
      'Cookie': cookies, // Importante: manter todos os cookies para preservar a sessão
    };

    // Se tivermos um cookie de sessão específico, também o adicionamos nos headers
    if (wooSession) {
      headers['woocommerce-session'] = `Session ${wooSession}`;
    }

    // Timeout para evitar requests infinitos
    const axiosConfig = {
      headers,
      timeout: 15000, // 15 segundos
      maxRedirects: 0 // Evitar redirecionamentos
    };

    // Enviar requisição para adicionar item ao carrinho
    const response = await axios.post(wooApiUrl, data, axiosConfig);
    
    // Pegar cookies retornados para repassar ao cliente
    const setCookieHeaders = response.headers['set-cookie'];
    if (setCookieHeaders) {
      res.setHeader('Set-Cookie', setCookieHeaders);
    }

    // Log de sucesso
    console.log('✅ [REST API] Item adicionado ao carrinho com sucesso:', {
      productId: id,
      quantity,
      cartItemsCount: response.data?.items_count
    });

    return res.status(200).json({
      success: true,
      data: response.data,
      message: 'Produto adicionado ao carrinho com sucesso'
    });
    
  } catch (error) {
    console.error('❌ [REST API] Erro ao adicionar item ao carrinho:', {
      productId: id,
      quantity,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    
    // Determinar tipo de erro e mensagem apropriada
    let errorMessage = 'Erro ao adicionar item ao carrinho';
    let errorCode = 'UNKNOWN_ERROR';
    let statusCode = 500;

    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Tempo limite excedido. Tente novamente.';
      errorCode = 'TIMEOUT';
      statusCode = 408;
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.message || 'Dados inválidos fornecidos';
      errorCode = 'BAD_REQUEST';
      statusCode = 400;
    } else if (error.response?.status === 404) {
      errorMessage = 'Produto não encontrado';
      errorCode = 'PRODUCT_NOT_FOUND';
      statusCode = 404;
    } else if (error.response?.status >= 500) {
      errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
      errorCode = 'SERVER_ERROR';
      statusCode = 503;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: errorCode,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}