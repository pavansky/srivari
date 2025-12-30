"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import { products as initialProducts } from '@/data/products';
import { Product } from '@/types';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [isAdding, setIsAdding] = useState(false);

    // New Product Form State
    const [newProduct, setNewProduct] = useState<Partial<Product>>({
        name: '',
        price: 0,
        category: '',
        image: '',
        description: ''
    });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === '1234') {
            setIsAuthenticated(true);
        } else {
            alert('Invalid PIN');
        }
    };

    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        const product: Product = {
            id: (products.length + 1).toString(),
            name: newProduct.name || 'New Saree',
            price: newProduct.price || 0,
            image: newProduct.image || 'https://placehold.co/600x800', // Default placeholder
            description: newProduct.description || '',
            category: newProduct.category || 'General',
            inStock: true
        };

        setProducts([...products, product]);
        setIsAdding(false);
        setNewProduct({ name: '', price: 0, category: '', image: '', description: '' });
        alert('Product Added! (Note: This is a demo. Data will reset on refresh without a database backend)');
    };

    if (!isAuthenticated) {
        return (
            <main>
                <Header />
                <div className="container login-container">
                    <div className="login-box">
                        <h2>Admin Access</h2>
                        <p>Please enter your 4-digit security PIN.</p>
                        <form onSubmit={handleLogin}>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="PIN"
                                maxLength={4}
                                className="pin-input"
                            />
                            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
                        </form>
                    </div>
                </div>
                <style jsx>{`
            .login-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 60vh;
            }
            .login-box {
                background: #fff;
                padding: 3rem;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
                width: 100%;
            }
            .login-box h2 {
                color: var(--color-primary);
                margin-bottom: 1rem;
            }
            .pin-input {
                width: 100%;
                padding: 1rem;
                margin: 2rem 0;
                font-size: 1.2rem;
                text-align: center;
                letter-spacing: 0.5rem;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
        `}</style>
            </main>
        );
    }

    return (
        <main>
            <Header />
            <div className="container dashboard">
                <div className="dash-header">
                    <h2>Store Administration</h2>
                    <button className="btn-primary" onClick={() => setIsAdding(!isAdding)}>
                        {isAdding ? 'Cancel' : '+ Add New Product'}
                    </button>
                </div>

                {isAdding && (
                    <div className="add-form">
                        <h3>Add New Saree</h3>
                        <form onSubmit={handleAddProduct} className="form-grid">
                            <input
                                placeholder="Product Name"
                                value={newProduct.name}
                                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Price (INR)"
                                type="number"
                                value={newProduct.price || ''}
                                onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                                required
                            />
                            <input
                                placeholder="Category (e.g. Silk, Cotton)"
                                value={newProduct.category}
                                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Image URL"
                                value={newProduct.image}
                                onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                            />
                            <textarea
                                placeholder="Description"
                                value={newProduct.description}
                                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                rows={3}
                                style={{ gridColumn: '1 / -1' }}
                            />
                            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1' }}>Save Product</button>
                        </form>
                    </div>
                )}

                <div className="product-list">
                    <h3>Current Inventory ({products.length})</h3>
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Category</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td><img src={p.image} alt="" style={{ height: '50px' }} /></td>
                                    <td>{p.name}</td>
                                    <td>₹{p.price}</td>
                                    <td>{p.category}</td>
                                    <td><button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Edit</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
        .dashboard {
            padding: 4rem 1.5rem;
        }
        .dash-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #eee;
        }
        .dash-header h2 {
            color: var(--color-primary);
        }
        .add-form {
            background: #f9f9f9;
            padding: 2rem;
            border-radius: 8px;
            margin-bottom: 3rem;
        }
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-top: 1rem;
        }
        .form-grid input, .form-grid textarea {
            padding: 0.8rem;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .inventory-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        .inventory-table th, .inventory-table td {
            text-align: left;
            padding: 1rem;
            border-bottom: 1px solid #eee;
        }
        .inventory-table th {
            font-family: var(--font-serif);
            color: var(--color-primary);
        }
      `}</style>
        </main>
    );
}
