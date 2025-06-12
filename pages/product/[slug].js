import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Layout from '../../src/components/Layout';

// Esta página apenas redireciona da antiga URL /product para a nova URL /produto
export default function ProductRedirect() {
  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    if (slug) {
      // Redirecionar para a nova URL
      router.replace(`/produto/${slug}`);
    }
  }, [slug, router]);

  return (
    <Layout>
      <div className="container mx-auto py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600 mx-auto mb-4"></div>
        <p className="text-lg">Redirecionando...</p>
      </div>
    </Layout>
  );
}

// Este componente será renderizado no servidor para SEO
export async function getServerSideProps(context) {
  const { slug } = context.params;
  const { res } = context;
  
  // Configurar cabeçalhos para redirecionamento 301 (permanente)
  if (res) {
    res.setHeader('Location', `/produto/${slug}`);
    res.statusCode = 301;
  }

  return {
    props: {}
  };
}
