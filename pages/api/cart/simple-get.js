// Sistema de armazenamento será implementado via cookie otimizado

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('[API Simple Cart Get] 📦 Buscando carrinho...');
    
    const startTime = Date.now();
    
    // PRIMEIRO: Tentar recuperar do armazenamento persistente
    let sessionCart = { items: [] };
    let sessionId = req.cookies['cartSessionId'];
    
    if (sessionId) {
      try {
        const storedCart = await getCompleteCart(sessionId);
        if (storedCart && storedCart.items && Array.isArray(storedCart.items)) {
          sessionCart = storedCart;
          console.log('[API Simple Cart Get] ✅ Carrinho recuperado do armazenamento:', sessionCart.items.length, 'itens');
          
          // Retornar carrinho completo do armazenamento
          const responseTime = Date.now() - startTime;
          return res.status(200).json({
            success: true,
            cart: {
              items: sessionCart.items,
              itemsCount: sessionCart.items_count || sessionCart.items.length,
              total: sessionCart.total,
              totalNumeric: sessionCart.total_numeric,
              subtotal: sessionCart.subtotal,
              totalItemTypes: sessionCart.totalItemTypes || sessionCart.items.length,
              hasMoreItems: false, // Todos os itens estão incluídos quando vem do armazenamento
              itemsInCookie: sessionCart.items.length,
              allItemsIncluded: true,
              source: 'persistent_storage'
            },
            responseTime
          });
        }
      } catch (storageError) {
        console.log('[API Simple Cart Get] ⚠️ Erro ao recuperar do armazenamento:', storageError.message);
      }
    }
    
    // FALLBACK: Buscar carrinho do cookie com tratamento de erro robusto
    let originalCookie = null;
    
    // Variável para armazenar o carrinho completo enquanto processamos
    let completeCartItems = [];
    
    try {
      if (req.cookies['simple_cart']) {
        let cookieContent = req.cookies['simple_cart'];
        originalCookie = cookieContent;
        
        // Verificar se o cookie é uma string JSON válida
        if (typeof cookieContent === 'string' && cookieContent.trim() !== '') {
          try {
            let parsedContent;
            
            // Verificar se o cookie está URI encoded (nossa nova estratégia)
            try {
              // Tenta decodificar primeiro, caso tenha sido salvo com encodeURIComponent
              if (/%[\dA-F]{2}/i.test(cookieContent)) {
                console.log('[API Simple Cart Get] 🔍 Cookie aparenta estar URI encoded, decodificando...');
                cookieContent = decodeURIComponent(cookieContent);
              }
              
              // Tenta fazer parse
              parsedContent = JSON.parse(cookieContent);
            } catch (initialParseError) {
              // Tente reparar o JSON se tiver erro de "Unterminated string"
              if (initialParseError.message.includes('Unterminated string')) {
                console.log('[API Simple Cart Get] 🛠️ Tentando reparar JSON com string não terminada');
                
                // Substitui caracteres especiais que podem quebrar strings JSON
                const sanitizedContent = cookieContent
                  .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove caracteres de controle
                  .replace(/([^\\])"/g, '$1\\"')  // Escapa aspas duplas sem escape prévio
                  .replace(/^([^{]*)({.*)$/s, '$2'); // Remove qualquer conteúdo antes do primeiro {
                  
                try {
                  // Tente revalidar o início e fim do objeto
                  if (!sanitizedContent.startsWith('{')) {
                    throw new Error('JSON inválido após sanitização');
                  }
                  
                  parsedContent = JSON.parse(sanitizedContent);
                  console.log('[API Simple Cart Get] ✅ JSON reparado com sucesso!');
                } catch (repairError) {
                  // Se falhar na reparação, crie um novo carrinho vazio
                  console.log('[API Simple Cart Get] ❌ Falha ao reparar JSON:', repairError.message);
                  throw new Error(`Falha ao reparar JSON: ${repairError.message}`);
                }
              } else if (initialParseError.message.includes('Expected property name') || 
                     initialParseError.message.includes('Unexpected token')) {
                // Tentativa de reparo para problemas comuns de JSON
                console.log('[API Simple Cart Get] 🛠️ Tentando reparar JSON malformado...');
                
                // Estratégia para tentar extrair um objeto JSON válido
                const validObjectPattern = /\{\s*"items"\s*:\s*\[.*?\]\s*\}/s;
                const match = cookieContent.match(validObjectPattern);
                
                if (match) {
                  try {
                    parsedContent = JSON.parse(match[0]);
                    console.log('[API Simple Cart Get] ✅ Objeto JSON extraído com sucesso!');
                  } catch (extractError) {
                    throw new Error(`Falha ao extrair objeto JSON: ${extractError.message}`);
                  }
                } else {
                  // Último recurso: criar um novo carrinho
                  console.log('[API Simple Cart Get] ⚠️ Não foi possível extrair um objeto JSON válido');
                  throw new Error('Nenhum objeto JSON válido encontrado');
                }
              } else {
                // Outros erros de parse - não é possível recuperar
                throw initialParseError;
              }
            }
            
            // Verificação adicional para garantir estrutura válida
            if (!parsedContent || typeof parsedContent !== 'object') {
              throw new Error('Estrutura de cookie inválida');
            }
            
            // Atribuir o conteúdo analisado ao carrinho da sessão
            sessionCart = parsedContent;
            
            // Guardar lista completa de itens do carrinho
            if (Array.isArray(sessionCart.items)) {
              completeCartItems = [...sessionCart.items];
            } else {
              sessionCart.items = [];
              completeCartItems = [];
            }
            
            // Garantir que o array de itens existe
            if (!Array.isArray(sessionCart.items)) {
              sessionCart.items = [];
            }
            
            console.log('[API Simple Cart Get] ✅ Cookie do carrinho carregado com sucesso');
            
            // Registrar o tamanho do cookie
            if (originalCookie) {
              console.log(`[API Simple Cart Get] 📊 Tamanho do cookie: ${originalCookie.length} bytes`);
            }
            
            // Validação adicional para cada item no carrinho
            for (let i = 0; i < sessionCart.items.length; i++) {
              const item = sessionCart.items[i];
              
              // Garantir que todos os campos essenciais existem
              if (!item.productId || !item.quantity || !item.price) {
                console.log(`[API Simple Cart Get] ⚠️ Item inválido no índice ${i}, removendo`);
                sessionCart.items.splice(i, 1);
                i--;
                continue;
              }
              
              // Normalizar valores para evitar problemas
              sessionCart.items[i] = {
                ...item,
                productId: parseInt(item.productId),
                variationId: item.variationId ? parseInt(item.variationId) : null,
                quantity: parseInt(item.quantity || 1),
                qty: parseInt(item.qty || item.quantity || 1),
                price: parseFloat(item.price || 0),
                name: typeof item.name === 'string' ? item.name : `Produto ${item.productId}`
              };
            }
          } catch (parseError) {
            console.log('[API Simple Cart Get] ⚠️ Cookie corrompido, criando carrinho vazio:', parseError.message);
            // Registra o conteúdo do cookie para debug
            console.log('[API Simple Cart Get] 🔍 Conteúdo do cookie corrompido:', 
              cookieContent.substring(0, 100) + (cookieContent.length > 100 ? '...' : ''));
            sessionCart = { items: [] };
            completeCartItems = [];
            
            // Limpar cookie corrompido
            res.setHeader('Set-Cookie', [
              'simple_cart={}; Path=/; Max-Age=86400; SameSite=Lax'
            ]);
            
            console.log('[API Simple Cart Get] 🗑️ Cookie corrompido foi substituído por um vazio');
          }
        }
      }
    } catch (error) {
      console.log('[API Simple Cart Get] ⚠️ Erro ao processar cookie do carrinho:', error.message);
      sessionCart = { items: [] };
      completeCartItems = [];
      
      // Limpar cookie corrompido
      res.setHeader('Set-Cookie', [
        'simple_cart=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      ]);
    }
    
    // Logar o tamanho da resposta para debug
    console.log('[API Simple Cart Get] 🛒 Carrinho encontrado:', {
      itemCount: sessionCart.items?.length || 0,
      items: sessionCart.items?.slice(0, 3).map(item => ({ 
        name: typeof item.name === 'string' ? item.name.substring(0, 30) : 'Nome inválido',
        price: typeof item.price === 'number' ? item.price : 0,
        imageSize: typeof item.image?.sourceUrl === 'string' ? 
          item.image.sourceUrl.length : 0
      })) || []
    });
    
    // Se não há itens, retornar carrinho vazio
    if (!sessionCart.items || sessionCart.items.length === 0) {
      const emptyCart = {
        items: [],
        items_count: 0,
        total: 'R$ 0,00',
        total_numeric: 0,
        subtotal: 'R$ 0,00',
        shipping: 'R$ 0,00',
        taxes: 'R$ 0,00'
      };
      
      return res.status(200).json({
        success: true,
        cart: emptyCart,
        responseTime: Date.now() - startTime
      });
    }
    
    // Validar e enriquecer dados dos itens se necessário
    if (!process.env.WC_CONSUMER_KEY || !process.env.WC_CONSUMER_SECRET) {
      console.log('[API Simple Cart Get] ⚠️ Credenciais WooCommerce não configuradas, pulando busca de dados');
    } else {
      const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString('base64');
      
      for (let i = 0; i < sessionCart.items.length; i++) {
        const item = sessionCart.items[i];
        
        // Se o item não tem nome real ou imagem placeholder, buscar dados atualizados
        if (!item.name || 
            item.name.startsWith('Produto ') || 
            !item.image?.sourceUrl || 
            item.image.sourceUrl.includes('placeholder') ||
            item.image.sourceUrl.includes('data:image/svg+xml')) {
          
          try {
            console.log(`[API Simple Cart Get] 🔍 Tentando buscar dados do produto ${item.productId}...`);
          } catch (error) {
            console.log(`[API Simple Cart Get] ⚠️ Erro ao buscar dados do produto ${item.productId}:`, error.message);
          }
        }
      }
    }

    // Calcular totais baseado em todos os itens
    const totalItems = completeCartItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
    const totalPrice = completeCartItems.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
    
    // Atualizar totais no sessionCart com valores atuais
    sessionCart.items_count = totalItems;
    sessionCart.total = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;
    sessionCart.total_numeric = totalPrice;
    sessionCart.subtotal = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;
    
    // Salvar o carrinho dividido em blocos se necessário
    try {
      // Serializar o carrinho completo para salvar
      // Usar JSON.stringify com replacer function para tratar casos específicos
      const cookieValue = JSON.stringify(sessionCart, (key, value) => {
        // Tratar valores undefined, NaN, Infinity que podem quebrar JSON
        if (value === undefined) return null;
        if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) return 0;
        return value;
      });
      
      // Validar explicitamente que é um JSON válido
      JSON.parse(cookieValue);

      // IMPORTANTE: Verificar tamanho real do cookie após codificação URI
      const cookieSize = encodeURIComponent(cookieValue).length;
      console.log(`[API Simple Cart Get] 📊 Tamanho do cookie: ${cookieSize} bytes`);

      // SOLUÇÃO: Implementar armazenamento de estado do lado do servidor
      if (!global.serverCartStorage) {
        global.serverCartStorage = {};
      }

      // Gerar ou reutilizar ID de sessão para o carrinho
      if (!sessionId) {
        sessionId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }

      // CORREÇÃO CRÍTICA: Manter itens existentes ao atualizar o armazenamento
      // Verificar se já existe um carrinho para esta sessão e preservar seus itens
      const existingCart = global.serverCartStorage[sessionId] || { items: [] };
      
      // Adicionar/atualizar o carrinho, preservando itens existentes
      // Usar o spread operator para criar uma nova referência e evitar problemas
      const mergedItems = [];
      
      // Mapa para controle de produtos já incluídos (para evitar duplicação)
      const includedProducts = {};
      
      // Primeiro adicionar todos os itens do completeCartItems (atual)
      if (Array.isArray(completeCartItems)) {
        completeCartItems.forEach(item => {
          if (item && item.productId) {
            const key = `${item.productId}_${item.variationId || 0}`;
            includedProducts[key] = true;
            mergedItems.push({...item}); // Clone do item
          }
        });
      }
      
      // Depois adicionar itens existentes que não estão no completeCartItems
      if (Array.isArray(existingCart.items)) {
        existingCart.items.forEach(item => {
          if (item && item.productId) {
            const key = `${item.productId}_${item.variationId || 0}`;
            if (!includedProducts[key]) {
              mergedItems.push({...item}); // Clone do item
              includedProducts[key] = true;
            }
          }
        });
      }
      
      // Log para depuração
      console.log(`[API Simple Cart Get] 🔄 Itens mesclados: ${mergedItems.length} (atuais: ${completeCartItems.length}, existentes: ${existingCart.items.length})`);
      
      // Salvar carrinho completo no armazenamento com os itens mesclados
      global.serverCartStorage[sessionId] = {
        items: mergedItems,
        timestamp: Date.now(),
        total: totalPrice,
        items_count: totalItems
      };

      // Definir cookie com ID de sessão
      res.setHeader('Set-Cookie', [
        `cartSessionId=${sessionId}; Path=/; Max-Age=86400; SameSite=Lax`,
        `simple_cart_count=${totalItems}; Path=/; Max-Age=86400; SameSite=Lax`,
        `simple_cart_total=${totalPrice.toFixed(2)}; Path=/; Max-Age=86400; SameSite=Lax`
      ]);
      console.log(`[API Simple Cart Get] 💾 Carrinho completo armazenado no servidor com ID: ${sessionId}`);
      
    } catch (jsonError) {
      console.error('[API Simple Cart Get] ❌ Erro na serialização JSON:', jsonError.message);
      
      // Se houver erro, pelo menos salvar contador e total como cookies separados
      try {
        // Gerar ID de sessão para o carrinho se necessário
        if (!sessionId) {
          sessionId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }

        // Salvar carrinho no armazenamento global
        if (!global.serverCartStorage) {
          global.serverCartStorage = {};
        }
        global.serverCartStorage[sessionId] = {
          items: completeCartItems,
          timestamp: Date.now(),
          total: totalPrice,
          items_count: totalItems
        };

        // Definir cookies mínimos
        res.setHeader('Set-Cookie', [
          `cartSessionId=${sessionId}; Path=/; Max-Age=86400; SameSite=Lax`,
          `simple_cart_count=${totalItems}; Path=/; Max-Age=86400; SameSite=Lax`,
          `simple_cart_total=${totalPrice.toFixed(2)}; Path=/; Max-Age=86400; SameSite=Lax`
        ]);
        
        console.log('[API Simple Cart Get] ✅ Dados mínimos do carrinho salvos como cookies separados');
      } catch (fallbackError) {
        console.error('[API Simple Cart Get] ❌ Erro ao salvar cookies mínimos:', fallbackError);
      }
    }

    const responseTime = Date.now() - startTime;
    console.log(`[API Simple Cart Get] ✅ Carrinho retornado em ${responseTime}ms`);
    
    // Buscar itens do armazenamento do servidor se existirem
    let serverItems = [];
    if (sessionId && global.serverCartStorage && global.serverCartStorage[sessionId]) {
      serverItems = global.serverCartStorage[sessionId].items || [];
      
      // Log para depuração
      console.log(`[API Simple Cart Get] 📦 Recuperados ${serverItems.length} itens do armazenamento do servidor`);
      
      if (serverItems.length > completeCartItems.length) {
        // Usar os itens do servidor em vez dos itens do cookie
        completeCartItems = serverItems;
        console.log(`[API Simple Cart Get] ✅ Usando itens do armazenamento do servidor (${serverItems.length} itens) em vez do cookie (${completeCartItems.length} itens)`);
      }
    }
    
    // Construir resposta final com todos os itens
    const responseCart = {
      items: completeCartItems,
      items_count: totalItems,
      total: `R$ ${totalPrice.toFixed(2).replace('.', ',')}`,
      total_numeric: totalPrice,
      subtotal: `R$ ${totalPrice.toFixed(2).replace('.', ',')}`,
      totalItemTypes: completeCartItems.length,
      hasMoreItems: false,
      allItemsIncluded: true,
      itemsInResponse: completeCartItems.length,
      source: serverItems.length > 0 ? 'server_storage' : 'cookie_fallback',
      // NOVO: Adicionar informações detalhadas dos itens
      itemDetails: completeCartItems.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: parseInt(item.qty || item.quantity || 1),
        price: parseFloat(item.price || 0),
        totalPrice: parseFloat(item.price || 0) * parseInt(item.qty || item.quantity || 1)
      }))
    };

    return res.status(200).json({
      success: true,
      cart: responseCart,
      responseTime
    });

  } catch (error) {
    console.error('[API Simple Cart Get] ❌ Erro:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar carrinho',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Função para recuperar o carrinho completo do armazenamento do servidor
async function getCompleteCart(sessionId) {
  if (!sessionId) return null;
  
  // Verificar se temos o carrinho no armazenamento global
  if (global.serverCartStorage && global.serverCartStorage[sessionId]) {
    const storedCart = global.serverCartStorage[sessionId];
    
    // Verificação completa para garantir que os itens existam
    if (!storedCart.items || !Array.isArray(storedCart.items)) {
      console.log(`[API Simple Cart Get] ⚠️ Estrutura do carrinho inválida para session ${sessionId}`);
      return null;
    }
    
    // Verificar se o global.serverCartStorage está sendo atualizado corretamente
    console.log(`[API Simple Cart Get] 🔎 Debug - Estado atual do serverCartStorage para session ${sessionId}:`, {
      itemCount: storedCart.items.length,
      totalProducts: Object.values(storedCart.items.reduce((acc, item) => {
        acc[item.productId] = true;
        return acc;
      }, {})).length,
      timestamp: new Date(storedCart.timestamp).toISOString(),
    });
    
    console.log(`[API Simple Cart Get] ✅ Carrinho recuperado do armazenamento servidor: ${storedCart.items.length} itens`);
    console.log(`[API Simple Cart Get] 🛒 IDs dos produtos no carrinho: ${storedCart.items.map(item => item.productId).join(', ')}`);
    
    // Calcular totais com base nos itens atuais para garantir consistência
    const totalItems = storedCart.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
    const totalPrice = storedCart.items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
    
    // CORREÇÃO CRÍTICA: Verificar se existe duplicação de produtos - consolidar itens por ID
    const itemsById = {};
    storedCart.items.forEach(item => {
      const productId = parseInt(item.productId);
      const variationId = item.variationId ? parseInt(item.variationId) : null;
      const key = `${productId}_${variationId || 0}`;
      
      if (itemsById[key]) {
        // Se o produto já existe, incrementar quantidade
        itemsById[key].quantity += (parseInt(item.quantity) || 1);
      } else {
        // Caso contrário, adicionar novo item
        itemsById[key] = { ...item };
      }
    });
    
    // Converter de volta para array
    const consolidatedItems = Object.values(itemsById);
    
    // Log para depuração da consolidação
    if (consolidatedItems.length !== storedCart.items.length) {
      console.log(`[API Simple Cart Get] ⚠️ Itens consolidados: ${consolidatedItems.length} (original: ${storedCart.items.length})`);
    }
    
    // Garantir que todos os itens sejam retornados corretamente
    return {
      items: JSON.parse(JSON.stringify(consolidatedItems)), // Cópia profunda para evitar referências
      items_count: totalItems,
      total: `R$ ${totalPrice.toFixed(2).replace('.', ',')}`,
      total_numeric: totalPrice,
      subtotal: `R$ ${totalPrice.toFixed(2).replace('.', ',')}`,
      totalItemTypes: consolidatedItems.length
    };
  } else {
    console.log(`[API Simple Cart Get] ⚠️ Nenhum carrinho encontrado para session ${sessionId}`);
    
    // Verificar e logar todas as sessões disponíveis para diagnóstico
    if (global.serverCartStorage) {
      const availableSessions = Object.keys(global.serverCartStorage);
      console.log(`[API Simple Cart Get] 🔍 Sessões disponíveis: ${availableSessions.length > 0 ? availableSessions.join(', ') : 'nenhuma'}`);
      
      // Se existir alguma sessão, mostrar a estrutura para depuração
      if (availableSessions.length > 0) {
        const firstSession = availableSessions[0];
        const exampleCart = global.serverCartStorage[firstSession];
        console.log(`[API Simple Cart Get] 📊 Exemplo de estrutura de sessão (${firstSession}):`, {
          hasItems: !!exampleCart.items,
          isItemsArray: Array.isArray(exampleCart.items),
          itemCount: Array.isArray(exampleCart.items) ? exampleCart.items.length : 'N/A',
          firstItem: Array.isArray(exampleCart.items) && exampleCart.items.length > 0 ? 
            `ID: ${exampleCart.items[0].productId}, Nome: ${exampleCart.items[0].name?.substring(0, 30)}` : 'N/A'
        });
      }
    } else {
      console.log(`[API Simple Cart Get] 🔍 Armazenamento global de carrinhos não inicializado`);
      
      // Inicializar armazenamento global se não existir
      global.serverCartStorage = {};
    }
  }
  
  return null;
}
