import React, { useState } from 'react';

/**
 * Componente de botão específico para toggle de filtros em dispositivos móveis
 * Este componente gerencia seu próprio estado para evitar problemas de rerenderização
 */
const FilterToggleButton = ({ showFiltersInitial, onToggle, styles }) => {
  const [isDisabled, setIsDisabled] = useState(false);
    // Função para lidar com o clique com debounce
  const handleClick = () => {
    if (isDisabled) return;
    
    setIsDisabled(true);
    
    // Usa diretamente o valor da prop para alternar
    onToggle(!showFiltersInitial);
    
    // Impede múltiplos cliques usando um timeout
    setTimeout(() => {
      setIsDisabled(false);
    }, 500); // Tempo suficiente para prevenir cliques acidentais
  };
    return (
    <button 
      style={{
        width: '100%',
        padding: '12px 24px',
        background: 'linear-gradient(90deg, #ff6900, #00a8e1)',
        color: 'white',
        border: 'none',
        borderRadius: '50px',
        fontWeight: '600',
        margin: '10px 0',
        cursor: isDisabled ? 'default' : 'pointer',
        opacity: isDisabled ? 0.7 : 1,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={handleClick}
      disabled={isDisabled}
      aria-expanded={showFiltersInitial}
      aria-controls="filter-groups"
    >
      {isDisabled && (
        <span style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Overlay para indicar que o botão está processando a ação */}
        </span>
      )}
      {showFiltersInitial ? '✕ Fechar Filtros' : '☰ Mostrar Filtros'}
    </button>
  );
};

export default FilterToggleButton;
