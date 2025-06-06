/**
 * Middleware para garantir que o diretório data/ e o banco SQLite 
 * tenham as permissões corretas em produção
 */

const fs = require('fs');
const path = require('path');

/**
 * Verifica e ajusta permissões do SQLite
 */
function setupSQLitePermissions(req, res, next) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const dbPath = path.join(dataDir, 'cart.sqlite');
    
    // Criar diretório data/ se não existir
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { 
        recursive: true,
        // 755 = Usuario pode ler/escrever/executar, grupo e outros podem ler/executar
        mode: 0o755 
      });
      console.log('[SQLite Middleware] 📁 Diretório data/ criado com permissões corretas');
    }
    
    // Verificar se o banco existe
    if (!fs.existsSync(dbPath)) {
      // Criar arquivo vazio com permissões corretas
      fs.writeFileSync(dbPath, '', { 
        // 644 = Usuario pode ler/escrever, grupo e outros podem ler
        mode: 0o644 
      });
      console.log('[SQLite Middleware] 🗄️ Arquivo cart.sqlite criado com permissões corretas');
    }
    
    // Verificar permissões do diretório
    const dataDirStats = fs.statSync(dataDir);
    if ((dataDirStats.mode & 0o777) !== 0o755) {
      // Ajustar permissões se necessário
      fs.chmodSync(dataDir, 0o755);
      console.log('[SQLite Middleware] 🔧 Permissões do diretório data/ ajustadas');
    }
    
    // Verificar permissões do banco
    const dbStats = fs.statSync(dbPath);
    if ((dbStats.mode & 0o777) !== 0o644) {
      // Ajustar permissões se necessário
      fs.chmodSync(dbPath, 0o644);
      console.log('[SQLite Middleware] 🔧 Permissões do cart.sqlite ajustadas');
    }
    
    if (next) next();
  } catch (error) {
    console.error('[SQLite Middleware] ❌ Erro ao configurar permissões:', error);
    if (next) next(error);
  }
}

// Exportar como middleware e função standalone
module.exports = {
  setupSQLitePermissions,
  middleware: setupSQLitePermissions
};
