import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import Link from 'next/link';

import Layout from '../src/components/Layout';
import LoginForm from '../src/components/auth/LoginForm';
import { useAuth } from '../src/hooks/useAuth';
import { useNotification } from '../src/components/ui/Notification';
import { GET_CUSTOMER } from '../src/queries/customer';
import SEO from '../src/components/seo/SEO';
import LoadingSpinner from '../src/components/LoadingSpinner';

// Componentes das abas
import OrdersTab from '../src/components/account/OrdersTab';
import DashboardTab from '../src/components/account/DashboardTab';
import AddressTab from '../src/components/account/AddressTab';
import AccountTab from '../src/components/account/AccountTab';

// Componentes auxiliares - seguindo o padrão do checkout
const UserIcon = () => <span className="text-orange-600">👤</span>;
const LogoutIcon = () => <span className="text-red-600">🚪</span>;
const DashboardIcon = () => <span className="text-blue-600">📊</span>;
const OrdersIcon = () => <span className="text-green-600">📦</span>;
const AddressIcon = () => <span className="text-purple-600">🏠</span>;
const SettingsIcon = () => <span className="text-gray-600">⚙️</span>;
const CheckIcon = () => <span className="text-green-500">✓</span>;

// Container com gradiente seguindo o padrão do checkout
const StyledContainer = ({ children, className = "" }) => (
  <div className={`content-card ${className}`}>
    {children}
  </div>
);

// Seção container seguindo o padrão do checkout
const SectionContainer = ({ children, title, className = "" }) => (
  <div className={`account-box ${className}`}>
    {title && (
      <div className="account-box-title">
        <div className="account-box-number">
          <span>📋</span>
        </div>
        <h2>{title}</h2>
      </div>
    )}
    {children}
  </div>
);

// Painel lateral redesenhado seguindo o padrão do checkout
const LeftPanel = React.memo(({ activeTab, setActiveTab, handleLogout, user }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'orders', label: 'Meus Pedidos', icon: <OrdersIcon /> },
    { id: 'address', label: 'Endereços', icon: <AddressIcon /> },
    { id: 'account', label: 'Dados da Conta', icon: <SettingsIcon /> },
  ];

  return (
    <div className="account-navigation">
      {/* Header do usuário */}
      <div className="user-profile">
        <div className="user-avatar">
          <UserIcon />
        </div>
        <div className="user-name">
          {user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user?.displayName || 'Usuário'
          }
        </div>
        <div className="user-email">{user?.email}</div>
      </div>

      {/* Menu de navegação */}
      <nav>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-button ${activeTab === item.id ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {activeTab === item.id && (
              <span className="ml-auto">
                <CheckIcon />
              </span>
            )}
          </button>
        ))}
        
        {/* Botão de logout */}
        <button
          onClick={handleLogout}
          className="nav-button danger"
          style={{
            borderTop: '1px solid #f1f3f4',
            color: '#ef4444'
          }}
        >
          <span className="nav-icon"><LogoutIcon /></span>
          <span>Sair da Conta</span>
        </button>
      </nav>
    </div>
  );
});

