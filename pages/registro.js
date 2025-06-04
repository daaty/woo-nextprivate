import React from 'react';
import Layout from '../src/components/Layout';
import RegisterForm from '../src/components/auth/RegisterForm';
import { useRouter } from 'next/router';
import { useAuth } from '../src/hooks/useAuth';
import Head from 'next/head';

/**
 * Página de registro de novos usuários com redirecionamento
 * se o usuário já estiver autenticado ou após o registro bem-sucedido
 */
const RegisterPage = () => {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();
  const { redirect } = router.query;
  
  // Redirecionar se já estiver logado
  React.useEffect(() => {
    if (!loading && isLoggedIn) {
      if (redirect) {
        router.push(decodeURIComponent(redirect));
      } else {
        router.push('/minha-conta');
      }
    }
  }, [isLoggedIn, loading, redirect, router]);
  
  // Callback após registro bem-sucedido
  const handleRegistrationSuccess = () => {
    if (redirect) {
      router.push(decodeURIComponent(redirect));
    } else {
      router.push('/minha-conta');
    }
  };
  
  if (loading || isLoggedIn) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-orange-400 mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Head>
        <title>Criar Nova Conta - Xiaomi Brasil</title>
        <meta name="description" content="Crie sua conta na loja Xiaomi Brasil para uma experiência de compra personalizada." />
      </Head>
      
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <RegisterForm 
            onSuccess={handleRegistrationSuccess} 
            redirectTo={redirect ? decodeURIComponent(redirect) : null} 
          />
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;