import React from 'react';
import styles from './BenefitsBanner.module.css';

const BenefitsBanner = () => {
  const benefits = [
    {
      id: 1,
      icon: '/Custom/Content/Themes/xiaomi/Imagens/svg/Produto_Oficial.png',
      title: 'Produtos Oficiais',
      description: 'Todas as marcas.',
    },
    {
      id: 2,
      icon: '/Custom/Content/Themes/xiaomi/Imagens/svg/Garantia_Xiaomi.png',
      title: 'Garantia da loja',
      description: 'Em produtos adquiridos no site.',
    },
    {
      id: 3,
      icon: '/Custom/Content/Themes/xiaomi/Imagens/svg/Frete_gratis.png',
      title: '*Frete Grátis',
      description: 'Nas compras acima de R$ 200,00.',
    },
    {
      id: 4,
      icon: '/Custom/Content/Themes/xiaomi/Imagens/svg/desconto_a_vista.png',
      title: '**8% de desconto à vista',
      description: 'Parcele em 12X sem juros',
      extraInfo: 'Não cumulativo com outras ofertas, exceto Frete Grátis.'
    },
  ];

  return (
    <div className={styles.benefitsBanner}>
      <div className={styles.benefitsContainer}>
        {benefits.map((benefit) => (
          <div key={benefit.id} className={styles.benefitItem}>
            <div className={styles.benefitIcon}>
              <img 
                src={benefit.icon} 
                alt={benefit.title} 
                width={48} 
                height={48} 
              />
            </div>
            <div className={styles.benefitInfo}>
              <h3 className={styles.benefitTitle}>{benefit.title}</h3>
              <p className={styles.benefitDescription}>{benefit.description}</p>
              {benefit.extraInfo && (
                <p className={styles.benefitExtraInfo}>{benefit.extraInfo}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BenefitsBanner;
