/**
 * Script para testar a persistência de autenticação
 * Diagnóstica problemas com cookies e sessões
 */

// Função para fazer login de teste
async function testLogin() {
  console.log('🧪 TESTE: Persistência de Autenticação');
  console.log('=' * 50);

  try {
    // 1. Testar login
    console.log('\n1️⃣ Realizando login...');
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'felipe', // Usando usuário padrão
        password: 'OTZhOTUwMzgwZjIz', // Senha padrão
        remember: true
      }),
      credentials: 'include' // Importante para cookies
    });

    const loginData = await loginResponse.json();
    console.log('🔐 Resultado do login:', loginData.success ? '✅ Sucesso' : '❌ Falhou');
    
    if (!loginData.success) {
      console.log('❌ Erro no login:', loginData.message);
      return;
    }

    console.log('👤 Usuário logado:', loginData.user?.username);
    
    // Verificar cookies definidos
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookies definidos:', setCookieHeader ? '✅ Sim' : '❌ Não');
    
    if (setCookieHeader) {
      console.log('🍪 Headers de cookie:');
      setCookieHeader.split(',').forEach(cookie => {
        console.log('   -', cookie.trim());
      });
    }

    // 2. Aguardar um momento e verificar persistência
    console.log('\n2️⃣ Aguardando 2 segundos e verificando persistência...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const verifyResponse = await fetch('/api/auth/verify', {
      method: 'GET',
      credentials: 'include'
    });

    const verifyData = await verifyResponse.json();
    console.log('🔍 Verificação de persistência:', verifyData.success ? '✅ Persistiu' : '❌ Perdeu');
    
    if (verifyData.success) {
      console.log('👤 Usuário verificado:', verifyData.user?.username);
    } else {
      console.log('❌ Erro na verificação:', verifyData.message);
    }

    // 3. Verificar cookies no navegador
    console.log('\n3️⃣ Verificando cookies no navegador...');
    if (typeof document !== 'undefined') {
      const cookies = document.cookie;
      console.log('🍪 Cookies atuais:', cookies);
      
      const hasAuthToken = cookies.includes('auth_token');
      const hasRefreshToken = cookies.includes('refresh_token');
      
      console.log('🔑 Token de auth:', hasAuthToken ? '✅ Presente' : '❌ Ausente');
      console.log('🔄 Token de refresh:', hasRefreshToken ? '✅ Presente' : '❌ Ausente');
    } else {
      console.log('⚠️ Não é possível verificar cookies (não está no navegador)');
    }

    // 4. Testar navegação simulada
    console.log('\n4️⃣ Simulando navegação entre páginas...');
    
    // Simular mudança de página fazendo nova verificação
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const navTestResponse = await fetch('/api/auth/verify', {
      method: 'GET',
      credentials: 'include'
    });

    const navTestData = await navTestResponse.json();
    console.log('🧭 Após "navegação":', navTestData.success ? '✅ Manteve login' : '❌ Perdeu login');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Função para verificar estado atual
function checkCurrentAuthState() {
  console.log('\n🔍 ESTADO ATUAL DE AUTENTICAÇÃO:');
  console.log('=' * 40);
  
  if (typeof window !== 'undefined') {
    // Verificar localStorage
    const authRemember = localStorage.getItem('auth_remember');
    const authUsername = localStorage.getItem('auth_username');
    
    console.log('💾 localStorage:');
    console.log('   auth_remember:', authRemember);
    console.log('   auth_username:', authUsername);
    
    // Verificar cookies
    const cookies = document.cookie;
    console.log('🍪 Cookies:', cookies);
    
    // Verificar tokens específicos
    const hasAuthToken = cookies.includes('auth_token');
    const hasRefreshToken = cookies.includes('refresh_token');
    
    console.log('🔑 Tokens:');
    console.log('   auth_token:', hasAuthToken ? '✅ Presente' : '❌ Ausente');
    console.log('   refresh_token:', hasRefreshToken ? '✅ Presente' : '❌ Ausente');
  } else {
    console.log('⚠️ Não está no navegador - não é possível verificar');
  }
}

// Executar se estiver no navegador
if (typeof window !== 'undefined') {
  // Disponibilizar globalmente para teste manual
  window.testAuth = {
    testLogin,
    checkCurrentAuthState
  };
  
  console.log('🧪 Ferramentas de teste disponíveis:');
  console.log('   window.testAuth.testLogin() - Testar login completo');
  console.log('   window.testAuth.checkCurrentAuthState() - Verificar estado atual');
  
  // Verificar estado atual imediatamente
  checkCurrentAuthState();
} else {
  // Se for Node.js, executar teste básico
  console.log('Executando em Node.js - teste limitado');
}
