"use client";

import { useState, useEffect } from 'react';
import { Product, Order } from '@/types';
import { products as initialProducts } from '@/data/products';
import {
    Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Video,
    Package, ShoppingCart, TrendingUp, DollarSign, Check, ChevronDown
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// --- Reusable Glass Components ---
const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ${className}`}>
        {children}
    </div>
);

const GlassInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className={`w-full bg-white/5 border border-white/10 p-3 rounded-lg text-white placeholder-white/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all ${props.className}`}
    />
);

const GlassSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select
        {...props}
        className={`w-full bg-[#0a0a0a] border border-white/10 p-3 rounded-lg text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all appearance-none ${props.className}`}
    />
);

export default function AdminDashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [categories, setCategories] = useState<string[]>(["Silk", "Banarasi", "Cotton", "Mysore Silk", "Tussar"]);

    // Auth & Loading
    const [isLoaded, setIsLoaded] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');

    // UI State
    const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryInput, setNewCategoryInput] = useState("");

    // Form State
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '', price: 0, description: '', category: '', stock: 0, images: [''], video: '', isFeatured: false,
        priceCps: 0, shipping: 0
    });

    // Order Modal
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderFormData, setOrderFormData] = useState({
        customerName: '', customerPhone: '', customerEmail: '', productId: '', quantity: 1
    });

    // --- Load/Save Data ---
    useEffect(() => {
        const auth = sessionStorage.getItem('srivari_admin_auth');
        if (auth === 'true') setIsAuthenticated(true);

        const storedProducts = localStorage.getItem('srivari_products');
        setProducts(storedProducts ? JSON.parse(storedProducts) : initialProducts);

        const storedOrders = localStorage.getItem('srivari_orders');
        if (storedOrders) setOrders(JSON.parse(storedOrders));

        const storedCategories = localStorage.getItem('srivari_categories');
        if (storedCategories) setCategories(JSON.parse(storedCategories));

        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('srivari_products', JSON.stringify(products));
            localStorage.setItem('srivari_orders', JSON.stringify(orders));
            localStorage.setItem('srivari_categories', JSON.stringify(categories));
        }
    }, [products, orders, categories, isLoaded]);

    // --- Actions ---
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === 'admin123' || passwordInput === 'srivari') {
            sessionStorage.setItem('srivari_admin_auth', 'true');
            setIsAuthenticated(true);
        } else alert('Access Denied');
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

    const resetForm = () => {
        setFormData({ name: '', price: 0, description: '', category: '', stock: 0, images: [''], video: '', isFeatured: false, priceCps: 0, shipping: 0 });
        setIsEditing(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddCategory = () => {
        if (newCategoryInput.trim() && !categories.includes(newCategoryInput.trim())) {
            const newCat = newCategoryInput.trim();
            setCategories([...categories, newCat]);
            setFormData({ ...formData, category: newCat }); // Auto-select new category
            setNewCategoryInput("");
            setIsAddingCategory(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Stats Calculation ---
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const activeOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Shipped').length;
    const stockValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

    // --- Markup Helpers ---
    const calculateMargin = (selling: number, cost: number = 0, shipping: number = 0) => {
        const totalCost = cost + shipping;
        const profit = selling - totalCost;
        const margin = selling > 0 ? (profit / selling) * 100 : 0;
        return { profit, margin };
    };

    if (!isAuthenticated) return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
            <GlassCard className="p-10 max-w-md w-full text-center border-[#D4AF37]/30">
                <div className="mb-6 mx-auto w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37]">
                    <DollarSign size={32} />
                </div>
                <h1 className="text-3xl font-serif text-[#D4AF37] mb-2">The Srivari</h1>
                <p className="text-white/50 mb-8 text-sm">Restricted Access Portal</p>
                <form onSubmit={handleLogin} className="space-y-4">
                    <GlassInput type="password" placeholder="Passkey" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="text-center tracking-widest" />
                    <button type="submit" className="w-full bg-[#D4AF37] hover:bg-white text-black font-bold py-3 rounded-lg transition-all">ENTER</button>
                </form>
            </GlassCard>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-[#D4AF37]/30">
            {/* --- Top Bar --- */}
            <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-lg border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#D4AF37] rounded-lg flex items-center justify-center text-black font-serif font-bold text-xl">S</div>
                    <div>
                        <h1 className="text-white font-serif tracking-wide">The Srivari</h1>
                        <p className="text-xs text-[#D4AF37]">Admin Console</p>
                    </div>
                </div>
                <nav className="flex gap-2">
                    <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'inventory' ? 'bg-white/10 text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}>Inventory</button>
                    <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-white/10 text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}>Orders</button>
                </nav>
            </header>

            <main className="max-w-7xl mx-auto p-6 md:p-12 space-y-12">

                {/* --- Stats Row --- */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
                        { label: "Active Orders", value: activeOrders, icon: ShoppingCart, color: "text-blue-400" },
                        { label: "Stock Value", value: `₹${stockValue.toLocaleString()}`, icon: Package, color: "text-[#D4AF37]" }
                    ].map((stat, idx) => (
                        <GlassCard key={idx} className="p-6 flex items-center gap-4 hover:border-[#D4AF37]/40 transition-colors">
                            <div className={`p-3 rounded-full bg-white/5 ${stat.color}`}><stat.icon size={24} /></div>
                            <div>
                                <p className="text-white/40 text-xs uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                        </GlassCard>
                    ))}
                </section>

                {/* --- Inventory Tab --- */}
                {activeTab === 'inventory' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

                        {/* Add/Edit Product Form */}
                        <GlassCard className="p-8 border-[#D4AF37]/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Package size={120} />
                            </div>
                            <h2 className="text-2xl font-serif text-[#D4AF37] mb-8 flex items-center gap-3">
                                {isEditing ? <Edit2 size={24} /> : <Plus size={24} />}
                                {isEditing ? 'Modify Artifact' : 'New Artifact'}
                            </h2>

                            <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
                                {/* Left Column: Media & Core Info */}
                                <div className="md:col-span-5 space-y-6">
                                    <div className="space-y-4">
                                        <GlassInput placeholder="Product Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="text-lg font-medium" />
                                        <textarea
                                            placeholder="Description"
                                            rows={5}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-lg text-white placeholder-white/30 focus:border-[#D4AF37] outline-none transition-all resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Images */}
                                    <div className="space-y-3">
                                        <label className="text-xs text-[#D4AF37] uppercase tracking-wider">Visual Assets</label>
                                        {formData.images?.map((img, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <GlassInput value={img} onChange={e => { const n = [...(formData.images ?? [])]; n[idx] = e.target.value; setFormData({ ...formData, images: n }) }} placeholder="Image URL" />
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setFormData({ ...formData, images: [...(formData.images || []), ''] })} className="text-xs text-[#D4AF37] hover:underline">+ Add URL</button>
                                    </div>
                                </div>

                                {/* Right Column: Details */}
                                <div className="md:col-span-7 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-white/40 mb-2 block">Selling Price</label>
                                            <GlassInput type="number" placeholder="₹" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/40 mb-2 block">Stock Count</label>
                                            <GlassInput type="number" placeholder="Qty" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} required />
                                        </div>
                                    </div>

                                    {/* Cost Analysis Row */}
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/5 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-white/40 mb-2 block">Cost Price (CPS)</label>
                                            <GlassInput type="number" placeholder="₹" value={formData.priceCps || ''} onChange={e => setFormData({ ...formData, priceCps: Number(e.target.value) })} className="bg-black/20" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/40 mb-2 block">Shipping Cost</label>
                                            <GlassInput type="number" placeholder="₹" value={formData.shipping || ''} onChange={e => setFormData({ ...formData, shipping: Number(e.target.value) })} className="bg-black/20" />
                                        </div>
                                    </div>

                                    {/* Inline Category Management */}
                                    <div>
                                        <label className="text-xs text-white/40 mb-2 block">Category</label>
                                        <div className="flex gap-2 h-12">
                                            {isAddingCategory ? (
                                                <div className="flex-1 flex gap-2 animate-in slide-in-from-left duration-300">
                                                    <GlassInput
                                                        autoFocus
                                                        placeholder="New Category Name..."
                                                        value={newCategoryInput}
                                                        onChange={e => setNewCategoryInput(e.target.value)}
                                                    />
                                                    <button type="button" onClick={handleAddCategory} className="bg-green-500/20 text-green-400 p-3 rounded-lg border border-green-500/50 hover:bg-green-500/30"><Check size={20} /></button>
                                                    <button type="button" onClick={() => setIsAddingCategory(false)} className="bg-red-500/20 text-red-400 p-3 rounded-lg border border-red-500/50 hover:bg-red-500/30"><X size={20} /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="relative flex-1">
                                                        <GlassSelect value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                                            <option value="" className="bg-neutral-900">Select Category</option>
                                                            {categories.map(cat => <option key={cat} value={cat} className="bg-neutral-900">{cat}</option>)}
                                                        </GlassSelect>
                                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAddingCategory(true)}
                                                        className="bg-white/5 border border-white/10 text-[#D4AF37] px-4 rounded-lg hover:bg-[#D4AF37] hover:text-black transition-all flex items-center justify-center"
                                                        title="Add New Category"
                                                    >
                                                        <Plus size={20} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 flex justify-end gap-4">
                                        {isEditing && (
                                            <button type="button" onClick={resetForm} className="px-6 py-3 rounded-lg text-white/50 hover:text-white transition-colors">Cancel</button>
                                        )}
                                        <button type="submit" className="bg-[#D4AF37] text-black font-bold px-8 py-3 rounded-lg hover:bg-white hover:scale-105 transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2">
                                            <Save size={18} /> {isEditing ? 'Update Artifact' : 'Save Artifact'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </GlassCard>

                        {/* Product Grid */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-serif text-white">Collection</h3>
                                <GlassInput
                                    className="w-64 py-2"
                                    placeholder="Search collection..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <AnimatePresence>
                                    {filteredProducts.map(product => {
                                        const { profit, margin } = calculateMargin(product.price, product.priceCps, product.shipping);
                                        return (
                                            <motion.div
                                                key={product.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                layout
                                            >
                                                <GlassCard className="p-4 flex items-center gap-6 group hover:border-[#D4AF37]/50 transition-all">
                                                    <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-white/5">
                                                        {product.images[0] && <Image src={product.images[0]} alt={product.name} fill className="object-cover" unoptimized />}
                                                    </div>

                                                    <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                                                        <div className="col-span-1">
                                                            <h4 className="font-medium text-white group-hover:text-[#D4AF37] transition-colors">{product.name}</h4>
                                                            <p className="text-xs text-white/40">{product.category}</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-white/40 uppercase">Price</p>
                                                            <p className="font-bold text-white">₹{product.price.toLocaleString()}</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-white/40 uppercase">Stock</p>
                                                            <p className={`font-bold ${product.stock < 5 ? 'text-red-400' : 'text-green-400'}`}>{product.stock}</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-white/40 uppercase">Margin</p>
                                                            <span className={`text-xs px-2 py-0.5 rounded border ${margin > 20 ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                                                                {margin.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setFormData(product); setIsEditing(product.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="p-2 hover:bg-white/10 rounded-lg text-[#D4AF37]"><Edit2 size={18} /></button>
                                                        <button
                                                            onClick={() => confirm('Delete?') && setProducts(products.filter(p => p.id !== product.id))}
                                                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-500"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </GlassCard>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* --- Orders Tab --- */}
                {activeTab === 'orders' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-serif text-[#D4AF37]">Order Log</h2>
                            <button onClick={() => setIsOrderModalOpen(true)} className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-bold hover:bg-white transition-colors flex items-center gap-2">
                                <Plus size={18} /> Manual Order
                            </button>
                        </div>

                        <div className="space-y-4">
                            {orders.map(order => (
                                <GlassCard key={order.id} className="p-6">
                                    <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                                        <div>
                                            <p className="text-xs text-[#D4AF37] mb-1">#{order.id}</p>
                                            <h3 className="font-bold text-lg text-white">{order.customerName}</h3>
                                            <p className="text-xs text-white/40">{new Date(order.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-white">₹{order.totalAmount.toLocaleString()}</p>
                                            <select
                                                value={order.status}
                                                onChange={(e) => {
                                                    const updated = orders.map(o => o.id === order.id ? { ...o, status: e.target.value as any } : o);
                                                    setOrders(updated);
                                                }}
                                                className={`mt-2 text-xs py-1 px-3 rounded-full border bg-transparent outline-none cursor-pointer ${order.status === 'Delivered' ? 'border-green-500 text-green-400' :
                                                        order.status === 'Cancelled' ? 'border-red-500 text-red-400' :
                                                            'border-yellow-500 text-yellow-400'
                                                    }`}
                                            >
                                                <option className="bg-neutral-900" value="Pending">Pending</option>
                                                <option className="bg-neutral-900" value="Shipped">Shipped</option>
                                                <option className="bg-neutral-900" value="Delivered">Delivered</option>
                                                <option className="bg-neutral-900" value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {order.items.map((item, i) => (
                                            <div key={i} className="flex justify-between text-sm text-white/60">
                                                <span>{item.productName} <span className="text-white/30">x{item.quantity}</span></span>
                                                <span>₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Manual Order Modal (Simplified for brevity, but functional) */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="max-w-md w-full p-8 border-[#D4AF37]/50">
                        <div className="flex justify-between mb-6">
                            <h3 className="text-xl text-[#D4AF37] font-serif">New Order</h3>
                            <button onClick={() => setIsOrderModalOpen(false)}><X className="text-white/50 hover:text-white" /></button>
                        </div>
                        {/* reusing similar form logic for order creation */}
                        <form className="space-y-4" onSubmit={(e) => {
                            e.preventDefault();
                            const product = products.find(p => p.id === orderFormData.productId);
                            if (!product) return;
                            const newOrder: Order = {
                                id: Math.random().toString(36).substr(2, 9),
                                ...orderFormData,
                                items: [{ productId: product.id, productName: product.name, quantity: orderFormData.quantity, price: product.price }],
                                totalAmount: product.price * orderFormData.quantity,
                                date: new Date().toISOString(),
                                status: 'Pending'
                            };
                            setOrders([newOrder, ...orders]);
                            setProducts(products.map(p => p.id === product.id ? { ...p, stock: p.stock - orderFormData.quantity } : p));
                            setIsOrderModalOpen(false);
                        }}>
                            <GlassInput placeholder="Customer Name" required value={orderFormData.customerName} onChange={e => setOrderFormData({ ...orderFormData, customerName: e.target.value })} />
                            <GlassInput placeholder="Phone" required value={orderFormData.customerPhone} onChange={e => setOrderFormData({ ...orderFormData, customerPhone: e.target.value })} />
                            <GlassSelect required value={orderFormData.productId} onChange={e => setOrderFormData({ ...orderFormData, productId: e.target.value })}>
                                <option value="" className="bg-neutral-900">Select Product</option>
                                {products.map(p => <option key={p.id} value={p.id} className="bg-neutral-900">{p.name} (Stock: {p.stock})</option>)}
                            </GlassSelect>
                            <GlassInput type="number" min="1" value={orderFormData.quantity} onChange={e => setOrderFormData({ ...orderFormData, quantity: Number(e.target.value) })} />
                            <button className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-white mt-4">Confirm Order</button>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
