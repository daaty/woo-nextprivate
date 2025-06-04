#!/usr/bin/env node

/**
 * Script para aplicar correções do sistema de carrinho
 * Execute: node fix-cart-bugs.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando correções do sistema de carrinho...\n');

// Backup do arquivo original
const originalPath = './src/hooks/useCart.js';
const fixedPath = './src/hooks/useCart-fixed.js';
const backupPath = './src/hooks/useCart-backup.js';

try {
  // 1. Fazer backup do arquivo original
  if (fs.existsSync(originalPath)) {
    fs.copyFileSync(originalPath, backupPath);
    console.log('✅ Backup criado: useCart-backup.js');
  }

  // 2. Substituir pelo arquivo corrigido
  if (fs.existsSync(fixedPath)) {
    fs.copyFileSync(fixedPath, originalPath);
    console.log('✅ Arquivo corrigido aplicado: useCart.js');
  } else {
    console.error('❌ Arquivo corrigido não encontrado: useCart-fixed.js');
    process.exit(1);
  }

  // 3. Verificar imports do CartContext
  const cartContextPath = './src/contexts/CartContext.js';
  if (fs.existsSync(cartContextPath)) {
    const content = fs.readFileSync(cartContextPath, 'utf8');
    if (content.includes("from '../hooks/useCart'")) {
      console.log('✅ Import do useCart no CartContext está correto');
    } else {
      console.log('⚠️  Verificar import do useCart no CartContext.js');
    }
  }

  // 4. Verificar se a página cart.js está usando o contexto corretamente
  const cartPagePath = './pages/cart.js';
  if (fs.existsSync(cartPagePath)) {
    const content = fs.readFileSync(cartPagePath, 'utf8');
    if (content.includes('useCartContext')) {
      console.log('✅ Página cart.js está usando o contexto corretamente');
    } else {
      console.log('⚠️  Verificar se cart.js está usando useCartContext');
    }
  }

  console.log('\n🎉 Correções aplicadas com sucesso!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Reiniciar o servidor de desenvolvimento');
  console.log('2. Testar adição de produtos ao carrinho');
  console.log('3. Testar atualização de quantidades');
  console.log('4. Testar remoção de itens');
  console.log('5. Verificar sincronização do carrinho');
  
  console.log('\n🔍 Para reverter as mudanças:');
  console.log('cp src/hooks/useCart-backup.js src/hooks/useCart.js');

} catch (error) {
  console.error('❌ Erro ao aplicar correções:', error.message);
  process.exit(1);
}
