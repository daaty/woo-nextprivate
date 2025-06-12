import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import InputField from '../checkout/form-elements/InputField';
import { UPDATE_PASSWORD } from '../../mutations/update-password';
import { useAuth } from '../../hooks/useAuth';

const AccountDetails = ({ userData }) => {
  const { reloadUser } = useAuth();
    const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cpf: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    errors: {}
  });
  
  const [message, setMessage] = useState({ type: '', content: '' });
  const [isSaving, setIsSaving] = useState(false);  const [activeSection, setActiveSection] = useState('personal');
  
  // Popular o formulário com os dados do usuário quando disponíveis
  useEffect(() => {
    if (userData) {
      console.log('[AccountDetails] Recebendo dados do usuário para popular o formulário:', userData);
      console.log('[AccountDetails] Dados de billing:', userData.billing);
      
      setFormState(prevState => ({
        ...prevState,
        firstName: userData.firstName || userData.billing?.firstName || '',
        lastName: userData.lastName || userData.billing?.lastName || '',
        email: userData.email || userData.billing?.email || '',
        phone: userData.billing?.phone || '',
        cpf: userData.billing?.cpf || '',
        // Adicionando dados de endereço do billing
        address1: userData.billing?.address1 || '',
        address2: userData.billing?.address2 || '',
        city: userData.billing?.city || '',
        state: userData.billing?.state || '',
        postcode: userData.billing?.postcode || '',
        country: userData.billing?.country || ''
      }));
      
      console.log('[AccountDetails] Formulário preenchido com CPF:', userData.billing?.cpf);
      console.log('[AccountDetails] Formulário preenchido com telefone:', userData.billing?.phone);
      console.log('[AccountDetails] Formulário preenchido com nome:', userData.firstName || userData.billing?.firstName);
      console.log('[AccountDetails] Formulário preenchido com endereço:', userData.billing?.address1);
    }
  }, [userData]);
  
  // Mutations para atualização de senha
  const [updatePassword] = useMutation(UPDATE_PASSWORD);
  
  const handleOnChange = (event) => {
    const { name, value } = event.target;
    
    // Formatação automática para CPF
    if (name === 'cpf') {
      const cpfFormatted = value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      setFormState(prevState => ({
        ...prevState,
        [name]: cpfFormatted,
        errors: {
          ...prevState.errors,
          [name]: ''
        }
      }));
      return;
    }

    // Formatação automática para telefone
    if (name === 'phone') {
      const phoneFormatted = value.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      setFormState(prevState => ({
        ...prevState,
        [name]: phoneFormatted,
        errors: {
          ...prevState.errors,
          [name]: ''
        }
      }));
      return;
    }
    
    setFormState(prevState => ({
      ...prevState,
      [name]: value,
      errors: {
        ...prevState.errors,
        [name]: '' // Limpa o erro ao editar o campo
      }
    }));
  };

  // Função para validar CPF
  const validateCPF = (cpf) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  };
  const validatePersonalInfo = () => {
    const errors = {};
    
    if (!formState.firstName.trim()) {
      errors.firstName = 'Nome é obrigatório';
    }
    
    if (!formState.lastName.trim()) {
      errors.lastName = 'Sobrenome é obrigatório';
    }
    
    if (!formState.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      errors.email = 'Email inválido';
    }

    if (formState.cpf && !validateCPF(formState.cpf)) {
      errors.cpf = 'CPF inválido';
    }

    if (formState.phone) {
      const cleanPhone = formState.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        errors.phone = 'Telefone deve ter 10 ou 11 dígitos';
      }
    }
    
    return errors;
  };

  const validatePasswordChange = () => {
    const errors = {};
    
    if (!formState.currentPassword) {
      errors.currentPassword = 'Senha atual é obrigatória';
    }
    
    if (!formState.newPassword) {
      errors.newPassword = 'Nova senha é obrigatória';
    } else if (formState.newPassword.length < 6) {
      errors.newPassword = 'A nova senha deve ter pelo menos 6 caracteres';
    }
    
    if (formState.newPassword !== formState.confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }
    
    return errors;
  };  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validatePersonalInfo();
    
    if (Object.keys(validationErrors).length > 0) {
      setFormState(prevState => ({
        ...prevState,
        errors: validationErrors
      }));
      return;
    }
    
    setIsSaving(true);
    setMessage({ type: '', content: '' });
      try {
      console.log('[AccountDetails] Estado do formulário antes do envio:', {
        cpf: formState.cpf,
        cpfLimpo: formState.cpf?.replace(/\D/g, '') || '',
        formStateCompleto: formState
      });

      // Usar API REST ao invés de GraphQL para evitar problemas de permissão
      const requestBody = {
        customerId: userData.databaseId || userData.id,
        userData: {
          firstName: formState.firstName,
          lastName: formState.lastName,
          email: formState.email,
        },
        billingData: {
          phone: formState.phone?.replace(/\D/g, '') || '',
          // CPF será salvo como meta_data no futuro
          cpf: formState.cpf?.replace(/\D/g, '') || '',
        }
      };

      console.log('[AccountDetails] Dados que serão enviados para API:', JSON.stringify(requestBody, null, 2));      const response = await fetch('/api/customer/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      console.log('[AccountDetails] Resposta da API:', {
        status: response.status,
        ok: response.ok,
        result: result
      });      if (response.ok && result.success) {
        setMessage({
          type: 'success',
          content: 'Dados pessoais atualizados com sucesso!'
        });

        // Processar os dados retornados pelo servidor
        if (result.customer) {
          console.log('[AccountDetails] Dados atualizados recebidos do servidor:', result.customer);
          console.log('[AccountDetails] Meta data recebido:', result.customer.meta_data);
        }

        // Recarregar dados do usuário para sincronizar o estado
        setTimeout(async () => {
          console.log('[AccountDetails] Recarregando dados do usuário após atualização...');
          const success = await reloadUser();
          console.log('[AccountDetails] Sucesso ao recarregar usuário:', success);
          
          // Forçar atualização do formulário com os novos dados após recarregamento
          if (success) {
            console.log('[AccountDetails] Forçando atualização do formulário com dados recarregados');
          }
        }, 1000);
      } else {
        throw new Error(result.message || result.error || 'Erro ao atualizar dados');
      }
    } catch (error) {
      console.error('[AccountDetails] Erro ao atualizar:', error);
      setMessage({
        type: 'error',
        content: `Erro: ${error.message || 'Não foi possível atualizar seus dados'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validatePasswordChange();
    
    if (Object.keys(validationErrors).length > 0) {
      setFormState(prevState => ({
        ...prevState,
        errors: validationErrors
      }));
      return;
    }
    
    setIsSaving(true);
    setMessage({ type: '', content: '' });
    
    try {
      const { data } = await updatePassword({
        variables: {
          input: {
            clientMutationId: Date.now().toString(),
            currentPassword: formState.currentPassword,
            newPassword: formState.newPassword
          }
        }
      });
      
      if (data?.updateCustomerPassword?.customer) {
        setMessage({
          type: 'success',
          content: 'Senha alterada com sucesso!'
        });
        
        // Limpar campos de senha após sucesso
        setFormState(prevState => ({
          ...prevState,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
      setMessage({
        type: 'error',
        content: `Erro: ${error.message || 'Não foi possível alterar sua senha'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="account-details-container">
      <h2 className="text-2xl font-bold mb-6">Detalhes da Conta</h2>
      
      <div className="mb-8">
        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeSection === 'personal' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveSection('personal')}
          >
            Dados Pessoais
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeSection === 'password' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveSection('password')}
          >
            Alterar Senha
          </button>
        </div>
        
        {message.content && (
          <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.content}
          </div>
        )}
        
        {activeSection === 'personal' ? (
          <form onSubmit={handlePersonalInfoSubmit}>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                name="firstName"
                inputValue={formState.firstName}
                required
                handleOnChange={handleOnChange}
                label="Nome"
                errors={formState.errors}
                containerClassNames="mb-4"
                className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px', 
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              />
              
              <InputField
                name="lastName"
                inputValue={formState.lastName}
                required
                handleOnChange={handleOnChange}
                label="Sobrenome"
                errors={formState.errors}
                containerClassNames="mb-4"
                className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              />
            </div>
              <InputField
              name="email"
              type="email"
              inputValue={formState.email}
              required
              handleOnChange={handleOnChange}
              label="Email"
              errors={formState.errors}
              containerClassNames="mb-4"
              className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            />

            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                name="cpf"
                inputValue={formState.cpf}
                handleOnChange={handleOnChange}
                label="CPF (Opcional)"
                errors={formState.errors}
                containerClassNames="mb-4"
                placeholder="000.000.000-00"
                className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              />
              
              <InputField
                name="phone"
                inputValue={formState.phone}
                handleOnChange={handleOnChange}
                label="Telefone (Opcional)"
                errors={formState.errors}
                containerClassNames="mb-4"
                placeholder="(11) 99999-9999"
                className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              />
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-blue-700 text-sm">
                <strong>💡 Dica:</strong> Adicionar CPF e telefone facilita o processo de pagamento via PIX, cartão e boleto.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isSaving}
              style={{
                background: 'linear-gradient(90deg, #ff6900, #ff8800)',
                color: 'white', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: '6px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
                boxShadow: '0 2px 4px rgba(255,105,0,0.2)',
                opacity: isSaving ? 0.7 : 1
              }}
              className="hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordChangeSubmit}>
            <InputField
              name="currentPassword"
              type="password"
              inputValue={formState.currentPassword}
              required
              handleOnChange={handleOnChange}
              label="Senha Atual"
              errors={formState.errors}
              containerClassNames="mb-4"
              className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            />
            
            <InputField
              name="newPassword"
              type="password"
              inputValue={formState.newPassword}
              required
              handleOnChange={handleOnChange}
              label="Nova Senha"
              errors={formState.errors}
              containerClassNames="mb-4"
              className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            />
            
            <InputField
              name="confirmPassword"
              type="password"
              inputValue={formState.confirmPassword}
              required
              handleOnChange={handleOnChange}
              label="Confirmar Nova Senha"
              errors={formState.errors}
              containerClassNames="mb-6"
              className="focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            />
            
            <button
              type="submit"
              disabled={isSaving}
              style={{
                background: 'linear-gradient(90deg, #ff6900, #ff8800)',
                color: 'white', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: '6px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
                boxShadow: '0 2px 4px rgba(255,105,0,0.2)',
                opacity: isSaving ? 0.7 : 1
              }}
              className="hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AccountDetails;