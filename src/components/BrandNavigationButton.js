import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Em vez de usar SVGs, vamos usar imagens reais das logos das marcas
// Agora apenas com as logos, sem texto, e tamanhos ajustados para Apple e Samsung
const BrandNavigationButton = ({ brand, isActive }) => {
  // Estado para controlar se é mobile ou não
  const [isMobile, setIsMobile] = useState(false);
  
  // Detecta o tamanho da tela quando o componente é montado no cliente
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Verifica inicialmente
    checkIfMobile();
    
    // Adiciona um event listener para mudanças no tamanho da janela
    window.addEventListener('resize', checkIfMobile);
    
    // Limpa o event listener quando o componente é desmontado
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  const getLogoPath = () => {
    switch(brand.toLowerCase()) {
      case 'apple':
        return '/Custom/Content/Themes/xiaomi/Imagens/apple-logo-white.png'; // Logo da Apple está na pasta da Xiaomi
      case 'xiaomi':
        return '/Custom/Content/Themes/xiaomi/Imagens/xiaomi-logo-white.png';
      case 'samsung':
        return '/Custom/Content/Themes/samsung/Imagens/samsung-logo-white.png';
      case 'motorola':
        return '/Custom/Content/Themes/motorola/Imagens/motorola-logo-white.png';
      case 'ver todos':
        // Para o "Ver Todos", podemos criar um layout com logos mini de todas as marcas
        return null;
      default:
        return null;
    }
  };
  
  const getHref = () => {
    if (brand.toLowerCase() === 'ver todos') {
      return '/vertodos'; // Atualizado para direcionar para a nova página vertodos
    }
    return `/marca/${brand.toLowerCase()}`;
  };  // Definindo os tamanhos específicos para cada marca, reduzidos para mobile
  const getImageSize = () => {
    // Fator de escala para mobile 480px
    const scaleFactor = isMobile ? 0.54 : 1;
    switch(brand.toLowerCase()) {
      case 'apple':
        return { 
          width: Math.floor(50 * scaleFactor), 
          height: Math.floor(50 * scaleFactor)
        };
      case 'samsung':
        return { 
          width: Math.floor(110 * scaleFactor), 
          height: Math.floor(70 * scaleFactor)
        };
      case 'motorola':
        return { 
          width: Math.floor(60 * scaleFactor), 
          height: Math.floor(45 * scaleFactor)
        };
      case 'xiaomi':
        return { 
          width: Math.floor(75 * scaleFactor), 
          height: Math.floor(50 * scaleFactor)
        };
      default:
        return { 
          width: Math.floor(70 * scaleFactor), 
          height: Math.floor(25 * scaleFactor)
        };
    }
  };

  const imageSize = getImageSize();
  // Estilos inline para evitar problemas de importação
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '5px 8px' : '10px 18px',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
    borderRadius: isMobile ? '19px' : '50px',
    transition: 'all 0.3s ease',
    margin: isMobile ? '0 1.5px' : '0 8px',
    minWidth: isMobile ? '48px' : 
             brand.toLowerCase() === 'ver todos' ? '80px' : 
             brand.toLowerCase() === 'samsung' ? '150px' : '120px',
    minHeight: isMobile ? '34px' : '60px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    textDecoration: 'none',
    fontSize: isMobile ? '0.8rem' : '1rem',
    // Remover blur e sombra no mobile
    ...(isMobile ? {} : {
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)'
    })
  };

  const iconWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  };

  // Configuração especial para o botão "Ver Todos"
  if (brand.toLowerCase() === 'ver todos') {
    return (
      <Link href={getHref()} passHref>
        <a 
          style={buttonStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '';
          }}
          title="Ver todos os smartphones"
          aria-label="Ver todos os smartphones"
        >
          <div style={iconWrapperStyle}>
            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '500' }}>Ver todos</span>
          </div>
        </a>
      </Link>
    );
  }
  
  return (
    <Link href={getHref()} passHref>
      <a 
        style={buttonStyle}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
        }}
        title={`Smartphones ${brand}`}
        aria-label={`Smartphones ${brand}`}
      >
        <div style={iconWrapperStyle}>
          <Image
            src={getLogoPath()}
            alt={`Logo ${brand}`}
            width={imageSize.width}
            height={imageSize.height}
            style={{ objectFit: "contain" }}
          />
        </div>
      </a>
    </Link>
  );
};

export default BrandNavigationButton;