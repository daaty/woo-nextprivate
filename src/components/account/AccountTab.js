import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../ui/Notification';
import LoadingSpinner from '../LoadingSpinner';

// Componentes auxiliares seguindo o padrão do projeto
const UserIcon = () => <span className="text-orange-500">👤</span>;
const EmailIcon = () => <span className="text-blue-500">📧</span>;
const PhoneIcon = () => <span className="text-green-500">📱</span>;
const IdIcon = () => <span className="text-purple-500">🆔</span>;
const SaveIcon = () => <span className="text-green-500">💾</span>;
const EditIcon = () => <span className="text-orange-500">✏️</span>;
const LoadingIcon = () => <span className="text-gray-500">⏳</span>;
const CancelIcon = () => <span className="text-red-500">❌</span>;
const CheckIcon = () => <span className="text-green-500">✓</span>;
const LockIcon = () => <span className="text-blue-500">🔒</span>;
const KeyIcon = () => <span className="text-yellow-500">🔑</span>;
const CalendarIcon = () => <span className="text-indigo-500">📅</span>;
const ShieldIcon = () => <span className="text-emerald-500">🛡️</span>;
const RefreshIcon = () => <span>🔄</span>;

// Spinner pequeno para botões
const Spinner = () => (
  <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
);

// Container estilizado seguindo o padrão do checkout
const StyledCard = ({ children, className = "" }) => (
  <div className={`content-card ${className}`}>
    {children}
  </div>
);

// Campo de formulário estilizado
const FormField = ({ label, children, required = false, error = null }) => (
  <div className="form-group">
    <label className="form-label">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-red-500 text-sm mt-1">{error}</p>
    )}
  </div>
);

