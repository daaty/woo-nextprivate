import React from 'react';
import Header from './Header/Header';
import Footer from './Footer';
import styles from './Layout.module.css';
import DebugConsole from './DevTools/DebugConsole';

const Layout = ({ children }) => {
  return (
    <>
      <div className={styles.container}>
        <Header />
        <main className={styles.main}>
          <div className={styles.mainContent}>
            {children}
          </div>
        </main>
        <Footer />
      </div>
      
      {/* Console de depuração apenas em ambiente de desenvolvimento */}
      <DebugConsole />
    </>
  );
};

export default Layout;
