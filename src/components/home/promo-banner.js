import React from 'react';
import Link from 'next/link';

const PromoBanner = ({ title, subtitle, buttonText, buttonLink, backgroundImage }) => {
    return (
        <section className="promo-banner-section">
            <div className="container">
                <div 
                    className="promo-banner" 
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                >
                    <div className="promo-banner-content">
                        <h2 className="promo-title">{title}</h2>
                        <p className="promo-subtitle">{subtitle}</p>
                        <Link href={buttonLink}>
                            <a className="promo-button">
                                {buttonText}
                                <i className="fas fa-arrow-right"></i>
                            </a>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PromoBanner;
