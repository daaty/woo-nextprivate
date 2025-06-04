import React from 'react';
import Image from 'next/image';
import styles from './WhyChooseUs.module.css';
import TrustBadges from './TrustBadges';

const WhyChooseUs = () => {
  const benefits = [
    {
      icon: '/icons/authentic.svg',
      title: 'Produtos Originais',
      description: 'Garantimos a autenticidade de todos os nossos produtos.'
    },
    {
      icon: '/icons/shipping.svg',
      title: 'Frete Grátis',
      description: 'Para compras acima de R$200 em todo o Brasil.'
    },
    {
      icon: '/icons/warranty.svg',
      title: 'Garantia Estendida',
      description: 'Todos os produtos com garantia de fábrica.'
    },
    {
      icon: '/icons/payment.svg',
      title: 'Pagamento Seguro',
      description: 'Parcelamento em até 12x sem juros no cartão.'
    }
  ];

  return (
    <section className={styles.whyChooseUs}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitleDecorated}>
          Por Que Escolher Nossa Loja?
        </h2>
        
        <div className={styles.benefitsGrid}>
          {benefits.map((benefit, index) => (
            <div key={index} className={styles.benefitItem}>
              <div className={styles.benefitIcon}>
                {/* Usando um fallback caso a imagem externa não esteja disponível */}
                {benefit.icon.includes('authentic') && (
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="22" stroke="#FF6900" strokeWidth="2"/>
                    <path d="M16 24L21 29L32 18" stroke="#FF6900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {benefit.icon.includes('shipping') && (
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 30H38V18C38 17.2044 37.6839 16.4413 37.1213 15.8787C36.5587 15.3161 35.7956 15 35 15H27V30H24" stroke="#00A8E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 30H10V10C10 9.20435 10.3161 8.44129 10.8787 7.87868C11.4413 7.31607 12.2044 7 13 7H21V30H24" stroke="#00A8E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="13" cy="34" r="4" stroke="#00A8E1" strokeWidth="2"/>
                    <circle cx="35" cy="34" r="4" stroke="#00A8E1" strokeWidth="2"/>
                  </svg>
                )}
                {benefit.icon.includes('warranty') && (
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 6L8 14V22C8 30.4 14.4 38.2 24 42C33.6 38.2 40 30.4 40 22V14L24 6Z" stroke="#FF6900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 24L22 28L30 20" stroke="#FF6900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {benefit.icon.includes('payment') && (
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="14" width="32" height="22" rx="2" stroke="#00A8E1" strokeWidth="2"/>
                    <line x1="8" y1="22" x2="40" y2="22" stroke="#00A8E1" strokeWidth="2"/>
                    <circle cx="32" cy="28" r="3" stroke="#00A8E1" strokeWidth="2"/>
                    <circle cx="26" cy="28" r="3" stroke="#00A8E1" strokeWidth="2"/>
                  </svg>
                )}
              </div>
              <h3 className={styles.benefitTitle}>{benefit.title}</h3>
              <p className={styles.benefitDescription}>{benefit.description}</p>
            </div>
          ))}
        </div>
        
        {/* Usando o novo componente de TrustBadges */}
        <TrustBadges />
      </div>
    </section>
  );
};

export default WhyChooseUs;