export default function MinhaContaPage() {
  console.log("[MinhaConta] Iniciando renderização da página");
  const { user, isLoggedIn, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authTab, setAuthTab] = useState('login');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const router = useRouter();
  
  console.log("[MinhaConta] Estado atual:", { 
    isLoggedIn, 
    userData: user ? 'Dados disponíveis' : 'Sem dados', 
    loading: authLoading, 
    error: null,
    activeTab,
    initialLoadComplete
  });

  console.log("[MinhaConta] Dados do usuário auth:", user);

  // Debug: Monitorar mudanças no estado de autenticação
  useEffect(() => {
    console.log("[MinhaConta] MUDANÇA DE ESTADO:");
    console.log("  - isLoggedIn:", isLoggedIn);
    console.log("  - authLoading:", authLoading);
    console.log("  - initialLoadComplete:", initialLoadComplete);
    console.log("  - user:", user ? `${user.username} (${user.email})` : 'null');
  }, [isLoggedIn, authLoading, initialLoadComplete, user]);
  // Aguarda o carregamento inicial da autenticação antes de prosseguir
  useEffect(() => {
    if (!authLoading) {
      console.log("[MinhaConta] Carregamento inicial da autenticação concluído");
      console.log("[MinhaConta] Estado da autenticação - isLoggedIn:", isLoggedIn, "user:", user ? 'presente' : 'null');
      setInitialLoadComplete(true);
    }
  }, [authLoading, isLoggedIn, user]);

  // Se disponível na URL, atualiza a tab ativa
  useEffect(() => {
    console.log("[MinhaConta] useEffect - verificação de tab na URL", router.query);
    if (router.query.tab) {
      setActiveTab(router.query.tab);
    }
    
    // Verificando se há um parâmetro auth na URL para definir a aba de autenticação
    if (router.query.auth) {
      setAuthTab(router.query.auth);
    }
  }, [router.query.tab, router.query.auth]);
  
  // Obter detalhes adicionais do cliente do WooCommerce
  // CORREÇÃO: Só executa quando o carregamento inicial estiver completo E o usuário estiver logado
  const { data: customerData, loading: customerLoading, refetch: refetchCustomerData, networkStatus } = useQuery(GET_CUSTOMER, {
    skip: !initialLoadComplete || !isLoggedIn || !user?.id, // Aguarda carregamento inicial + autenticação + ID de usuário válido
    fetchPolicy: 'cache-and-network', // Tenta usar cache mas atualiza do servidor 
    notifyOnNetworkStatusChange: true, // Notificar mudanças de status de rede
    onCompleted: (data) => {
      console.log("[MinhaConta] Consulta GET_CUSTOMER completada:", data);
    },
    onError: (error) => {
      console.error("[MinhaConta] Erro na consulta GET_CUSTOMER:", error);
    }
  });  // Combinando dados do contexto de autenticação e dados do cliente WooCommerce
  // CORREÇÃO: Melhor lógica de combinação de dados com validação
  const userData = useMemo(() => {
    console.log("[MinhaConta] Recalculando userData combinado");
    
    // Se não há usuário logado, retorna objeto vazio
    if (!isLoggedIn || !user) {
      console.log("[MinhaConta] Usuário não logado, retornando dados vazios");
      return {};
    }
    
    // Base: dados do contexto de autenticação
    const baseData = { ...user };
    
    // Se temos dados da query GraphQL, eles têm prioridade para campos específicos
    if (customerData?.customer) {
      const customer = customerData.customer;
      console.log("[MinhaConta] Mesclando dados do GraphQL customer");
      
      // Mesclar dados preservando informações importantes
      Object.assign(baseData, {
        ...customer,
        // Garantir que databaseId seja definido corretamente
        databaseId: customer.databaseId || user.databaseId,
        // Preservar dados críticos do contexto de auth se não existirem no customer
        username: customer.username || user.username,
        email: customer.email || user.email,
        // Mesclar billing preservando dados importantes como CPF
        billing: {
          ...(user.billing || {}),  // Base: dados do contexto de auth
          ...(customer.billing || {})  // Sobrescrever com dados do GraphQL se existirem
        },
        // Mesclar shipping
        shipping: {
          ...(user.shipping || {}),  // Base: dados do contexto de auth
          ...(customer.shipping || {})  // Sobrescrever com dados do GraphQL se existirem
        },
        // Dados de pedidos sempre do GraphQL
        orders: customer.orders || {}
      });
    }
    
    console.log("[MinhaConta] Dados combinados finais:", baseData);
    return baseData;
  }, [isLoggedIn, user, customerData]);  // Processar meta_data para extrair CPF e outros dados
  useEffect(() => {
    if (customerData?.customer?.metaData) {
      console.log("[MinhaConta] Processando meta_data do customer:", customerData.customer.metaData);
      
      // Extrair CPF dos metadados
      const cpfMeta = customerData.customer.metaData.find(meta => meta.key === 'cpf');
      if (cpfMeta && cpfMeta.value) {
        console.log("[MinhaConta] CPF encontrado nos meta_data do customer:", cpfMeta.value);
        // Atualizar userData se necessário (pode ser feito através de um callback)
      } else {
        console.log("[MinhaConta] CPF não encontrado nos meta_data");
      }
      
      // Extrair telefone dos metadados se não estiver nos dados principais
      const phoneMeta = customerData.customer.metaData.find(meta => 
        meta.key === 'phone' || 
        meta.key === 'telefone' || 
        meta.key === 'billing_phone' ||
        meta.key === 'shipping_phone' ||
        meta.key === '_billing_phone' ||
        meta.key === '_shipping_phone' ||
        meta.key.includes('phone') ||
        meta.key.includes('telefone')
      );
      if (phoneMeta && phoneMeta.value) {
        console.log("[MinhaConta] Telefone encontrado nos meta_data do customer:", phoneMeta.value);
      } else {
        console.log("[MinhaConta] Telefone não encontrado nos meta_data");
      }
    } else {
      console.log("[MinhaConta] Nenhum meta_data encontrado no customer");
    }
  }, [customerData?.customer?.metaData]);  // Logs de debug para verificar todos os dados
  useEffect(() => {
    console.log("[MinhaConta] Customer data completo:", customerData?.customer);
    console.log("[MinhaConta] Auth data:", { user, isLoggedIn });
    console.log("[MinhaConta] Dados do usuário combinados:", userData);
  }, [customerData, user, isLoggedIn, userData]);
  
  // CORREÇÃO: Loading deve considerar tanto auth quanto customer data
  const isLoading = authLoading || (initialLoadComplete && isLoggedIn && customerLoading);
  
  // Efeito para recarregar dados do customer quando o user do contexto mudar
  useEffect(() => {
    if (initialLoadComplete && isLoggedIn && user && refetchCustomerData) {
      console.log("[MinhaConta] Usuário mudou, recarregando dados do customer...");
      refetchCustomerData();
    }
  }, [user?.id, isLoggedIn, refetchCustomerData, initialLoadComplete]);
    // Função para fazer logout
  const handleLogout = async () => {
    console.log("[MinhaConta] Fazendo logout...");
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error("[MinhaConta] Erro no logout:", error);
    }
  };

  // Debounce para tab changes para prevenir chamadas APIs excessivas
  const [debouncedActiveTab, setDebouncedActiveTab] = useState(activeTab);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedActiveTab(activeTab);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Função otimizada para mudar tab
  const handleTabChange = (tabId) => {
    console.log("[MinhaConta] Mudando para tab:", tabId);
    setActiveTab(tabId);
    
    // Atualizar a URL sem causar reload da página
    const url = new URL(window.location);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url);
  };

  // Renderizar conteúdo baseado na aba ativa (usando debounced value)
  const renderTabContent = () => {
    console.log(`[MinhaConta] Renderizando conteúdo da aba: ${debouncedActiveTab}`);
    
    switch (debouncedActiveTab) {
      case 'dashboard':
        return <DashboardTab user={userData} />;
      case 'orders':
        return <OrdersTab />;
      case 'address':
        return <AddressTab onDataUpdate={() => refetchCustomerData()} />;
      case 'account':
        return <AccountTab userData={userData} onDataUpdate={() => refetchCustomerData()} />;
      default:
        return <DashboardTab user={userData} />;
    }
  };  // CORREÇÃO: Aguardar carregamento inicial antes de decidir se mostra login
  if (!initialLoadComplete) {
    console.log("[MinhaConta] Aguardando carregamento inicial da autenticação...");
    console.log("[MinhaConta] authLoading:", authLoading, "initialLoadComplete:", initialLoadComplete);
    return (
      <Layout>
        <SEO 
          title="Minha Conta - Carregando..." 
          description="Verificando autenticação..."
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Verificando autenticação...</p>
            <p className="mt-2 text-sm text-gray-500">Aguarde enquanto verificamos seu status de login</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    console.log("[MinhaConta] Exibindo loading...");
    console.log("[MinhaConta] Detalhes do loading - authLoading:", authLoading, "customerLoading:", customerLoading, "initialLoadComplete:", initialLoadComplete, "isLoggedIn:", isLoggedIn);
    return (
      <Layout>
        <SEO 
          title="Minha Conta - Carregando..." 
          description="Carregando dados da conta..."
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">{isLoggedIn ? 'Carregando seus dados...' : 'Carregando sua conta...'}</p>
            <div className="mt-2 flex flex-col items-center">
              <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600" 
                  style={{width: isLoggedIn ? '75%' : '50%'}}
                ></div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {isLoggedIn ? 'Obtendo detalhes da conta e pedidos' : 'Verificando credenciais'}
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }    if (!isLoggedIn) {
    console.log("[MinhaConta] Usuário não autenticado, exibindo tela de redirecionamento");
    console.log("[MinhaConta] Estado completo - isLoggedIn:", isLoggedIn, "user:", user, "initialLoadComplete:", initialLoadComplete, "authLoading:", authLoading);
    return (
      <Layout>
        <SEO 
          title="Faça Login - Minha Conta" 
          description="Faça login para acessar sua conta"
        />
        
        {/* CSS básico para a tela de login */}
        <style jsx global>{`
          .login-container {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            min-height: 100vh;
            padding: 40px 0;
          }
          
          .login-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.08);
            padding: 40px;
            max-width: 440px;
            margin: 0 auto;
          }
          
          .login-avatar {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 24px;
            color: white;
            box-shadow: 0 4px 16px rgba(255, 105, 0, 0.3);
          }
        `}</style>
        
        <div className="login-container">
          <div className="container mx-auto px-4">
            <div className="login-card">
              <div className="text-center mb-8">
                <div className="login-avatar">
                  <UserIcon />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesse sua Conta</h1>
                <p className="text-gray-600">Entre para gerenciar seus pedidos e dados</p>
              </div>
              <LoginForm onSuccess={() => router.push('/minha-conta')} />
            </div>
          </div>
        </div>
      </Layout>
    );  }return (
    <Layout>
      <SEO 
        title={`Minha Conta - ${userData?.firstName || 'Usuário'}`}
        description="Gerencie sua conta, pedidos e endereços"
      />
      
      {/* Log para confirmar renderização da página principal */}
      {console.log("[MinhaConta] ✅ RENDERIZANDO PÁGINA PRINCIPAL DA CONTA") || null}
      
      {/* CSS Styling inspirado no checkout.js */}
      <style jsx global>{`
        /* Estilo geral da página de conta - seguindo checkout.js */
        .xiaomi-account {
          background: #f8f9fa;
          min-height: 100vh;
        }
        
        /* Header com gradiente moderno */
        .account-header {
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          padding: 20px 0;
          color: white;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(255, 105, 0, 0.2);
        }
        
        /* Container principal da conta */
        .account-main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
        }
        
        /* Layout em grid para desktop */
        .account-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 32px;
          align-items: start;
        }
        
        @media (max-width: 1024px) {
          .account-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        
        /* Caixas da conta seguindo padrão checkout */
        .account-box {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;
        }
        
        .account-box:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }
        
        /* Cabeçalho das caixas */
        .account-box-title {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f3f4;
        }
        
        .account-box-number {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          margin-right: 12px;
          box-shadow: 0 2px 8px rgba(255, 105, 0, 0.3);
        }
        
        .account-box-title h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          flex: 1;
        }
        
        /* Menu de navegação lateral */
        .account-navigation {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #e9ecef;
        }
        
        .nav-button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border: none;
          background: white;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          border-bottom: 1px solid #f1f3f4;
        }
        
        .nav-button:last-child {
          border-bottom: none;
        }
        
        .nav-button:hover {
          background: linear-gradient(135deg, #fff8f3 0%, #f0f9ff 100%);
          color: #ff6900;
          transform: translateX(4px);
        }
        
        .nav-button.active {
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          color: white;
          box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.2);
        }
        
        .nav-button.active:hover {
          transform: none;
        }
        
        .nav-icon {
          font-size: 18px;
          width: 20px;
          text-align: center;
        }
        
        /* Perfil do usuário */
        .user-profile {
          text-align: center;
          padding: 24px 20px;
          background: linear-gradient(135deg, rgba(255,105,0,0.1), rgba(0,168,225,0.1));
          border-bottom: 1px solid #f1f3f4;
        }
        
        .user-avatar {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 24px;
          color: white;
          box-shadow: 0 4px 16px rgba(255, 105, 0, 0.3);
        }
        
        .user-name {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }
        
        .user-email {
          font-size: 14px;
          color: #64748b;
        }
        
        /* Botões de ação */
        .action-button {
          background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .action-button:hover {
          background: linear-gradient(135deg, #ff8f00 0%, #ff6900 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 105, 0, 0.4);
        }
        
        .action-button.secondary {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
        }
        
        .action-button.secondary:hover {
          background: linear-gradient(135deg, #475569 0%, #64748b 100%);
        }
        
        .action-button.danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        
        .action-button.danger:hover {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
        }
        
        /* Cards de conteúdo */
        .content-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;
          margin-bottom: 20px;
        }
        
        .content-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }
        
        /* Formulários */
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }
        
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: white;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #ff6900;
          box-shadow: 0 0 0 3px rgba(255, 105, 0, 0.1);
        }
        
        /* Tabelas */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        
        .data-table th,
        .data-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #f1f3f4;
        }
        
        .data-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
        
        .data-table td {
          font-size: 14px;
          color: #6b7280;
        }
        
        /* Status badges */
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-badge.completed {
          background: #d4edda;
          color: #155724;
        }
        
        .status-badge.processing {
          background: #fff3cd;
          color: #856404;
        }
        
        .status-badge.pending {
          background: #f8d7da;
          color: #721c24;
        }
        
        /* Responsivo */
        @media (max-width: 768px) {
          .account-main-container {
            padding: 0 12px;
          }
          
          .account-box {
            padding: 16px;
            margin-bottom: 16px;
          }
          
          .account-box-title h2 {
            font-size: 16px;
          }
          
          .user-avatar {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }
          
          .user-name {
            font-size: 16px;
          }
          
          .nav-button {
            padding: 12px 16px;
          }
        }
      `}</style>

      <div className="xiaomi-account">
        {/* Header da página */}
        <div className="account-header">
          <div className="account-main-container">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Minha Conta</h1>
              <p className="text-orange-100">
                Gerencie seus dados, pedidos e preferências
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="account-main-container">
          <div className="account-grid">
            {/* Painel lateral */}
            <LeftPanel 
              activeTab={activeTab} 
              setActiveTab={handleTabChange}
              handleLogout={handleLogout}
              user={userData}
            />
            
            {/* Conteúdo da aba */}
            <div className="flex-1">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
