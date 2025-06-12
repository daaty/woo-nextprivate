import React from 'react';

/**
 * Componente para exibição e seleção de endereços salvos
 * 
 * @param {Object} props Propriedades do componente
 * @param {Array} props.addresses Array de endereços salvos
 * @param {Object|null} props.selectedAddress Endereço selecionado
 * @param {Function} props.onSelectAddress Função chamada quando um endereço é selecionado
 * @returns {JSX.Element}
 */
const SavedAddresses = ({ addresses = [], selectedAddress, onSelectAddress }) => {
  // Adicionar log para depuração
  console.log("[SavedAddresses] Recebido: ", {
    addresses,
    selectedAddress
  });
  
  if (!addresses || addresses.length === 0) {
    console.log("[SavedAddresses] Nenhum endereço encontrado ou array vazio");
    return null;
  }

  const formatAddress = (address) => {
    const parts = [];
    
    if (address.address1) {
      parts.push(address.address1);
    }
    
    if (address.address2) {
      parts.push(address.address2);
    }
    
    const cityStateZip = [];
    if (address.city) cityStateZip.push(address.city);
    if (address.state) cityStateZip.push(address.state);
    if (address.postcode) cityStateZip.push(address.postcode);
    
    if (cityStateZip.length) {
      parts.push(cityStateZip.join(', '));
    }
    
    if (address.country) {
      // Converter o código do país para o nome completo
      const countryName = address.country === 'BR' ? 'Brasil' : address.country;
      parts.push(countryName);
    }
    
    return parts.join(' - ');
  };

  const isSelected = (address) => {
    if (!selectedAddress) return false;
    
    // Verificar se é o mesmo endereço comparando os campos principais
    return address.address1 === selectedAddress.address1 &&
           address.city === selectedAddress.city &&
           address.state === selectedAddress.state &&
           address.postcode === selectedAddress.postcode;
  };

  return (
    <div className="saved-addresses mb-6">
      <div className="space-y-2">
        {addresses.map((address, index) => (
          <div 
            key={index}
            className={`border p-3 rounded-md hover:border-orange-500 transition-colors cursor-pointer ${
              isSelected(address) ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
            }`}
            onClick={() => onSelectAddress(address)}          >
            <div className="flex-1">
              <div className="font-medium">
                {address.firstName} {address.lastName}
              </div>              <div className="text-gray-500 text-sm">
                {formatAddress(address)}
                {isSelected(address) && (
                  <span 
                    className="inline-flex ml-1 align-middle"
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginLeft: '4px'
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              {address.phone && (
                <div className="text-gray-500 text-sm">
                  {address.phone}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedAddresses;