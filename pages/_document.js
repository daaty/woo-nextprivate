import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          {/* Meta tags padrão */}
          <meta charSet="utf-8" />
          
          {/* Open Graph meta tags padrão */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Rota dos Celulares" />
          <meta property="og:locale" content="pt_BR" />
          
          {/* Twitter Card meta tags padrão */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@rotadoscelulares66" />
          
          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" />
          
          {/* Fontes */}
          <link 
            rel="stylesheet" 
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" 
            integrity="sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==" 
            crossOrigin="anonymous" 
            referrerPolicy="no-referrer" 
          />
          <link 
            href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" 
            rel="stylesheet"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
