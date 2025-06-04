import React from 'react';
import Link from 'next/link';
import styles from './HomePromoBanners.module.css';

const HomePromoBanners = () => {
    // Lista de banners promocionais
    const banners = [
        {
            id: 1,
            title: "Fone de Ouvido Bluetooth Mi True Wireless",
            image: "/Custom/Content/Themes/xiaomi/Imagens/earphones2.png",
            link: "/fone-de-ouvido-bluetooth-mi-true-wireless-earphones-2-basic",
            alt: "Fones de Ouvido Bluetooth"
        },
        {
            id: 2,
            title: "Pulseira Inteligente Xiaomi Band 8",
            image: "/Custom/Content/Themes/xiaomi/Imagens/band-eight.png",
            link: "/pulseira-inteligente-xiaomi-band-8",
            alt: "Pulseira Inteligente Xiaomi Band 8"
        },
        {
            id: 3,
            title: "Cabos USB 100cm Xiaomi",
            image: "/Custom/Content/Themes/xiaomi/Imagens/cabo.png",
            link: "/listas/cabos-usb-100cm",
            alt: "Cabos USB Xiaomi"
        },
        {
            id: 4,
            title: "Balança Inteligente Mi",
            image: "/Custom/Content/Themes/xiaomi/Imagens/balanca-2.png",
            link: "/balanca-corporal-inteligente-de-saude-mi-body-composition-scale-2",
            alt: "Balança Inteligente Mi"
        },
    ];

    return (
        <div className={styles.bannerGrid}>
            {banners.map(banner => (
                <div key={banner.id} className={styles.bannerLateral}>
                    <Link href={banner.link}>
                        <a className={styles.bannerLink}>
                            <div className={styles.bannerContent}>
                                <h2>{banner.title}</h2>
                                <span className={styles.bannerCta}>Saiba mais</span>
                            </div>
                            <img src={banner.image} alt={banner.alt} />
                        </a>
                    </Link>
                </div>
            ))}
        </div>
    );
};

export default HomePromoBanners;