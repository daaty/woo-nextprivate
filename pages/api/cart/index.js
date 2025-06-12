/**
 * API para obter dados do carrinho
 * Usa a API REST do WooCommerce para evitar problemas de CORS
 */

import axios from 'axios';
import cookie from 'cookie';

export default async function handler(req, res) {
  // Permitir apenas requisições GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Extrair cookies da requisição para manter a sessão
    const cookies = req.headers.cookie || '';
    const parsedCookies = cookie.parse(cookies);
    const wooSession = parsedCookies['woocommerce-session'] || '';

    // URL da API WooCommerce
    const wooApiUrl = `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/store/v1/cart`;
    
    console.log('[REST API] Obtendo dados do carrinho');
    
    // Configurando headers para a requisição
    const headers = {
      'Content-Type': 'application/json',
      'Cookie': cookies, // Importante: manter todos os cookies para preservar a sessão
    };

    // Se tivermos um cookie de sessão específico, também o adicionamos nos headers
    if (wooSession) {
      headers['woocommerce-session'] = `Session ${wooSession}`;
    }

    // Obter os dados do carrinho
    const response = await axios.get(wooApiUrl, { headers });
    
    // Pegar cookies retornados para repassar ao cliente
    const setCookieHeaders = response.headers['set-cookie'];
    if (setCookieHeaders) {
      res.setHeader('Set-Cookie', setCookieHeaders);
    }

    return res.status(200).json({
      success: true,
      data: response.data
    });
    
  } catch (error) {
    console.error('Erro ao obter dados do carrinho:', error.response?.data || error.message);
    
    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Erro ao obter dados do carrinho',
      error: error.message
    });
  }
}