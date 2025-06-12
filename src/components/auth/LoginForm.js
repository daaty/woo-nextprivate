import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';

/**
 * Componente de formulário de login com estilo visual atualizado
 * para manter consistência com o restante do site
 */
const LoginForm = ({ onSuccess, redirectTo = null }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMounted = useRef(true);
  
  const { login, error, clearError } = useAuth();
  
  // Configurar e limpar o ref de componente montado
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);
    
    try {
      const result = await login(username, password, rememberMe);
      
      if (result?.success) {
        // Executar callback de sucesso se fornecido
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        }
        
        // Redirecionar se um caminho for fornecido
        if (redirectTo) {
          window.location.href = redirectTo;
        }
      }
    } catch (err) {
      console.error('Erro ao processar login:', err);
    } finally {
      // Só atualizar o estado se o componente ainda estiver montado
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };
  
  // Estilo comum para todos os campos de formulário
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontSize: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  };
  
  return (
    <div className="login-form-container w-full mx-auto">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md" role="alert">
          <div className="flex">
            <div className="flex-shrink-0 text-red-500">
              ⚠️
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Email ou nome de usuário
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:ring-opacity-50"
            style={inputStyle}
            placeholder="seu@email.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:ring-opacity-50"
            style={inputStyle}
            placeholder="Sua senha"
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Lembrar-me
            </label>
          </div>
          
          <div className="text-sm">
            <Link href="/esqueci-senha">
              <a className="text-orange-500 hover:text-orange-600 transition-colors font-medium">
                Esqueceu sua senha?
              </a>
            </Link>
          </div>
        </div>
        
        <div className="mt-8">
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: 'linear-gradient(90deg, #ff6900, #ff8800)',
              color: 'white', 
              border: 'none', 
              padding: '14px 0', 
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              width: '100%',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              boxShadow: '0 2px 4px rgba(255,105,0,0.2)',
              opacity: isSubmitting ? 0.7 : 1,
              fontWeight: '500',
              fontSize: '16px'
            }}
            className="hover:-translate-y-0.5 hover:shadow-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </div>
            ) : (
              'Entrar'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Não tem uma conta?{' '}
          <Link href="/registrar">
            <a className="font-medium text-orange-600 hover:text-orange-700 transition-colors">
              Registre-se
            </a>
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;