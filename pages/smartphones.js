import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../src/components/Layout';

// Esta página serve para redirecionar à página vertodos
export default function SmartphonesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página Ver Todos após carregar o componente
    router.push('/vertodos');
  }, []);

  return (
    <Layout>
      <div style={{ 
        padding: '100px 20px', 
        textAlign: 'center', 
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1>Redirecionando...</h1>
        <p>Aguarde um momento enquanto redirecionamos você para nossa nova página de smartphones.</p>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #ff6900',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginTop: '20px'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </Layout>
  );
}