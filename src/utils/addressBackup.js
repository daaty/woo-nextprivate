import React from 'react';

/**
 * Função auxiliar para salvar endereço usando GraphQL com backup no localStorage
 * e verificação de persistência
 */
export const saveAddressWithBackup = async (
  customerId, 
  addressType, 
  addressData, 
  updateAddressMutation
) => {
  console.log('[AddressBackup] Iniciando salvamento com backup:', { customerId, addressType });
  
  let graphqlSuccess = false;
  let verificationSuccess = false;
  
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
      
      // Aguardar um pouco e verificar se os dados foram realmente persistidos
      console.log('[AddressBackup] Verificando persistência dos dados...');
      setTimeout(async () => {
        try {
          // Fazer uma nova query para verificar se os dados estão lá
          const verificationResult = await updateAddressMutation({
            query: `
              query VerifyAddress {
                customer {
                  id
                  ${addressType} {
                    firstName
                    lastName
                    address1
                    city
                    state
                  }
                }
              }
            `,
            fetchPolicy: 'network-only'
          });
          
          const savedData = verificationResult.data?.customer?.[addressType];
          const isDataPersisted = savedData?.firstName === addressData.firstName && 
                                  savedData?.address1 === addressData.address1;
          
          if (isDataPersisted) {
            console.log('[AddressBackup] ✅ Dados verificados como persistidos');
            verificationSuccess = true;
            // Remover backup se existir
            if (typeof window !== 'undefined') {
              const storageKey = `address_backup_${customerId}_${addressType}`;
              localStorage.removeItem(storageKey);
            }
          } else {
            console.log('[AddressBackup] ❌ Dados não persistidos, salvando backup');
            // Salvar no backup mesmo que o GraphQL tenha "funcionado"
            await saveToLocalStorage(customerId, addressType, addressData);
          }
        } catch (verifyError) {
          console.error('[AddressBackup] Erro na verificação:', verifyError);
          await saveToLocalStorage(customerId, addressType, addressData);
        }
      }, 2000); // Aguardar 2 segundos para verificar
      
      // Se o GraphQL funcionou, remover qualquer backup pendente inicial
      if (typeof window !== 'undefined') {
        const storageKey = `address_backup_${customerId}_${addressType}`;
        localStorage.removeItem(storageKey);
      }
    }
    
  } catch (error) {
    console.error('[AddressBackup] ❌ Erro no GraphQL:', error);
    graphqlSuccess = false;
  }
  
  // Se GraphQL falhou completamente, salvar no localStorage como backup
  if (!graphqlSuccess) {
    await saveToLocalStorage(customerId, addressType, addressData);
  }
  
  return {
    graphqlSuccess,
    verificationSuccess,
    method: graphqlSuccess ? 'GraphQL' : 'LocalStorage'
  };
};

/**
 * Função auxiliar para salvar no localStorage
 */
const saveToLocalStorage = async (customerId, addressType, addressData) => {
  if (typeof window === 'undefined') return;
  
  console.log('[AddressBackup] Salvando no localStorage como backup...');
  
  try {
    const storageKey = `address_backup_${customerId}_${addressType}`;
    const backupData = {
      customerId,
      addressType,
      addressData,
      timestamp: new Date().toISOString(),
      needsSync: true,
      attempts: 0
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
