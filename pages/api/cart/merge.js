/**
 * API para mesclar carrinhos quando o usuário faz login
 * Permite preservar os itens do carrinho anônimo ao fazer login
 */

import axios from 'axios';
import cookie from 'cookie';
// import { getSession } from 'next-auth/react'; // Comentado temporariamente - NextAuth não configurado

export default async function handler(req, res) {
  // Permitir apenas requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Verificar se o usuário está autenticado (pode variar dependendo do sistema de autenticação)
    // Se estiver usando NextAuth:
    // const session = await getSession({ req });
    // if (!session) {
    //   return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    // }

    // Extrair cookies da requisição para manter a sessão
    const cookies = req.headers.cookie || '';
    const parsedCookies = cookie.parse(cookies);
    const wooSession = parsedCookies['woocommerce-session'] || '';

    // Obter dados do corpo da requisição
    const { userId, items = [] } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Itens a serem mesclados são obrigatórios' });
    }

    console.log(`[REST API] Mesclando carrinho para o usuário ${userId}:`, items);

    // URL da API WooCommerce para obter o carrinho atual do usuário
    const wooApiUrl = `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/store/v1/cart`;
    
    // Configurando headers para a requisição
    const headers = {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    };

    // Se tivermos um cookie de sessão específico, também o adicionamos nos headers
    if (wooSession) {
      headers['woocommerce-session'] = `Session ${wooSession}`;
    }

    // Adicionamos um header para informar que a requisição é para um usuário específico
    headers['X-User-ID'] = userId;

    // Verificar se o usuário já tem um carrinho
    const existingCartResponse = await axios.get(wooApiUrl, { headers });

    // Verificar se já existem itens no carrinho do usuário
    const hasExistingItems = existingCartResponse.data?.items?.length > 0;

    // Começar a adicionar os itens ao carrinho
    const addItemsPromises = items.map(async (item) => {
      try {
        // Verificar se o item já existe no carrinho do usuário
        let itemExists = false;
        
        if (hasExistingItems) {
          itemExists = existingCartResponse.data.items.some(
            existingItem => existingItem.id === item.productId
          );
        }

        // Se o item já existe, não precisamos adicioná-lo novamente
        if (itemExists) {
          console.log(`[REST API] Item ${item.productId} já existe no carrinho do usuário, pulando...`);
          return { success: true, skipped: true, productId: item.productId };
        }

        // Adicionar o item ao carrinho do usuário
        const addItemResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/store/v1/cart/add-item`,
          {
            id: parseInt(item.productId, 10),
            quantity: parseInt(item.quantity, 10)
          },
          { headers }
        );

        return { 
          success: true, 
          skipped: false, 
          productId: item.productId, 
          data: addItemResponse.data 
        };
      } catch (error) {
        console.error(`[REST API] Erro ao adicionar item ${item.productId} ao carrinho:`, error);
        return { 
          success: false, 
          error: error.message, 
          productId: item.productId 
        };
      }
    });

    // Esperar que todos os itens sejam processados
    const results = await Promise.all(addItemsPromises);

    // Obter o carrinho atualizado após todas as adições
    const updatedCartResponse = await axios.get(wooApiUrl, { headers });
    
    // Pegar cookies retornados para repassar ao cliente
    const setCookieHeaders = updatedCartResponse.headers['set-cookie'];
    if (setCookieHeaders) {
      res.setHeader('Set-Cookie', setCookieHeaders);
    }

    return res.status(200).json({
      success: true,
      message: 'Carrinhos mesclados com sucesso',
      results,
      cart: updatedCartResponse.data
    });
    
  } catch (error) {
    console.error('Erro ao mesclar carrinhos:', error.response?.data || error.message);
    
    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Erro ao mesclar carrinhos',
      error: error.message
    });
  }
}