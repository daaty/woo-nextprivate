import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import Image from 'next/image';
import { useRouter } from 'next/router';
import CartIcon from "./cart/CartIcon";
import styles from './Header.module.css';

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuVisible, setMenuVisibility] = useState(false);
    const [isMinicartOpen, setIsMinicartOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [promoMessages, setPromoMessages] = useState(['Parcele em até 12x sem juros', 'Frete Grátis acima de R$200*', '8% de desconto à vista**']);
    const [categories, setCategories] = useState([
        {
            name: 'Celulares',
            slug: 'celulares',
            subcategories: [
                { name: 'Smartphones', slug: 'smartphones' },
                { name: 'Tablets', slug: 'tablets' },
                { name: 'Carregadores e Power Banks', slug: 'carregador' },
                { name: 'Cabos', slug: 'cabos' },
                { name: 'Capas', slug: 'capinha-para-celular' },
                { name: 'Películas', slug: 'pelicula-para-celular' }
            ]
        },
        {
            name: 'Smartwatch',
            slug: 'smartwatch',
            subcategories: [
                { name: 'Pulseiras inteligentes', slug: 'pulseiras-inteligentes' },
                { name: 'Relógios inteligentes', slug: 'relogios-inteligentes' },
                { name: 'Acessórios', slug: 'acessorios-para-smartwatches' }
            ]
        },
        {
            name: 'Casa inteligente',
            slug: 'casa-inteligente',
            subcategories: [
                { name: 'Utilidades Domésticas', slug: 'utilidades-domesticas' },
                { name: 'TV Inteligente', slug: 'tv-inteligente' },
                { name: 'Iluminação', slug: 'iluminacao' },
                { name: 'Segurança', slug: 'seguranca' },
                { name: 'Roteadores e Periféricos', slug: 'roteadores-e-perifericos' },
                { name: 'Pet', slug: 'pet' }
            ]
        },
        {
            name: 'Dia a Dia',
            slug: 'dia-a-dia',
            subcategories: [
                { name: 'Mochilas', slug: 'mochilas' },
                { name: 'Viagem', slug: 'viagem' },
                { name: 'Ferramentas', slug: 'ferramentas' },
                { name: 'Utilidades', slug: 'utilidades' }
            ]
        },
        {
            name: 'Beleza e saúde',
            slug: 'beleza-e-saude',
            subcategories: [
                { name: 'Cuidados Pessoais', slug: 'cuidados-pessoais' },
                { name: 'Balança Inteligente', slug: 'balanca-inteligente' },
                { name: 'Aparador de Pelos e Barbeadores', slug: 'aparador-de-pelos-e-barbeadores' },
                { name: 'Massageadores', slug: 'massageadores' },
                { name: 'Óculos', slug: 'oculos' }
            ]
        },
        {
            name: 'Áudio',
            slug: 'audio',
            subcategories: [
                { name: 'Assistente Virtual', slug: 'assistente-virtual' },
                { name: 'Caixa de Som', slug: 'caixa-de-som' },
                { name: 'Fone de Ouvido sem Fio', slug: 'fone-de-ouvido' },
                { name: 'Fone de Ouvido com Fio', slug: 'fone-de-ouvido-com-fio' },
                { name: 'Acessórios', slug: 'acessorios' }
            ]
        }
    ]);

    const router = useRouter();

    useEffect(() => {
        try {
            const fetchPromos = async () => {
                // Na implementação real, isso seria uma chamada a uma API
                // const response = await fetch('/.json');
                // const data = await response.json();
                // setPromoMessages([data.promo1, data.promo2, data.promo3]);
            };
            fetchPromos();
        } catch (err) {
            console.error('Erro ao carregar promoções:', err);
        }
    }, []);

    const closeMinicart = () => {
        setIsMinicartOpen(false);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/pesquisa?s=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <header id="header" className={styles.header}>
            {/* Google Tag Manager */}
            <Script id="google-tag-manager">
                {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'GTM-NJFWMHH2')
                `}
            </Script>
            <noscript>
                <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NJFWMHH2" height="0" width="0" style={{display: 'none', visibility: 'hidden'}}></iframe>
            </noscript>

            {/* Barra de Benefícios (Azul) */}
            <div style={{maxHeight: '40px'}} className={styles.benefitsBar}>
                <span className="topo-mibrasil">
                    {promoMessages.map((message, index) => (
                        <span key={index} className={`grid-icon-info item-${index+1}-header-xiaomi`}>
                            <img className="img-header-mi" src="/Custom/Content/Themes/xiaomi/Imagens/icon-selo-official-mi.png" alt="Selo" />
                            <span id={`headline-promo${index+1}`}>{message}</span>
                        </span>
                    ))}
                </span>
            </div>

            {/* Barra principal do header */}
            <div className={styles.topBar}>
                <div className={styles.wrapper}>
                    {/* Área da Newsletter (oculta por padrão) */}
                    <div className={styles.newsletterHeader} style={{display: 'none'}}>
                        {/* Implementação do formulário de newsletter seria aqui */}
                    </div>

                    {/* Logo */}
                    <div id="logo">
                        <h1>
                            <Link href="/">
                                <Image 
                                    src="/Custom/Content/Themes/xiaomi/Imagens/svg/novo-logo.svg" 
                                    alt="Xiaomi Brasil" 
                                    width={120}
                                    height={30}
                                />
                            </Link>
                        </h1>
                    </div>

                    {/* Menu de Todas as Categorias */}
                    <div className={styles.allCategories}>
                        <div className={styles.title} onClick={() => setMenuVisibility(!isMenuVisible)}>
                            <svg role="img" className="menu-all-categories">
                                <use xlinkHref="/Custom/Content/Themes/xiaomi/Imagens/svg/svg-symbols.svg#menu-all-categories"></use>
                            </svg>
                            Todos os produtos
                        </div>

                        <div className={styles.categoryMenu}>
                            <nav>
                                <ul className="section level-1">
                                    {categories.map((category, index) => (
                                        <li key={index} className={`${category.slug} ${index === 0 ? 'first' : ''} ${index === categories.length - 1 ? 'last' : ''} has-children`}>
                                            <h3>
                                                <a href={`/${category.slug}`} className={category.slug} title={category.name}>
                                                    {category.name}
                                                    <span className="icon">
                                                        <svg role="img" className="arrow-right">
                                                            <use xlinkHref="/Custom/Content/Themes/xiaomi/Imagens/svg/svg-symbols.svg#arrow-right"></use>
                                                        </svg>
                                                    </span>
                                                </a>
                                            </h3>
                                            
                                            <a href={`/${category.slug}`} className="ver-tudo">Ver Tudo</a>
                                            
                                            <ul className="sub-section level-2">
                                                {category.subcategories.map((subcategory, subIndex) => (
                                                    <li key={subIndex} className={`${subIndex === 0 ? 'first' : ''} ${subIndex === category.subcategories.length - 1 ? 'last' : ''}`}>
                                                        <h4>
                                                            <a href={`/${category.slug}/${subcategory.slug}`} className={category.slug} title={subcategory.name}>
                                                                <span className="icon"></span>
                                                                {subcategory.name}
                                                            </a>
                                                        </h4>
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                                <div className="category-banner-all"></div>
                            </nav>
                        </div>
                    </div>

                    {/* Menu principal de categorias horizontal */}
                    <div className={styles.mainCategories}>
                        <div className={styles.categoryMenu}>
                            <nav>
                                <ul className="section level-1">
                                    {categories.map((category, index) => (
                                        <li key={index} className={`${category.slug} menu_topo ${index === 0 ? 'first' : ''} ${index === categories.length - 1 ? 'last' : ''} has-children`}>
                                            <h3>
                                                <a href={`/${category.slug}`} className={category.slug} title={category.name}>
                                                    {category.name}
                                                    <span className="icon">
                                                        <svg role="img" className="arrow-right">
                                                            <use xlinkHref="/Custom/Content/Themes/xiaomi/Imagens/svg/svg-symbols.svg#arrow-right"></use>
                                                        </svg>
                                                    </span>
                                                </a>
                                            </h3>
                                            
                                            <ul className="sub-section level-2">
                                                <div className="sub-section-content">
                                                    <a href={`/${category.slug}`} className="ver-tudo">Ver Tudo</a>
                                                    
                                                    {category.subcategories.map((subcategory, subIndex) => (
                                                        <li key={subIndex} className={`${subIndex === 0 ? 'first' : ''} ${subIndex === category.subcategories.length - 1 ? 'last' : ''}`}>
                                                            <h4>
                                                                <a href={`/${category.slug}/${subcategory.slug}`} className={category.slug} title={subcategory.name}>
                                                                    <span className="icon"></span>
                                                                    {subcategory.name}
                                                                </a>
                                                            </h4>
                                                        </li>
                                                    ))}
                                                </div>
                                                
                                                <div className="category-banner">
                                                    <img src={`/banners/${category.slug}-banner.jpg`} alt={`Banner ${category.name}`} />
                                                </div>
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </div>
                    </div>

                    {/* Botão de ofertas */}
                    <div className={styles.saleButton}>
                        <Link href="/listas/ofertas">Ofertas</Link>
                    </div>

                    {/* Busca, conta e carrinho */}
                    <div className={styles.easyAccess}>
                        {/* Busca */}
                        <div id="search">
                            <form onSubmit={handleSearchSubmit} id="product-search-form">
                                <div className={styles.inputWrapper}>
                                    <input 
                                        type="text" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="O que você está procurando?" 
                                    />
                                    <button type="submit">
                                        <svg role="img" className="search">
                                            <use xlinkHref="/Custom/Content/Themes/xiaomi/Imagens/svg/svg-symbols.svg#search"></use>
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Conta do usuário */}
                        <div className={`account ${styles.account}`}>
                            <Link href="/minha-conta">
                                <a title="Minha Conta" className={`account-link ${styles.accountLink}`}>
                                    <svg role="img" className={styles.accountIcon}>
                                        <use xlinkHref="/Custom/Content/Themes/xiaomi/Imagens/svg/svg-symbols.svg#user"></use>
                                    </svg>
                                </a>
                            </Link>
                        </div>

                        {/* Carrinho */}
                        <div className={styles.cart}>
                            <CartIcon />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mini Carrinho (aparece quando clicado) */}
            <div className={`wd-ko wd-checkout-basket-summaryheader size-by-item empty ${isMinicartOpen ? 'open' : ''}`}>
                <div className="summaryheader-content wd-widget">
                    <div className="wd-header">
                        <span className="wd-icon"></span>
                        <div className="wd-title">Produtos no meu carrinho</div>
                    </div>
                    <div className="wd-content">
                        <div className="empty-cart">
                            <strong>Você ainda não colocou nenhum produto no carrinho.</strong>
                        </div>
                        <div className="header-content">
                            <svg role="img" className="cart">
                                <use xlinkHref="/Custom/Content/Themes/xiaomi/Imagens/svg/svg-symbols.svg#cart"></use>
                            </svg>
                            <div className="header-title">Minhas compras</div>
                            <svg role="img" className="close-menu-mobile" onClick={closeMinicart}>
                                <use xlinkHref="/Custom/Content/Themes/xiaomi/Imagens/svg/svg-symbols.svg#close-menu-mobile"></use>
                            </svg>
                        </div>
                        <ul className="subtotal">
                            <li className="label">Subtotal</li>
                            <li className="value">R$ 0,00</li>
                        </ul>
                    </div>
                    <div className="wd-footer">
                        <span className="wd-icon"></span>
                        <button data-href="/carrinho" className="go-to-basket btn" title="Finalizar pedido">Finalizar pedido</button>
                        <button className="go-to-checkout ghost-button" title="Continuar comprando" onClick={closeMinicart}>Continuar comprando</button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;