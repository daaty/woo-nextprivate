/**
 * Cart v2 UI Components Test Page
 * 
 * This page provides comprehensive testing and demonstration of all
 * cart v2 UI components in various states and configurations.
 * 
 * Access at: /cart-v2-ui-test
 */

import React, { useState } from 'react';
import { CartProvider } from '../src/v2/cart/context/CartProvider.js';
import { 
    CartIcon, 
    AddToCartButton, 
    CartItems, 
    CartTotals, 
    CartPage 
} from '../src/v2/cart/components/index.js';

const CartV2UITestPage = () => {
    const [testMode, setTestMode] = useState('all');
    const [mockItems, setMockItems] = useState([
        {
            id: 1,
            product_id: 101,
            name: 'Premium Wireless Headphones',
            price: 199.99,
            quantity: 2,
            image: 'https://via.placeholder.com/100x100?text=Headphones'
        },
        {
            id: 2,
            product_id: 102,
            name: 'Smartphone Case',
            price: 29.99,
            quantity: 1,
            image: 'https://via.placeholder.com/100x100?text=Case'
        }
    ]);

    const testModes = [
        { key: 'all', label: 'All Components' },
        { key: 'icons', label: 'Cart Icons' },
        { key: 'buttons', label: 'Add Buttons' },
        { key: 'items', label: 'Cart Items' },
        { key: 'totals', label: 'Cart Totals' },
        { key: 'page', label: 'Full Page' }
    ];

    const renderCartIcons = () => (
        <section className="test-section">
            <h2 className="section-title">Cart Icons</h2>
            
            <div className="test-group">
                <h3>Sizes & States</h3>
                <div className="component-grid">
                    <div className="test-item">
                        <label>Small Size</label>
                        <CartIcon size="small" />
                    </div>
                    <div className="test-item">
                        <label>Default Size</label>
                        <CartIcon />
                    </div>
                    <div className="test-item">
                        <label>Large Size</label>
                        <CartIcon size="large" />
                    </div>
                    <div className="test-item">
                        <label>With Items (2)</label>
                        <CartIcon />
                    </div>
                </div>
            </div>

            <div className="test-group">
                <h3>Interactive States</h3>
                <div className="component-grid">
                    <div className="test-item">
                        <label>Clickable</label>
                        <CartIcon onClick={() => alert('Cart clicked!')} />
                    </div>
                    <div className="test-item">
                        <label>Custom Class</label>
                        <CartIcon className="custom-cart-icon" />
                    </div>
                </div>
            </div>
        </section>
    );

    const renderAddButtons = () => (
        <section className="test-section">
            <h2 className="section-title">Add to Cart Buttons</h2>
            
            <div className="test-group">
                <h3>Button Variants</h3>
                <div className="component-grid">
                    <div className="test-item">
                        <label>Primary</label>
                        <AddToCartButton 
                            product_id={101}
                            variant="primary"
                        />
                    </div>
                    <div className="test-item">
                        <label>Secondary</label>
                        <AddToCartButton 
                            product_id={102}
                            variant="secondary"
                        />
                    </div>
                    <div className="test-item">
                        <label>Outline</label>
                        <AddToCartButton 
                            product_id={103}
                            variant="outline"
                        />
                    </div>
                </div>
            </div>

            <div className="test-group">
                <h3>Button Sizes</h3>
                <div className="component-grid">
                    <div className="test-item">
                        <label>Small</label>
                        <AddToCartButton 
                            product_id={104}
                            size="small"
                        />
                    </div>
                    <div className="test-item">
                        <label>Default</label>
                        <AddToCartButton 
                            product_id={105}
                        />
                    </div>
                    <div className="test-item">
                        <label>Large</label>
                        <AddToCartButton 
                            product_id={106}
                            size="large"
                        />
                    </div>
                </div>
            </div>

            <div className="test-group">
                <h3>Special States</h3>
                <div className="component-grid">
                    <div className="test-item">
                        <label>With Quantity</label>
                        <AddToCartButton 
                            product_id={107}
                            quantity={3}
                            showQuantity={true}
                        />
                    </div>
                    <div className="test-item">
                        <label>Custom Text</label>
                        <AddToCartButton 
                            product_id={108}
                            text="Buy Now"
                        />
                    </div>
                </div>
            </div>
        </section>
    );

    const renderCartItems = () => (
        <section className="test-section">
            <h2 className="section-title">Cart Items</h2>
            
            <div className="test-group">
                <h3>Display Modes</h3>
                <div className="component-showcase">
                    <div className="test-item full-width">
                        <label>Full Mode</label>
                        <CartItems mode="full" />
                    </div>
                    <div className="test-item full-width">
                        <label>Compact Mode</label>
                        <CartItems mode="compact" />
                    </div>
                </div>
            </div>

            <div className="test-group">
                <h3>Interactive Features</h3>
                <div className="component-showcase">
                    <div className="test-item full-width">
                        <label>With All Controls</label>
                        <CartItems 
                            showQuantityControls={true}
                            showRemoveButton={true}
                            showImages={true}
                        />
                    </div>
                </div>
            </div>
        </section>
    );

    const renderCartTotals = () => (
        <section className="test-section">
            <h2 className="section-title">Cart Totals</h2>
            
            <div className="test-group">
                <h3>Display Options</h3>
                <div className="component-grid">
                    <div className="test-item">
                        <label>Basic Totals</label>
                        <CartTotals />
                    </div>
                    <div className="test-item">
                        <label>With Shipping</label>
                        <CartTotals 
                            showShipping={true}
                            shipping={12.99}
                        />
                    </div>
                    <div className="test-item">
                        <label>With Tax</label>
                        <CartTotals 
                            showTax={true}
                            tax={18.50}
                        />
                    </div>
                    <div className="test-item">
                        <label>Complete</label>
                        <CartTotals 
                            showShipping={true}
                            showTax={true}
                            showCoupons={true}
                            shipping={12.99}
                            tax={18.50}
                        />
                    </div>
                </div>
            </div>
        </section>
    );

    const renderFullPage = () => (
        <section className="test-section">
            <h2 className="section-title">Full Cart Page</h2>
            
            <div className="test-group">
                <div className="component-showcase">
                    <div className="test-item full-width">
                        <CartPage />
                    </div>
                </div>
            </div>
        </section>
    );

    const renderTestContent = () => {
        switch (testMode) {
            case 'icons':
                return renderCartIcons();
            case 'buttons':
                return renderAddButtons();
            case 'items':
                return renderCartItems();
            case 'totals':
                return renderCartTotals();
            case 'page':
                return renderFullPage();
            default:
                return (
                    <>
                        {renderCartIcons()}
                        {renderAddButtons()}
                        {renderCartItems()}
                        {renderCartTotals()}
                        {renderFullPage()}
                    </>
                );
        }
    };

    return (
        <CartProvider>
            <div className="cart-ui-test-page">
                <header className="test-header">
                    <h1>Cart v2 UI Components Test Suite</h1>
                    <p>Comprehensive testing of all cart v2 UI components</p>
                    
                    <div className="test-controls">
                        <label htmlFor="test-mode">Test Mode:</label>
                        <select 
                            id="test-mode"
                            value={testMode} 
                            onChange={(e) => setTestMode(e.target.value)}
                            className="test-select"
                        >
                            {testModes.map(mode => (
                                <option key={mode.key} value={mode.key}>
                                    {mode.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </header>

                <main className="test-content">
                    {renderTestContent()}
                </main>

                <footer className="test-footer">
                    <div className="test-stats">
                        <div className="stat">
                            <strong>Components:</strong> 5 UI Components
                        </div>
                        <div className="stat">
                            <strong>API Status:</strong> Connected
                        </div>
                        <div className="stat">
                            <strong>Cart Items:</strong> {mockItems.length}
                        </div>
                    </div>
                </footer>

                <style jsx>{`
                    .cart-ui-test-page {
                        min-height: 100vh;
                        background: #f8fafc;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }

                    .test-header {
                        background: white;
                        padding: 2rem;
                        border-bottom: 1px solid #e2e8f0;
                        text-align: center;
                    }

                    .test-header h1 {
                        margin: 0 0 0.5rem 0;
                        color: #1a202c;
                        font-size: 2rem;
                        font-weight: 700;
                    }

                    .test-header p {
                        margin: 0 0 1.5rem 0;
                        color: #64748b;
                        font-size: 1.1rem;
                    }

                    .test-controls {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 1rem;
                    }

                    .test-select {
                        padding: 0.5rem 1rem;
                        border: 1px solid #d1d5db;
                        border-radius: 0.375rem;
                        background: white;
                        font-size: 1rem;
                    }

                    .test-content {
                        padding: 2rem;
                        max-width: 1200px;
                        margin: 0 auto;
                    }

                    .test-section {
                        background: white;
                        border-radius: 0.5rem;
                        padding: 2rem;
                        margin-bottom: 2rem;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    }

                    .section-title {
                        margin: 0 0 1.5rem 0;
                        color: #1a202c;
                        font-size: 1.5rem;
                        font-weight: 600;
                        border-bottom: 2px solid #3b82f6;
                        padding-bottom: 0.5rem;
                    }

                    .test-group {
                        margin-bottom: 2rem;
                    }

                    .test-group:last-child {
                        margin-bottom: 0;
                    }

                    .test-group h3 {
                        margin: 0 0 1rem 0;
                        color: #374151;
                        font-size: 1.125rem;
                        font-weight: 500;
                    }

                    .component-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 1rem;
                    }

                    .component-showcase {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .test-item {
                        border: 1px solid #e5e7eb;
                        border-radius: 0.375rem;
                        padding: 1rem;
                        background: #fafafa;
                        text-align: center;
                    }

                    .test-item.full-width {
                        width: 100%;
                    }

                    .test-item label {
                        display: block;
                        margin-bottom: 0.75rem;
                        color: #6b7280;
                        font-size: 0.875rem;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .test-footer {
                        background: white;
                        border-top: 1px solid #e2e8f0;
                        padding: 1.5rem 2rem;
                    }

                    .test-stats {
                        display: flex;
                        justify-content: center;
                        gap: 2rem;
                        max-width: 600px;
                        margin: 0 auto;
                    }

                    .stat {
                        text-align: center;
                        color: #64748b;
                        font-size: 0.875rem;
                    }

                    .stat strong {
                        color: #1a202c;
                    }

                    .custom-cart-icon {
                        color: #ef4444;
                    }

                    @media (max-width: 768px) {
                        .test-header {
                            padding: 1rem;
                        }

                        .test-content {
                            padding: 1rem;
                        }

                        .test-section {
                            padding: 1rem;
                        }

                        .component-grid {
                            grid-template-columns: 1fr;
                        }

                        .test-stats {
                            flex-direction: column;
                            gap: 0.5rem;
                        }
                    }
                `}</style>
            </div>
        </CartProvider>
    );
};

export default CartV2UITestPage;
