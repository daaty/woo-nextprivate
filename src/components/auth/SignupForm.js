import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';

/**
 * Componente de formulário de cadastro com estilo visual atualizado
 * para manter consistência com o restante do site
 */
const SignupForm = ({ onSuccess, redirectTo = null }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  const { register, error, clearError } = useAuth();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpar erro específico do campo quando o usuário começa a editar
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'Nome é obrigatório';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Sobrenome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Nome de usuário é obrigatório';
    } else if (formData.username.length < 4) {
      errors.username = 'Nome de usuário deve ter pelo menos 4 caracteres';
    }
    
    if (!formData.password) {
      errors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'As senhas não correspondem';
    }
    
    if (!privacyAccepted) {
      errors.privacy = 'Você precisa aceitar os termos de uso e política de privacidade';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      
      if (result?.success) {
        // Executar callback de sucesso se fornecido
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        }
        
        // Redirecionar se um caminho for fornecido
        if (redirectTo) {
          window.location.href = redirectTo;
        }
      } else if (result?.errors) {
        // Pode haver erros específicos de campo retornados pela API
        setFormErrors(result.errors);
      }
    } catch (err) {
      console.error('Erro ao processar cadastro:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    outline: 'none'
  };
  
  const errorInputStyle = {
    ...inputStyle,
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2'
  };
  
  return (
    <div className="signup-form-container w-full mx-auto">
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
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Nome */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              style={formErrors.firstName ? errorInputStyle : inputStyle}
              placeholder="Seu nome"
              required
            />
            {formErrors.firstName && (
              <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
            )}
          </div>
          
          {/* Sobrenome */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Sobrenome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              style={formErrors.lastName ? errorInputStyle : inputStyle}
              placeholder="Seu sobrenome"
              required
            />
            {formErrors.lastName && (
              <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
            )}
          </div>
        </div>
        
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
            style={formErrors.email ? errorInputStyle : inputStyle}
            placeholder="seu@email.com"
            required
          />
          {formErrors.email && (
            <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
          )}
        </div>
        
        {/* Nome de usuário */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Nome de usuário <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
            style={formErrors.username ? errorInputStyle : inputStyle}
            placeholder="Escolha um nome de usuário"
            required
          />
          {formErrors.username && (
            <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
          )}
        </div>
        
        {/* Senha */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Senha <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
            style={formErrors.password ? errorInputStyle : inputStyle}
            placeholder="Crie uma senha segura"
            required
          />
          {formErrors.password && (
            <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
          )}
        </div>
        
        {/* Confirmar Senha */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Senha <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
            style={formErrors.confirmPassword ? errorInputStyle : inputStyle}
            placeholder="Repita sua senha"
            required
          />
          {formErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
          )}
        </div>
        
        {/* Política de privacidade */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="privacy-policy"
              name="privacy-policy"
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              required
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="privacy-policy" className="text-gray-700">
              Concordo com os <Link href="/termos-de-uso"><a className="text-orange-600 hover:text-orange-700 transition-colors">Termos de Uso</a></Link> e <Link href="/politica-de-privacidade"><a className="text-orange-600 hover:text-orange-700 transition-colors">Política de Privacidade</a></Link>
            </label>
            {formErrors.privacy && (
              <p className="mt-1 text-sm text-red-600">{formErrors.privacy}</p>
            )}
          </div>
        </div>
        
        {/* Botão de cadastro */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: 'linear-gradient(90deg, #00a8e1, #0076b2)',
              color: 'white', 
              border: 'none', 
              padding: '12px 0', 
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              width: '100%',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              boxShadow: '0 2px 4px rgba(0,168,225,0.2)',
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
                Cadastrando...
              </div>
            ) : (
              'Criar conta'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link href="/minha-conta">
            <a className="font-medium text-orange-600 hover:text-orange-700 transition-colors">
              Faça login
            </a>
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;