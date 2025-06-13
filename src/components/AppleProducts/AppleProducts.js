import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { isEmpty } from 'lodash';
import { sanitize } from '../../utils/miscellaneous';
import ProductCard from '../ProductCard/ProductCard';
import styles from './AppleProducts.module.css';
import Slider from 'react-slick';
import LoadingSpinner from '../LoadingSpinner';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const AppleProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const settings = {
        dots: true,
        infinite: products.length > 3,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplay: false,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };

    useEffect(() => {
        setLoading(true);
        
        fetch('/api/brand?brand=Apple&per_page=12')
            .then(response => response.json())
            .then(data => {
                setProducts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Erro ao buscar produtos da Apple:', err);
                setError('Falha ao carregar os produtos. Tente novamente mais tarde.');
                setLoading(false);
            });
    }, []);

    return (
        <div className={styles.appleProducts}>
            <div className={styles.sectionHeader}>
                <h2>Produtos Apple</h2>
                <Link href="/search?brand=Apple">
                    <a className={styles.viewAll}>Ver todos</a>
                </Link>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-600">Carregando produtos Apple...</p>
                </div>
            )}

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {!loading && !error && !isEmpty(products) && (
                <Slider {...settings} className={styles.productsSlider}>
                    {products.map(product => (
                        <div key={product.id} className={styles.productSlide}>
                            <ProductCard product={product} />
                        </div>
                    ))}
                </Slider>
            )}

            {!loading && !error && isEmpty(products) && (
                <div className={styles.noProducts}>
                    Nenhum produto Apple encontrado. 
                </div>
            )}
        </div>
    );
};

export default AppleProducts;