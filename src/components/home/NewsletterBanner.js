import React, { useState } from 'react';
import styles from './NewsletterBanner.module.css';

const NewsletterBanner = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica de email
    if (!email || !email.includes('@')) {
      setError('Por favor, insira um email válido.');
      return;
    }
    
    try {
      // Aqui você adicionaria a integração real com sua API ou serviço de email
      // const response = await fetch('/api/newsletter', {...
      
      // Simulação de sucesso
      setSubmitted(true);
      setError('');
    } catch (err) {
      setError('Ocorreu um erro ao cadastrar seu email. Por favor, tente novamente.');
    }
  };
  
  return (
    <section className={styles.newsletterBanner}>
      <div className={styles.newsletterContainer}>
        <div className={styles.newsletterContent}>
          <h2 className={styles.newsletterTitle}>Receba Ofertas Exclusivas</h2>
          <p className={styles.newsletterDescription}>
            Cadastre-se para receber nossas promoções e ganhe <strong>10% OFF</strong> em sua primeira compra!
          </p>
          
          {!submitted ? (
            <form className={styles.newsletterForm} onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu melhor e-mail" 
                  className={styles.newsletterInput}
                  required
                />
                <button type="submit" className={styles.newsletterButton}>
                  Cadastrar
                </button>
              </div>
              {error && <p className={styles.newsletterError}>{error}</p>}
              <p className={styles.privacyInfo}>
                Ao se cadastrar, você concorda com nossa <a href="/politica-de-privacidade">Política de Privacidade</a>.
              </p>
            </form>
          ) : (
            <div className={styles.newsletterSuccess}>
              <span className={styles.successIcon}>✓</span>
              <h3>Obrigado pelo cadastro!</h3>
              <p>Enviamos um código de desconto para seu email.</p>
            </div>
          )}
        </div>
        
        <div className={styles.newsletterImage}>
          {/* Pode ser uma imagem decorativa ou um pattern */}
          <div className={styles.decorativePattern}></div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterBanner;