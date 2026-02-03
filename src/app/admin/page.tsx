"use client";

import { useState, useEffect } from 'react';
import { Product, Order } from '@/types';
import { products as initialProducts } from '@/data/products';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Video, Package, ShoppingCart, Clock, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default function AdminDashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');

    // Form State
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '', price: 0, description: '', category: '', stock: 0, images: [''], video: '', isFeatured: false
    });

    // Order Modal State
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderFormData, setOrderFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        productId: '',
        quantity: 1
    });

    // Load Data
    useEffect(() => {
        const auth = sessionStorage.getItem('srivari_admin_auth');
        if (auth === 'true') setIsAuthenticated(true);

        const storedProducts = localStorage.getItem('srivari_products');
        if (storedProducts) setProducts(JSON.parse(storedProducts));
        else setProducts(initialProducts);

        const storedOrders = localStorage.getItem('srivari_orders');
        if (storedOrders) setOrders(JSON.parse(storedOrders));

        setIsLoaded(true);
    }, []);

    // Save Data
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('srivari_products', JSON.stringify(products));
            localStorage.setItem('srivari_orders', JSON.stringify(orders));
        }
    }, [products, orders, isLoaded]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === 'admin123' || passwordInput === 'srivari') {
            sessionStorage.setItem('srivari_admin_auth', 'true');
            setIsAuthenticated(true);
        } else {
            alert('Invalid Password');
        }
    };

    // --- Product Logic ---
    const resetForm = () => {
        setFormData({ name: '', price: 0, description: '', category: '', stock: 0, images: [''], video: '', isFeatured: false });
        setIsEditing(null);
    };

    const handleProductSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            setProducts(products.map(p => p.id === isEditing ? { ...formData, id: isEditing } as Product : p));
        } else {
            setProducts([{ ...formData, id: Math.random().toString(36).substr(2, 9) } as Product, ...products]);
        }
        resetForm();
    };

    const handleDeleteProduct = (id: string) => {
        if (confirm('Delete this product?')) setProducts(products.filter(p => p.id !== id));
    };

    // --- Order Logic ---
    const handleCreateOrder = (e: React.FormEvent) => {
        e.preventDefault();
        const product = products.find(p => p.id === orderFormData.productId);
        if (!product) return alert('Select a product');
        if (product.stock < orderFormData.quantity) return alert('Insufficient stock!');

        const newOrder: Order = {
            id: Math.random().toString(36).substr(2, 9),
            customerName: orderFormData.customerName,
            customerPhone: orderFormData.customerPhone,
            customerEmail: orderFormData.customerEmail,
            items: [{
                productId: product.id,
                productName: product.name,
                quantity: orderFormData.quantity,
                price: product.price
            }],
            totalAmount: product.price * orderFormData.quantity,
            date: new Date().toISOString(),
            status: 'Completed'
        };

        // Decrement Stock
        const updatedProducts = products.map(p =>
            p.id === product.id ? { ...p, stock: p.stock - orderFormData.quantity } : p
        );

        setProducts(updatedProducts);
        setOrders([newOrder, ...orders]);
        setIsOrderModalOpen(false);
        setOrderFormData({ customerName: '', customerPhone: '', customerEmail: '', productId: '', quantity: 1 });
        alert('Order Created & Stock Updated!');
    };

    // --- Image Helpers ---
    const updateImage = (index: number, value: string) => {
        const newImages = [...(formData.images || [])];
        newImages[index] = value;
        setFormData({ ...formData, images: newImages });
    };

    // Auth View
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center bg-obsidian text-marble">
                <div className="max-w-md w-full glass-card p-8 rounded-lg border border-white/10 text-center">
                    <h1 className="text-3xl font-serif text-gold mb-6">Admin Access</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input type="password" placeholder="Enter Admin Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 rounded text-marble focus:border-gold outline-none text-center" />
                        <button type="submit" className="w-full bg-gold text-obsidian font-serif font-bold px-6 py-3 rounded hover:bg-white transition-all">Login</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 px-6 md:px-12 bg-obsidian text-marble">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-serif text-gold">Admin Dashboard</h1>
                        <p className="text-marble/60 mt-1">Manage your empire.</p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`px-6 py-2 rounded-md transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-gold text-obsidian font-bold' : 'text-marble/60 hover:text-white'}`}
                        >
                            <Package size={18} /> Inventory
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-6 py-2 rounded-md transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-gold text-obsidian font-bold' : 'text-marble/60 hover:text-white'}`}
                        >
                            <ShoppingCart size={18} /> Orders
                        </button>
                    </div>
                </div>

                {/* Inventory Tab */}
                {activeTab === 'inventory' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Product Form */}
                        <div className="glass-card p-8 rounded-lg mb-12 border border-white/10">
                            <h2 className="text-2xl font-serif text-gold mb-6 flex items-center gap-2">
                                {isEditing ? <Edit2 size={24} /> : <Plus size={24} />} {isEditing ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <input type="text" placeholder="Product Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 p-3 rounded text-marble focus:border-gold outline-none" required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="number" placeholder="Price (₹)" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 p-3 rounded text-marble focus:border-gold outline-none" required />
                                        <input type="number" placeholder="Stock" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 p-3 rounded text-marble focus:border-gold outline-none" required />
                                    </div>
                                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-white/5 border border-white/10 p-3 rounded text-marble focus:border-gold outline-none">
                                        <option value="" className="bg-obsidian">Select Category</option>
                                        <option value="Silk" className="bg-obsidian">Silk</option>
                                        <option value="Banarasi" className="bg-obsidian">Banarasi</option>
                                        <option value="Cotton" className="bg-obsidian">Cotton</option>
                                        <option value="Mysore Silk" className="bg-obsidian">Mysore Silk</option>
                                    </select>
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/10">
                                        <input type="checkbox" checked={formData.isFeatured} onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} className="w-5 h-5 accent-gold" id="featured" />
                                        <label htmlFor="featured" className="cursor-pointer select-none">Mark as Featured Product</label>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full bg-white/5 border border-white/10 p-3 rounded text-marble focus:border-gold outline-none" required />
                                    <div className="space-y-2">
                                        <label className="text-sm text-marble/60">Images (First is cover)</label>
                                        {formData.images?.map((img, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input type="text" value={img} onChange={e => updateImage(idx, e.target.value)} placeholder="Image URL" className="w-full bg-white/5 border border-white/10 p-2 rounded text-sm text-marble focus:border-gold outline-none" />
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setFormData({ ...formData, images: [...(formData.images || []), ''] })} className="text-xs text-gold hover:underline">+ Add Another URL</button>
                                    </div>
                                </div>
                                <div className="md:col-span-2 flex justify-end gap-4">
                                    {isEditing && <button type="button" onClick={resetForm} className="px-6 py-3 rounded text-marble/60 hover:text-white flex items-center gap-2"><X size={20} /> Cancel</button>}
                                    <button type="submit" className="bg-gold text-obsidian font-serif font-bold px-8 py-3 rounded hover:bg-white transition-all flex items-center gap-2"><Save size={20} /> {isEditing ? 'Update' : 'save'} Product</button>
                                </div>
                            </form>
                        </div>

                        {/* List */}
                        <div className="grid grid-cols-1 gap-4">
                            {products.map((product) => (
                                <div key={product.id} className="glass-card p-4 rounded-lg flex flex-col md:flex-row items-center gap-6 border border-white/5 hover:border-gold/30 transition-colors">
                                    <div className="w-16 h-16 relative rounded overflow-hidden bg-white/5 flex-shrink-0">
                                        {product.images[0] && <Image src={product.images[0]} alt={product.name} fill className="object-cover" unoptimized />}
                                    </div>
                                    <div className="flex-grow text-center md:text-left">
                                        <h3 className="text-lg font-medium text-white">{product.name}</h3>
                                        <p className="text-sm text-marble/60">₹{product.price.toLocaleString('en-IN')} • Stock: {product.stock}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setFormData({ ...product }); setIsEditing(product.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 bg-white/5 hover:bg-gold/20 text-gold rounded"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-red-400 rounded"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-serif text-gold">Recent Orders</h2>
                            <button onClick={() => setIsOrderModalOpen(true)} className="bg-gold text-obsidian px-4 py-2 rounded font-bold hover:bg-white transition-colors flex items-center gap-2">
                                <Plus size={18} /> Create Manual Order
                            </button>
                        </div>

                        {orders.length === 0 ? (
                            <div className="text-center py-12 text-marble/40">No orders yet.</div>
                        ) : (
                            <div className="glass-card overflow-hidden rounded-lg border border-white/10">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 text-gold border-b border-white/10">
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Customer</th>
                                            <th className="p-4">Product</th>
                                            <th className="p-4">Total</th>
                                            <th className="p-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 text-sm text-marble/60">{new Date(order.date).toLocaleDateString()}</td>
                                                <td className="p-4">
                                                    <div className="font-medium text-white">{order.customerName}</div>
                                                    <div className="text-xs text-marble/50">{order.customerPhone}</div>
                                                </td>
                                                <td className="p-4">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="text-sm text-marble/80">
                                                            {item.productName} (x{item.quantity})
                                                        </div>
                                                    ))}
                                                </td>
                                                <td className="p-4 font-bold text-gold">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1 w-fit">
                                                        <CheckCircle size={12} /> {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Order Modal */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
                    <div className="bg-[#1a1a1a] rounded-lg p-8 max-w-md w-full border border-gold/20 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-serif text-gold">New Manual Order</h2>
                            <button onClick={() => setIsOrderModalOpen(false)} className="text-marble/50 hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateOrder} className="space-y-4">
                            <div>
                                <label className="block text-xs text-marble/60 mb-1">Customer Name</label>
                                <input type="text" required value={orderFormData.customerName} onChange={e => setOrderFormData({ ...orderFormData, customerName: e.target.value })} className="w-full bg-white/5 border border-white/10 p-2 rounded text-white focus:border-gold outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs text-marble/60 mb-1">Phone Number</label>
                                <input type="tel" required value={orderFormData.customerPhone} onChange={e => setOrderFormData({ ...orderFormData, customerPhone: e.target.value })} className="w-full bg-white/5 border border-white/10 p-2 rounded text-white focus:border-gold outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs text-marble/60 mb-1">Select Product</label>
                                <select required value={orderFormData.productId} onChange={e => setOrderFormData({ ...orderFormData, productId: e.target.value })} className="w-full bg-white/5 border border-white/10 p-2 rounded text-white focus:border-gold outline-none">
                                    <option value="" className="bg-obsidian">Select a product...</option>
                                    {products.filter(p => p.stock > 0).map(p => (
                                        <option key={p.id} value={p.id} className="bg-obsidian">{p.name} (Stock: {p.stock}) - ₹{p.price}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-marble/60 mb-1">Quantity</label>
                                <input type="number" min="1" required value={orderFormData.quantity} onChange={e => setOrderFormData({ ...orderFormData, quantity: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 p-2 rounded text-white focus:border-gold outline-none" />
                            </div>
                            <button type="submit" className="w-full bg-gold text-obsidian font-bold py-3 rounded mt-4 hover:bg-white transition-colors">Create Order (Deduct Stock)</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
