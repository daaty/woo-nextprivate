// Sistema de armazenamento de carrinho com SQLite
// Filepath: f:\Site Felipe\next-react-site\woo-next\lib\cart-storage.cjs

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Caminho absoluto para o banco de dados na raiz do projeto
const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'cart.sqlite');

// Criar diretório data/ se não existir
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('[Cart Storage] 📁 Diretório data/ criado');
}

// Inicializar banco SQLite
const db = new Database(dbPath);

// Criar tabela se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS carts (
    session_id TEXT PRIMARY KEY,
    cart_data TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('[Cart Storage] 🗄️ SQLite inicializado em:', dbPath);

/**
 * Recuperar carrinho por session ID
 */
function getCart(sessionId) {
  try {
    if (!sessionId) {
      console.log('[Cart Storage] ⚠️ Session ID não fornecido para getCart');
      return [];
    }

    const row = db.prepare('SELECT cart_data FROM carts WHERE session_id = ?').get(sessionId);
    
    if (!row) {
      console.log(`[Cart Storage] ℹ️ Nenhum carrinho encontrado para sessão ${sessionId}`);
      return [];
    }
    
    const cartData = JSON.parse(row.cart_data);
    console.log(`[Cart Storage] ✅ Carrinho recuperado para sessão ${sessionId} (${cartData.items?.length || 0} itens)`);
    return cartData.items || [];
  } catch (error) {
    console.error('[Cart Storage] ❌ Erro ao recuperar carrinho:', error);
    return [];
  }
}

/**
 * Salvar carrinho por session ID
 */
function saveCart(sessionId, items) {
  try {
    if (!sessionId) {
      console.error('[Cart Storage] ⚠️ Session ID não fornecido para saveCart');
      return false;
    }

    const cartData = { items };
    const data = JSON.stringify(cartData);
    
    db.prepare(`
      INSERT INTO carts (session_id, cart_data, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(session_id) DO UPDATE SET cart_data=excluded.cart_data, updated_at=CURRENT_TIMESTAMP
    `).run(sessionId, data);
    
    console.log(`[Cart Storage] ✅ Carrinho salvo para sessão ${sessionId} (${items?.length || 0} itens)`);
    return true;
  } catch (error) {
    console.error('[Cart Storage] ❌ Erro ao salvar carrinho:', error);
    return false;
  }
}

/**
 * Deletar carrinho por session ID
 */
function deleteCart(sessionId) {
  try {
    if (!sessionId) {
      console.error('[Cart Storage] ⚠️ Session ID não fornecido para deleteCart');
      return false;
    }

    const result = db.prepare('DELETE FROM carts WHERE session_id = ?').run(sessionId);
    
    if (result.changes > 0) {
      console.log(`[Cart Storage] 🗑️ Carrinho deletado para sessão ${sessionId}`);
      return true;
    } else {
      console.log(`[Cart Storage] ℹ️ Nenhum carrinho encontrado para deletar sessão ${sessionId}`);
      return false;
    }
  } catch (error) {
    console.error('[Cart Storage] ❌ Erro ao deletar carrinho:', error);
    return false;
  }
}

/**
 * Limpar carrinhos expirados (mais de 24 horas)
 */
function cleanupExpiredCarts() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = db.prepare('DELETE FROM carts WHERE updated_at < ?').run(oneDayAgo);
    
    if (result.changes > 0) {
      console.log(`[Cart Storage] 🧹 ${result.changes} carrinhos expirados removidos`);
    }
    
    return result.changes;
  } catch (error) {
    console.error('[Cart Storage] ❌ Erro na limpeza de carrinhos expirados:', error);
    return 0;
  }
}

/**
 * Obter estatísticas do banco
 */
function getStats() {
  try {
    const totalCarts = db.prepare('SELECT COUNT(*) as count FROM carts').get().count;
    const recentCarts = db.prepare('SELECT COUNT(*) as count FROM carts WHERE updated_at > ?')
      .get(new Date(Date.now() - 60 * 60 * 1000).toISOString()).count; // última hora
    
    return {
      totalCarts,
      recentCarts
    };
  } catch (error) {
    console.error('[Cart Storage] ❌ Erro ao obter estatísticas:', error);
    return { totalCarts: 0, recentCarts: 0 };
  }
}

// Executar limpeza periodicamente (a cada 2 horas)
setInterval(cleanupExpiredCarts, 2 * 60 * 60 * 1000);

// Log inicial das estatísticas
setTimeout(() => {
  const stats = getStats();
  console.log(`[Cart Storage] 📊 Estatísticas: ${stats.totalCarts} carrinhos total, ${stats.recentCarts} ativos na última hora`);
}, 1000);

// Exportar funções
module.exports = {
  getCart,
  saveCart,
  deleteCart,
  cleanupExpiredCarts,
  getStats
};
