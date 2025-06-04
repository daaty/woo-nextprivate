import React, { useState } from 'react';
import Image from 'next/image';

const StarRating = ({ value = 0, readOnly = true, onChange = () => {}, size = 'normal' }) => {
  const [hoverValue, setHoverValue] = useState(0);
    // Definir o tamanho das estrelas
  const starSize = size === 'large' ? 48 : size === 'small' ? 32 : 40;
  
  // Gerar um array com 5 estrelas
  const stars = Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    const filled = readOnly 
      ? (value >= starValue) 
      : (hoverValue >= starValue || (!hoverValue && value >= starValue));
    
    return (
      <span 
        key={index}
        className={`star ${filled ? 'filled' : ''}`}
        onClick={() => !readOnly && onChange(starValue)}
        onMouseEnter={() => !readOnly && setHoverValue(starValue)}
        onMouseLeave={() => !readOnly && setHoverValue(0)}      >
        <Image
          src="/payment/star.png"
          alt="Star"
          width={starSize}
          height={starSize}
          className={`star-image ${filled ? 'filled' : 'empty'}`}
        />
      </span>
    );
  });

  return (
    <div className="star-rating">
      {stars}      <style jsx>{`
        .star-rating {
          display: inline-flex;
          gap: 2px;
        }
        
        .star {
          cursor: ${readOnly ? 'default' : 'pointer'};
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .star:hover {
          transform: scale(1.1);
        }
        
        .star-image {
          transition: all 0.2s ease;
        }
        
        .star .star-image.filled {
          filter: brightness(1) saturate(1);
          opacity: 1;
        }
        
        .star .star-image.empty {
          filter: brightness(0.3) saturate(0);
          opacity: 0.4;
        }
        
        /* Somente aplicar efeito hover se não for somente leitura */
        ${!readOnly ? `
        .star:hover .star-image {
          filter: brightness(1.2) saturate(1.2);
          transform: scale(1.05);
        }
        ` : ''}
      `}</style>
    </div>
  );
};

export default StarRating;