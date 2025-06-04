import React, { useEffect } from 'react';
import App from 'next/app';
import Head from 'next/head';
import { ApolloProvider } from '@apollo/client';
import client from '../src/components/ApolloClient';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { CartProvider } from '../src/contexts/CartContext';
import CartNotifications from '../src/components/cart/CartNotifications';
import { AppProvider } from '../src/contexts/AppContext';
import { ToastProvider, ToastContainer } from '../src/components/ui/Toast';
import { NotificationProvider } from '../src/components/ui/Notification';
import { AuthProvider } from '../src/contexts/AuthContext';
import '../styles/globals.css';
import '../src/styles/topbar.css';
import '../src/styles/cart.css';
import '../styles/cart-mobile.css'; // Estilos específicos para mobile do carrinho
// Importar o utilitário de limpeza de sessão
import '../src/utils/sessionCleanup';
import dynamic from 'next/dynamic';

/**
 * Componente principal da aplicação Next.js
 * Configura o Apollo Provider com o cliente correto que possui middleware/afterware
 */
function MyApp({ Component, pageProps }) {
  const apolloClient = client;
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => {
      NProgress.start();
    };
    const handleComplete = () => {
      NProgress.done();
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);
    
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Verificar parâmetros de URL para limpeza de sessão
  useEffect(() => {
    // Verificar se é um navegador e não renderização no servidor
    if (typeof window !== 'undefined') {
      // Verificar se há parâmetro de logout forçado na URL
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('forceLogout') || urlParams.has('noCache')) {
        console.log("[App] Detectada solicitação de logout forçado na URL");
        
        // Limpar localStorage e sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Limpar cookies críticos
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        document.cookie = "woocommerce-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        
        // Tentar limpar o cache do Apollo Client
        if (apolloClient.resetStore) apolloClient.resetStore();
        if (apolloClient.cache && apolloClient.cache.reset) apolloClient.cache.reset();
        
        // Limpar a URL para não repetir a limpeza
        if (router && router.replace) {
          router.replace(router.pathname, undefined, { shallow: true });
        }
      }
    }
  }, [router.pathname]);

  // Carregamento dinâmico para evitar problemas de SSR
  const CartStateManager = dynamic(
    () => import('../src/components/cart/CartStateManager'),
    { ssr: false }
  );

  return (
    <ApolloProvider client={apolloClient}>
      <AppProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <CartProvider>
                <Head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                </Head>
                <Component {...pageProps} />
                <CartNotifications />
                <ToastContainer />
                {/* Adiciona gerenciador de estado do carrinho */}
                <CartStateManager logging={process.env.NODE_ENV === 'development'} />
              </CartProvider>
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </AppProvider>
    </ApolloProvider>
  );
}

export default MyApp;

