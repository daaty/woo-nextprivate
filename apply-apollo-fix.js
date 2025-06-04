// Script para aplicar a correção do ApolloClient
const fs = require('fs');
const path = require('path');

console.log('Iniciando script de correção do ApolloClient...');

// Caminho dos arquivos
const srcPath = path.resolve(__dirname, 'apollo-client-fix-logs.js');
const destPath = path.resolve(__dirname, 'src/components/ApolloClient.js');

try {
  // Verificar se o arquivo de origem existe
  if (!fs.existsSync(srcPath)) {
    console.error(`ERRO: O arquivo de origem ${srcPath} não foi encontrado!`);
    process.exit(1);
  }

  // Verificar se o arquivo de destino existe
  if (!fs.existsSync(destPath)) {
    console.error(`ERRO: O arquivo de destino ${destPath} não foi encontrado!`);
    process.exit(1);
  }

  // Fazer backup do arquivo original
  const backupPath = `${destPath}.backup-${Date.now()}`;
  fs.copyFileSync(destPath, backupPath);
  console.log(`✅ Backup do arquivo original criado em: ${backupPath}`);

  // Copiar o arquivo corrigido
  fs.copyFileSync(srcPath, destPath);
  console.log(`✅ Arquivo ApolloClient.js atualizado com sucesso!`);
  
  console.log('\nCorreção aplicada! A mensagem de erro "Nenhum token JWT encontrado nos cookies" foi resolvida.');
  console.log('Agora o sistema reconhecerá corretamente quando o usuário estiver autenticado,');
  console.log('mesmo quando o token JWT específico não estiver disponível mas houver outros sinais de autenticação.');
  
} catch (error) {
  console.error('Ocorreu um erro ao aplicar a correção:', error);
  process.exit(1);
}
