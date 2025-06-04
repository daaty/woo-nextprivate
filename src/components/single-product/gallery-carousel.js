import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

console.log('🚀 LOADING GalleryCarousel.js - ARQUIVO CARREGADO! v2.0');

const GalleryCarousel = ({ gallery = [] }) => {
  // Debug logs  
  console.log('🎨 GalleryCarousel: Componente inicializado v2.0', { gallery, timestamp: new Date().toLocaleTimeString() });
  
  const [currentImage, setCurrentImage] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const mainImageRef = useRef(null);
  const processedGallery = useRef([]);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  // Normalizar dados da galeria para um formato consistente
  useEffect(() => {
    console.log('📸 GalleryCarousel: Processando galeria', { gallery });
    
    // Processa a galeria para normalizar o formato
    const normalizedGallery = gallery.map(item => {
      // Se já estiver no formato esperado pela nossa UI
      if (item.src) {
        return {
          sourceUrl: item.src,
          altText: item.alt || 'Product image'
        };
      }
      
      // Se for do formato GraphQL do WooCommerce
      if (item.sourceUrl || item.mediaItemUrl) {
        return {
          sourceUrl: item.sourceUrl || item.mediaItemUrl,
          altText: item.altText || item.title || 'Product image'
        };
      }
      
      // Formato desconhecido, tenta obter a URL da melhor forma possível
      return {
        sourceUrl: item.url || item.source || item.image || '',
        altText: item.alt || item.text || 'Product image'
      };
    }).filter(item => item.sourceUrl); // Filtra apenas imagens com URL válida
    
    console.log('✅ GalleryCarousel: Galeria processada', { normalizedGallery });
    
    processedGallery.current = normalizedGallery;
    setImagesLoaded(true);
  }, [gallery]);
    // Avançar para a próxima imagem
  const nextImage = useCallback(() => {
    if (processedGallery.current.length <= 1 || isTransitioning) return;
    setIsTransitioning(true);
    setImageLoading(true);
    setCurrentImage((prev) => {
      const next = (prev + 1) % processedGallery.current.length;
      setTimeout(() => setIsTransitioning(false), 300);
      return next;
    });
  }, [isTransitioning]);
  
  // Voltar para a imagem anterior
  const prevImage = useCallback(() => {
    if (processedGallery.current.length <= 1 || isTransitioning) return;
    setIsTransitioning(true);
    setImageLoading(true);
    setCurrentImage((prev) => {
      const next = prev === 0 ? processedGallery.current.length - 1 : prev - 1;
      setTimeout(() => setIsTransitioning(false), 300);
      return next;
    });
  }, [isTransitioning]);
  
  // Selecionar uma imagem específica
  const selectImage = useCallback((index) => {
    if (index === currentImage || isTransitioning) return;
    setIsTransitioning(true);
    setImageLoading(true);
    setCurrentImage(index);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentImage, isTransitioning]);
    // Função para lidar com o movimento do mouse na imagem (zoom)
  const handleMouseMove = useCallback((e) => {
    if (!showZoom || !mainImageRef.current) return;
    
    const { left, top, width, height } = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setMousePosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, [showZoom]);

  // Touch events para navegação móvel
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current || !touchStartY.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - touchEndX;
    const deltaY = touchStartY.current - touchEndY;
    
    // Detectar swipe horizontal (mínimo 50px de movimento)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        nextImage(); // Swipe para esquerda = próxima imagem
      } else {
        prevImage(); // Swipe para direita = imagem anterior
      }
    }
    
    touchStartX.current = 0;
    touchStartY.current = 0;
  };

  // Controle por teclado
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showModal) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case 'Escape':
          closeModal();
          break;
        case '+':
        case '=':
          setZoomLevel(prev => Math.min(5, prev + 0.5));
          break;
        case '-':
          setZoomLevel(prev => Math.max(1, prev - 0.5));
          break;
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [showModal, nextImage, prevImage]);

  // Preload das imagens adjacentes
  useEffect(() => {
    if (processedGallery.current.length > 1) {
      const preloadImage = (src) => {
        const img = new Image();
        img.src = src;
      };
      
      // Preload da próxima imagem
      const nextIndex = (currentImage + 1) % processedGallery.current.length;
      if (processedGallery.current[nextIndex]) {
        preloadImage(processedGallery.current[nextIndex].sourceUrl);
      }
      
      // Preload da imagem anterior
      const prevIndex = currentImage === 0 ? processedGallery.current.length - 1 : currentImage - 1;
      if (processedGallery.current[prevIndex]) {
        preloadImage(processedGallery.current[prevIndex].sourceUrl);
      }
    }
  }, [currentImage]);
  // Função para abrir a modal em tela cheia
  const openModal = () => {
    console.log('🔍 GalleryCarousel: Tentando abrir modal');
    setShowModal(true);
    setZoomLevel(2);
    document.body.style.overflow = 'hidden';
  };
  
  // Função para fechar a modal
  const closeModal = () => {
    setShowModal(false);
    setZoomLevel(2);
    document.body.style.overflow = 'auto';
  };

  // Callback para quando a imagem carrega
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Callback para erro de carregamento
  const handleImageError = (e) => {
    setImageLoading(false);
    e.target.onerror = null;
    e.target.style.display = 'none';
  };
  
  // Caso não tenha imagens na galeria ou ainda estejam carregando
  if (!imagesLoaded || processedGallery.current.length === 0) {
    return (
      <div className="empty-gallery">
        <div className="placeholder-image">
          <span>Imagens não disponíveis</span>
        </div>
        <style jsx>{`
          .empty-gallery {
            width: 100%;
            height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .placeholder-image {
            width: 100%;
            height: 100%;
            background-color: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            border-radius: 8px;
          }
        `}</style>
      </div>
    );
  }  return (
    <>
      <div className="product-gallery-container">
        {/* Imagem principal - PRIMEIRO NO DOM PARA MOBILE */}
        <div 
          className="main-image-container"
          onMouseEnter={() => setShowZoom(true)}
          onMouseLeave={() => setShowZoom(false)}
          onMouseMove={handleMouseMove}
          onClick={(e) => {
            console.log('🖱️ GalleryCarousel: Click detectado na imagem principal');
            openModal();          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          ref={mainImageRef}
        >
          {/* Loading spinner */}
          {imageLoading && (
            <div className="image-loader">
              <div className="spinner"></div>
              <span>Carregando...</span>
            </div>
          )}
          
          <div className={`image-wrapper ${isTransitioning ? 'transitioning' : ''}`}>
            <img
              src={processedGallery.current[currentImage]?.sourceUrl}
              alt={processedGallery.current[currentImage]?.altText || `Product image ${currentImage + 1}`}
              className="main-product-image"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            
            {/* Overlay de zoom avançado */}
            {showZoom && !imageLoading && (
              <div 
                className="zoom-overlay"
                style={{ 
                  backgroundImage: `url(${processedGallery.current[currentImage]?.sourceUrl})`,
                  backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                  backgroundSize: `${zoomLevel * 100}%`
                }}
              />
            )}
            
            {/* Gradiente de indicação de zoom */}
            {showZoom && !imageLoading && (
              <div className="zoom-indicator">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
                </svg>
                <span>Clique para ampliar</span>
              </div>
            )}
          </div>
            {/* Botões de navegação modernos */}
          {processedGallery.current.length > 1 && (
            <>
              <button 
                className="nav-button prev"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                disabled={isTransitioning}
                aria-label="Imagem anterior"
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                </svg>
              </button>
              <button 
                className="nav-button next"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                disabled={isTransitioning}
                aria-label="Próxima imagem"
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                </svg>
              </button>
            </>
          )}
          
          {/* Ícone de expandir melhorado */}
          <button 
            className="expand-button" 
            onClick={(e) => {
              e.stopPropagation();
              openModal();
            }}
            aria-label="Ver em tela cheia"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor" />
            </svg>
          </button>
          
          {/* Contador de imagem melhorado */}
          {processedGallery.current.length > 1 && (
            <div className="slide-counter">
              <span className="current">{currentImage + 1}</span>
              <span className="separator">/</span>
              <span className="total">{processedGallery.current.length}</span>
            </div>
          )}
          
          {/* Indicadores de pontos */}
          {processedGallery.current.length > 1 && processedGallery.current.length <= 10 && (
            <div className="dot-indicators">
              {processedGallery.current.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentImage ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectImage(index);
                  }}
                  aria-label={`Ver imagem ${index + 1}`}
                />              ))}
            </div>
          )}
        </div>

        {/* Miniaturas das imagens - AGORA DEPOIS DA IMAGEM PRINCIPAL */}
        <div className="thumbnails-container">
          {processedGallery.current.map((item, index) => (
            <div 
              key={`thumb-${index}`} 
              className={`thumbnail-item ${index === currentImage ? 'active' : ''}`}
              onClick={() => selectImage(index)}
            >
              <div className="thumbnail-wrapper">                <img
                  src={item.sourceUrl}
                  alt={item.altText || `Thumbnail ${index + 1}`}
                  width={80}
                  height={70}
                  className="thumbnail-image"
                  onError={handleImageError}
                  loading="lazy"
                />
                {index === currentImage && <div className="active-indicator" />}
              </div>
            </div>
          ))}
          
          {/* Indicador de posição */}
          {processedGallery.current.length > 1 && (
            <div className="thumbnail-progress">
              <div 
                className="progress-bar"
                style={{ 
                  height: `${((currentImage + 1) / processedGallery.current.length) * 100}%` 
                }}
              />
            </div>
          )}
        </div>
      </div>        {/* Modal de visualização em tela cheia avançada */}
        {showModal && (
          <div className="fullscreen-modal" onClick={closeModal}>
          {/* Header da modal */}
          <div className="modal-header">
            <div className="modal-title">
              <span>Visualização de Produto</span>
              <span className="modal-counter">
                {currentImage + 1} de {processedGallery.current.length}
              </span>
            </div>
            <div className="modal-controls">
              {/* Controles de zoom */}
              <div className="zoom-controls">
                <button 
                  className="zoom-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomLevel(prev => Math.max(1, prev - 0.5));
                  }}
                  disabled={zoomLevel <= 1}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M19 13H5v-2h14v2z" fill="currentColor"/>
                  </svg>
                </button>
                <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                <button 
                  className="zoom-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomLevel(prev => Math.min(5, prev + 0.5));
                  }}
                  disabled={zoomLevel >= 5}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
              
              <button className="close-modal" onClick={closeModal}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Navegação anterior */}
            {processedGallery.current.length > 1 && (
              <button 
                className="modal-nav prev" 
                onClick={prevImage}
                disabled={isTransitioning}
              >
                <svg width="32" height="32" viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                </svg>
              </button>
            )}
            
            {/* Container da imagem com zoom */}
            <div className="modal-image-container">
              <div 
                className="modal-image"
                style={{
                  transform: `scale(${zoomLevel})`,
                  cursor: zoomLevel > 1 ? 'grab' : 'zoom-in'
                }}
              >
                <img
                  src={processedGallery.current[currentImage]?.sourceUrl}
                  alt={processedGallery.current[currentImage]?.altText || `Product image ${currentImage + 1}`}
                  className="modal-product-image"
                  onError={handleImageError}
                  draggable={false}
                />
              </div>
            </div>
            
            {/* Navegação próxima */}
            {processedGallery.current.length > 1 && (
              <button 
                className="modal-nav next" 
                onClick={nextImage}
                disabled={isTransitioning}
              >
                <svg width="32" height="32" viewBox="0 0 24 24">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                </svg>
              </button>
            )}
          </div>
          
          {/* Footer da modal com miniaturas */}
          {processedGallery.current.length > 1 && (
            <div className="modal-footer">
              <div className="modal-thumbnails">
                {processedGallery.current.map((item, index) => (
                  <button
                    key={`modal-thumb-${index}`}
                    className={`modal-thumbnail ${index === currentImage ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectImage(index);
                    }}
                  >
                    <img
                      src={item.sourceUrl}
                      alt={item.altText || `Thumbnail ${index + 1}`}
                      className="modal-thumbnail-image"
                      onError={handleImageError}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
        <style jsx>{`        .product-gallery-container {
          position: relative;
          display: flex;
          gap: 24px;
          height: 577px;
          background: linear-gradient(135deg, rgba(255, 105, 0, 0.02), rgba(0, 168, 225, 0.02));
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          isolation: isolate;
        }        .thumbnails-container {
          width: 120px;
          max-height: 693px;
          overflow-y: auto;
          overflow-x: visible;
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          scrollbar-width: none;
          -ms-overflow-style: none;
          margin-left: -10px;
          margin-right: 20px;
          z-index: 5;
          flex-shrink: 0;
        }
        
        .thumbnails-container::-webkit-scrollbar {
          display: none;
        }
          .thumbnail-item {
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0.7;
          position: relative;
          z-index: 6;
        }
          .thumbnail-wrapper {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: 80px;
          height: 100px;
          z-index: 7;
        }
          .thumbnail-item:hover {
          opacity: 0.9;
          transform: translateX(6px);
          z-index: 8;
        }
        
        .thumbnail-item:hover .thumbnail-wrapper {
          box-shadow: 0 4px 16px rgba(255, 105, 0, 0.3);
          transform: scale(1.02);
        }
        
        .thumbnail-item.active {
          opacity: 1;
          transform: translateX(10px);
          z-index: 8;
        }
        
        .thumbnail-item.active .thumbnail-wrapper {
          box-shadow: 0 4px 20px rgba(255, 105, 0, 0.4);
          border: 2px solid #ff6900;
        }        .thumbnail-image {
          width: 100%;
          height: 100px;
          object-fit: cover;
          display: block;
        }
          .active-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 3px solid #ff6900;
          border-radius: 12px;
        }
        
        .thumbnail-progress {
          position: absolute;
          right: -8px;
          top: 0;
          bottom: 0;
          width: 4px;
          background: rgba(255, 105, 0, 0.2);
          border-radius: 2px;
        }
        
        .progress-bar {
          width: 100%;
          background: linear-gradient(45deg, #ff6900, #00a8e1);
          border-radius: 2px;
          transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }        .main-image-container {
          position: absolute;
          top: 20px;
          left: 170px;
          width: calc(100% - 170px);
          height: calc(100% - 40px);
          cursor: zoom-in;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: auto;
          user-select: none;
          z-index: 1;
        }
        
        .main-image-container:hover {
          box-shadow: 0 8px 32px rgba(255, 105, 0, 0.2);
        }
        
        .image-loader {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.9);
          z-index: 10;
          backdrop-filter: blur(2px);
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 105, 0, 0.2);
          border-left: 4px solid #ff6900;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .image-loader span {
          color: #666;
          font-size: 14px;
          font-weight: 500;
        }
        
        .image-wrapper {
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .image-wrapper.transitioning {
          opacity: 0.8;
          transform: scale(0.98);
        }
        
        .main-product-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .zoom-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-repeat: no-repeat;
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          z-index: 2;
          border-radius: 16px;
        }
        
        .main-image-container:hover .zoom-overlay {
          opacity: 1;
        }
        
        .zoom-indicator {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 16px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 500;
          z-index: 5;
          opacity: 0;
          animation: fadeInUp 0.3s ease-out 0.5s forwards;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .zoom-indicator svg {
          color: #ff6900;
        }
        
        .nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 3;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          color: #333;
        }
        
        .nav-button:hover {
          background: linear-gradient(135deg, #ff6900, #00a8e1);
          color: white;
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 20px rgba(255, 105, 0, 0.4);
        }
        
        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: translateY(-50%) scale(0.9);
        }
        
        .nav-button.prev {
          left: 15px;
        }
        
        .nav-button.next {
          right: 15px;
        }
          .expand-button {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          z-index: 4;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          color: #333;
        }
          .expand-button:hover {
          background: linear-gradient(135deg, #ff6900, #00a8e1);
          color: white;
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(255, 105, 0, 0.4);
        }
        
        .slide-counter {
          position: absolute;
          top: 15px;
          left: 15px;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6));
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          z-index: 3;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .slide-counter .current {
          color: #ff6900;
        }
        
        .slide-counter .separator {
          opacity: 0.7;
        }
        
        .dot-indicators {
          position: absolute;
          bottom: 15px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 3;
        }
        
        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .dot:hover {
          background: rgba(255, 255, 255, 0.8);
          transform: scale(1.2);
        }
        
        .dot.active {
          background: linear-gradient(45deg, #ff6900, #00a8e1);
          transform: scale(1.3);
          box-shadow: 0 2px 8px rgba(255, 105, 0, 0.5);
        }        
        /* Modal Styles */
        .fullscreen-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.9));
          z-index: 1000;
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(10px);
          animation: modalFadeIn 0.3s ease-out;
        }
        
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(10px);
          }
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          background: linear-gradient(135deg, rgba(255, 105, 0, 0.1), rgba(0, 168, 225, 0.1));
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .modal-title {
          display: flex;
          flex-direction: column;
          color: white;
        }
        
        .modal-title span:first-child {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .modal-counter {
          font-size: 14px;
          opacity: 0.8;
        }
        
        .modal-controls {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 16px;
          border-radius: 25px;
          backdrop-filter: blur(10px);
        }
        
        .zoom-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .zoom-btn:hover:not(:disabled) {
          background: rgba(255, 105, 0, 0.8);
          transform: scale(1.1);
        }
        
        .zoom-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .zoom-level {
          color: white;
          font-size: 14px;
          font-weight: 600;
          min-width: 50px;
          text-align: center;
        }
        
        .close-modal {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          cursor: pointer;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
        }
        
        .close-modal:hover {
          background: rgba(255, 0, 0, 0.8);
          transform: scale(1.1);
        }
        
        .modal-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 20px;
          overflow: hidden;
        }
        
        .modal-image-container {
          position: relative;
          max-width: 90%;
          max-height: 90%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 12px;
        }
        
        .modal-image {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .modal-product-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
        }
        
        .modal-nav {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
          border: none;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: absolute;
          z-index: 2;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .modal-nav:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff6900, #00a8e1);
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(255, 105, 0, 0.4);
        }
        
        .modal-nav:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: scale(0.9);
        }
        
        .modal-nav.prev {
          left: 20px;
        }
        
        .modal-nav.next {
          right: 20px;
        }
        
        .modal-footer {
          padding: 20px 30px;
          background: linear-gradient(135deg, rgba(255, 105, 0, 0.1), rgba(0, 168, 225, 0.1));
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .modal-thumbnails {
          display: flex;
          gap: 12px;
          justify-content: center;
          overflow-x: auto;
          padding: 10px 0;
        }
        
        .modal-thumbnail {
          flex-shrink: 0;
          width: 60px;
          height: 60px;
          border: none;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0.6;
          background: white;
        }
        
        .modal-thumbnail:hover {
          opacity: 0.8;
          transform: scale(1.1);
        }
        
        .modal-thumbnail.active {
          opacity: 1;
          transform: scale(1.15);
          box-shadow: 0 0 0 3px #ff6900;
        }
        
        .modal-thumbnail-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }          /* Responsive Styles */        @media (max-width: 768px) {
          .product-gallery-container {
            display: flex;
            flex-direction: column;
            gap: 0;
            padding: 0;
            height: 100%;
            min-height: 450px;
            position: relative;
            margin: 0;
          }
          
          .main-image-container {
            position: relative;
            top: 0;
            left: 0;
            width: 100%;
            height: calc(100% - 80px);
            flex: 1;
            min-height: 350px;
            margin: 0;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          
          .thumbnails-container {
            position: relative;
            width: 100%;
            height: 80px;
            max-height: 80px;
            flex-direction: row;
            margin: 0;
            flex-shrink: 0;
            overflow-x: auto;
            overflow-y: hidden;
            gap: 8px;
            padding: 8px 0;
            justify-content: flex-start;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          .thumbnail-item {
            flex-shrink: 0;
            position: relative;
          }
            .thumbnail-wrapper {
            width: 72px;
            height: 72px;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .thumbnail-image {
            width: 72px;
            height: 72px;
            object-fit: cover;
          }
          
          .image-wrapper {
            height: 100%;
            min-height: 350px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .main-product-image {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
          }
          
          .nav-button {
            width: 40px;
            height: 40px;
          }
          
          .nav-button.prev {
            left: 10px;
          }
          
          .nav-button.next {
            right: 10px;
          }
          
          .expand-button {
            width: 40px;
            height: 40px;
            top: 10px;
            right: 10px;
          }
          
          .slide-counter {
            top: 10px;
            left: 10px;
            padding: 6px 12px;
            font-size: 12px;
          }
          
          .zoom-indicator {
            bottom: 15px;
            font-size: 12px;
            padding: 8px 12px;
          }
          
          .dot-indicators {
            bottom: 10px;
            gap: 6px;
          }
          
          .dot {
            width: 10px;
            height: 10px;
          }
          
          /* Modal mobile styles */
          .modal-header {
            padding: 15px 20px;
          }
          
          .modal-title span:first-child {
            font-size: 18px;
          }
          
          .zoom-controls {
            gap: 8px;
            padding: 6px 12px;
          }
          
          .zoom-btn {
            width: 28px;
            height: 28px;
          }
          
          .close-modal {
            width: 40px;
            height: 40px;
          }
          
          .modal-content {
            padding: 15px;
          }
          
          .modal-nav {
            width: 50px;
            height: 50px;
          }
          
          .modal-nav.prev {
            left: 10px;
          }
          
          .modal-nav.next {
            right: 10px;
          }
          
          .modal-footer {
            padding: 15px 20px;
          }
          
          .modal-thumbnails {
            gap: 8px;
          }
          
          .modal-thumbnail {
            width: 50px;
            height: 50px;
          }
        }        @media (max-width: 480px) {
          .product-gallery-container {
            padding: 0;
            min-height: 400px;
            gap: 0;
            margin: 0;
          }
          
          .main-image-container {
            min-height: 320px;
            height: calc(100% - 70px);
            margin: 0;
            border-radius: 10px;
          }
          
          .thumbnails-container {
            height: 70px;
            max-height: 70px;
            padding: 4px 0;
            gap: 6px;
            margin: 0;
          }
          
          .thumbnail-wrapper {
            width: 64px;
            height: 64px;
            border-radius: 6px;
          }
          
          .thumbnail-image {
            width: 64px;
            height: 64px;
          }
          
          .image-wrapper {
            height: 100%;
            min-height: 320px;
          }
          
          .nav-button {
            width: 36px;
            height: 36px;
          }
          
          .expand-button {
            width: 36px;
            height: 36px;
          }
          
          .modal-header {
            padding: 12px 16px;
          }
          
          .modal-title span:first-child {
            font-size: 16px;
          }
          
          .modal-controls {
            gap: 12px;
          }
          
          .zoom-controls {
            gap: 6px;
            padding: 4px 8px;
          }
          
          .zoom-btn {
            width: 24px;
            height: 24px;
          }
          
          .zoom-level {
            font-size: 12px;
            min-width: 40px;
          }
          
          .close-modal {
            width: 36px;
            height: 36px;
          }
          
          .modal-content {
            padding: 10px;
          }
          
          .modal-nav {
            width: 44px;
            height: 44px;
          }
          
          .modal-footer {
            padding: 12px 16px;
          }
          
          .modal-thumbnail {
            width: 45px;
            height: 45px;
          }
        }        @media (max-width: 320px) {
          .product-gallery-container {
            min-height: 350px;
            margin: 0;
            padding: 0;
          }
          
          .main-image-container {
            min-height: 280px;
            height: calc(100% - 60px);
            margin: 0;
          }
          
          .thumbnails-container {
            height: 60px;
            max-height: 60px;
            gap: 4px;
            padding: 4px 0;
            margin: 0;
          }
          
          .thumbnail-wrapper {
            width: 56px;
            height: 56px;
            border-radius: 4px;
          }
          
          .thumbnail-image {
            width: 56px;
            height: 56px;
          }
          
          .image-wrapper {
            min-height: 280px;
          }
          
          .modal-thumbnail {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </>
  );
};

export default GalleryCarousel;