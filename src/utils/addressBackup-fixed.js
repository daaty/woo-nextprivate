import React from 'react';

/**
 * Função auxiliar para salvar endereço usando GraphQL com backup no localStorage
 */
export const saveAddressWithBackup = async (
  customerId, 
  addressType, 
  addressData, 
  updateAddressMutation
) => {
  console.log('[AddressBackup] Iniciando salvamento com backup:', { customerId, addressType });
  
  let graphqlSuccess = false;
  
  // Primeira tentativa: GraphQL (método preferido)
  try {
    console.log('[AddressBackup] Tentando salvar via GraphQL...');
    
    const input = {
      clientMutationId: 'updateAddress',
      id: customerId
    };
    
    if (addressType === 'billing') {
      input.billing = addressData;
    } else if (addressType === 'shipping') {
      input.shipping = addressData;
    }
    
    const { data } = await updateAddressMutation({
      variables: { input }
    });
    
    if (data?.updateCustomer?.customer) {
      console.log('[AddressBackup] ✅ GraphQL salvamento bem-sucedido');
      graphqlSuccess = true;
      
      // Se o GraphQL funcionou, remover qualquer backup pendente
      if (typeof window !== 'undefined') {
        const storageKey = `address_backup_${customerId}_${addressType}`;
        localStorage.removeItem(storageKey);
      }
    }
    
  } catch (error) {
    console.error('[AddressBackup] ❌ Erro no GraphQL:', error);
  }
  
  // Se GraphQL falhou, salvar no localStorage como backup
  if (!graphqlSuccess && typeof window !== 'undefined') {
    console.log('[AddressBackup] GraphQL falhou, salvando no localStorage como backup...');
    
    try {
      const storageKey = `address_backup_${customerId}_${addressType}`;
      const backupData = {
        customerId,
        addressType,
        addressData,
        timestamp: new Date().toISOString(),
        needsSync: true
      };
      
      localStorage.setItem(storageKey, JSON.stringify(backupData));
      console.log('[AddressBackup] ✅ Dados salvos no localStorage para sincronização posterior');
      
      // Disparar evento personalizado para notificar sobre dados pendentes
      window.dispatchEvent(new CustomEvent('addressBackupSaved', {
        detail: { customerId, addressType, addressData }
      }));
      
    } catch (error) {
      console.error('[AddressBackup] ❌ Erro ao salvar no localStorage:', error);
      throw new Error('Falha em todos os métodos de salvamento');
    }
  }
  
  return {
    graphqlSuccess,
    method: graphqlSuccess ? 'GraphQL' : 'LocalStorage'
  };
};

/**
 * Função para sincronizar dados do localStorage com o servidor
 */
export const syncPendingAddresses = async (customerId, updateAddressMutation) => {
  if (typeof window === 'undefined') return;
  
  console.log('[AddressBackup] Verificando endereços pendentes para sincronização...');
  
  const pendingKeys = Object.keys(localStorage).filter(key => 
    key.startsWith(`address_backup_${customerId}`) && 
    localStorage.getItem(key)
  );
  
  for (const key of pendingKeys) {
    try {
      const backupData = JSON.parse(localStorage.getItem(key));
      
      if (!backupData.needsSync) continue;
      
      console.log(`[AddressBackup] Sincronizando endereço pendente: ${backupData.addressType}`);
      
      const result = await saveAddressWithBackup(
        customerId, 
        backupData.addressType, 
        backupData.addressData, 
        updateAddressMutation
      );
      
      if (result.graphqlSuccess) {
        // Marcar como sincronizado
        backupData.needsSync = false;
        backupData.syncedAt = new Date().toISOString();
        backupData.syncMethod = result.method;
        localStorage.setItem(key, JSON.stringify(backupData));
        
        console.log(`[AddressBackup] ✅ Endereço ${backupData.addressType} sincronizado via ${result.method}`);
      }
      
    } catch (error) {
      console.error('[AddressBackup] Erro ao sincronizar endereço pendente:', error);
    }
  }
};

/**
 * Hook para verificar e sincronizar endereços pendentes
 */
export const useAddressSync = (customerId, updateAddressMutation) => {
  React.useEffect(() => {
    if (!customerId || !updateAddressMutation || typeof window === 'undefined') return;
    
    // Sincronizar endereços pendentes quando o componente monta
    syncPendingAddresses(customerId, updateAddressMutation);
    
    // Escutar eventos de salvamento de backup
    const handleBackupSaved = (event) => {
      console.log('[AddressSync] Novo backup salvo, agendando sincronização...');
      // Tentar sincronizar após um pequeno delay
      setTimeout(() => {
        syncPendingAddresses(customerId, updateAddressMutation);
      }, 2000);
    };
    
    window.addEventListener('addressBackupSaved', handleBackupSaved);
    
    return () => {
      window.removeEventListener('addressBackupSaved', handleBackupSaved);
    };
  }, [customerId, updateAddressMutation]);
};
