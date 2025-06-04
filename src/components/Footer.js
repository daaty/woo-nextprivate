import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div className={styles.footerLinks}>
            <div className={styles.footerSection}>
              <h3>Navegação</h3>
              <ul>                <li><Link href="/"><a>Home</a></Link></li>
                <li><Link href="/vertodos"><a>Produtos</a></Link></li>
                <li><Link href="/produto/promocoes"><a>Ofertas</a></Link></li>
              </ul>
            </div>
            
            <div className={styles.footerSection}>
              <h3>Suporte</h3>
              <ul>
                <li><Link href="/como-comprar"><a>Como Comprar</a></Link></li>
                <li><Link href="/formas-de-pagamento"><a>Formas de Pagamento</a></Link></li>
                <li><Link href="/frete"><a>Entrega e Frete</a></Link></li>
                <li><Link href="/trocas-e-devolucoes"><a>Trocas e Devoluções</a></Link></li>
                <li><Link href="/faq"><a>Perguntas Frequentes</a></Link></li>
              </ul>
            </div>
            
            <div className={styles.footerSection}>
              <h3>Institucional</h3>
              <ul>
                <li><Link href="/sobre-nos"><a>Sobre Nós</a></Link></li>
                <li><Link href="/termos-e-condicoes"><a>Termos e Condições</a></Link></li>
                <li><Link href="/politica-de-privacidade"><a>Política de Privacidade</a></Link></li>
                <li><Link href="/blog"><a>Blog</a></Link></li>
              </ul>
            </div>
            
            <div className={styles.footerSection}>
              <h3>Atendimento</h3>
              <ul>
                <li><a href="tel:+551140028922">(11) 4002-8922</a></li>
                <li><a href="mailto:contato@loja.com.br">contato@loja.com.br</a></li>
                <li className={styles.businessHours}>
                  <p>Seg à Sex: 9h às 18h</p>
                  <p>Sábado: 9h às 13h</p>
                </li>
              </ul>
              
              <h3>Formas de Pagamento</h3>
              <div className={styles.paymentMethods}>
                <img src="/payment/visa.svg" alt="Visa" />
                <img src="/payment/mastercard.svg" alt="Mastercard" />
                <img src="/payment/amex.svg" alt="American Express" />
                <img src="/payment/pix.svg" alt="PIX" />
              </div>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <div className={styles.socialLinks}>
              <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
                </svg>
              </a>
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25zM12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                </svg>
              </a>
              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                </svg>
              </a>
              <a href="https://youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                </svg>
              </a>
              <a href="https://api.whatsapp.com/send?phone=5511999999999" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
                </svg>
              </a>
            </div>
            <p className={styles.copyright}>
              &copy; {currentYear} Loja Virtual | Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
