import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../src/components/Layout';
import { useRouter } from 'next/router';

export default function MinhaContaPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userData, setUserData] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    // Verificação de autenticação simulada
    // Em uma implementação real, isso verificaria o token armazenado
    const checkAuth = async () => {
      try {
        // Simulando verificação de autenticação
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          setIsLoggedIn(true);
          setUserData({
            name: 'Cliente Xiaomi',
            email: 'cliente@exemplo.com',
          });
        } else {
          // Redirecionar para login se não estiver logado
          // router.push('/login');
          
          // Por enquanto, vamos simular um login para testes
          setIsLoggedIn(true);
          setUserData({
            name: 'Cliente Teste',
            email: 'teste@exemplo.com',
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Função para logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsLoggedIn(false);
    router.push('/');
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container">
          <p>Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Minha Conta - Xiaomi Brasil</title>
      </Head>
      
      <div className="my-account-page">
        <div className="container">
          <h1>Minha Conta</h1>
          
          <div className="account-container">
            {/* Menu de navegação lateral */}
            <nav className="account-navigation">
              <ul>
                <li className={activeTab === 'dashboard' ? 'active' : ''}>
                  <a onClick={() => setActiveTab('dashboard')}>Painel</a>
                </li>
                <li className={activeTab === 'orders' ? 'active' : ''}>
                  <a onClick={() => setActiveTab('orders')}>Meus Pedidos</a>
                </li>
                <li className={activeTab === 'address' ? 'active' : ''}>
                  <a onClick={() => setActiveTab('address')}>Endereços</a>
                </li>
                <li className={activeTab === 'account' ? 'active' : ''}>
                  <a onClick={() => setActiveTab('account')}>Detalhes da Conta</a>
                </li>
                <li>
                  <a onClick={handleLogout}>Sair</a>
                </li>
              </ul>
            </nav>
            
            {/* Conteúdo principal */}
            <div className="account-content-wrapper">
              {activeTab === 'dashboard' && (
                <div>
                  <h2>Painel</h2>
                  <p>Olá, <strong>{userData?.name}</strong> (não é <strong>{userData?.name}</strong>? <a onClick={handleLogout} style={{color: '#ff6700', cursor: 'pointer'}}>Sair</a>)</p>
                  <p>
                    No painel da sua conta, você pode visualizar seus <a onClick={() => setActiveTab('orders')} style={{color: '#ff6700', cursor: 'pointer'}}>pedidos recentes</a>, 
                    gerenciar seus <a onClick={() => setActiveTab('address')} style={{color: '#ff6700', cursor: 'pointer'}}>endereços de entrega e faturamento</a> e 
                    <a onClick={() => setActiveTab('account')} style={{color: '#ff6700', cursor: 'pointer'}}> editar sua senha e detalhes da conta</a>.
                  </p>
                </div>
              )}
              
              {activeTab === 'orders' && (
                <div>
                  <h2>Pedidos</h2>
                  <p>Você não tem nenhum pedido recente.</p>
                </div>
              )}
              
              {activeTab === 'address' && (
                <div>
                  <h2>Endereços</h2>
                  <p>Os endereços a seguir serão utilizados por padrão durante o checkout.</p>
                  
                  <div style={{display: 'flex', gap: '20px', marginTop: '20px'}}>
                    <div style={{flex: 1, border: '1px solid #eee', padding: '15px', borderRadius: '4px'}}>
                      <h3>Endereço de Faturamento</h3>
                      <p>Você ainda não configurou este tipo de endereço.</p>
                      <button style={{
                        backgroundColor: '#ff6700', 
                        color: 'white', 
                        border: 'none', 
                        padding: '8px 15px', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}>
                        Adicionar
                      </button>
                    </div>
                    
                    <div style={{flex: 1, border: '1px solid #eee', padding: '15px', borderRadius: '4px'}}>
                      <h3>Endereço de Entrega</h3>
                      <p>Você ainda não configurou este tipo de endereço.</p>
                      <button style={{
                        backgroundColor: '#ff6700', 
                        color: 'white', 
                        border: 'none', 
                        padding: '8px 15px', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}>
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'account' && (
                <div>
                  <h2>Detalhes da Conta</h2>
                  
                  <form style={{marginTop: '20px'}}>
                    <div style={{marginBottom: '15px'}}>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Nome</label>
                      <input 
                        type="text" 
                        defaultValue={userData?.name || ''} 
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    
                    <div style={{marginBottom: '15px'}}>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>E-mail</label>
                      <input 
                        type="email" 
                        defaultValue={userData?.email || ''} 
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    
                    <h3 style={{marginTop: '30px', marginBottom: '15px'}}>Alteração de senha</h3>
                    
                    <div style={{marginBottom: '15px'}}>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Senha atual</label>
                      <input 
                        type="password"  
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    
                    <div style={{marginBottom: '15px'}}>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Nova senha</label>
                      <input 
                        type="password"  
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    
                    <div style={{marginBottom: '15px'}}>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Confirmar nova senha</label>
                      <input 
                        type="password"  
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      style={{
                        backgroundColor: '#ff6700', 
                        color: 'white', 
                        border: 'none', 
                        padding: '10px 20px', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '10px'
                      }}
                    >
                      Salvar alterações
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
