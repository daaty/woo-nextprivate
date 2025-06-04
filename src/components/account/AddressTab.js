import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../ui/Notification';
import LoadingSpinner from '../LoadingSpinner';

// Componentes auxiliares - ícones seguindo o padrão
const Spinner = () => (
  <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
);

const EditIcon = () => <span>✏️</span>;
const SaveIcon = () => <span>💾</span>;
const CancelIcon = () => <span>❌</span>;
const CheckIcon = () => <span className="text-green-500">✓</span>;
const HomeIcon = () => <span>🏠</span>;
const ShippingIcon = () => <span>📦</span>;
const BillingIcon = () => <span>💳</span>;
const AddIcon = () => <span>➕</span>;
const RefreshIcon = () => <span>🔄</span>;

// Lista de estados brasileiros
const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
];

const AddressTab = ({ onDataUpdate }) => {
  console.log("[AddressTab] Inicializando componente");
  
  const [activeAddress, setActiveAddress] = useState('shipping');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const { notification } = useNotification();
  const { user, reloadUser } = useAuth();

  // Estados para os formulários de endereço
  const [billingAddress, setBillingAddress] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'BR',
    email: '',
    phone: ''
  });

  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'BR'
  });

  // Preencher formulários quando os dados são carregados
  useEffect(() => {
    if (user) {
      console.log("[AddressTab] Preenchendo dados do usuário:", user);
      
      // Preencher endereço de cobrança
      if (user.billing) {
        setBillingAddress({
          firstName: user.billing.firstName || user.firstName || '',
          lastName: user.billing.lastName || user.lastName || '',
          company: user.billing.company || '',
          address1: user.billing.address1 || '',
          address2: user.billing.address2 || '',
          city: user.billing.city || '',
          state: user.billing.state || '',
          postcode: user.billing.postcode || '',
          country: user.billing.country || 'BR',
          email: user.billing.email || user.email || '',
          phone: user.billing.phone || ''
        });
      }

      // Preencher endereço de entrega
      if (user.shipping) {
        setShippingAddress({
          firstName: user.shipping.firstName || user.firstName || '',
          lastName: user.shipping.lastName || user.lastName || '',
          company: user.shipping.company || '',
          address1: user.shipping.address1 || '',
          address2: user.shipping.address2 || '',
          city: user.shipping.city || '',
          state: user.shipping.state || '',
          postcode: user.shipping.postcode || '',
          country: user.shipping.country || 'BR'
        });
      }
    }
  }, [user]);

  // Buscar endereço pelo CEP
  const handleCepLookup = async (cep, addressType) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      notification.warning('CEP deve ter 8 dígitos');
      return;
    }

    setIsLoadingCep(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        notification.error('CEP não encontrado');
        return;
      }

      const updateData = {
        address1: data.logradouro || '',
        city: data.localidade || '',
        state: data.uf || '',
        postcode: cleanCep
      };

      if (addressType === 'billing') {
        setBillingAddress(prev => ({ ...prev, ...updateData }));
      } else {
        setShippingAddress(prev => ({ ...prev, ...updateData }));
      }

      notification.success('Endereço preenchido automaticamente!');
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      notification.error('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Lidar com mudanças no formulário de cobrança
  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingAddress(prev => ({ ...prev, [name]: value }));

    // Auto-busca CEP quando completo
    if (name === 'postcode' && value.replace(/\D/g, '').length === 8) {
      handleCepLookup(value, 'billing');
    }
  };

  // Lidar com mudanças no formulário de entrega
  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));

    // Auto-busca CEP quando completo
    if (name === 'postcode' && value.replace(/\D/g, '').length === 8) {
      handleCepLookup(value, 'shipping');
    }
  };

  // Salvar endereço usando REST API
  const handleSaveAddress = async () => {
    if (!user?.databaseId) {
      notification.error('Usuário não encontrado');
      return;
    }

    setIsSaving(true);

    try {
      const updateData = {
        billing: billingAddress,
        shipping: shippingAddress
      };

      const response = await fetch('/api/customer/update-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: user.databaseId,
          addresses: updateData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar endereços');
      }

      notification.success('Endereços salvos com sucesso!');
      setIsEditMode(false);

      // Recarregar dados do usuário
      if (reloadUser) {
        await reloadUser();
      }

      // Notificar componente pai sobre a atualização
      if (onDataUpdate) {
        onDataUpdate();
      }

    } catch (error) {
      console.error('Erro ao salvar endereços:', error);
      notification.error(error.message || 'Erro ao salvar endereços');
    } finally {
      setIsSaving(false);
    }
  };

  // Usar mesmo endereço de cobrança para entrega
  const handleUseBillingForShipping = () => {
    const { email, phone, ...billingWithoutContactInfo } = billingAddress;
    setShippingAddress(billingWithoutContactInfo);
    notification.info('Endereço de cobrança copiado para entrega');
  };

  // Obter nome do país
  const getCountryName = (code) => {
    return code === 'BR' ? 'Brasil' : code;
  };

  // Renderização do endereço atual (sem edição)
  const renderAddressDetails = (addressType, addressData) => (
    <div className="address-display">
      {!addressData || (
        !addressData.firstName && 
        !addressData.lastName && 
        !addressData.address1 && 
        !addressData.city
      ) ? (
        <div className="empty-address">
          <div className="empty-icon">
            {addressType === 'billing' ? <BillingIcon /> : <ShippingIcon />}
          </div>
          <p>Nenhum endereço cadastrado</p>
          <p className="empty-text">
            {addressType === 'billing' 
              ? 'Adicione seu endereço de cobrança' 
              : 'Adicione seu endereço de entrega'
            }
          </p>
        </div>
      ) : (
        <div className="address-content">
          <div className="address-header">
            <div className="address-icon">
              {addressType === 'billing' ? <BillingIcon /> : <ShippingIcon />}
            </div>
            <div className="address-name">
              <strong>{addressData.firstName} {addressData.lastName}</strong>
              {addressData.company && <div className="company">{addressData.company}</div>}
            </div>
          </div>
          
          <div className="address-details">
            <p>{addressData.address1}</p>
            {addressData.address2 && <p>{addressData.address2}</p>}
            <p>{addressData.city}, {addressData.state} - {addressData.postcode}</p>
            <p>{getCountryName(addressData.country)}</p>
            
            {addressType === 'billing' && (
              <div className="contact-info">
                <p><strong>Email:</strong> {addressData.email}</p>
                {addressData.phone && <p><strong>Telefone:</strong> {addressData.phone}</p>}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="address-actions">
        <button 
          onClick={() => {
            setActiveAddress(addressType);
            setIsEditMode(true);
          }}
          className="action-button"
        >
          <EditIcon />
          <span>Editar</span>
        </button>
      </div>
    </div>
  );

  // Renderização do formulário de edição
  const renderAddressForm = (addressType, addressData, handleChange) => (
    <div className="address-form">
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Nome *</label>
          <input
            type="text"
            name="firstName"
            value={addressData.firstName}
            onChange={handleChange}
            className="form-input"
            placeholder="Seu nome"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Sobrenome *</label>
          <input
            type="text"
            name="lastName"
            value={addressData.lastName}
            onChange={handleChange}
            className="form-input"
            placeholder="Seu sobrenome"
            required
          />
        </div>

        <div className="form-group full-width">
          <label className="form-label">Empresa (opcional)</label>
          <input
            type="text"
            name="company"
            value={addressData.company}
            onChange={handleChange}
            className="form-input"
            placeholder="Nome da empresa"
          />
        </div>

        <div className="form-group">
          <label className="form-label">CEP *</label>
          <div className="cep-input-group">
            <input
              type="text"
              name="postcode"
              value={addressData.postcode}
              onChange={handleChange}
              className="form-input"
              placeholder="00000-000"
              maxLength="9"
              required
            />
            {isLoadingCep && <Spinner />}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Estado *</label>
          <select
            name="state"
            value={addressData.state}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Selecione o estado</option>
            {BRAZILIAN_STATES.map(state => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group full-width">
          <label className="form-label">Endereço *</label>
          <input
            type="text"
            name="address1"
            value={addressData.address1}
            onChange={handleChange}
            className="form-input"
            placeholder="Rua, avenida, etc."
            required
          />
        </div>

        <div className="form-group full-width">
          <label className="form-label">Complemento</label>
          <input
            type="text"
            name="address2"
            value={addressData.address2}
            onChange={handleChange}
            className="form-input"
            placeholder="Apartamento, bloco, lote, etc."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cidade *</label>
          <input
            type="text"
            name="city"
            value={addressData.city}
            onChange={handleChange}
            className="form-input"
            placeholder="Sua cidade"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">País</label>
          <select
            name="country"
            value={addressData.country}
            onChange={handleChange}
            className="form-input"
            disabled
          >
            <option value="BR">Brasil</option>
          </select>
        </div>

        {addressType === 'billing' && (
          <>
            <div className="form-group full-width">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                value={addressData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                type="tel"
                name="phone"
                value={addressData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="(00) 00000-0000"
              />
            </div>
          </>
        )}
      </div>

      {addressType === 'shipping' && (
        <div className="form-actions-helper">
          <button
            type="button"
            onClick={handleUseBillingForShipping}
            className="action-button secondary"
          >
            <BillingIcon />
            <span>Usar endereço de cobrança</span>
          </button>
        </div>
      )}

      <div className="form-actions">
        <button
          onClick={handleSaveAddress}
          className="action-button"
          disabled={isSaving}
        >
          {isSaving ? <Spinner /> : <SaveIcon />}
          <span>{isSaving ? 'Salvando...' : 'Salvar Endereços'}</span>
        </button>

        <button
          onClick={() => setIsEditMode(false)}
          className="action-button secondary"
          disabled={isSaving}
        >
          <CancelIcon />
          <span>Cancelar</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* CSS específico para AddressTab seguindo o padrão moderno */}
      <style jsx>{`
        /* Container principal dos endereços */
        .addresses-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Header com navegação de abas */
        .addresses-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }

        .addresses-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .addresses-nav {
          display: flex;
          gap: 8px;
          background: #f8fafc;
          padding: 4px;
          border-radius: 12px;
        }

        .nav-tab {
          background: transparent;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-tab.active {
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(255, 105, 0, 0.3);
        }

        .nav-tab:hover:not(.active) {
          background: #f1f5f9;
          color: #475569;
        }

        /* Cards de endereço */
        .address-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        }

        .address-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          border-color: #ff6900;
        }

        .address-card-header {
          padding: 20px 24px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .address-card-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .address-card-body {
          padding: 20px 24px 24px;
        }

        /* Display de endereço */
        .address-display {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .empty-address {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-address p {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 500;
        }

        .empty-text {
          font-size: 14px !important;
          opacity: 0.8;
        }

        .address-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .address-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .address-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: white;
          flex-shrink: 0;
        }

        .address-name {
          flex: 1;
        }

        .address-name strong {
          font-size: 16px;
          color: #1e293b;
          display: block;
          margin-bottom: 4px;
        }

        .company {
          font-size: 14px;
          color: #64748b;
          font-style: italic;
        }

        .address-details {
          color: #475569;
          line-height: 1.5;
        }

        .address-details p {
          margin: 0 0 4px 0;
        }

        .contact-info {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }

        .contact-info p {
          margin: 0 0 6px 0;
          font-size: 14px;
        }

        .address-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-start;
        }

        /* Formulário de endereço */
        .address-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-input {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #ff6900;
          box-shadow: 0 0 0 3px rgba(255, 105, 0, 0.1);
        }

        .form-input:disabled {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .cep-input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .cep-input-group .form-input {
          flex: 1;
          padding-right: 40px;
        }

        .cep-input-group .spinner {
          position: absolute;
          right: 12px;
        }

        .form-actions-helper {
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
        }

        /* Modo de edição */
        .edit-mode-header {
          background: linear-gradient(135deg, rgba(255, 105, 0, 0.1) 0%, rgba(0, 168, 225, 0.1) 100%);
          padding: 16px 24px;
          margin: -20px -24px 20px;
          border-radius: 16px 16px 0 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .edit-mode-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Responsivo */
        @media (max-width: 768px) {
          .addresses-header {
            flex-direction: column;
            align-items: stretch;
          }

          .addresses-nav {
            justify-content: center;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .address-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 16px;
          }
        }
      `}</style>

      <div className="addresses-container">
        {/* Header com navegação */}
        <div className="addresses-header">
          <h1 className="addresses-title">
            <HomeIcon />
            Meus Endereços
          </h1>
          
          <div className="addresses-nav">
            <button
              onClick={() => setActiveAddress('billing')}
              className={`nav-tab ${activeAddress === 'billing' ? 'active' : ''}`}
            >
              <BillingIcon />
              <span>Cobrança</span>
            </button>
            <button
              onClick={() => setActiveAddress('shipping')}
              className={`nav-tab ${activeAddress === 'shipping' ? 'active' : ''}`}
            >
              <ShippingIcon />
              <span>Entrega</span>
            </button>
          </div>
        </div>

        {/* Card do endereço ativo */}
        <div className="address-card">
          <div className="address-card-header">
            <h2 className="address-card-title">
              {activeAddress === 'billing' ? <BillingIcon /> : <ShippingIcon />}
              <span>
                {activeAddress === 'billing' 
                  ? 'Endereço de Cobrança' 
                  : 'Endereço de Entrega'
                }
              </span>
            </h2>
            
            {isEditMode && (
              <span className="status-badge active">
                Editando
              </span>
            )}
          </div>

          <div className="address-card-body">
            {isEditMode ? (
              <>
                <div className="edit-mode-header">
                  <div className="edit-mode-title">
                    <EditIcon />
                    <span>
                      Editando {activeAddress === 'billing' ? 'endereço de cobrança' : 'endereço de entrega'}
                    </span>
                  </div>
                </div>
                
                {activeAddress === 'billing' 
                  ? renderAddressForm('billing', billingAddress, handleBillingChange)
                  : renderAddressForm('shipping', shippingAddress, handleShippingChange)
                }
              </>
            ) : (
              activeAddress === 'billing' 
                ? renderAddressDetails('billing', user?.billing)
                : renderAddressDetails('shipping', user?.shipping)
            )}
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="addresses-summary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="summary-card">
              <div className="summary-header">
                <BillingIcon />
                <span>Endereço de Cobrança</span>
              </div>
              <div className="summary-content">
                {user?.billing?.address1 ? (
                  <div>
                    <p className="summary-name">{user.billing.firstName} {user.billing.lastName}</p>
                    <p className="summary-address">{user.billing.city}, {user.billing.state}</p>
                    <p className="summary-status complete">✓ Completo</p>
                  </div>
                ) : (
                  <p className="summary-status incomplete">⚠️ Não cadastrado</p>
                )}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-header">
                <ShippingIcon />
                <span>Endereço de Entrega</span>
              </div>
              <div className="summary-content">
                {user?.shipping?.address1 ? (
                  <div>
                    <p className="summary-name">{user.shipping.firstName} {user.shipping.lastName}</p>
                    <p className="summary-address">{user.shipping.city}, {user.shipping.state}</p>
                    <p className="summary-status complete">✓ Completo</p>
                  </div>
                ) : (
                  <p className="summary-status incomplete">⚠️ Não cadastrado</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS adicional para os cards de resumo */}
      <style jsx>{`
        .addresses-summary {
          margin-top: 24px;
        }

        .summary-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          transition: all 0.3s ease;
        }

        .summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }

        .summary-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 12px;
        }

        .summary-content {
          font-size: 14px;
          color: #64748b;
        }

        .summary-name {
          font-weight: 500;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .summary-address {
          margin: 0 0 8px 0;
        }

        .summary-status {
          font-size: 12px;
          font-weight: 500;
          margin: 0;
        }

        .summary-status.complete {
          color: #059669;
        }

        .summary-status.incomplete {
          color: #d97706;
        }
      `}</style>
    </>
  );
};

export default AddressTab;