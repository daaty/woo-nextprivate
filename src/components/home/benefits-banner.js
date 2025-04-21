import React from 'react';

const BenefitsBanner = ({ benefits }) => {
    return (
        <section className="benefits-section">
            <div className="container">
                <div className="benefits-container">
                    {benefits.map((benefit, index) => (
                        <div className="benefit-item" key={index}>
                            <div className="benefit-icon">
                                <i className={benefit.icon}></i>
                            </div>
                            <div className="benefit-content">
                                <h3 className="benefit-title">{benefit.title}</h3>
                                <p className="benefit-description">{benefit.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BenefitsBanner;
