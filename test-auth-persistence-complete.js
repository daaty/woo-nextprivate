const axios = require('axios');

// Configurar axios com cookies
const testClient = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  timeout: 10000
});

async function testAuthPersistence() {
  console.log('🔐 TESTE COMPLETO: Persistência de Autenticação');
  console.log('='.repeat(60));

  try {
    // 1. Testar login
    console.log('\n1️⃣ Testando login...');
    const loginResponse = await testClient.post('/api/auth/login', {
      username: 'cliente@teste.com',
      password: 'senha123',
      remember: true
    });

    if (loginResponse.data.success) {
      console.log('✅ Login bem-sucedido');
      console.log('👤 Usuário:', loginResponse.data.user?.username);
      console.log('🍪 Cookies recebidos:', loginResponse.headers['set-cookie']?.join('; ') || 'Nenhum');
    } else {
      console.log('❌ Falha no login:', loginResponse.data.message);
      return;
    }

    // 2. Aguardar um pouco e verificar se a sessão persiste
    console.log('\n2️⃣ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Verificar autenticação sem fazer novo login
    console.log('\n3️⃣ Verificando persistência da autenticação...');
    const verifyResponse = await testClient.get('/api/auth/verify');

    if (verifyResponse.data.success) {
      console.log('✅ Autenticação persiste');
      console.log('👤 Usuário verificado:', verifyResponse.data.user?.username);
      console.log('🆔 ID do usuário:', verifyResponse.data.user?.databaseId);
    } else {
      console.log('❌ Autenticação não persiste');
      console.log('💬 Motivo:', verifyResponse.data.message);
    }

    // 4. Simular navegação (nova requisição)
    console.log('\n4️⃣ Simulando navegação para nova página...');
    const secondVerifyResponse = await testClient.get('/api/auth/verify');

    if (secondVerifyResponse.data.success) {
      console.log('✅ Autenticação mantida após "navegação"');
      console.log('👤 Usuário:', secondVerifyResponse.data.user?.username);
    } else {
      console.log('❌ Autenticação perdida após "navegação"');
      console.log('💬 Motivo:', secondVerifyResponse.data.message);
    }

    // 5. Testar múltiplas verificações consecutivas
    console.log('\n5️⃣ Testando múltiplas verificações consecutivas...');
    for (let i = 1; i <= 3; i++) {
      const multiVerifyResponse = await testClient.get('/api/auth/verify');
      console.log(`   Verificação ${i}:`, 
        multiVerifyResponse.data.success ? '✅ Autenticado' : '❌ Não autenticado'
      );
    }

    // 6. Testar logout
    console.log('\n6️⃣ Testando logout...');
    const logoutResponse = await testClient.post('/api/auth/logout');
    
    if (logoutResponse.data.success) {
      console.log('✅ Logout bem-sucedido');
    } else {
      console.log('❌ Erro no logout:', logoutResponse.data.message);
    }

    // 7. Verificar se realmente foi deslogado
    console.log('\n7️⃣ Verificando se logout foi efetivo...');
    try {
      const postLogoutVerify = await testClient.get('/api/auth/verify');
      if (postLogoutVerify.data.success) {
        console.log('❌ PROBLEMA: Usuário ainda autenticado após logout!');
      } else {
        console.log('✅ Logout efetivo - usuário não autenticado');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Logout efetivo - retorno 401 como esperado');
      } else {
        console.log('⚠️ Erro inesperado:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Dados:', error.response.data);
    }
  }
}

// Executar teste apenas se o servidor estiver rodando
testAuthPersistence()
  .then(() => {
    console.log('\n🏁 Teste de persistência concluído!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erro crítico:', error.message);
    process.exit(1);
  });
