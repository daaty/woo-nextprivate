import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from "../src/components/Layout";

/**
 * Componente de redirecionamento para a página do carrinho
 * Resolve o problema de links apontando para /carrinho redirecionando para /cart
 */
const CarrinhoRedirect = () => {
  const router = useRouter();
  const isMounted = useRef(true);
  
  // Usar useEffect com cleanup para evitar memory leaks
  useEffect(() => {
    // Redirecionar para a página correta do carrinho
    router.replace('/cart');
    
    // Cleanup function para evitar updates em componentes desmontados
    return () => {
      isMounted.current = false;
    };
  }, [router]);
  
  return (
    <Layout>
      <div className="container mx-auto py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500 mx-auto mb-4"></div>
        <p className="text-lg">Redirecionando para o carrinho...</p>
      </div>
    </Layout>
  );
};

export default CarrinhoRedirect;