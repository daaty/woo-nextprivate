import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import MegaMenu from './MegaMenu';
import styles from '../Layout.module.css';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Links atualizados para apontar para as páginas em /marca/
  const menuItems = [
    {
      label: 'Smartphones',
      submenu: [
        { label: 'Apple', url: '/marca/apple' }, // Atualizado
        { label: 'Xiaomi', url: '/marca/xiaomi' }, // Atualizado
        { label: 'Samsung', url: '/marca/samsung' }, // Atualizado
        { label: 'Motorola', url: '/marca/motorola' }, // Atualizado
        // TODO: Verificar para onde "Ver todos" deve apontar, já que /categoria/smartphones não existe mais.
        // Mantendo temporariamente ou remover/alterar conforme necessário.
        { label: 'Ver todos', url: '/smartphones' } // Exemplo: Alterado para /smartphones
      ]
    },
    // ... outros itens de menu existentes ...
  ];

  return (
    <>
      <button 
        className={styles.mobileMenuToggle}
        onClick={toggleMenu}
        aria-expanded={isMenuOpen}
        aria-label="Toggle navigation menu"
      >
        <span className="menu-icon"></span>
      </button>
      
      <div className={`${styles.navContainer} ${isMenuOpen ? styles.navContainerOpen : ''}`}>
        <ul className={styles.menuList}>
          <li className={styles.menuItem}>
            <Link href="/">
              <a 
                className={`${styles.menuLink} ${router.pathname === '/' ? styles.menuLinkActive : ''}`}
              >
                Home
              </a>
            </Link>
          </li>
          
          <MegaMenu />
            <li className={styles.menuItem}>
            <Link href="/produto/promocoes">
              <a 
                className={`${styles.menuLink} ${router.pathname === '/produto/promocoes' ? styles.menuLinkActive : ''}`}
              >
                Promoções
              </a>
            </Link>
          </li>
          
          <li className={styles.menuItem}>
            <Link href="/about">
              <a 
                className={`${styles.menuLink} ${router.pathname === '/about' ? styles.menuLinkActive : ''}`}
              >
                Sobre
              </a>
            </Link>
          </li>
          
          <li className={styles.menuItem}>
            <Link href="/contact">
              <a 
                className={`${styles.menuLink} ${router.pathname === '/contact' ? styles.menuLinkActive : ''}`}
              >
                Contato
              </a>
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Navigation;