const AccountTab = ({ userData, onDataUpdate }) => {
  console.log("[AccountTab] Inicializando componente");
  console.log("[AccountTab] userData recebido:", userData);
  
  const { user, reloadUser } = useAuth();
  const { notification } = useNotification();
  
  // Estados do formulário
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  // Estados dos dados pessoais
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phone: '',
    cpf: '',
    birthDate: ''
  });
  
  // Estados da mudança de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Estados de validação
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Preencher formulário com dados do usuário
  useEffect(() => {
    if (userData) {
      console.log("[AccountTab] Preenchendo dados do usuário:", userData);
      
      // Extrair CPF dos diferentes locais possíveis
      let extractedCpf = '';
      
      // 1. CPF direto no userData
      if (userData.cpf) extractedCpf = userData.cpf;
      
      // 2. CPF no billing
      if (!extractedCpf && userData.billing?.cpf) extractedCpf = userData.billing.cpf;
      
      // 3. CPF no rawMetaData
      if (!extractedCpf && Array.isArray(userData.rawMetaData)) {
        const cpfMeta = userData.rawMetaData.find(meta => meta.key === 'cpf');
        if (cpfMeta?.value) extractedCpf = cpfMeta.value;
      }
      
      // 4. rawMetaData como string (fallback)
      if (!extractedCpf && typeof userData.rawMetaData === 'string') {
        extractedCpf = userData.rawMetaData;
      }
      
      // Extrair telefone dos diferentes locais possíveis
      let extractedPhone = '';
      
      // 1. Telefone direto no userData
      if (userData.phone) extractedPhone = userData.phone;
      
      // 2. Telefone no billing
      if (!extractedPhone && userData.billing?.phone) extractedPhone = userData.billing.phone;
      
      // 3. Telefone no shipping
      if (!extractedPhone && userData.shipping?.phone) extractedPhone = userData.shipping.phone;
      
      // 4. Telefone no rawMetaData
      if (!extractedPhone && Array.isArray(userData.rawMetaData)) {
        const phoneMeta = userData.rawMetaData.find(meta => 
          meta.key === 'phone' || 
          meta.key === 'billing_phone' || 
          meta.key === 'shipping_phone' ||
          meta.key.includes('phone')
        );
        if (phoneMeta?.value) extractedPhone = phoneMeta.value;
      }
      
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        email: userData.email || '',
        phone: extractedPhone,
        cpf: extractedCpf,
        birthDate: userData.birthDate || ''
      });
    }
  }, [userData]);

  // Função para validar CPF
  const validateCPF = (cpf) => {
    if (!cpf) return true; // CPF é opcional
    
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // CPFs com todos os dígitos iguais
    
    // Validação do algoritmo do CPF
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

  // Função para validar telefone
  const validatePhone = (phone) => {
    if (!phone) return false; // Telefone é obrigatório
    
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  // Função para validar email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Função para validar formulário
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Sobrenome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email deve ter um formato válido';
    }
    
    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Telefone deve ter pelo menos 10 dígitos';
    }
    
    if (formData.cpf && !validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF deve ter um formato válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para validar senha
  const validatePassword = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Senha atual é obrigatória';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Nova senha é obrigatória';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Nova senha deve ter pelo menos 6 caracteres';
    }
    
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }
    
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manipular mudanças no formulário
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Formatação específica para CPF e telefone
    let formattedValue = value;
    
    if (name === 'cpf') {
      // Formatar CPF: 000.000.000-00
      const cleanValue = value.replace(/\D/g, '');
      if (cleanValue.length <= 11) {
        formattedValue = cleanValue
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      } else {
        formattedValue = formData.cpf; // Manter valor anterior se exceder 11 dígitos
      }
    }
    
    if (name === 'phone') {
      // Formatar telefone: (00) 00000-0000
      const cleanValue = value.replace(/\D/g, '');
      if (cleanValue.length <= 11) {
        if (cleanValue.length <= 10) {
          formattedValue = cleanValue
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
        } else {
          formattedValue = cleanValue
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2');
        }
      } else {
        formattedValue = formData.phone; // Manter valor anterior se exceder 11 dígitos
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Manipular mudanças na senha
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Salvar dados pessoais
  const handleSave = async () => {
    if (!validateForm()) {
      notification.warning('Por favor, corrija os erros no formulário');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        displayName: formData.displayName.trim() || `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email.trim(),
        phone: formData.phone.replace(/\D/g, ''), // Enviar apenas números
        cpf: formData.cpf.replace(/\D/g, ''), // Enviar apenas números
        birthDate: formData.birthDate
      };
      
      const response = await fetch('/api/customer/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: userData?.databaseId || user?.databaseId,
          profileData: updateData
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar dados');
      }
      
      notification.success('Dados salvos com sucesso!');
      setIsEditing(false);
      
      // Recarregar dados do usuário
      if (reloadUser) {
        await reloadUser();
      }
      
      // Notificar componente pai sobre a atualização
      if (onDataUpdate) {
        onDataUpdate();
      }
      
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      notification.error(error.message || 'Erro ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  // Alterar senha
  const handlePasswordChange_Submit = async () => {
    if (!validatePassword()) {
      notification.warning('Por favor, corrija os erros na alteração de senha');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      const response = await fetch('/api/customer/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: userData?.databaseId || user?.databaseId,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao alterar senha');
      }
      
      notification.success('Senha alterada com sucesso!');
      setShowPasswordFields(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      notification.error(error.message || 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Cancelar edição
  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    
    // Restaurar dados originais
    if (userData) {
      // Reextrair dados como no useEffect
      let extractedCpf = '';
      if (userData.cpf) extractedCpf = userData.cpf;
      if (!extractedCpf && userData.billing?.cpf) extractedCpf = userData.billing.cpf;
      if (!extractedCpf && Array.isArray(userData.rawMetaData)) {
        const cpfMeta = userData.rawMetaData.find(meta => meta.key === 'cpf');
        if (cpfMeta?.value) extractedCpf = cpfMeta.value;
      }
      
      let extractedPhone = '';
      if (userData.phone) extractedPhone = userData.phone;
      if (!extractedPhone && userData.billing?.phone) extractedPhone = userData.billing.phone;
      if (!extractedPhone && userData.shipping?.phone) extractedPhone = userData.shipping.phone;
      
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        email: userData.email || '',
        phone: extractedPhone,
        cpf: extractedCpf,
        birthDate: userData.birthDate || ''
      });
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString) => {
    if (!dateString) return 'Não informado';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  // Formatar CPF para exibição
  const formatCPF = (cpf) => {
    if (!cpf) return 'Não informado';
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Formatar telefone para exibição
  const formatPhone = (phone) => {
    if (!phone) return 'Não informado';
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  return (
    <>
      {/* CSS específico para AccountTab seguindo o padrão moderno */}
      <style jsx>{`
        /* Container principal da conta */
        .account-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Header da conta */
        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
          background: white;
          border-radius: 16px;
          padding: 20px 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        }

        .account-header:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          border-color: #ff6900;
        }

        .account-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .account-actions {
          display: flex;
          gap: 12px;
        }

        /* Cards da conta */
        .account-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        }

        .account-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          border-color: #ff6900;
        }

        .account-card-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, rgba(255, 105, 0, 0.1) 0%, rgba(0, 168, 225, 0.1) 100%);
          border-bottom: 1px solid #f1f5f9;
        }

        .account-card-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }

        .account-card-body {
          padding: 24px;
        }

        /* Formulário de dados pessoais */
        .personal-data-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        .personal-data-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .personal-data-item.full-width {
          grid-column: 1 / -1;
        }

        .data-label {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .data-value {
          font-size: 16px;
          color: #1e293b;
          font-weight: 500;
        }

        .data-value.not-informed {
          color: #94a3b8;
          font-style: italic;
        }

        /* Grid de informações */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
        }

        .info-item {
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .info-item:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateY(-2px);
        }

        .info-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: white;
          margin-bottom: 12px;
        }

        .info-label {
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }

        /* Seção de segurança */
        .security-section {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }

        .security-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .security-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .password-fields {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 16px;
        }

        /* Responsivo */
        @media (max-width: 768px) {
          .account-header {
            flex-direction: column;
            align-items: stretch;
          }

          .account-actions {
            justify-content: center;
          }

          .personal-data-grid {
            grid-template-columns: 1fr;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Estados de edição */
        .edit-mode {
          background: linear-gradient(135deg, rgba(255, 105, 0, 0.05) 0%, rgba(0, 168, 225, 0.05) 100%);
          border: 2px dashed rgba(255, 105, 0, 0.3);
        }

        .edit-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 105, 0, 0.1);
          color: #ff6900;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>

      <div className="account-container">
        {/* Header com ações */}
        <div className="account-header">
          <h1 className="account-title">
            <UserIcon />
            Dados Pessoais
          </h1>
          
          <div className="account-actions">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="action-button"
              >
                <EditIcon />
                <span>Editar Dados</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="action-button"
                  disabled={isSaving}
                >
                  {isSaving ? <Spinner /> : <SaveIcon />}
                  <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="action-button secondary"
                  disabled={isSaving}
                >
                  <CancelIcon />
                  <span>Cancelar</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Card de Dados Pessoais */}
        <div className={`account-card ${isEditing ? 'edit-mode' : ''}`}>
          <div className="account-card-header">
            <h2 className="account-card-title">
              <UserIcon />
              <span>Informações Pessoais</span>
              {isEditing && (
                <span className="edit-indicator">
                  <EditIcon />
                  Editando
                </span>
              )}
            </h2>
          </div>

          <div className="account-card-body">
            {isEditing ? (
              <div className="personal-data-grid">
                <FormField label="Nome" required error={errors.firstName}>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="Seu nome"
                  />
                </FormField>

                <FormField label="Sobrenome" required error={errors.lastName}>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="Seu sobrenome"
                  />
                </FormField>

                <FormField label="Nome de Exibição" className="full-width">
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="Como você quer ser chamado"
                  />
                </FormField>

                <FormField label="Email" required error={errors.email}>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="seu@email.com"
                  />
                </FormField>

                <FormField label="Telefone" required error={errors.phone}>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="(00) 00000-0000"
                    maxLength="15"
                  />
                </FormField>

                <FormField label="CPF" error={errors.cpf}>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="000.000.000-00"
                    maxLength="14"
                  />
                </FormField>

                <FormField label="Data de Nascimento">
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleFormChange}
                    className="form-input"
                  />
                </FormField>
              </div>
            ) : (
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon">
                    <UserIcon />
                  </div>
                  <div className="info-label">Nome Completo</div>
                  <div className="info-value">
                    {formData.firstName && formData.lastName 
                      ? `${formData.firstName} ${formData.lastName}`
                      : 'Não informado'
                    }
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <EmailIcon />
                  </div>
                  <div className="info-label">Email</div>
                  <div className="info-value">
                    {formData.email || 'Não informado'}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <PhoneIcon />
                  </div>
                  <div className="info-label">Telefone</div>
                  <div className="info-value">
                    {formatPhone(formData.phone)}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <IdIcon />
                  </div>
                  <div className="info-label">CPF</div>
                  <div className="info-value">
                    {formatCPF(formData.cpf)}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <CalendarIcon />
                  </div>
                  <div className="info-label">Data de Nascimento</div>
                  <div className="info-value">
                    {formatDate(formData.birthDate)}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <IdIcon />
                  </div>
                  <div className="info-label">ID da Conta</div>
                  <div className="info-value">
                    #{userData?.databaseId || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card de Segurança */}
        <div className="account-card">
          <div className="account-card-header">
            <h2 className="account-card-title">
              <ShieldIcon />
              <span>Segurança da Conta</span>
            </h2>
          </div>

          <div className="account-card-body">
            <div className="security-section">
              <div className="security-header">
                <div className="security-title">
                  <LockIcon />
                  <span>Alterar Senha</span>
                </div>
                <button
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                  className="action-button secondary"
                >
                  <KeyIcon />
                  <span>{showPasswordFields ? 'Cancelar' : 'Alterar Senha'}</span>
                </button>
              </div>

              {showPasswordFields && (
                <div className="password-fields">
                  <FormField label="Senha Atual" required error={passwordErrors.currentPassword}>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="form-input"
                      placeholder="Digite sua senha atual"
                    />
                  </FormField>

                  <FormField label="Nova Senha" required error={passwordErrors.newPassword}>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="form-input"
                      placeholder="Digite sua nova senha"
                    />
                  </FormField>

                  <FormField label="Confirmar Nova Senha" required error={passwordErrors.confirmPassword}>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="form-input"
                      placeholder="Confirme sua nova senha"
                    />
                  </FormField>

                  <div className="flex gap-3">
                    <button
                      onClick={handlePasswordChange_Submit}
                      className="action-button"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? <Spinner /> : <SaveIcon />}
                      <span>{isChangingPassword ? 'Alterando...' : 'Alterar Senha'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordFields(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                        setPasswordErrors({});
                      }}
                      className="action-button secondary"
                      disabled={isChangingPassword}
                    >
                      <CancelIcon />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card de Estatísticas da Conta */}
        <div className="account-card">
          <div className="account-card-header">
            <h2 className="account-card-title">
              <CheckIcon />
              <span>Resumo da Conta</span>
            </h2>
          </div>

          <div className="account-card-body">
            <div className="info-grid">
              <div className="info-item">
                <div className="info-icon">
                  <CalendarIcon />
                </div>
                <div className="info-label">Membro desde</div>
                <div className="info-value">
                  {formatDate(userData?.date) || 'Data não disponível'}
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <ShieldIcon />
                </div>
                <div className="info-label">Status da Conta</div>
                <div className="info-value" style={{color: '#059669'}}>
                  Ativa
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <EmailIcon />
                </div>
                <div className="info-label">Email Verificado</div>
                <div className="info-value" style={{color: '#059669'}}>
                  Verificado
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <UserIcon />
                </div>
                <div className="info-label">Tipo de Usuário</div>
                <div className="info-value">
                  Cliente
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountTab;
