import React from 'react';
import Layout from "../src/components/Layout";
import LoginForm from "../src/components/auth/LoginForm";
import { useAuth } from '../src/contexts/AuthContext';
import { useRouter } from 'next/router';
import SEO from '../src/components/seo/SEO';

const LoginPage = () => {
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
        title="Login - Xiaomi Brasil"
        description="Acesse sua conta na Xiaomi Brasil para gerenciar seus pedidos, informações pessoais e favoritos."
        canonicalUrl="/login"
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-8">
          <LoginForm redirectTo={redirect || '/minha-conta'} />
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;