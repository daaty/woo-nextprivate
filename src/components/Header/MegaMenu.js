import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from '../Layout.module.css';

const MegaMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const megaMenuRef = useRef(null);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  // Fechar o menu ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const categoryData = [
    {
      title: 'Eletrônicos',
      items: [
        { name: 'Smartphones', slug: 'smartphones' },
        { name: 'Laptops', slug: 'laptops' },
        { name: 'Tablets', slug: 'tablets' },
        { name: 'Acessórios', slug: 'acessorios-eletronicos' }
      ]
    },
    {
      title: 'Roupas',
      items: [
        { name: 'Camisetas', slug: 'camisetas' },
        { name: 'Calças', slug: 'calcas' },
        { name: 'Casacos', slug: 'casacos' },
        { name: 'Calçados', slug: 'calcados' }
      ]
    },
    {
      title: 'Casa e Decoração',
      items: [
        { name: 'Móveis', slug: 'moveis' },
        { name: 'Iluminação', slug: 'iluminacao' },
        { name: 'Decoração', slug: 'decoracao' },
        { name: 'Utensílios', slug: 'utensilios' }
      ]
    },
    {
      title: 'Esportes',
      items: [
        { name: 'Equipamentos', slug: 'equipamentos' },
        { name: 'Roupas Esportivas', slug: 'roupas-esportivas' },
        { name: 'Tênis', slug: 'tenis-esportivos' },
        { name: 'Suplementos', slug: 'suplementos' }
      ]
    }
  ];

  return (
    <li 
      className={`${styles.menuItem} ${styles.megaMenuContainer} ${isOpen ? styles.megaMenuActive : ''}`} 
      ref={megaMenuRef}
    >
      <button 
        className={styles.megaMenuTrigger} 
        onClick={toggleMenu}
        aria-expanded={isOpen}
      >
        Todos os Produtos
      </button>
      
      <div className={styles.megaMenu}>
        {categoryData.map((category, index) => (
          <div className={styles.megaMenuSection} key={index}>
            <h3 className={styles.megaMenuTitle}>{category.title}</h3>
            <ul className={styles.megaMenuList}>
              {category.items.map((item, idx) => (
                <li className={styles.megaMenuItem} key={idx}>
                  <Link href={`/category/${item.slug}`}>
                    <a className={styles.megaMenuLink}>{item.name}</a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        
        <div className={styles.megaMenuSection}>
          <h3 className={styles.megaMenuTitle}>Destaques</h3>
          <ul className={styles.megaMenuList}>
            <li className={styles.megaMenuItem}>
              <Link href="/promocoes">
                <a className={styles.megaMenuLink}>Promoções</a>
              </Link>
            </li>
            <li className={styles.megaMenuItem}>
              <Link href="/lancamentos">
                <a className={styles.megaMenuLink}>Lançamentos</a>
              </Link>
            </li>
            <li className={styles.megaMenuItem}>
              <Link href="/mais-vendidos">
                <a className={styles.megaMenuLink}>Mais Vendidos</a>
              </Link>
            </li>
            <li className={styles.megaMenuItem}>
              <Link href="/products">
                <a className={styles.megaMenuLink}>Ver Todos os Produtos</a>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </li>
  );
};

export default MegaMenu;
