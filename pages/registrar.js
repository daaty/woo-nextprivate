import React from 'react';
import Layout from "../src/components/Layout";
import RegisterForm from "../src/components/auth/RegisterForm";
import { useAuth } from '../src/hooks/useAuth';
import { useRouter } from 'next/router';
import SEO from '../src/components/seo/SEO';

const RegisterPage = () => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const { redirect } = router.query;

  // Se o usuário já estiver logado, redireciona para a página de conta
  React.useEffect(() => {
    if (isLoggedIn) {
      router.push(redirect || '/minha-conta');
    }
  }, [isLoggedIn, router, redirect]);

  return (
    <Layout>
      <SEO
        title="Criar Conta - Rota"
        description="Crie sua conta na Rota para acessar vantagens exclusivas, gerenciar seus pedidos e acompanhar suas compras."
        canonicalUrl="/registrar"
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Criar Conta</h1>
          
          {/* Container do formulário com borda gradiente */}
          <div style={{ 
            background: 'linear-gradient(90deg, rgba(255,105,0,0.03), rgba(0,168,225,0.03))', 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            position: 'relative',
            padding: '1px',
            overflow: 'hidden'
          }}>
            {/* Pseudo-elemento para criar a borda gradiente */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '12px',
              padding: '2px',
              background: 'linear-gradient(90deg, #ff6900, #00a8e1)',
              content: '""',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              zIndex: 0
            }}></div>
            
            {/* Conteúdo do formulário */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              background: 'white',
              borderRadius: '10px',
              padding: '24px'
            }}>
              <RegisterForm redirectTo={redirect || '/minha-conta'} />
            </div>
          </div>
          
          {/* Banner de benefícios com estilo consistente */}
          <div className="mt-8" style={{
            background: 'linear-gradient(90deg, rgba(255,105,0,0.03), rgba(0,168,225,0.03))', 
            borderRadius: '12px',
            position: 'relative',
            padding: '1px',
            overflow: 'hidden'
          }}>
            {/* Pseudo-elemento para criar a borda gradiente */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '12px',
              padding: '2px',
              background: 'linear-gradient(90deg, #ff6900, #00a8e1)',
              content: '""',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              zIndex: 0
            }}></div>
            
            {/* Conteúdo do banner */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              background: 'white',
              borderRadius: '10px',
              padding: '20px'
            }}>
              <h2 className="text-lg font-medium mb-4 text-center">Benefícios da sua conta Rota</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <div className="flex-grow">
                    <h3 className="text-sm font-medium text-gray-700">
                      Acompanhe pedidos 
                      <span style={{ color: '#22c55e', fontWeight: 'bold', marginLeft: '8px' }}>✓</span>
                    </h3>
                    <p className="text-sm text-gray-500">Visualize o status de seus pedidos facilmente</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-grow">
                    <h3 className="text-sm font-medium text-gray-700">
                      Salve seus endereços
                      <span style={{ color: '#22c55e', fontWeight: 'bold', marginLeft: '8px' }}>✓</span>
                    </h3>
                    <p className="text-sm text-gray-500">Agilize suas compras com endereços salvos</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-grow">
                    <h3 className="text-sm font-medium text-gray-700">
                      Adicione favoritos
                      <span style={{ color: '#22c55e', fontWeight: 'bold', marginLeft: '8px' }}>✓</span>
                    </h3>
                    <p className="text-sm text-gray-500">Guarde produtos para comprar depois</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-grow">
                    <h3 className="text-sm font-medium text-gray-700">
                      Checkout mais rápido
                      <span style={{ color: '#22c55e', fontWeight: 'bold', marginLeft: '8px' }}>✓</span>
                    </h3>
                    <p className="text-sm text-gray-500">Finalize compras em poucos cliques</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;