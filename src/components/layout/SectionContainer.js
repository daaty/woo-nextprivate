import React from 'react';

/**
 * Componente de container para seções do site
 * Fornece um layout consistente com margens e padding padronizados
 * 
 * @param {Object} props - Propriedades do componente
 * @param {ReactNode} props.children - Elementos filhos
 * @param {string} props.className - Classes adicionais para o container
 * @returns {JSX.Element} Container de seção padronizado
 */
const SectionContainer = ({ children, className = '' }) => {
  return (
    <div className={`py-8 md:py-12 ${className}`}>
      {children}
    </div>
  );
};

export default SectionContainer;