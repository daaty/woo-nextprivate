import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './Banner.module.css';

const Banner = () => {
  // Estado para o slide atual
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef(null);
  
  // Dados dos banners com as imagens .webp
  const banners = [
    {
      id: 1,
      image: '/banners/banner1.webp',
      alt: 'Promoção de Smartphones',
      title: 'Promoção de Smartphones',
      link: '/categoria/smartphones',
    },
    {
      id: 2,
      image: '/banners/banner2.webp',
      alt: 'Lançamento Xiaomi 14T',
      title: 'Lançamento Xiaomi 14T',
      link: '/produto/xiaomi-14t',
    },
    {
      id: 3,
      image: '/banners/banner3.webp',
      alt: 'Acessórios com 20% OFF',
      title: 'Acessórios com 20% OFF',
      link: '/categoria/acessorios',
    },
  ];

  // Iniciar o intervalo de slides quando o componente é montado
  useEffect(() => {
    startSlideInterval();
    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, []);

  // Função para iniciar o intervalo de slides
  const startSlideInterval = () => {
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
    }
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % banners.length);
    }, 7000); // Mudar slide a cada 7 segundos
  };

  // Navegar para o próximo slide
  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % banners.length);
    startSlideInterval(); // Resetar o intervalo para evitar mudança imediata
  };

  // Navegar para o slide anterior
  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + banners.length) % banners.length);
    startSlideInterval(); // Resetar o intervalo
  };

  // Ir para um slide específico
  const goToSlide = (index) => {
    setCurrentSlide(index);
    startSlideInterval(); // Resetar o intervalo
  };

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.bannerWrapper}>
        {banners.map((banner, index) => (
          <div 
            key={banner.id}
            className={`${styles.bannerSlide} ${index === currentSlide ? styles.active : ''}`}
            style={{ 
              transform: `translateX(${(index - currentSlide) * 100}%)`,
              zIndex: index === currentSlide ? 1 : 0
            }}
          >
            <Link href={banner.link}>
              <a className={styles.bannerLink}>
                <img 
                  src={banner.image} 
                  alt={banner.alt} 
                  title={banner.title} 
                  className={styles.bannerImage}
                />
              </a>
            </Link>
          </div>
        ))}
      </div>

      {/* Controles de navegação */}
      <button 
        className={`${styles.bannerControl} ${styles.prevControl}`} 
        onClick={prevSlide}
        aria-label="Slide anterior"
      >
        <div className={styles.arrows}>
          <span className={styles.arrow}></span>
        </div>
      </button>
      
      <button 
        className={`${styles.bannerControl} ${styles.nextControl}`} 
        onClick={nextSlide}
        aria-label="Próximo slide"
      >
        <div className={styles.arrows}>
          <span className={styles.arrow}></span>
        </div>
      </button>

      {/* Indicadores de slides */}
      <ul className={styles.bannerDots}>
        {banners.map((_, index) => (
          <li 
            key={index} 
            className={`${index === currentSlide ? styles.active : ''}`}
          >
            <button
              onClick={() => goToSlide(index)}
              aria-label={`Ir para slide ${index + 1}`}
              aria-selected={index === currentSlide}
            >
              {index + 1}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Banner;
