// Script para diagnosticar problemas de persistência de endereços no WooCommerce
console.log('🔍 Diagnóstico de Persistência de Endereços WooCommerce');
console.log('===============================================================');

// Verificações que você deve fazer no WordPress/WooCommerce:

console.log('\n1. VERIFICAÇÕES NO WORDPRESS ADMIN:');
console.log('   - Acesse: /wp-admin/plugins.php');
console.log('   - Confirme que estes plugins estão ATIVOS:');
console.log('     ✓ WP GraphQL');
console.log('     ✓ WooGraphQL (WP GraphQL WooCommerce)');
console.log('     ✓ WooCommerce');

console.log('\n2. VERIFICAÇÕES NA BASE DE DADOS:');
console.log('   - Acesse phpMyAdmin ou similar');
console.log('   - Verifique estas tabelas:');
console.log('     ✓ wp_woocommerce_customer_lookup');
console.log('     ✓ wp_usermeta (onde meta_key LIKE "%billing%" ou "%shipping%")');
console.log('     ✓ wp_users');

console.log('\n3. VERIFICAÇÕES DE PERMISSÕES GRAPHQL:');
console.log('   - Acesse: /wp-admin/admin.php?page=graphql_general_settings');
console.log('   - Verifique se "Enable Public Introspection" está habilitado');
console.log('   - Acesse: WooCommerce > Settings > Advanced > WP GraphQL');

console.log('\n4. TESTE MANUAL NO GRAPHIQL:');
console.log('   - Acesse: /graphiql (no seu WordPress)');
console.log('   - Execute esta query para verificar se o cliente existe:');
console.log(`
   query {
     customer {
       id
       email
       billing {
         firstName
         lastName
         address1
         city
       }
       shipping {
         firstName
         lastName
         address1
         city
       }
     }
   }
   `);

console.log('\n5. POSSÍVEIS PROBLEMAS E SOLUÇÕES:');
console.log('   PROBLEMA: Plugin WooGraphQL desatualizado');
console.log('   SOLUÇÃO: Atualizar para versão mais recente');
console.log('');
console.log('   PROBLEMA: Conflito entre plugins de cache');
console.log('   SOLUÇÃO: Desativar temporariamente plugins de cache');
console.log('');
console.log('   PROBLEMA: Permissões de escrita no banco de dados');
console.log('   SOLUÇÃO: Verificar permissões do usuário MySQL');
console.log('');
console.log('   PROBLEMA: Tabelas corrompidas do WooCommerce');
console.log('   SOLUÇÃO: Reparar tabelas via phpMyAdmin');

console.log('\n6. COMANDOS SQL PARA DEBUG:');
console.log('   -- Verificar se o usuário existe:');
console.log('   SELECT * FROM wp_users WHERE user_email = "SEU_EMAIL@EXEMPLO.COM";');
console.log('');
console.log('   -- Verificar meta_data de billing/shipping:');
console.log('   SELECT * FROM wp_usermeta WHERE user_id = USER_ID AND meta_key LIKE "%billing%";');
console.log('   SELECT * FROM wp_usermeta WHERE user_id = USER_ID AND meta_key LIKE "%shipping%";');

console.log('\n7. WORKAROUND TEMPORÁRIO:');
console.log('   - Criar hook personalizado no WordPress:');
console.log('   - Forçar persistência via REST API como backup');

console.log('\n===============================================================');
console.log('💡 PRÓXIMOS PASSOS RECOMENDADOS:');
console.log('1. Verificar logs do WordPress (/wp-content/debug.log)');
console.log('2. Testar a mutation diretamente no GraphiQL');
console.log('3. Verificar se dados aparecem nas tabelas do MySQL');
console.log('4. Se necessário, implementar workaround via REST API');
