import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Carousel.module.css';

const Carousel = ({ banners }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRefs = useRef([]);
  const carouselRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Configurar refs para vídeos
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, banners.length);
  }, [banners]);
  
  // Função para avançar para o próximo slide
  const nextSlide = () => {
    const newIndex = (currentSlide + 1) % banners.length;
    goToSlide(newIndex);
  };
  
  // Função para voltar ao slide anterior
  const prevSlide = () => {
    const newIndex = (currentSlide - 1 + banners.length) % banners.length;
    goToSlide(newIndex);
  };

  // Função para ir para um slide específico
  const goToSlide = (index) => {
    // Pausar todos os vídeos
    videoRefs.current.forEach((videoRef, i) => {
      if (videoRef && i !== index) {
        videoRef.pause();
        if (videoRef.currentTime) {
          videoRef.currentTime = 0;
        }
      }
    });
    
    // Reproduzir o vídeo do slide atual
    if (videoRefs.current[index]) {
      videoRefs.current[index].play().catch(e => console.log("Auto-play prevented:", e));
    }
    
    setCurrentSlide(index);
  };

  // Iniciar o primeiro vídeo ao carregar
  useEffect(() => {
    if (videoRefs.current[0]) {
      videoRefs.current[0].play().catch(e => console.log("Auto-play prevented:", e));
    }
    
    // Configurar intervalo para troca automática de slides
    const interval = setInterval(() => {
      nextSlide();
    }, 10000); // 10 segundos
    
    return () => clearInterval(interval);
  }, []);
  
  // Funções para suporte a gestos touch (swipe)
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const difference = touchStartX.current - touchEndX.current;
    
    if (difference > 50) {
      // Swipe para esquerda, próximo slide
      nextSlide();
    } else if (difference < -50) {
      // Swipe para direita, slide anterior
      prevSlide();
    }
    
    // Resetar valores
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div 
      className={styles.carouselContainer}
      ref={carouselRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Indicadores de slides - movidos para a parte superior */}
      <div className={`${styles.indicators} ${styles.topIndicators}`}>
        {banners.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${index === currentSlide ? styles.activeIndicator : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Ir para slide ${index + 1}`}
            aria-current={index === currentSlide}
          />
        ))}
      </div>
      
      <div className={styles.carouselWrapper}>
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
            style={{
              transform: `translateX(${(index - currentSlide) * 100}%)`,
              zIndex: index === currentSlide ? 1 : 0,
            }}
          >
            <Link href={banner.link}>
              <a className={styles.slideLink}>                <div className={styles.videoWrapper} style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, overflow: 'visible', border: 'none', borderRadius: 0 }}>                  <video
                    ref={el => videoRefs.current[index] = el}
                    src={banner.videoUrl}
                    className={styles.videoBackground}
                    autoPlay={index === currentSlide}
                    muted
                    loop
                    playsInline
                    style={{ 
                      width: '120%', /* Aumentado para cobrir completamente */
                      height: '120%', /* Aumentado para cobrir completamente */
                      objectFit: 'cover', 
                      objectPosition: 'center bottom', /* Foco na parte inferior para eliminar faixa preta */
                      display: 'block',
                      position: 'absolute',
                      top: '-10%', /* Posição ajustada */
                      left: '-10%', /* Posição ajustada */
                      margin: 0,
                      padding: 0,
                      borderRadius: 0
                    }}
                  />
                  <div className={styles.overlay}></div>
                </div>
                <div className={styles.content}>
                  <div className={styles.logoContainer} style={{
                    position: 'absolute',
                    top: '20px',
                    left: '30px',
                    margin: 0,
                    zIndex: 10
                  }}>
                    {banner.logo && (
                      <Image
                        src={banner.logo}
                        alt={`Logo ${index + 1}`}
                        width={150}
                        height={80}
                        objectFit="contain"
                      />
                    )}
                  </div>
                </div>
              </a>
            </Link>
          </div>
        ))}
      </div>
      
      {/* Controles de navegação */}
      <button 
        className={`${styles.carouselControl} ${styles.prevControl}`}
        onClick={prevSlide}
        aria-label="Slide anterior"
      >
        <span className={styles.controlIcon}>❮</span>
      </button>
      
      <button 
        className={`${styles.carouselControl} ${styles.nextControl}`}
        onClick={nextSlide}
        aria-label="Próximo slide"
      >
        <span className={styles.controlIcon}>❯</span>
      </button>
    </div>
  );
};

export default Carousel;