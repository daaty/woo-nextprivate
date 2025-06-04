import React, { useState, useEffect } from 'react';
import styles from './hero-carousel.module.css';

const HeroCarousel = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  
  // Imagens estáticas dos banners
  const banners = [
    {
      id: 1,
      imageUrl: '/banners/banner1.webp',
      alt: 'Promoção de Smartphones'
    },
    {
      id: 2,
      imageUrl: '/banners/banner2.webp',
      alt: 'Lançamentos Exclusivos'
    },
    {
      id: 3,
      imageUrl: '/banners/banner3.webp',
      alt: 'Ofertas Especiais'
    }
  ];

  // Alternar slide automaticamente a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(current => (current + 1) % banners.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [banners.length]);

  // Navegar para um slide específico
  const goToSlide = (index) => {
    setActiveSlide(index);
  };

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.carousel}>
        <div className={styles.carouselInner}>
          {banners.map((banner, index) => (
            <div 
              key={banner.id} 
              className={`${styles.carouselItem} ${index === activeSlide ? styles.active : ''}`}
              style={{ transform: `translateX(${(index - activeSlide) * 100}%)` }}
            >
              <img 
                src={banner.imageUrl} 
                alt={banner.alt} 
                className={styles.carouselImage}
              />
            </div>
          ))}
        </div>
        
        {/* Botões de navegação */}
        <button 
          className={styles.carouselControlPrev}
          onClick={() => goToSlide((activeSlide - 1 + banners.length) % banners.length)}
          aria-label="Slide anterior"
        >
          <span aria-hidden="true">&lsaquo;</span>
        </button>
        <button 
          className={styles.carouselControlNext}
          onClick={() => goToSlide((activeSlide + 1) % banners.length)}
          aria-label="Próximo slide"
        >
          <span aria-hidden="true">&rsaquo;</span>
        </button>
        
        {/* Indicadores de slide (bolinhas) no estilo do site */}
        <div className={styles.carouselIndicators}>
          {banners.map((_, index) => (
            <button
              key={`indicator-${index}`}
              className={`${styles.indicator} ${index === activeSlide ? styles.activeIndicator : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Slide ${index + 1}`}
              data-index={index}
            >
              <span className={styles.indicatorContent}></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;