import React from 'react';
import Header from './Header/Header';
import Footer from './Footer';
import styles from './Layout.module.css';
import DebugConsole from './DevTools/DebugConsole';

const Layout = (props) => {
  return (
    <div className="layout">
      <Header/>
      <div className="main-content">
        {/* Não renderize CountdownOffers aqui se já estiver sendo renderizado na página */}
        {props.children}
      </div>
      <Footer/>
    </div>
  )
};

export default Layout;
