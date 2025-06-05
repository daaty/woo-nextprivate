// Cart v2 WooCommerce Integration Test Page
import React, { useState } from 'react';
import { CartProvider } from '../src/v2/cart/context/CartProvider.js';
import { useCart } from '../src/v2/cart/hooks/useCart.js';

// Test component for WooCommerce integration
function WooCommerceIntegrationTest() {
  const { items, loading, error, total, addItem, removeItem, updateQuantity, clearCart } = useCart();
  const [testProductId, setTestProductId] = useState('');
  const [testQuantity, setTestQuantity] = useState(1);
  const [testResults, setTestResults] = useState([]);

  // Add test result
  const addTestResult = (test, success, message) => {
    const result = {
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev]);
  };

  // Test adding real WooCommerce product
  const testAddProduct = async () => {
    if (!testProductId) {
      addTestResult('Add Product', false, 'Product ID is required');
      return;
    }

    try {
      await addItem({ id: testProductId, productId: testProductId }, testQuantity);
      addTestResult('Add Product', true, `Added product ${testProductId} x${testQuantity}`);
    } catch (error) {
      addTestResult('Add Product', false, `Error: ${error.message}`);
    }
  };

  // Test common WooCommerce product IDs
  const testCommonProducts = async () => {
    const commonIds = [1, 2, 3, 4, 5]; // Common product IDs
    
    for (const id of commonIds) {
      try {
        await addItem({ id: id, productId: id }, 1);
        addTestResult('Batch Add', true, `Added product ${id}`);
      } catch (error) {
        addTestResult('Batch Add', false, `Failed to add product ${id}: ${error.message}`);
      }
    }
  };

  // Test cart operations
  const testCartOperations = async () => {
    try {
      // Add product
      await addItem({ id: 1, productId: 1 }, 2);
      addTestResult('Cart Operations', true, 'Added product');
      
      // Update quantity
      await updateQuantity(1, 3);
      addTestResult('Cart Operations', true, 'Updated quantity');
      
      // Remove product
      await removeItem(1);
      addTestResult('Cart Operations', true, 'Removed product');
      
    } catch (error) {
      addTestResult('Cart Operations', false, `Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#007bff',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0 }}>Cart v2 - WooCommerce Integration Test</h1>
        <p style={{ margin: '10px 0 0 0' }}>
          Testing integration with real WooCommerce products
        </p>
      </div>

      {/* Current Cart State */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2>Current Cart State</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div>
            <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Items:</strong> {items.length}
          </div>
          <div>
            <strong>Total:</strong> R$ {total ? total.toFixed(2) : '0.00'}
          </div>
        </div>
        
        {error && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Cart Items */}
      {items.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2>Cart Items</h2>
          {items.map(item => (
            <div key={item.productId} style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr auto auto auto',
              gap: '15px',
              alignItems: 'center',
              padding: '10px',
              borderBottom: '1px solid #eee'
            }}>
              <img 
                src={item.image}
                alt={item.name}
                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div>
                <strong>{item.name}</strong>
                {item.description && (
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    {item.description}
                  </div>
                )}
              </div>
              <div>R$ {item.price.toFixed(2)}</div>
              <div>Qty: {item.quantity}</div>
              <div>
                <button 
                  onClick={() => removeItem(item.productId)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Controls */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2>Test Controls</h2>
        
        {/* Single Product Test */}
        <div style={{ marginBottom: '20px' }}>
          <h3>Add Single Product</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="number"
              placeholder="Product ID"
              value={testProductId}
              onChange={(e) => setTestProductId(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <input
              type="number"
              placeholder="Quantity"
              value={testQuantity}
              onChange={(e) => setTestQuantity(parseInt(e.target.value) || 1)}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '80px'
              }}
            />
            <button
              onClick={testAddProduct}
              disabled={loading}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Product
            </button>
          </div>
        </div>

        {/* Batch Tests */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={testCommonProducts}
            disabled={loading}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Common Products (1-5)
          </button>
          
          <button 
            onClick={testCartOperations}
            disabled={loading}
            style={{
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Cart Operations
          </button>
          
          <button 
            onClick={clearCart}
            disabled={loading}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h2>Test Results</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{
                  padding: '10px',
                  margin: '5px 0',
                  backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                  color: result.success ? '#155724' : '#721c24',
                  borderRadius: '4px',
                  border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`
                }}
              >
                <strong>[{result.timestamp}] {result.test}:</strong> {result.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main page component
export default function CartV2WooCommerceTestPage() {
  return (
    <CartProvider>
      <WooCommerceIntegrationTest />
    </CartProvider>
  );
}
