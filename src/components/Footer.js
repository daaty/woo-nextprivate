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
                <li><a href="tel:+5566996025589">(66) 99602-5589</a></li>
                <li><a href="mailto:rotadoscelulares66@gmail.com">rotadoscelulares66@gmail.com</a></li>
                <li className={styles.businessHours}>
                  <p>Seg à Sex: 07h às 19h</p>
                  <p>Sábado: 07h às 17h</p>
                  <p>Domingo: Fechado</p>
                </li>
                <li className={styles.address}>
                  <p><strong>Endereço:</strong></p>
                  <p>Av. Brasil 89 A</p>
                  <p>Nova Canaã do Norte - MT</p>
                  <p>CEP: 78515-000</p>
                  <p><a href="https://maps.app.goo.gl/aPyZJ5XyC4n2wf7e8" target="_blank" rel="noopener noreferrer">Ver no mapa</a></p>
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
              <a href="https://www.facebook.com/profile.php?id=61551387841024" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/rotadoscelulares66" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25zM12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                </svg>
              </a>
              <a href="https://www.tiktok.com/@rotadoscelulares66" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>
              <a href="https://wa.me/5566996025589" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
                </svg>
              </a>
            </div>
            <p className={styles.copyright}>
              &copy; {currentYear} Rota dos Celulares | Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
