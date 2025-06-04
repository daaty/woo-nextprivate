/**
 * API para limpar completamente o carrinho
 * Compatível com o novo sistema de armazenamento de carrinho sem limitações
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('[API Cart Clear] 🧹 Limpando carrinho completo');
    
    // Pegar a sessão atual do carrinho
    const sessionId = req.cookies['cartSessionId'];
    console.log(`[API Cart Clear] 🔍 ID de sessão atual: ${sessionId || 'nenhum'}`);
    
    // 1. Limpar armazenamento do servidor
    if (sessionId && global.serverCartStorage) {
      if (global.serverCartStorage[sessionId]) {
        // Armazenar quantidade anterior para log
        const previousItemCount = global.serverCartStorage[sessionId].items?.length || 0;
        
        // Limpar dados do carrinho desta sessão
        delete global.serverCartStorage[sessionId];
        console.log(`[API Cart Clear] ✅ Removidos ${previousItemCount} produtos do armazenamento do servidor (sessão: ${sessionId})`);
        
        // Log para depuração
        const sessionsCount = global.serverCartStorage ? Object.keys(global.serverCartStorage).length : 0;
        console.log(`[API Cart Clear] 📊 Sessões restantes no armazenamento: ${sessionsCount}`);
      } else {
        console.log(`[API Cart Clear] ℹ️ Sessão ${sessionId} não encontrada no armazenamento do servidor`);
      }
    } else {
      console.log('[API Cart Clear] ℹ️ Sem ID de sessão ou armazenamento global não inicializado');
    }
    
    // 2. Limpar TODOS os cookies relacionados ao carrinho
    // Importante: Também remover o cartSessionId para garantir que o armazenamento antigo não seja acessado novamente
    const expireCookies = [
      'simple_cart=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
      'simple_cart_count=0; Path=/; Max-Age=86400; SameSite=Lax',
      'simple_cart_total=0; Path=/; Max-Age=86400; SameSite=Lax',
      'cartSessionId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax' // NOVO: Expirar o cartSessionId
    ];
    
    // Definir cookies com expiração no passado para removê-los
    res.setHeader('Set-Cookie', expireCookies);
    console.log('[API Cart Clear] 🍪 Cookies do carrinho removidos, incluindo cartSessionId');

    // 3. Gerar um novo ID de sessão para que futuros produtos sejam adicionados em uma nova sessão
    const newSessionId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // 4. Inicializar o armazenamento global se não existir
    if (!global.serverCartStorage) {
      global.serverCartStorage = {};
      console.log('[API Cart Clear] 🔧 Armazenamento global inicializado');
    }
    
    // 5. Criar uma nova sessão vazia no armazenamento
    global.serverCartStorage[newSessionId] = {
      items: [],
      timestamp: Date.now(),
      total: 0,
      items_count: 0,
      cleared: true // Indicador de que esta sessão foi criada após um clear
    };
    
    console.log(`[API Cart Clear] ✅ Criada nova sessão vazia: ${newSessionId}`);
    
    // 6. Definir o novo cookie de sessão
    res.setHeader('Set-Cookie', [
      `cartSessionId=${newSessionId}; Path=/; Max-Age=86400; SameSite=Lax`,
      'simple_cart_count=0; Path=/; Max-Age=86400; SameSite=Lax',
      'simple_cart_total=0; Path=/; Max-Age=86400; SameSite=Lax'
    ]);
    
    // Evento para notificar front-end que o carrinho foi limpo
    const cleanCartEvent = {
      event: 'cartCleared',
      timestamp: Date.now(),
      newSessionId
    };
    
    // 7. Disparar evento global para o sistema de carrinho
    if (global.cartEvents) {
      global.cartEvents.emit('clear', { sessionId: newSessionId });
      console.log('[API Cart Clear] 📢 Evento global de limpeza disparado');
    }
    
    // 8. Retornar resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Carrinho limpo com sucesso',
      eventData: cleanCartEvent,
      newSessionId,
      cart: {
        items: [],
        items_count: 0,
        total: 'R$ 0,00',
        total_numeric: 0,
        subtotal: 'R$ 0,00',
        allItemsIncluded: true,
        source: 'server_storage',
        wasCleared: true
      }
    });
    
  } catch (error) {
    console.error('[API Cart Clear] ❌ Erro ao limpar carrinho:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao limpar carrinho',
      error: process.env.NODE_ENV === 'development' ? error.stack : error.message
    });
  }
}
