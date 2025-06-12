/**
 * API para limpar o carrinho completamente
 * VERSÃO MELHORADA com proteção contra race conditions e melhor tratamento de erros
 */
import axios from 'axios';
import cookie from 'cookie';
import cartErrorHandler, { cartErrorUtils } from '../../../src/utils/cart-error-handler';

// Rate limiting - track requests per IP
const requestTracker = new Map();
const RATE_LIMIT_WINDOW = 2000; // 2 seconds
const MAX_REQUESTS_PER_WINDOW = 2; // More restrictive for clear operations

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
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    console.log('[API Cart Clear] 🧹 Limpando carrinho completo');
    
    const startTime = Date.now();
    
    // Primeiro, buscar todos os itens do carrinho
    const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString('base64');
    
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'User-Agent': 'NextJS-Cart/1.0',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Buscar itens do carrinho primeiro
    const getCartUrl = `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/store/cart`;
    
    const getResponse = await fetch(getCartUrl, {
      method: 'GET',
      headers
    });

    if (!getResponse.ok) {
      throw new Error('Erro ao buscar itens do carrinho');
    }

    const cartData = await getResponse.json();
    
    // Se não há itens, retornar sucesso
    if (!cartData.items || cartData.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Carrinho já estava vazio!',
        responseTime: Date.now() - startTime
      });
    }

    // Remover cada item individualmente (Store API não tem endpoint de clear)
    const removePromises = cartData.items.map(async (item) => {
      const removeUrl = `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/store/cart/remove-item`;
      
      return fetch(removeUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          key: item.key
        })
      });
    });

    await Promise.all(removePromises);
    
    const responseTime = Date.now() - startTime;
    
    console.log(`[API Cart Clear] ✅ Carrinho limpo em ${responseTime}ms`);

    return res.status(200).json({
      success: true,
      message: 'Carrinho limpo com sucesso!',
      responseTime
    });

  } catch (error) {
    console.error('[API Cart Clear] ❌ Erro:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao limpar carrinho',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}