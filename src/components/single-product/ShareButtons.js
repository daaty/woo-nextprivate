import React, { useState } from 'react';

const ShareButtons = ({ url, title, image }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // URLs para compartilhamento
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`;
  const pinterestShareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(image)}&description=${encodeURIComponent(title)}`;
  const emailShareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Confira este produto: ${url}`)}`;
  
  // Função para copiar o link para a área de transferência
  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 2000);
      })
      .catch(err => {
        console.error('Erro ao copiar: ', err);
      });
  };

  return (
    <div className="share-buttons">
      <span className="share-label">Compartilhar:</span>
      
      <div className="buttons-container">
        {/* Facebook */}
        <a 
          href={facebookShareUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="share-button facebook"
          aria-label="Compartilhar no Facebook"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M18.77,7.46H14.5V10.24h4.27V14H14.5v11.88H10.24V14H6V10.24h4.24V7.46c0-2.56,1.96-5.2,6.5-5.2H18.77z" fill="currentColor" />
          </svg>
        </a>
        
        {/* Twitter */}
        <a 
          href={twitterShareUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="share-button twitter"
          aria-label="Compartilhar no Twitter"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M21.79,6.34c-0.72,0.32-1.49,0.54-2.3,0.63c0.83-0.5,1.46-1.28,1.76-2.22c-0.78,0.46-1.63,0.79-2.55,0.97C17.94,4.97,16.92,4.5,15.83,4.5c-2.14,0-3.87,1.73-3.87,3.87c0,0.3,0.03,0.6,0.1,0.88C8.79,9.1,6.26,7.58,4.5,5.3c-0.33,0.57-0.52,1.23-0.52,1.94c0,1.34,0.68,2.53,1.72,3.22c-0.63-0.02-1.22-0.19-1.74-0.48v0.05c0,1.87,1.33,3.44,3.1,3.79c-0.32,0.09-0.66,0.13-1.01,0.13c-0.25,0-0.49-0.02-0.72-0.07c0.49,1.54,1.92,2.65,3.61,2.68c-1.32,1.04-2.99,1.65-4.8,1.65c-0.31,0-0.62-0.02-0.92-0.05c1.71,1.1,3.74,1.74,5.92,1.74c7.11,0,11-5.88,11-11c0-0.17,0-0.33-0.01-0.5C20.45,7.85,21.21,7.14,21.79,6.34z" fill="currentColor" />
          </svg>
        </a>
        
        {/* WhatsApp */}
        <a 
          href={whatsappShareUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="share-button whatsapp"
          aria-label="Compartilhar no WhatsApp"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M16.75,13.96C17.32,14.24,17.43,15.1,16.94,15.59L15.41,17.12C14.92,17.61,14.06,17.72,13.55,17.35C11.78,16.16,10.14,14.57,8.94,12.83C8.57,12.32,8.68,11.46,9.17,10.97L10.69,9.45C11.18,8.96,12.05,9.07,12.33,9.64L13.23,11.23C13.51,11.8,13.3,12.5,12.76,12.91L12.42,13.18C12.11,13.42,12.07,13.89,12.35,14.2C12.63,14.5,13,14.83,13.37,15.16C13.74,15.5,14.08,15.85,14.38,16.14C14.7,16.42,15.16,16.38,15.41,16.06L15.67,15.73C16.08,15.19,16.78,14.98,17.35,15.25L18.94,16.15M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z" fill="currentColor" />
          </svg>
        </a>
        
        {/* Pinterest */}
        <a 
          href={pinterestShareUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="share-button pinterest"
          aria-label="Compartilhar no Pinterest"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M13,12C13,11.45 12.55,11 12,11C11.45,11 11,11.45 11,12C11,12.55 11.45,13 12,13C12.55,13 13,12.55 13,12M8,11C7.45,11 7,11.45 7,12C7,12.55 7.45,13 8,13C8.55,13 9,12.55 9,12C9,11.45 8.55,11 8,11M12,14C10.92,14.04 9.86,13.72 9,13C9,13.96 9.17,14.92 9.5,15.83C9.82,16.74 10.3,17.59 10.91,18.33C10.3,18.03 9.85,17.5 9.64,16.87C8.66,18.19 7.61,19.47 6.5,20.7C6.36,20.85 6.22,21 6.1,21.15C11.75,21.8 13.2,17.45 13.85,15.31C13.93,15.05 14,14.78 14.07,14.5C13.42,14.23 12.71,14.08 12,14Z" fill="currentColor" />
          </svg>
        </a>
        
        {/* E-mail */}
        <a 
          href={emailShareUrl} 
          className="share-button email"
          aria-label="Compartilhar por e-mail"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" fill="currentColor" />
          </svg>
        </a>
        
        {/* Link */}
        <button 
          onClick={copyToClipboard}
          className="share-button link"
          aria-label="Copiar link"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M10.59,13.41C11,13.8 11,14.44 10.59,14.83C10.2,15.22 9.56,15.22 9.17,14.83C7.22,12.88 7.22,9.71 9.17,7.76V7.76L12.71,4.22C14.66,2.27 17.83,2.27 19.78,4.22C21.73,6.17 21.73,9.34 19.78,11.29L18.29,12.78C18.3,11.96 18.17,11.14 17.89,10.36L18.36,9.88C19.54,8.71 19.54,6.81 18.36,5.64C17.19,4.46 15.29,4.46 14.12,5.64L10.59,9.17C9.41,10.34 9.41,12.24 10.59,13.41M13.41,9.17C13.8,8.78 14.44,8.78 14.83,9.17C16.78,11.12 16.78,14.29 14.83,16.24V16.24L11.29,19.78C9.34,21.73 6.17,21.73 4.22,19.78C2.27,17.83 2.27,14.66 4.22,12.71L5.71,11.22C5.7,12.04 5.83,12.86 6.11,13.65L5.64,14.12C4.46,15.29 4.46,17.19 5.64,18.36C6.81,19.54 8.71,19.54 9.88,18.36L13.41,14.83C14.59,13.66 14.59,11.76 13.41,10.59C13,10.2 13,9.56 13.41,9.17Z" fill="currentColor" />
          </svg>
          {showTooltip && <span className="tooltip">Link copiado!</span>}
        </button>
      </div>
      
      <style jsx>{`
        .share-buttons {
          display: flex;
          align-items: center;
          margin-top: 20px;
        }
        
        .share-label {
          margin-right: 10px;
          font-weight: 500;
        }
        
        .buttons-container {
          display: flex;
        }
        
        .share-button {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 8px;
          color: white;
          text-decoration: none;
          transition: transform 0.2s, background-color 0.2s;
          position: relative;
        }
        
        .share-button:hover {
          transform: scale(1.1);
        }
        
        .facebook {
          background-color: #3b5998;
        }
        
        .twitter {
          background-color: #1da1f2;
        }
        
        .whatsapp {
          background-color: #25d366;
        }
        
        .pinterest {
          background-color: #e60023;
        }
        
        .email {
          background-color: #555;
        }
        
        .link {
          background-color: #333;
          border: none;
          cursor: pointer;
        }
        
        .tooltip {
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
        }
        
        @media (max-width: 480px) {
          .share-buttons {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .share-label {
            margin-bottom: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default ShareButtons;