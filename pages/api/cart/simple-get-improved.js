export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('[API Simple Cart Get] 📦 Buscando carrinho...');
    
    const startTime = Date.now();
    
    // Buscar carrinho do cookie com tratamento de erro robusto
    let sessionCart = { items: [] };
    let originalCookie = null;
    
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
            
            // Garantir que o array de itens existe
            if (!Array.isArray(sessionCart.items)) {
              sessionCart.items = [];
            }
            
            console.log('[API Simple Cart Get] ✅ Cookie do carrinho carregado com sucesso');
            
            // Registrar o tamanho do cookie
            if (originalCookie) {
              console.log(`[API Simple Cart Get] 📊 Tamanho do cookie: ${originalCookie.length} bytes`);
            }
            
            // Verificar se o carrinho tem informações sobre itens totais
            if (sessionCart.totalItemTypes && sessionCart.totalItemTypes > sessionCart.items.length) {
              console.log(`[API Simple Cart Get] ℹ️ Carrinho tem mais itens (${sessionCart.totalItemTypes}) do que no cookie (${sessionCart.items.length})`);
              console.log('[API Simple Cart Get] 🔍 Usando itens limitados do cookie devido ao limite de tamanho');
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
      
      // Limpar cookie corrompido
      res.setHeader('Set-Cookie', [
        'simple_cart=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      ]);
    }
    
    // Logar o tamanho da resposta para debug
    console.log('[API Simple Cart Get] 🛒 Carrinho encontrado:', {
      itemCount: sessionCart.items?.length || 0,
      totalItemTypes: sessionCart.totalItemTypes || sessionCart.items?.length || 0,
      hasMoreItems: sessionCart.hasMoreItems || false,
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
    
    // CORRIGIR: Declarar itemsUpdated FORA do bloco if
    let itemsUpdated = false;
    
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
            
            // Vamos otimizar esta parte para ser mais eficiente e não buscar dados que já estão no sessionCart
            // Por padrão, mantemos os dados existentes se já estiverem presentes
          } catch (error) {
            console.log(`[API Simple Cart Get] ⚠️ Erro ao buscar dados do produto ${item.productId}:`, error.message);
          }
        }
      }
    }

    // Verificar se precisamos recalcular totais
    // Isso pode ser necessário se o cookie contiver apenas uma versão parcial do carrinho
    if (sessionCart.totalItemTypes && sessionCart.totalItemTypes > sessionCart.items.length) {
      console.log('[API Simple Cart Get] ⚠️ Recalculando totais baseado apenas nos itens disponíveis');
      
      // Recalcular totais apenas com os itens disponíveis
      const recalculatedTotalItems = sessionCart.items.reduce((sum, item) => sum + item.quantity, 0);
      const recalculatedTotalPrice = sessionCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      sessionCart.items_count = recalculatedTotalItems;
      sessionCart.total = `R$ ${recalculatedTotalPrice.toFixed(2).replace('.', ',')}`;
      sessionCart.total_numeric = recalculatedTotalPrice;
      sessionCart.subtotal = `R$ ${recalculatedTotalPrice.toFixed(2).replace('.', ',')}`;
    }
    
    // Limpar tamanhos de imagem para reduzir tamanho do cookie se necessário
    // Especialmente importante para navegação com largura de banda limitada
    const safeCart = {
      ...sessionCart,
      items: sessionCart.items.map(item => {
        const cleanItem = { ...item };
        
        // Se a URL da imagem for muito grande, reduzir para evitar consumo excessivo de banda
        if (item.image?.sourceUrl && item.image.sourceUrl.length > 500) {
          cleanItem.image = {
            ...item.image,
            sourceUrl: item.image.sourceUrl.substring(0, 500) // Limitar comprimento da URL
          };
        }
        
        return {
          ...cleanItem,
          // Limitar campos textuais para tamanhos razoáveis
          name: typeof cleanItem.name === 'string' ? 
            cleanItem.name.substring(0, 100) // Limitar o nome a 100 caracteres
            : `Produto ${cleanItem.productId}`,
          sku: typeof cleanItem.sku === 'string' ? 
            cleanItem.sku.substring(0, 20) 
            : '',
          // Outros campos para limitar se necessário
        };
      })
    };
    
    // Adicionar flag para indicar se o carrinho foi limitado
    safeCart.wasLimited = sessionCart.hasMoreItems || sessionCart.totalItemTypes > sessionCart.items.length;
    
    // Adicionar tamanho do cookie à resposta para debug
    if (originalCookie) {
      safeCart.cookieSize = originalCookie.length;
    }
    
    // Tentar salvar o cookie de volta (com possíveis atualizações)
    try {
      // Usar um super-safe cart similar ao simple-add.js
      const superSafeCart = {
        ...safeCart,
        items: safeCart.items.map(item => ({
          ...item,
          // Garantir que propriedades críticas são 100% seguras para JSON
          name: typeof item.name === 'string' 
            ? item.name.replace(/[^\w\s\-.,]/g, '') // Manter apenas caracteres seguros
            : `Produto ${item.productId}`,
          image: {
            sourceUrl: typeof item.image?.sourceUrl === 'string'
              ? item.image.sourceUrl.replace(/[^\w\s\-.:\/]/g, '') // URL segura
              : '',
            alt: typeof item.image?.alt === 'string'
              ? item.image.alt.replace(/[^\w\s\-.,]/g, '')
              : ''
          }
        }))
      };

      // Use JSON.stringify com replacer function para tratar casos específicos
      const cookieValue = JSON.stringify(superSafeCart, (key, value) => {
        // Tratar valores undefined, NaN, Infinity que podem quebrar JSON
        if (value === undefined) return null;
        if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) return 0;
        return value;
      });
      
      // Validar explicitamente
      JSON.parse(cookieValue); // Verifica se o JSON é válido
      
      // Verificar o tamanho do cookie para evitar exceder o limite do navegador (4KB)
      const cookieSize = encodeURIComponent(cookieValue).length;
      console.log(`[API Simple Cart Get] 📊 Tamanho do cookie: ${cookieSize} bytes`);
      
      let finalCookieValue = cookieValue;
      
      // Se o cookie estiver se aproximando do limite (3700 bytes), manter apenas os items mais recentes
      if (cookieSize > 3700) {
        console.log('[API Simple Cart Get] ⚠️ Cookie se aproximando do limite! Otimizando...');
        
        // Ordenar itens pelo mais recente (usando cartKey que contém timestamp)
        const limitedItems = [...superSafeCart.items]
          .sort((a, b) => {
            // Extrair timestamp do cartKey (formato: {productId}_{variationId}_timestamp)
            const getTimestamp = (key) => {
              if (!key) return 0;
              const parts = key.split('_');
              return parts.length > 2 ? parseInt(parts[2]) : 0;
            };
            return getTimestamp(b.cartKey) - getTimestamp(a.cartKey);
          })
          // Limitar a 3 itens mais recentes para garantir que caibam no cookie
          .slice(0, 3);
          
        // Criar versão limitada do carrinho
        const limitedCart = {
          ...superSafeCart,
          items: limitedItems,
          totalItemTypes: superSafeCart.items.length,
          hasMoreItems: superSafeCart.items.length > limitedItems.length,
          itemsInCookie: limitedItems.length
        };
        
        // Manter totais do carrinho original
        
        // Regenerar cookie value com itens limitados
        finalCookieValue = JSON.stringify(limitedCart, (key, value) => {
          if (value === undefined) return null;
          if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) return 0;
          return value;
        });
        
        // Verificar o tamanho final
        const limitedCookieSize = encodeURIComponent(finalCookieValue).length;
        console.log(`[API Simple Cart Get] ✅ Cookie otimizado para ${limitedItems.length} itens mais recentes (${limitedCookieSize} bytes)`);
      }
      
      // Salvar carrinho com encode URI para maior segurança
      const cartCookie = `simple_cart=${encodeURIComponent(finalCookieValue)}; Path=/; Max-Age=86400; SameSite=Lax`;
      res.setHeader('Set-Cookie', cartCookie);
      console.log(`[API Simple Cart Get] 💾 Carrinho atualizado salvo no cookie (${finalCookieValue.length} bytes)`);
    } catch (jsonError) {
      console.error('[API Simple Cart Get] ❌ Erro na serialização JSON:', jsonError.message);
      
      // Simplificar ainda mais o carrinho
      const minimalCart = {
        items_count: safeCart.items_count || safeCart.items.length,
        total: safeCart.total || 'R$ 0,00',
        total_numeric: safeCart.total_numeric || 0,
        items: safeCart.items.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity || 1),
          price: parseFloat(item.price || 0),
          name: typeof item.name === 'string' ? item.name.substring(0, 30) : `Produto ${item.productId}`
        }))
      };
      
      try {
        const simpleCartString = JSON.stringify(minimalCart);
        const fallbackCookie = `simple_cart=${encodeURIComponent(simpleCartString)}; Path=/; Max-Age=86400; SameSite=Lax`;
        res.setHeader('Set-Cookie', fallbackCookie);
        console.log('[API Simple Cart Get] ⚠️ Salvo cookie minimalista como fallback');
      } catch (fallbackError) {
        // Em último caso, criar um carrinho super minimalista
        const simpleCart = {
          items_count: safeCart.items_count || safeCart.items.length,
          total: safeCart.total || 'R$ 0,00',
          total_numeric: safeCart.total_numeric || 0
        };
        
        try {
          const fallbackCookie = `simple_cart=${encodeURIComponent(JSON.stringify(simpleCart))}; Path=/; Max-Age=86400; SameSite=Lax`;
          res.setHeader('Set-Cookie', fallbackCookie);
          console.log('[API Simple Cart Get] ✅ Versão super simplificada do carrinho salva com sucesso');
        } catch (fallbackError) {
          console.error('[API Simple Cart Get] ❌ Erro ao salvar versão super simplificada:', fallbackError);
          
          // Último recurso: remover o cookie
          res.setHeader('Set-Cookie', [
            'simple_cart={}; Path=/; Max-Age=86400; SameSite=Lax'
          ]);
        }
      }
    }

    const responseTime = Date.now() - startTime;
    
    console.log(`[API Simple Cart Get] ✅ Carrinho retornado em ${responseTime}ms`);
    
    // Adicionar flags ao carrinho para informar o frontend sobre o estado
    const responseCart = {
      ...sessionCart,
      // Flag para indicar se o frontend deve buscar mais dados
      wasLimited: sessionCart.hasMoreItems || (sessionCart.totalItemTypes > sessionCart.items.length),
      // Incluir todos os itens disponíveis
      totalItemTypes: sessionCart.totalItemTypes || sessionCart.items.length
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
