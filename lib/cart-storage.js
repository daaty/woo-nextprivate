// Sistema de armazenamento de carrinho completo
// Filepath: f:\Site Felipe\next-react-site\woo-next\lib\cart-storage.js

const fs = require('fs');
const path = require('path');

// Diretório para armazenar carrinhos temporários
const CART_STORAGE_DIR = path.join(process.cwd(), '.cart-storage');

// Garantir que o diretório existe
if (!fs.existsSync(CART_STORAGE_DIR)) {
  fs.mkdirSync(CART_STORAGE_DIR, { recursive: true });
}

// Função para gerar ID de sessão baseado em cookie ou IP
function generateSessionId(req) {
  // Usar cookie de sessão se existir, senão criar baseado no IP e user-agent
  const sessionCookie = req.cookies['cart_session_id'];
  if (sessionCookie) {
    return sessionCookie;
  }
  
  // Gerar novo ID baseado em timestamp e dados da requisição
  const timestamp = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Criar hash simples
  const data = `${ip}_${userAgent}_${timestamp}`;
  const sessionId = Buffer.from(data).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  
  return sessionId;
}

// Salvar carrinho completo no armazenamento
function saveCompleteCart(req, res, cartData) {
  try {
    const sessionId = generateSessionId(req);
    const cartFile = path.join(CART_STORAGE_DIR, `cart_${sessionId}.json`);
    
    // Adicionar timestamp para expiração
    const cartWithTimestamp = {
      ...cartData,
      lastUpdated: Date.now(),
      sessionId: sessionId
    };
    
    fs.writeFileSync(cartFile, JSON.stringify(cartWithTimestamp, null, 2));
    
    // Definir cookie de sessão se não existir
    if (!req.cookies['cart_session_id']) {
      const sessionCookie = `cart_session_id=${sessionId}; Path=/; Max-Age=86400; SameSite=Lax`;
      res.setHeader('Set-Cookie', [res.getHeader('Set-Cookie'), sessionCookie].filter(Boolean));
    }
    
    console.log(`[Cart Storage] ✅ Carrinho completo salvo para sessão ${sessionId}`);
    return sessionId;
  } catch (error) {
    console.error('[Cart Storage] ❌ Erro ao salvar carrinho completo:', error);
    return null;
  }
}

// Recuperar carrinho completo do armazenamento
function getCompleteCart(req) {
  try {
    const sessionId = generateSessionId(req);
    const cartFile = path.join(CART_STORAGE_DIR, `cart_${sessionId}.json`);
    
    if (!fs.existsSync(cartFile)) {
      console.log(`[Cart Storage] ℹ️ Nenhum carrinho encontrado para sessão ${sessionId}`);
      return null;
    }
    
    const cartData = JSON.parse(fs.readFileSync(cartFile, 'utf8'));
    
    // Verificar se o carrinho não expirou (24 horas)
    const now = Date.now();
    const expiration = 24 * 60 * 60 * 1000; // 24 horas
    
    if (cartData.lastUpdated && (now - cartData.lastUpdated) > expiration) {
      console.log(`[Cart Storage] ⏰ Carrinho expirado para sessão ${sessionId}, removendo`);
      fs.unlinkSync(cartFile);
      return null;
    }
    
    console.log(`[Cart Storage] ✅ Carrinho completo recuperado para sessão ${sessionId} (${cartData.items?.length || 0} itens)`);
    return cartData;
  } catch (error) {
    console.error('[Cart Storage] ❌ Erro ao recuperar carrinho completo:', error);
    return null;
  }
}

// Limpar carrinhos expirados
function cleanupExpiredCarts() {
  try {
    const files = fs.readdirSync(CART_STORAGE_DIR);
    const now = Date.now();
    const expiration = 24 * 60 * 60 * 1000; // 24 horas
    let cleaned = 0;
    
    for (const file of files) {
      if (file.startsWith('cart_') && file.endsWith('.json')) {
        const filePath = path.join(CART_STORAGE_DIR, file);
        const stats = fs.statSync(filePath);
        
        if ((now - stats.mtime.getTime()) > expiration) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Cart Storage] 🧹 ${cleaned} carrinhos expirados removidos`);
    }
  } catch (error) {
    console.error('[Cart Storage] ❌ Erro na limpeza de carrinhos expirados:', error);
  }
}

// Executar limpeza periodicamente
setInterval(cleanupExpiredCarts, 60 * 60 * 1000); // A cada hora

module.exports = {
  saveCompleteCart,
  getCompleteCart,
  generateSessionId,
  cleanupExpiredCarts
};
