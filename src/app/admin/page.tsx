"use client";

import { useState, useEffect } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { Product, Order } from '@/types';
import { products as initialProducts } from '@/data/products';
import {
    Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Video,
    Package, ShoppingCart, TrendingUp, DollarSign, Check, ChevronDown,
    Sparkles, Wand2, Loader2, Upload, LogOut
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SrivariImage from '@/components/SrivariImage';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import Script from 'next/script';

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

    // AI Integration (Standard Fetch)
    const [isAIWriting, setIsAIWriting] = useState(false);

    const generateAIDescription = async () => {
        if (!formData.name) return alert("Please enter a product name first!");
        setIsAIWriting(true);

        const prompt = `Write a description for a saree named "${formData.name}". Category: ${formData.category}. Additional Notes: ${formData.description || 'None'}`;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({ prompt })
            });
            const data = await res.json();

            if (data.error) {
                alert(data.error);
                setFormData(prev => ({ ...prev, description: data.error }));
            } else {
                setFormData(prev => ({ ...prev, description: data.text }));
            }
        } catch (err: any) {
            alert("Network Error: " + err.message);
        } finally {
            setIsAIWriting(false);
        }
    };

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

    // AI Studio State
    const [studioTab, setStudioTab] = useState<'text' | 'image'>('text');
    const [studioStyle, setStudioStyle] = useState('Editorial');
    const [studioImage, setStudioImage] = useState<File | null>(null);
    const [studioPreview, setStudioPreview] = useState<string | null>(null); // For uploaded file preview

    // AI State

    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [imagePrompt, setImagePrompt] = useState("");
    const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

    // --- AI Logic (SDK) ---
    const generateAIDescription = async () => {
        if (!formData.name) return alert("Please enter a product name first!");

        // Construct a prompt context
        const prompt = `Write a description for a saree named "${formData.name}". Category: ${formData.category}. Additional Notes: ${formData.description || 'None'}`;

        await complete(prompt);
    };

    const handleGenerateStudioImage = async () => {
        if (!imagePrompt && !studioImage) return alert("Please explain what you want or upload an image!");
        setIsGeneratingImage(true);

        try {
            const formData = new FormData();
            formData.append('prompt', imagePrompt);
            formData.append('style', studioStyle);
            if (studioImage) formData.append('image', studioImage);

            const res = await fetch('/api/admin/ai-studio-generate', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (data.imageData) {
                // Construct base64 string
                const prefix = data.mimeType === 'image/png' ? 'data:image/png;base64,' : 'data:image/jpeg;base64,';
                setGeneratedPreview(`${prefix}${data.imageData}`);
            } else if (data.error) {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to connect to AI service.");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const [error, setError] = useState<string | null>(null);

    // --- Load Data ---
    const fetchData = async () => {
        setError(null);
        try {
            const [pRes, oRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/orders')
            ]);

            if (pRes.ok) {
                setProducts(await pRes.json());
            } else {
                const errData = await pRes.json();
                setError(`Failed to load products: ${errData.details || errData.error || pRes.statusText}`);
                console.error("Product Fetch Error:", errData);
            }

            if (oRes.ok) setOrders(await oRes.json());

        } catch (error) {
            console.error("Failed to load data", error);
            setError("Network Error: Could not reach API.");
        } finally {
            setIsLoaded(true);
        }
    };

    useEffect(() => {
        const checkAdminAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user?.email === 'support@thesrivari.com') {
                setIsAuthenticated(true);
            } else {
                // Redirect unauthorized
                window.location.href = '/login';
            }
            fetchData();
        };
        checkAdminAuth();
    }, []);

    // Remove legacy localstorage sync
    /* 
    useEffect(() => {
        if (isLoaded) {
           ...
        }
    }, ...); 
    */

    // --- Actions ---
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === 'admin123' || passwordInput === 'srivari') {
            sessionStorage.setItem('srivari_admin_auth', 'true');
            setIsAuthenticated(true);
        } else alert('Access Denied');
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Filter out empty image strings
        const cleanedImages = formData.images?.filter(img => img && img.trim() !== "") || [];
        const productData = {
            ...formData,
            images: cleanedImages,
            id: isEditing || Math.random().toString(36).substr(2, 9)
        };

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            if (res.ok) {
                await fetchData(); // Reload to get fresh list
                resetForm();
            } else {
                alert("Failed to save product");
            }
        } catch (err) {
            alert("Error saving product");
        }
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
    const totalRevenue = orders
        .filter(o => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0);
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
                        <h1 className="text-3xl font-[family-name:var(--font-playfair)] text-[#D4AF37]">Admin Console</h1>
                        <p className="text-white/40 text-sm mt-1">Manage your boutique inventory and orders</p>
                    </div>
                </div>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 flex items-center gap-3">
                        <LogOut size={20} />
                        <div>
                            <p className="font-bold">System Error</p>
                            <p className="text-sm opacity-80">{error}</p>
                        </div>
                        <button onClick={fetchData} className="ml-auto bg-red-500/20 px-3 py-1 rounded text-sm hover:bg-red-500/40">Retry</button>
                    </div>
                )}
                <nav className="flex gap-2">
                    <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'inventory' ? 'bg-white/10 text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}>Inventory</button>
                    <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-white/10 text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}>Orders</button>
                    <div className="h-6 w-px bg-white/10 mx-2"></div>
                    <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center gap-2">
                        <LogOut size={16} /> Exit
                    </Link>
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
                                        <div className="relative">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-medium text-white/60">Description</label>
                                                <button
                                                    type="button"
                                                    onClick={generateAIDescription}
                                                    disabled={isAIWriting}
                                                    className="text-xs flex items-center gap-1.5 text-[#D4AF37] hover:text-white transition-colors disabled:opacity-50"
                                                >
                                                    {isAIWriting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                    {isAIWriting ? 'Streaming...' : 'AI Writing...'}
                                                </button>
                                            </div>
                                            <textarea
                                                placeholder="Enter details or let AI write it for you..."
                                                rows={5}
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-lg text-white placeholder-white/30 focus:border-[#D4AF37] outline-none transition-all resize-none font-sans leading-relaxed"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Images */}
                                    <div className="space-y-3">
                                        <label className="text-xs text-[#D4AF37] uppercase tracking-wider">Visual Assets</label>

                                        {/* URL Inputs */}
                                        {formData.images?.map((img, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <GlassInput value={img} onChange={e => { const n = [...(formData.images ?? [])]; n[idx] = e.target.value; setFormData({ ...formData, images: n }) }} placeholder="Image URL" />
                                            </div>
                                        ))}

                                        <div className="flex gap-2 text-xs">
                                            <button type="button" onClick={() => setFormData({ ...formData, images: [...(formData.images || []), ''] })} className="text-[#D4AF37] hover:underline">+ Add URL</button>
                                            <span className="text-white/20">|</span>

                                            {/* Cloudinary Widget Trigger */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // @ts-ignore
                                                    const widget = window.cloudinary.createUploadWidget(
                                                        {
                                                            cloudName: 'SrivariData',
                                                            uploadPreset: 'uploadPreset',
                                                            folder: 'srivari/products', // Optional organization
                                                            sources: ['local', 'url', 'camera', 'instagram'],
                                                            multiple: false,
                                                            clientAllowedFormats: ['image', 'video'],
                                                            maxImageFileSize: 10000000, // 10MB
                                                            styles: {
                                                                palette: {
                                                                    window: "#000000",
                                                                    sourceBg: "#000000",
                                                                    windowBorder: "#D4AF37",
                                                                    tabIcon: "#D4AF37",
                                                                    inactiveTabIcon: "#555a5f",
                                                                    menuIcons: "#D4AF37",
                                                                    link: "#D4AF37",
                                                                    action: "#D4AF37",
                                                                    inProgress: "#0433ff",
                                                                    complete: "#33ff00",
                                                                    error: "#cc0000",
                                                                    textDark: "#000000",
                                                                    textLight: "#fcfffd"
                                                                },
                                                            }
                                                        },
                                                        (error: any, result: any) => {
                                                            if (!error && result && result.event === "success") {
                                                                console.log('Done! Here is the image info: ', result.info);
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    images: [...(prev.images || []), result.info.secure_url]
                                                                }));
                                                            }
                                                        }
                                                    );
                                                    widget.open();
                                                }}
                                                className="text-[#D4AF37] hover:underline cursor-pointer flex items-center gap-1"
                                            >
                                                <Upload size={12} /> Upload Media
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setIsImageModalOpen(true)}
                                            className="w-full py-3 mt-2 rounded-lg border border-[#D4AF37]/30 text-[#D4AF37] text-sm flex items-center justify-center gap-2 hover:bg-[#D4AF37]/10 transition-colors"
                                        >
                                            <Wand2 size={16} /> Open AI Image Studio
                                        </button>
                                    </div>
                                    <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
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
                                                    <button type="button" onClick={handleAddCategory} className="bg-green-500/20 text-green-400 p-3 rounded-lg border border-green-500/50 hover:bg-green-500/30" aria-label="Confirm new category"><Check size={20} /></button>
                                                    <button type="button" onClick={() => setIsAddingCategory(false)} className="bg-red-500/20 text-red-400 p-3 rounded-lg border border-red-500/50 hover:bg-red-500/30" aria-label="Cancel new category"><X size={20} /></button>
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

                                    {/* Featured Toggle */}
                                    <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}>
                                        <div className={`w-5 h-5 rounded border border-[#D4AF37] flex items-center justify-center transition-colors ${formData.isFeatured ? 'bg-[#D4AF37]' : 'bg-transparent'}`}>
                                            {formData.isFeatured && <Check size={14} className="text-black" />}
                                        </div>
                                        <span className="text-sm text-white select-none">Mark as Featured Product</span>
                                        {formData.isFeatured && <Sparkles size={16} className="text-[#D4AF37] animate-pulse" />}
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
                                        // Debug Log
                                        const displayImg = product.images.find(img => img && img.trim() !== "") || "";
                                        if (!displayImg) console.warn("Missing Image for", product.name, product.images);
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
                                                        <SrivariImage
                                                            src={product.images.find(img => img && img.trim() !== "") || ""}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                        />
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
                                                        <button onClick={() => { setFormData(product); setIsEditing(product.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="p-2 hover:bg-white/10 rounded-lg text-[#D4AF37]" aria-label="Edit product"><Edit2 size={18} /></button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('Delete?')) return;
                                                                try {
                                                                    await fetch(`/api/products?id=${product.id}`, { method: 'DELETE' });
                                                                    fetchData();
                                                                } catch (err) { alert('Delete failed'); }
                                                            }}
                                                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-500"
                                                            aria-label="Delete product"
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
                                                aria-label="Order Status"
                                                value={order.status}
                                                onChange={async (e) => {
                                                    const newStatus = e.target.value as any;
                                                    const updatedOrder = { ...order, status: newStatus };

                                                    // Optimistic Update
                                                    setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));

                                                    try {
                                                        await fetch('/api/orders', {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify(updatedOrder)
                                                        });
                                                        fetchData(); // Sync fully
                                                    } catch (err) {
                                                        alert("Failed to update order");
                                                        fetchData(); // Revert
                                                    }
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
                            <button onClick={() => setIsOrderModalOpen(false)} aria-label="Close order modal"><X className="text-white/50 hover:text-white" /></button>
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
                            setOrderFormData({ customerName: '', customerPhone: '', customerEmail: '', productId: '', quantity: 1 });
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

            {/* AI Image Studio Modal */}
            {isImageModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
                    <GlassCard className="max-w-5xl w-full p-0 border-[#D4AF37]/50 relative overflow-hidden flex flex-col md:flex-row h-[80vh]">

                        {/* Left: Controls */}
                        <div className="w-full md:w-1/3 p-6 border-r border-white/10 overflow-y-auto space-y-6 bg-black/40">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl text-[#D4AF37] font-serif flex items-center gap-2">
                                    <Wand2 className="animate-pulse" /> AI Studio
                                </h3>
                                <button onClick={() => setIsImageModalOpen(false)} className="md:hidden" aria-label="Close studio"><X className="text-white/50" /></button>
                            </div>

                            {/* Mode Support */}
                            <div className="flex p-1 bg-white/5 rounded-lg">
                                <button onClick={() => setStudioTab('text')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${studioTab === 'text' ? 'bg-[#D4AF37] text-black' : 'text-white/50 hover:text-white'}`}>Text to Image</button>
                                <button onClick={() => setStudioTab('image')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${studioTab === 'image' ? 'bg-[#D4AF37] text-black' : 'text-white/50 hover:text-white'}`}>Image Remix</button>
                            </div>

                            {/* Image Upload (Remix Mode) */}
                            <AnimatePresence>
                                {studioTab === 'image' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                                        <label className="text-xs text-white/40 uppercase">Reference Image</label>
                                        <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center transition-colors hover:border-[#D4AF37]/50 relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                aria-label="Upload Reference Image"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setStudioImage(file);
                                                        setStudioPreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                target-lint-error-id="ac502c70-f23e-4f1e-8f46-d61fc22882fa"
                                            />
                                            {studioPreview ? (
                                                <div className="relative h-32 w-full rounded-lg overflow-hidden">
                                                    <Image src={studioPreview} alt="Preview" fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="py-4">
                                                    <Upload className="mx-auto mb-2 text-white/30 group-hover:text-[#D4AF37]" size={24} />
                                                    <p className="text-xs text-white/50">Upload Sketch or Photo</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Prompt Input */}
                            <div className="space-y-2">
                                <label className="text-xs text-white/40 uppercase">Vision Prompt</label>
                                <textarea
                                    placeholder={studioTab === 'text' ? "Describe your masterpiece..." : "Describe how to change this image..."}
                                    rows={4}
                                    value={imagePrompt}
                                    onChange={e => setImagePrompt(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white text-sm focus:border-[#D4AF37] outline-none resize-none placeholder:text-white/20"
                                />
                            </div>

                            {/* Style Presets */}
                            <div className="space-y-3">
                                <label className="text-xs text-white/40 uppercase">Style Presets</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Editorial', 'Flat Lay', 'Texture Macro', 'Ghost Mannequin'].map(style => (
                                        <button
                                            key={style}
                                            onClick={() => setStudioStyle(style)}
                                            className={`p-3 rounded-xl text-xs text-left transition-all border ${studioStyle === style ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'}`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateStudioImage}
                                disabled={isGeneratingImage || (!imagePrompt && !studioImage)}
                                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-black font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 mt-auto"
                            >
                                {isGeneratingImage ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                {isGeneratingImage ? 'Creating Magic...' : 'Generate Studio Shot'}
                            </button>
                        </div>

                        {/* Right: Preview Canvas */}
                        <div className="flex-1 bg-[#0a0a0a] relative flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                            <button onClick={() => setIsImageModalOpen(false)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-colors z-50" aria-label="Close preview"><X size={20} /></button>

                            {generatedPreview ? (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-2xl aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/50 group">
                                    <Image src={generatedPreview} alt="Generated" fill className="object-contain" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6 gap-4">
                                        <button
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, images: [generatedPreview!, ...(prev.images || [])] }));
                                                setIsImageModalOpen(false);
                                            }}
                                            className="bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-8 rounded-xl shadow-lg transition-transform hover:scale-105"
                                        >
                                            Use as Product Image
                                        </button>
                                        <a href={generatedPreview} download="srivari-studio-ai.png" className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl border border-white/20 backdrop-blur-md">
                                            Download
                                        </a>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="text-center space-y-4 opacity-30">
                                    <div className="w-32 h-32 border-2 border-dashed border-white/30 rounded-full flex items-center justify-center mx-auto">
                                        <ImageIcon size={48} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-serif text-white">Canvas Empty</h4>
                                        <p className="text-sm">Configure your settings to generate art.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
