import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../ui/Notification';
import Link from 'next/link';
import LoadingSpinner from '../../components/LoadingSpinner';

/**
 * Função para validar CPF
 * @param {string} cpf - CPF com apenas números
 * @returns {boolean} - true se válido, false se inválido
 */
const isValidCPF = (cpf) => {
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Calcula o primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;
  
  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;
  
  // Verifica se os dígitos calculados conferem
  return firstDigit === parseInt(cpf.charAt(9)) && secondDigit === parseInt(cpf.charAt(10));
};

/**
 * Função para formatar telefone
 * @param {string} phone - Telefone com apenas números
 * @returns {string} - Telefone formatado
 */
const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

/**
 * Função para formatar CPF
 * @param {string} cpf - CPF com apenas números
 * @returns {string} - CPF formatado
 */
const formatCPF = (cpf) => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
};

/**
 * Componente de formulário de registro com campos de endereço
 * Design inspirado no padrão visual Xiaomi do site
 */
const RegisterForm = ({ onSuccess, redirectTo = null }) => {  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cpf: '',
    // Campos de endereço
    address: {
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
      postcode: '',
      country: 'BR' // Padrão Brasil
    },
    // Endereço de cobrança
    billingAddress: {
      sameAsShipping: true, // Por padrão, usar o mesmo endereço
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
      postcode: '',
      country: 'BR'
    }
  });
  
  const [step, setStep] = useState(1); // Para navegação em etapas do formulário
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const { register, error, clearError } = useAuth();
  const { notification } = useNotification();
    const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Verifica se é campo de endereço de entrega
    if (name.startsWith('shipping.')) {
      const field = name.replace('shipping.', '');
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } 
    // Verifica se é campo de endereço de cobrança
    else if (name.startsWith('billing.')) {
      const field = name.replace('billing.', '');
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [field]: value
        }
      }));
    } 
    // Caso especial para o checkbox "mesmo endereço"
    else if (name === 'sameAsBilling') {
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          sameAsShipping: !prev.billingAddress.sameAsShipping
        }
      }));
    } 
    // Formatação especial para telefone
    else if (name === 'phone') {
      const formattedPhone = formatPhone(value);
      setFormData(prev => ({ ...prev, [name]: formattedPhone }));
    }
    // Formatação especial para CPF
    else if (name === 'cpf') {
      const formattedCpf = formatCPF(value);
      setFormData(prev => ({ ...prev, [name]: formattedCpf }));
    }
    // Campos normais
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Limpar mensagens de validação ao digitar
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };
    const validatePersonalInfo = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'Nome é obrigatório';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Sobrenome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Nome de usuário é obrigatório';
    } else if (formData.username.length < 3) {
      errors.username = 'Nome de usuário deve ter pelo menos 3 caracteres';
    }
    
    if (!formData.password) {
      errors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'As senhas não conferem';
    }
    
    // Validação do telefone (obrigatório)
    if (!formData.phone.trim()) {
      errors.phone = 'Telefone é obrigatório';
    } else {
      // Remover caracteres não numéricos para validação
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.phone = 'Telefone deve ter pelo menos 10 dígitos';
      } else if (cleanPhone.length > 11) {
        errors.phone = 'Telefone não pode ter mais de 11 dígitos';
      }
    }
    
    // Validação do CPF (opcional, mas se preenchido deve ser válido)
    if (formData.cpf.trim()) {
      const cleanCpf = formData.cpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        errors.cpf = 'CPF deve ter 11 dígitos';
      } else if (!isValidCPF(cleanCpf)) {
        errors.cpf = 'CPF inválido';
      }
    }
    
    return errors;
  };
  
  const validateAddressInfo = () => {
    const errors = {};
    
    // Validar endereço de entrega
    if (!formData.address.street.trim()) {
      errors['shipping.street'] = 'Rua/Avenida é obrigatória';
    }
    
    if (!formData.address.number.trim()) {
      errors['shipping.number'] = 'Número é obrigatório';
    }
    
    if (!formData.address.district.trim()) {
      errors['shipping.district'] = 'Bairro é obrigatório';
    }
    
    if (!formData.address.city.trim()) {
      errors['shipping.city'] = 'Cidade é obrigatória';
    }
    
    if (!formData.address.state.trim()) {
      errors['shipping.state'] = 'Estado é obrigatório';
    }
    
    if (!formData.address.postcode.trim()) {
      errors['shipping.postcode'] = 'CEP é obrigatório';
    } else if (!/^\d{5}-?\d{3}$/.test(formData.address.postcode)) {
      errors['shipping.postcode'] = 'CEP inválido, formato esperado: 00000-000';
    }
    
    // Validar endereço de cobrança apenas se for diferente do de entrega
    if (!formData.billingAddress.sameAsShipping) {
      if (!formData.billingAddress.street.trim()) {
        errors['billing.street'] = 'Rua/Avenida é obrigatória';
      }
      
      if (!formData.billingAddress.number.trim()) {
        errors['billing.number'] = 'Número é obrigatório';
      }
      
      if (!formData.billingAddress.district.trim()) {
        errors['billing.district'] = 'Bairro é obrigatório';
      }
      
      if (!formData.billingAddress.city.trim()) {
        errors['billing.city'] = 'Cidade é obrigatória';
      }
      
      if (!formData.billingAddress.state.trim()) {
        errors['billing.state'] = 'Estado é obrigatório';
      }
      
      if (!formData.billingAddress.postcode.trim()) {
        errors['billing.postcode'] = 'CEP é obrigatório';
      } else if (!/^\d{5}-?\d{3}$/.test(formData.billingAddress.postcode)) {
        errors['billing.postcode'] = 'CEP inválido, formato esperado: 00000-000';
      }
    }
    
    return errors;
  };
  
  const nextStep = () => {
    // Validar primeira etapa
    const errors = validatePersonalInfo();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setStep(2);
  };
  
  const prevStep = () => {
    setStep(1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    // Validar etapa atual
    const errors = step === 1 ? validatePersonalInfo() : validateAddressInfo();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    // Se estamos na primeira etapa, avançar para a próxima
    if (step === 1) {
      nextStep();
      return;
    }
    
    setIsSubmitting(true);
    
    try {      // Preparar dados para o registro
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        shipping: { // Endereço de entrega
          firstName: formData.firstName,
          lastName: formData.lastName,
          address1: `${formData.address.street}, ${formData.address.number}`,
          address2: formData.address.complement || '',
          city: formData.address.city,
          state: formData.address.state,
          postcode: formData.address.postcode,
          country: formData.address.country,
          neighborhood: formData.address.district, // Campo personalizado
          phone: formData.phone.replace(/\D/g, '') // Limpar formatação do telefone
        },
        billing: {} // Será preenchido abaixo
      };
        // Se o endereço de cobrança for o mesmo que o de entrega
      if (formData.billingAddress.sameAsShipping) {
        userData.billing = { 
          ...userData.shipping,
          email: formData.email, // Garantir que o email está no billing
          cpf: formData.cpf.replace(/\D/g, '') || '', // Incluir CPF (opcional)
        };
      } else {
        userData.billing = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address1: `${formData.billingAddress.street}, ${formData.billingAddress.number}`,
          address2: formData.billingAddress.complement || '',
          city: formData.billingAddress.city,
          state: formData.billingAddress.state,
          postcode: formData.billingAddress.postcode,
          country: formData.billingAddress.country,
          neighborhood: formData.billingAddress.district, // Campo personalizado
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ''), // Limpar formatação do telefone
          cpf: formData.cpf.replace(/\D/g, '') || '', // Incluir CPF (opcional)
        };
      }
      
      // Chamar a função de registro do contexto de autenticação
      const result = await register(userData);
      
      if (result.success) {
        notification.success('Registro efetuado com sucesso!');
        
        // Executar callback de sucesso se fornecido
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        }
          // Redirecionar se um caminho for fornecido
        if (redirectTo) {
          // Garantir que o redirecionamento seja uma URL absoluta
          const redirectUrl = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
          window.location.href = redirectUrl;
        }
      } else {
        notification.error(result.message || 'Falha ao registrar usuário');
      }
    } catch (err) {
      console.error('Erro ao processar registro:', err);
      notification.error('Ocorreu um erro ao registrar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };
    // Renderizar a etapa atual do formulário
  const renderStep = () => {
    if (step === 1) {
      return (
        <div className="form-container">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                <span className="section-icon">👤</span>
                Nome
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`form-input ${validationErrors.firstName ? 'error' : ''}`}
                placeholder="Nome"
              />
              {validationErrors.firstName && (
                <div className="error-message">⚠️ {validationErrors.firstName}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                <span className="section-icon">👤</span>
                Sobrenome
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`form-input ${validationErrors.lastName ? 'error' : ''}`}
                placeholder="Sobrenome"
              />
              {validationErrors.lastName && (
                <div className="error-message">⚠️ {validationErrors.lastName}</div>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <span className="section-icon">✉️</span>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
              placeholder="seu@email.com"
            />
            {validationErrors.email && (
              <div className="error-message">⚠️ {validationErrors.email}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              <span className="section-icon">👤</span>
              Nome de usuário
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`form-input ${validationErrors.username ? 'error' : ''}`}
              placeholder="seunome"
            />
            {validationErrors.username && (
              <div className="error-message">⚠️ {validationErrors.username}</div>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <span className="section-icon">🔒</span>
                Senha
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${validationErrors.password ? 'error' : ''}`}
                placeholder="Mínimo 6 caracteres"
              />
              {validationErrors.password && (
                <div className="error-message">⚠️ {validationErrors.password}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                <span className="section-icon">🔒</span>
                Confirmar senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                placeholder="Digite a senha novamente"
              />
              {validationErrors.confirmPassword && (
                <div className="error-message">⚠️ {validationErrors.confirmPassword}</div>
              )}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                <span className="section-icon">📱</span>
                Telefone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`form-input ${validationErrors.phone ? 'error' : ''}`}
                placeholder="(11) 99999-9999"
                maxLength="15"
              />
              {validationErrors.phone && (
                <div className="error-message">⚠️ {validationErrors.phone}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="cpf" className="form-label">
                <span className="section-icon">🆔</span>
                CPF <span style={{color: '#6b7280', fontSize: '12px'}}>(opcional)</span>
              </label>
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                className={`form-input ${validationErrors.cpf ? 'error' : ''}`}
                placeholder="000.000.000-00"
                maxLength="14"
              />
              {validationErrors.cpf && (
                <div className="error-message">⚠️ {validationErrors.cpf}</div>
              )}
              <div className="success-message">💡 O CPF é opcional, mas pode facilitar futuras compras</div>
            </div>
          </div>
          
          <div style={{marginTop: '32px'}}>            <button
              type="button"
              onClick={nextStep}
              className="btn-primary"
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                border: 'none',
                outline: 'none',
                background: 'linear-gradient(135deg, #ff6900 0%, #ff8f00 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                minHeight: '48px',
                textDecoration: 'none',
                fontFamily: 'inherit'
              }}
            >
              <span>Continuar</span>
              <span>→</span>
            </button>
          </div>
        </div>
      );
    }
      return (
      <div className="form-container">
        <div className="address-section">
          <h3 className="section-title">
            <span className="section-icon">🏠</span>
            Endereço de Entrega
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="shipping-street" className="form-label">
                Rua/Avenida
              </label>
              <input
                type="text"
                id="shipping-street"
                name="shipping.street"
                value={formData.address.street}
                onChange={handleChange}
                className={`form-input ${validationErrors['shipping.street'] ? 'error' : ''}`}
                placeholder="Rua ou Avenida"
              />
              {validationErrors['shipping.street'] && (
                <div className="error-message">⚠️ {validationErrors['shipping.street']}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="shipping-number" className="form-label">
                Número
              </label>
              <input
                type="text"
                id="shipping-number"
                name="shipping.number"
                value={formData.address.number}
                onChange={handleChange}
                className={`form-input ${validationErrors['shipping.number'] ? 'error' : ''}`}
                placeholder="Número"
              />
              {validationErrors['shipping.number'] && (
                <div className="error-message">⚠️ {validationErrors['shipping.number']}</div>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="shipping-complement" className="form-label">
              Complemento (opcional)
            </label>
            <input
              type="text"
              id="shipping-complement"
              name="shipping.complement"
              value={formData.address.complement}
              onChange={handleChange}
              className="form-input"
              placeholder="Apto, Bloco, etc."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="shipping-district" className="form-label">
              Bairro
            </label>
            <input
              type="text"
              id="shipping-district"
              name="shipping.district"
              value={formData.address.district}
              onChange={handleChange}
              className={`form-input ${validationErrors['shipping.district'] ? 'error' : ''}`}
              placeholder="Bairro"
            />
            {validationErrors['shipping.district'] && (
              <div className="error-message">⚠️ {validationErrors['shipping.district']}</div>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="shipping-city" className="form-label">
                Cidade
              </label>
              <input
                type="text"
                id="shipping-city"
                name="shipping.city"
                value={formData.address.city}
                onChange={handleChange}
                className={`form-input ${validationErrors['shipping.city'] ? 'error' : ''}`}
                placeholder="Cidade"
              />
              {validationErrors['shipping.city'] && (
                <div className="error-message">⚠️ {validationErrors['shipping.city']}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="shipping-state" className="form-label">
                Estado
              </label>
              <select
                id="shipping-state"
                name="shipping.state"
                value={formData.address.state}
                onChange={handleChange}
                className={`form-input ${validationErrors['shipping.state'] ? 'error' : ''}`}
              >
                <option value="">Selecione o estado</option>
                <option value="AC">Acre</option>
                <option value="AL">Alagoas</option>
                <option value="AP">Amapá</option>
                <option value="AM">Amazonas</option>
                <option value="BA">Bahia</option>
                <option value="CE">Ceará</option>
                <option value="DF">Distrito Federal</option>
                <option value="ES">Espírito Santo</option>
                <option value="GO">Goiás</option>
                <option value="MA">Maranhão</option>
                <option value="MT">Mato Grosso</option>
                <option value="MS">Mato Grosso do Sul</option>
                <option value="MG">Minas Gerais</option>
                <option value="PA">Pará</option>
                <option value="PB">Paraíba</option>
                <option value="PR">Paraná</option>
                <option value="PE">Pernambuco</option>
                <option value="PI">Piauí</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="RN">Rio Grande do Norte</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="RO">Rondônia</option>
                <option value="RR">Roraima</option>
                <option value="SC">Santa Catarina</option>
                <option value="SP">São Paulo</option>
                <option value="SE">Sergipe</option>
                <option value="TO">Tocantins</option>
              </select>
              {validationErrors['shipping.state'] && (
                <div className="error-message">⚠️ {validationErrors['shipping.state']}</div>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="shipping-postcode" className="form-label">
              CEP
            </label>
            <input
              type="text"
              id="shipping-postcode"
              name="shipping.postcode"
              value={formData.address.postcode}
              onChange={handleChange}
              className={`form-input ${validationErrors['shipping.postcode'] ? 'error' : ''}`}
              placeholder="00000-000"
            />
            {validationErrors['shipping.postcode'] && (
              <div className="error-message">⚠️ {validationErrors['shipping.postcode']}</div>
            )}
          </div>
        </div>
        
        <div className="address-section">
          <div className="checkbox-group">
            <input
              id="same-address"
              name="sameAsBilling"
              type="checkbox"
              checked={formData.billingAddress.sameAsShipping}
              onChange={handleChange}
              className="checkbox-input"
            />
            <label htmlFor="same-address" className="checkbox-label">
              💳 O endereço de cobrança é o mesmo de entrega
            </label>
          </div>
          
          {!formData.billingAddress.sameAsShipping && (
            <div style={{marginTop: '24px'}}>
              <h3 className="section-title">
                <span className="section-icon">💳</span>
                Endereço de Cobrança
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="billing-street" className="form-label">
                    Rua/Avenida
                  </label>
                  <input
                    type="text"
                    id="billing-street"
                    name="billing.street"
                    value={formData.billingAddress.street}
                    onChange={handleChange}
                    className={`form-input ${validationErrors['billing.street'] ? 'error' : ''}`}
                    placeholder="Rua ou Avenida"
                  />
                  {validationErrors['billing.street'] && (
                    <div className="error-message">⚠️ {validationErrors['billing.street']}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="billing-number" className="form-label">
                    Número
                  </label>
                  <input
                    type="text"
                    id="billing-number"
                    name="billing.number"
                    value={formData.billingAddress.number}
                    onChange={handleChange}
                    className={`form-input ${validationErrors['billing.number'] ? 'error' : ''}`}
                    placeholder="Número"
                  />
                  {validationErrors['billing.number'] && (
                    <div className="error-message">⚠️ {validationErrors['billing.number']}</div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="billing-complement" className="form-label">
                  Complemento (opcional)
                </label>
                <input
                  type="text"
                  id="billing-complement"
                  name="billing.complement"
                  value={formData.billingAddress.complement}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Apto, Bloco, etc."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="billing-district" className="form-label">
                  Bairro
                </label>
                <input
                  type="text"
                  id="billing-district"
                  name="billing.district"
                  value={formData.billingAddress.district}
                  onChange={handleChange}
                  className={`form-input ${validationErrors['billing.district'] ? 'error' : ''}`}
                  placeholder="Bairro"
                />
                {validationErrors['billing.district'] && (
                  <div className="error-message">⚠️ {validationErrors['billing.district']}</div>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="billing-city" className="form-label">
                    Cidade
                  </label>
                  <input
                    type="text"
                    id="billing-city"
                    name="billing.city"
                    value={formData.billingAddress.city}
                    onChange={handleChange}
                    className={`form-input ${validationErrors['billing.city'] ? 'error' : ''}`}
                    placeholder="Cidade"
                  />
                  {validationErrors['billing.city'] && (
                    <div className="error-message">⚠️ {validationErrors['billing.city']}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="billing-state" className="form-label">
                    Estado
                  </label>
                  <select
                    id="billing-state"
                    name="billing.state"
                    value={formData.billingAddress.state}
                    onChange={handleChange}
                    className={`form-input ${validationErrors['billing.state'] ? 'error' : ''}`}
                  >
                    <option value="">Selecione o estado</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                  {validationErrors['billing.state'] && (
                    <div className="error-message">⚠️ {validationErrors['billing.state']}</div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="billing-postcode" className="form-label">
                  CEP
                </label>
                <input
                  type="text"
                  id="billing-postcode"
                  name="billing.postcode"
                  value={formData.billingAddress.postcode}
                  onChange={handleChange}
                  className={`form-input ${validationErrors['billing.postcode'] ? 'error' : ''}`}
                  placeholder="00000-000"
                />
                {validationErrors['billing.postcode'] && (
                  <div className="error-message">⚠️ {validationErrors['billing.postcode']}</div>
                )}
              </div>
            </div>
          )}
        </div>
          
        <div style={{marginTop: '32px', display: 'flex', justifyContent: 'space-between', gap: '16px'}}>          <button
            type="button"
            onClick={prevStep}
            className="btn-secondary"
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              border: 'none',
              outline: 'none',
              background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '150px',
              minHeight: '48px',
              textDecoration: 'none',
              fontFamily: 'inherit'
            }}
          >
            <span>←</span>
            <span>Voltar</span>
          </button>
          
          {isSubmitting ? (
            <div style={{ 
              width: '100%',
              display: 'flex',
              alignItems: 'center', 
              justifyContent: 'center',
              height: '56px',
              padding: '16px 32px', 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
              boxShadow: '0 4px 16px rgba(156, 163, 175, 0.2)',
              color: 'white',
              fontWeight: '600'
            }}>
              <LoadingSpinner size="small" />
              <span style={{marginLeft: '12px'}}>Criando conta...</span>
            </div>
          ) : (            <button
              type="submit" 
              className="btn-primary"
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                border: 'none',
                outline: 'none',
                background: 'linear-gradient(135deg, #ff6900 0%, #ff8f00 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                flex: '1',
                minHeight: '48px',
                textDecoration: 'none',
                fontFamily: 'inherit'
              }}
            >
              <span>✅</span>
              <span>Criar conta</span>
            </button>
          )}
        </div>
      </div>
    );
  };
    return (
    <div className="register-form-container">
      {/* Styles inline seguindo o padrão do site */}
      <style jsx>{`
        .register-form-container {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
          padding: 20px 0;
        }
        
        .register-header {
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          color: white;
          padding: 20px 0;
          margin-bottom: 30px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(255, 105, 0, 0.2);
          text-align: center;
        }
          .register-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.08);
          padding: 40px;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .form-container {
          padding: 0;
        }
        
        .progress-steps {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 30px;
          gap: 16px;
        }
        
        .step-item {
          display: flex;
          align-items: center;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-right: 8px;
          font-size: 14px;
        }
        
        .step-number.active {
          background: white;
          color: #ff6900;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .step-connector {
          width: 32px;
          height: 2px;
          background: rgba(255, 255, 255, 0.3);
          margin: 0 8px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }
        
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: white;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #ff6900;
          box-shadow: 0 0 0 3px rgba(255, 105, 0, 0.1);
          transform: translateY(-1px);
        }
        
        .form-input.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        
        .error-message {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .success-message {
          color: #10b981;
          font-size: 12px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }          /* Botões seguindo o padrão action-button do site */
        .btn-primary {
          /* Reset padrões do navegador */
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          border: none;
          outline: none;
          
          /* Estilos do botão */
          background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%) !important;
          color: white !important;
          padding: 12px 24px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          font-size: 14px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          width: 100% !important;
          min-height: 48px !important;
          text-decoration: none !important;
          font-family: inherit !important;
        }
          .btn-primary:hover {
          background: linear-gradient(135deg, #ff8f00 0%, #ff6900 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(255, 105, 0, 0.4) !important;
        }
        
        .btn-primary:active {
          transform: translateY(0) !important;
          box-shadow: 0 4px 12px rgba(255, 105, 0, 0.3) !important;
        }          .btn-primary:disabled {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%) !important;
          cursor: not-allowed !important;
          transform: none !important;
          box-shadow: none !important;
        }
          .btn-secondary {
          /* Reset padrões do navegador */
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          border: none;
          outline: none;
          
          /* Estilos do botão */
          background: linear-gradient(135deg, #64748b 0%, #475569 100%) !important;
          color: white !important;
          padding: 12px 24px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          font-size: 14px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          width: 100% !important;
          min-height: 48px !important;
          text-decoration: none !important;
          font-family: inherit !important;
        }

        .btn-secondary:hover {
          background: linear-gradient(135deg, #475569 0%, #64748b 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(100, 116, 139, 0.4) !important;
        }
        
        .address-section {
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .section-icon {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .checkbox-input {
          width: 18px;
          height: 18px;
          accent-color: #ff6900;
        }
        
        .checkbox-label {
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }
        
        .login-link {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin-top: 24px;
        }
        
        .login-link a {
          color: #ff6900;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        
        .login-link a:hover {
          color: #ff8f00;
          text-decoration: underline;
        }
        
        .alert {
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .alert-error {
          background: #fef2f2;
          border: 2px solid #fecaca;
          color: #991b1b;
        }
        
        .alert-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        
        @media (max-width: 768px) {
          .register-form-container {
            padding: 10px;
          }
          
          .register-card {
            padding: 24px 20px;
          }
          
          .form-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .progress-steps {
            flex-direction: column;
            gap: 12px;
          }
          
          .step-connector {
            width: 2px;
            height: 20px;
            margin: 4px 0;
          }
        }
      `}</style>

      <div className="register-header">
        <h1 style={{fontSize: '24px', fontWeight: '700', marginBottom: '8px'}}>
          Criar Nova Conta
        </h1>
        <p style={{fontSize: '14px', opacity: '0.9'}}>
          Cadastre-se para ter acesso completo à nossa loja
        </p>
        
        {/* Steps progress */}
        <div className="progress-steps">
          <div className="step-item">
            <div className={`step-number ${step === 1 ? 'active' : ''}`}>1</div>
            <span>Dados Pessoais</span>
          </div>
          <div className="step-connector"></div>
          <div className="step-item">
            <div className={`step-number ${step === 2 ? 'active' : ''}`}>2</div>
            <span>Endereço</span>
          </div>
        </div>
      </div>

      <div className="register-card">
        {error && (
          <div className="alert alert-error" role="alert">
            <div className="alert-icon">⚠️</div>
            <div>
              <p style={{margin: 0, fontSize: '14px'}}>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {renderStep()}
        </form>

        <div className="login-link">
          <p style={{margin: 0, fontSize: '14px', color: '#6b7280'}}>
            Já tem uma conta?{' '}
            <Link href="/login">
              <a>Faça login</a>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;