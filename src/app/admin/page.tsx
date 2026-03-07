"use client";

import { useState, useEffect } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { Product, Order, Supplier } from '@/types';
import { products as initialProducts } from '@/data/products';
import { Plus, Search, MapPin, Check, PlusCircle, ArrowUpDown, ChevronDown, Save, X, Eye, Edit2, Trash2, Box, Users, Settings, LogOut, Package, TrendingUp, DollarSign, Clock, Calendar, BarChart3, Activity, Command, Layers, Truck, Filter, Download, ArrowUpRight, CheckSquare, Square, CheckCircle2, History, Link as LinkIcon, AlertCircle, ImageIcon, Copy, ExternalLink, Image as LucideImage, Zap, LayoutGrid, Paintbrush, Code, Loader2, PlayCircle, EyeOff, Tag, Upload, SearchCode, Sparkles, Repeat, Wand2, PlusSquare, MinusSquare, BoxSelect, Archive, FileText, Smartphone, AlignLeft, Bold, Italic, Link2, ListOrdered, List, Play, Type, AlignCenter, AlignRight, FileJson, Minus, Moon, Sun, Home, ShoppingCart, AlertTriangle } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import SrivariImage from '@/components/SrivariImage';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import Script from 'next/script';

// --- Global Helpers ---
const calculateMargin = (selling: number, cost: number = 0, shipping: number = 0) => {
    const totalCost = cost + shipping;
    const profit = selling - totalCost;
    const margin = selling > 0 ? (profit / selling) * 100 : 0;
    return { profit, margin };
};
// --- Reusable Glass Components ---
const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-gradient-to-br from-[#111111]/95 to-[#080808]/95 backdrop-blur-3xl border border-white/[0.08] rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.05)] relative overflow-hidden group/card ${className}`}>
        {/* Top highlight line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent pointer-events-none" />
        {/* Inner glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none rounded-2xl" />
        {children}
    </div>
);

const GlassInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className={`w-full bg-black/50 border border-white/[0.08] p-4 rounded-xl text-white placeholder-white/25 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 focus:bg-black/70 hover:border-white/15 outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] font-sans text-sm ${props.className || ''}`}
    />
);

const GlassSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select
        {...props}
        className={`w-full bg-black/50 border border-white/[0.08] p-4 rounded-xl text-white focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 hover:border-white/15 outline-none transition-all duration-300 appearance-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] font-sans text-sm ${props.className || ''}`}
    />
);

export default function AdminDashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
    const [isLightMode, setIsLightMode] = useState(false);
    const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'analytics' | 'suppliers'>('inventory');
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<any[]>([]);
    const [selectedProductName, setSelectedProductName] = useState('');

    // Supplier Form State
    const [isSupplierEditing, setIsSupplierEditing] = useState<string | null>(null);
    const [supplierFormData, setSupplierFormData] = useState<Partial<Supplier>>({
        name: '', contactName: '', email: '', phone: '', address: '', notes: ''
    });
    const [supplierSearch, setSupplierSearch] = useState('');
    
    // Inventory Filtering & Sorting State
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [supplierFilter, setSupplierFilter] = useState('');
    const [stockFilter, setStockFilter] = useState('all'); // 'all', 'in-stock', 'low-stock', 'out-of-stock'
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price-desc', 'price-asc', 'stock-desc', 'stock-asc', 'margin-desc'
    
    // Bulk Selection State
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [bulkSupplierId, setBulkSupplierId] = useState('');

    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [commandQuery, setCommandQuery] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryInput, setNewCategoryInput] = useState("");

    // Form State
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '', sku: '', barcode: '', price: 0, description: '', category: '', stock: 0, lowStockThreshold: 5, locationBin: '', images: [''], video: '', isFeatured: false,
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

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        cancelText: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'info';
    } | null>(null);

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
            const t = Date.now();
            const [pRes, oRes, sRes] = await Promise.all([
                fetch(`/api/products?archived=true&t=${t}`),
                fetch(`/api/orders?t=${t}`),
                fetch(`/api/admin/suppliers?t=${t}`)
            ]);

            if (pRes.ok) {
                setProducts(await pRes.json());
            } else {
                const errData = await pRes.json();
                setError(`Failed to load products: ${errData.details || errData.error || pRes.statusText}`);
                console.error("Product Fetch Error:", errData);
            }

            if (oRes.ok) setOrders(await oRes.json());
            if (sRes.ok) setSuppliers(await sRes.json());

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

    // Control Particle Background visibility
    useEffect(() => {
        const toggleParticles = new CustomEvent('toggleParticles', {
            detail: { hide: activeTab === 'inventory' }
        });
        window.dispatchEvent(toggleParticles);

        return () => {
            const resetParticles = new CustomEvent('toggleParticles', {
                detail: { hide: false }
            });
            window.dispatchEvent(resetParticles);
        };
    }, [activeTab]);

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
            price: Number(formData.price) || 0,
            stock: parseInt(String(formData.stock)) || 0,
            lowStockThreshold: parseInt(String(formData.lowStockThreshold)) || 5,
            priceCps: Number(formData.priceCps) || 0,
            shipping: Number(formData.shipping) || 0,
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
                // Show Success Toast Instead of Alert
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-10 right-10 bg-[#D4AF37] text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(212,175,55,0.4)] z-50 animate-bounce cursor-pointer flex items-center gap-2';
                toast.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Artifact Saved Successfully`;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 4000);
            } else {
                const errData = await res.json();
                alert(`Failed to save product: ${errData.details || errData.error || res.statusText}`);
            }
        } catch (err) {
            alert("Error saving product");
        }
    };

    const resetForm = () => {
        setFormData({ name: '', sku: '', barcode: '', price: 0, description: '', category: '', stock: 0, lowStockThreshold: 5, locationBin: '', images: [''], video: '', isFeatured: false, priceCps: 0, shipping: 0 });
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

    const viewHistory = async (id: string, name: string) => {
        try {
            const res = await fetch(`/api/products/history?id=${id}`);
            if(res.ok) {
                const data = await res.json();
                setSelectedHistory(data);
                setSelectedProductName(name);
                setIsHistoryModalOpen(true);
            }
        } catch(e) { console.error(e) }
    };

    // Derived States
    const filteredProducts = products
        .filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
            const matchesSupplier = supplierFilter ? p.supplierId === supplierFilter : true;
            let matchesStock = true;
            if (stockFilter === 'in-stock') matchesStock = p.stock > 0 && !p.isArchived;
            else if (stockFilter === 'low-stock') matchesStock = p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5) && !p.isArchived;
            else if (stockFilter === 'out-of-stock') matchesStock = p.stock === 0 && !p.isArchived;
            else if (stockFilter === 'archived') matchesStock = p.isArchived;
            else matchesStock = !p.isArchived; // 'all' default

            return matchesSearch && matchesCategory && matchesSupplier && matchesStock;
        })
        .sort((a, b) => {
            const marginA = calculateMargin(a.price, a.priceCps, a.shipping).margin;
            const marginB = calculateMargin(b.price, b.priceCps, b.shipping).margin;

            switch (sortBy) {
                case 'price-desc': return b.price - a.price;
                case 'price-asc': return a.price - b.price;
                case 'stock-desc': return b.stock - a.stock;
                case 'stock-asc': return a.stock - b.stock;
                case 'margin-desc': return marginB - marginA;
                case 'newest':
                default: {
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return timeB - timeA;
                }
            }
        });

    // Helper for Bulk Actions
    const handleBulkArchive = async () => {
        if (selectedProducts.length === 0) return;
        setConfirmDialog({
            isOpen: true,
            title: "Bulk Archive",
            message: `Archive ${selectedProducts.length} items? They won't appear in the storefront but history remains.`,
            confirmText: "Archive Items",
            cancelText: "Cancel",
            type: "warning",
            onConfirm: async () => {
                try {
                    await Promise.all(selectedProducts.map(id => fetch(`/api/products?id=${id}`, { method: 'DELETE' })));
                    setSelectedProducts([]);
                    fetchData();
                    setConfirmDialog(null);
                } catch (err) { alert('Bulk archive failed'); }
            }
        });
    };

    const handleBulkSupplierAssign = async () => {
        if (!bulkSupplierId) return alert('Select a supplier first');
        try {
            await Promise.all(selectedProducts.map(id => {
                const p = products.find(prod => prod.id === id);
                if (!p) return Promise.resolve();
                return fetch('/api/products', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...p, supplierId: bulkSupplierId })
                });
            }));
            setBulkSupplierId('');
            setSelectedProducts([]);
            fetchData();
        } catch (err) { alert('Bulk assign failed'); }
    };

    const handleBulkFeatureToggle = async () => {
        try {
            await Promise.all(selectedProducts.map(id => {
                const p = products.find(prod => prod.id === id);
                if (!p) return Promise.resolve();
                return fetch('/api/products', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...p, isFeatured: !p.isFeatured })
                });
            }));
            setSelectedProducts([]);
            fetchData();
        } catch (err) { alert('Bulk feature toggle failed'); }
    };

    const updateInlineStock = async (productId: string, newStock: number) => {
        if (newStock < 0) return;
        const p = products.find(prod => prod.id === productId);
        if (!p) return;
        
        // Optimistic UI Update
        setProducts(products.map(prod => prod.id === productId ? { ...prod, stock: newStock } : prod));

        try {
            await fetch('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...p, stock: newStock })
            });
        } catch (err) {
            alert('Failed to update stock');
            fetchData(); // Rollback
        }
    };

    // --- Stats Calculation ---
    const totalRevenue = orders
        .filter(o => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0);
    const activeOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Shipped').length;
    const stockValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5));
    const outOfStockProducts = products.filter(p => p.stock === 0);
    const todaysOrders = orders.filter(o => {
        const d = new Date(o.date);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    });

    // --- Analytics Computed ---
    const categoryRevenue = orders
        .filter(o => o.status !== 'Cancelled')
        .reduce((acc, o) => {
            o.items.forEach((item: any) => {
                const product = products.find(p => p.id === item.productId);
                const cat = product?.category || 'Unknown';
                acc[cat] = (acc[cat] || 0) + (item.price * item.quantity);
            });
            return acc;
        }, {} as Record<string, number>);

    const topSellers = orders
        .filter(o => o.status !== 'Cancelled')
        .flatMap(o => o.items)
        .reduce((acc, item: any) => {
            acc[item.productName] = (acc[item.productName] || 0) + item.quantity;
            return acc;
        }, {} as Record<string, number>);
    const topSellersSorted = Object.entries(topSellers)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5);

    const orderFunnel = {
        pending: orders.filter(o => o.status === 'Pending').length,
        shipped: orders.filter(o => o.status === 'Shipped').length,
        delivered: orders.filter(o => o.status === 'Delivered').length,
        cancelled: orders.filter(o => o.status === 'Cancelled').length,
    };

    // --- Activity Feed (derived from orders + products) ---
    const activityFeed = [
        ...orders.slice(0, 5).map(o => ({
            type: 'order' as const,
            text: `Order #${o.id} — ${o.customerName} — ₹${o.totalAmount.toLocaleString()}`,
            status: o.status,
            time: new Date(o.date),
        })),
        ...lowStockProducts.map(p => ({
            type: 'alert' as const,
            text: `Low stock: ${p.name} (${p.stock} left)`,
            status: 'Warning',
            time: new Date(),
        })),
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 8);

    // Revenue sparkline (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
    });
    const dailyRevenue = last7Days.map(day => {
        const dayStr = day.toDateString();
        return orders
            .filter(o => o.status !== 'Cancelled' && new Date(o.date).toDateString() === dayStr)
            .reduce((sum, o) => sum + o.totalAmount, 0);
    });
    const maxDailyRevenue = Math.max(...dailyRevenue, 1);

    // --- Command Palette ---
    const commandActions = [
        { label: 'Go to Inventory', action: () => { setActiveTab('inventory'); setIsCommandPaletteOpen(false); } },
        { label: 'Go to Orders', action: () => { setActiveTab('orders'); setIsCommandPaletteOpen(false); } },
        { label: 'Go to Analytics', action: () => { setActiveTab('analytics'); setIsCommandPaletteOpen(false); } },
        { label: 'Go to Suppliers', action: () => { setActiveTab('suppliers'); setIsCommandPaletteOpen(false); } },
        { label: 'Add New Product', action: () => { setActiveTab('inventory'); resetForm(); setIsCommandPaletteOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
        { label: 'Toggle Dark/Light Mode', action: () => { setIsLightMode(!isLightMode); setIsCommandPaletteOpen(false); } },
        { label: 'Export Products CSV', action: () => { exportCSV('products'); setIsCommandPaletteOpen(false); } },
        { label: 'Import Products CSV', action: () => { document.getElementById('csv-import')?.click(); setIsCommandPaletteOpen(false); } },
        { label: 'Export Orders CSV', action: () => { exportCSV('orders'); setIsCommandPaletteOpen(false); } },
        { label: 'Go to Storefront', action: () => { window.location.href = '/'; } },
    ];
    const filteredCommands = commandActions.filter(c =>
        c.label.toLowerCase().includes(commandQuery.toLowerCase())
    );

    // Keyboard shortcut for command palette
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
                setCommandQuery('');
            }
            if (e.key === 'Escape') setIsCommandPaletteOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // --- CSV Export & Import ---
    const exportCSV = (type: 'products' | 'orders') => {
        let csv = '';
        if (type === 'products') {
            csv = 'SKU,Barcode,Name,Category,Price,Stock,Featured\n' +
                products.map(p => `"${p.sku || ''}","${p.barcode || ''}","${p.name.replace(/"/g, '""')}","${p.category}",${p.price},${p.stock},${p.isFeatured}`).join('\n');
        } else {
            csv = 'OrderID,Customer,Phone,Amount,Status,Date\n' +
                orders.map(o => `"${o.id}","${o.customerName}","${o.customerPhone}",${o.totalAmount},"${o.status}","${o.date}"`).join('\n');
        }
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `srivari-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setConfirmDialog({
            isOpen: true,
            title: "Import CSV",
            message: "Are you sure you want to import this CSV? This will add or update products based on Name/SKU.",
            confirmText: "Import Database",
            cancelText: "Cancel",
            type: "info",
            onConfirm: () => {
                setConfirmDialog(null);
                const reader = new FileReader();
                reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            // Simple CSV parser (doesn't handle commas inside quotes cleanly, but okay for basic use)
            const rows = text.split('\\n');
            const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
            
            const importedProducts = rows.slice(1).filter(r => r.trim()).map(r => {
                // Split by comma ignoring commas inside quotes
                const values = r.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
                const p: any = {};
                headers.forEach((h, i) => {
                    p[h] = values[i];
                });

                return {
                    sku: p.sku || undefined,
                    barcode: p.barcode || undefined,
                    name: p.name || 'Imported Product',
                    category: p.category || 'Uncategorized',
                    price: parseFloat(p.price) || 0,
                    stock: parseInt(p.stock) || 0,
                    description: p.description || 'Imported from CSV',
                    isFeatured: p.featured?.toLowerCase() === 'true',
                    images: [''] // Need an image field for validation downstream
                };
            });

            if (importedProducts.length === 0) return alert("No valid products found in CSV.");

            try {
                // We'd ideally post in chunks for safety, but post the array for now
                const res = await fetch('/api/products/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ products: importedProducts })
                });

                const data = await res.json();
                if (res.ok) {
                    alert(`Import successful: ${data.successful} imported, ${data.failed} failed.`);
                    if (data.errors?.length > 0) {
                        console.error("Import errors:", data.errors);
                    }
                    fetchData();
                } else {
                    alert(`Import failed: ${data.error} - ${data.details || ''}`);
                }
            } catch (err) {
                alert("Network error during import.");
            }
        };
        reader.readAsText(file);
            }
        });
    };

    // --- Markup Helpers ---

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
        <div className={`min-h-screen bg-[#020202] text-gray-200 font-sans selection:bg-[#D4AF37]/30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/20 via-[#020202] to-[#020202] transition-colors duration-500 overflow-x-hidden ${isLightMode ? 'admin-light' : ''}`}>
            {/* --- Top Bar --- */}
            <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-3xl border-b border-white/[0.06] px-6 md:px-12 py-4 flex flex-col md:flex-row items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)] gap-4 transition-colors duration-500">
                {/* Gold accent line at top */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-[#D4AF37] to-[#8C7320] rounded-xl flex items-center justify-center text-black font-serif font-bold text-xl shadow-[0_0_25px_rgba(212,175,55,0.35)]">
                            S
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-serif bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37] bg-clip-text text-transparent leading-tight">Admin Console</h1>
                            <p className="text-white/30 text-[10px] md:text-xs mt-0.5 tracking-[0.15em] uppercase font-sans">Manage your boutique</p>
                        </div>
                    </div>
                </div>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3">
                        <LogOut size={20} />
                        <div>
                            <p className="font-bold">System Error</p>
                            <p className="text-sm opacity-80">{error}</p>
                        </div>
                        <button onClick={fetchData} className="ml-auto bg-red-500/20 px-3 py-1 rounded text-sm hover:bg-red-500/40">Retry</button>
                    </div>
                )}
                <nav className="flex items-center gap-1 md:gap-1.5 flex-wrap justify-center w-full md:w-auto">
                    {/* Theme Toggle */}
                    <button onClick={() => setIsLightMode(!isLightMode)} className="p-2.5 mr-1 rounded-xl hover:bg-white/[0.06] transition-all text-[#D4AF37] border border-transparent hover:border-white/[0.08]" title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}>
                        {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
                    </button>

                    <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${activeTab === 'inventory' ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent'}`}>Inventory</button>
                    <button onClick={() => setActiveTab('orders')} className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${activeTab === 'orders' ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent'}`}>Orders</button>
                    <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${activeTab === 'analytics' ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent'}`}><BarChart3 size={14} className="inline mr-1.5 -mt-0.5" />Analytics</button>
                    <button onClick={() => setActiveTab('suppliers')} className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${activeTab === 'suppliers' ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent'}`}><Users size={14} className="inline mr-1.5 -mt-0.5" />Suppliers</button>

                    <div className="hidden md:block h-6 w-px bg-white/[0.06] mx-2"></div>

                    {/* Home Link */}
                    <Link href="/" className="px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wider text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all flex items-center gap-2 border border-transparent hover:border-emerald-500/20">
                        <Home size={15} /> <span className="hidden sm:inline">Storefront</span>
                    </Link>

                    {/* Exit Link */}
                    <Link href="/" className="px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wider text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center gap-2 border border-transparent hover:border-red-500/20">
                        <LogOut size={15} /> <span className="hidden sm:inline">Exit</span>
                    </Link>

                    {/* Command Palette Hint */}
                    <button onClick={() => { setIsCommandPaletteOpen(true); setCommandQuery(''); }} className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.04] border border-white/[0.06] transition-all ml-1">
                        <Command size={12} /> <span>Ctrl+K</span>
                    </button>
                </nav>
            </header>

            <main className="max-w-7xl mx-auto p-6 md:p-12 space-y-12">

                {/* --- Stats Row --- */}
                <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", glow: "group-hover/card:shadow-[0_0_40px_rgba(52,211,153,0.12)]" },
                        { label: "Active Orders", value: activeOrders, icon: ShoppingCart, color: "text-sky-400", bg: "from-sky-500/20 to-sky-500/5", border: "border-sky-500/20", glow: "group-hover/card:shadow-[0_0_40px_rgba(56,189,248,0.12)]" },
                        { label: "Stock Value", value: `₹${stockValue.toLocaleString()}`, icon: Package, color: "text-[#D4AF37]", bg: "from-[#D4AF37]/20 to-[#D4AF37]/5", border: "border-[#D4AF37]/20", glow: "group-hover/card:shadow-[0_0_40px_rgba(212,175,55,0.12)]" },
                        { label: "Low Stock", value: `${lowStockProducts.length + outOfStockProducts.length}`, icon: AlertTriangle, color: lowStockProducts.length + outOfStockProducts.length > 0 ? "text-amber-400" : "text-green-400", bg: lowStockProducts.length + outOfStockProducts.length > 0 ? "from-amber-500/20 to-amber-500/5" : "from-green-500/20 to-green-500/5", border: lowStockProducts.length + outOfStockProducts.length > 0 ? "border-amber-500/20" : "border-green-500/20", glow: "group-hover/card:shadow-[0_0_40px_rgba(251,191,36,0.12)]" },
                        { label: "Today's Orders", value: todaysOrders.length, icon: Calendar, color: "text-violet-400", bg: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/20", glow: "group-hover/card:shadow-[0_0_40px_rgba(139,92,246,0.12)]" },
                    ].map((stat, idx) => (
                        <GlassCard key={idx} className={`p-5 flex items-center gap-4 hover:border-white/15 transition-all duration-500 ease-out cursor-default ${stat.glow}`}>
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bg} border ${stat.border} ${stat.color} shadow-lg shrink-0`}>
                                <stat.icon size={20} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">{stat.label}</p>
                                <p className={`text-xl md:text-2xl font-bold tracking-tight font-sans ${stat.color}`}>{stat.value}</p>
                            </div>
                        </GlassCard>
                    ))}
                </section>

                {/* --- Inventory Tab --- */}
                {activeTab === 'inventory' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

                        {/* Add/Edit Product Form */}
                        <GlassCard className="p-8 md:p-10 border-[#D4AF37]/20 relative">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                                <Sparkles size={300} />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-serif bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] bg-clip-text text-transparent mb-10 flex items-center gap-4 border-b border-white/10 pb-6 w-full">
                                {isEditing ? <Edit2 size={28} className="text-[#D4AF37]" /> : <Plus size={28} className="text-[#D4AF37]" />}
                                {isEditing ? 'Modify Masterpiece' : 'Add New Masterpiece'}
                            </h2>

                            <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-10 relative z-10">
                                {/* Left Column: Media & Core Info */}
                                <div className="md:col-span-6 space-y-8">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Artifact Name</label>
                                            <GlassInput placeholder="e.g. Royal Kanjivaram Silk" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="text-xl font-serif placeholder:font-sans" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-[#D4AF37] uppercase tracking-widest block mb-2 font-medium flex justify-between">
                                                    <span>SKU</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setFormData({...formData, sku: `SRI-${formData.category?.substring(0,3).toUpperCase() || 'GEN'}-${Math.floor(1000 + Math.random() * 9000)}`})}
                                                        className="text-[9px] hover:text-white transition-colors"
                                                    >
                                                        Auto-Gen
                                                    </button>
                                                </label>
                                                <GlassInput placeholder="Stock Keeping Unit" value={formData.sku || ''} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Barcode (UPC/EAN)</label>
                                                <GlassInput placeholder="Scan or enter barcode" value={formData.barcode || ''} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="relative pt-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs text-white/50 uppercase tracking-widest font-medium">Curator's Description</label>
                                                <button
                                                    type="button"
                                                    onClick={generateAIDescription}
                                                    disabled={isAIWriting}
                                                    className="text-xs flex items-center gap-1.5 text-[#D4AF37] hover:text-[#F2D06B] hover:bg-[#D4AF37]/10 px-3 py-1.5 rounded border border-[#D4AF37]/30 transition-all disabled:opacity-50"
                                                >
                                                    {isAIWriting ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                                    {isAIWriting ? 'Weaving magic...' : 'Auto-Generate Details'}
                                                </button>
                                            </div>
                                            <textarea
                                                placeholder="Enter the exquisite details or let the AI write an enchanting description for you..."
                                                rows={5}
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full bg-[#050505]/60 border border-white/10 p-4 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-white/20 outline-none transition-all duration-300 resize-none font-sans leading-relaxed shadow-inner"
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
                                <div className="md:col-span-6 space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                                        <div className="group col-span-1">
                                            <label className="text-xs text-[#D4AF37] uppercase tracking-widest block mb-2 font-medium">Selling Price</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-serif">₹</span>
                                                <GlassInput type="number" placeholder="0.00" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required className="pl-10 text-lg font-medium" />
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Inventory Stock</label>
                                            <GlassInput type="number" placeholder="Qty" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} required className="text-lg" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-xs text-[#D4AF37] uppercase tracking-widest block mb-2 font-medium" title="Alert when stock falls below this number">Low Stock at</label>
                                            <GlassInput type="number" placeholder="5" value={formData.lowStockThreshold || ''} onChange={e => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })} className="text-lg" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium" title="Physical Warehouse Location">Location Bin</label>
                                            <GlassInput placeholder="Aisle 4..." value={formData.locationBin || ''} onChange={e => setFormData({ ...formData, locationBin: e.target.value })} className="text-lg text-white" />
                                        </div>
                                    </div>

                                    {/* Cost Analysis Row */}
                                    <div className="p-6 rounded-2xl bg-[#050505]/40 border border-white/5 grid grid-cols-2 gap-6 shadow-inner relative overflow-hidden">
                                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                        <div>
                                            <label className="text-xs text-white/40 uppercase block mb-2">Cost Price (CPS)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">₹</span>
                                                <GlassInput type="number" placeholder="0" value={formData.priceCps || ''} onChange={e => setFormData({ ...formData, priceCps: Number(e.target.value) })} className="bg-black/40 pl-9" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/40 uppercase block mb-2">Base Shipping</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">₹</span>
                                                <GlassInput type="number" placeholder="0" value={formData.shipping || ''} onChange={e => setFormData({ ...formData, shipping: Number(e.target.value) })} className="bg-black/40 pl-9" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inline Category Management */}
                                    <div className="pt-2">
                                        <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Product Category</label>
                                        <div className="flex gap-3 h-14">
                                            {isAddingCategory ? (
                                                <div className="flex-1 flex gap-2 animate-in slide-in-from-right duration-300">
                                                    <GlassInput
                                                        autoFocus
                                                        placeholder="New Category Name..."
                                                        value={newCategoryInput}
                                                        onChange={e => setNewCategoryInput(e.target.value)}
                                                    />
                                                    <button type="button" onClick={handleAddCategory} className="bg-emerald-500/20 text-emerald-400 aspect-square h-full rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center justify-center transition-all" aria-label="Confirm new category"><Check size={20} /></button>
                                                    <button type="button" onClick={() => setIsAddingCategory(false)} className="bg-red-500/20 text-red-400 aspect-square h-full rounded-xl border border-red-500/30 hover:bg-red-500/30 flex items-center justify-center transition-all" aria-label="Cancel new category"><X size={20} /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="relative flex-1">
                                                        <GlassSelect value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                                                            <option value="" className="bg-[#0f0f0f]">Select Category</option>
                                                            {categories.map(cat => <option key={cat} value={cat} className="bg-[#0f0f0f]">{cat}</option>)}
                                                        </GlassSelect>
                                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[#D4AF37] pointer-events-none" size={18} />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAddingCategory(true)}
                                                        className="aspect-square h-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] rounded-xl hover:bg-[#D4AF37] hover:text-black transition-all duration-300 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                                                        title="Add New Category"
                                                    >
                                                        <Plus size={22} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Supplier Dropdown */}
                                    <div className="pt-2">
                                        <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Supplier</label>
                                        <div className="relative">
                                            <GlassSelect value={formData.supplierId || ''} onChange={e => setFormData({ ...formData, supplierId: e.target.value || undefined })}>
                                                <option value="" className="bg-[#0f0f0f]">No Supplier</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id} className="bg-[#0f0f0f]">{s.name}</option>)}
                                            </GlassSelect>
                                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[#D4AF37] pointer-events-none" size={18} />
                                        </div>
                                        <p className="text-[10px] text-white/30 mt-1.5">Link this product to a supplier for tracking</p>
                                    </div>

                                    {/* Featured Toggle */}
                                    <div className={`mt-4 flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${formData.isFeatured ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`} onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}>
                                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${formData.isFeatured ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-transparent border-white/30'}`}>
                                            {formData.isFeatured && <Check size={16} className="text-black font-bold" />}
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-sm text-white font-medium select-none block">Highlight as Featured Artifact</span>
                                            <span className="text-xs text-white/40 block mt-0.5">Showcase this masterpiece on the homepage marquee</span>
                                        </div>
                                        {formData.isFeatured && <Sparkles size={24} className="text-[#D4AF37] animate-pulse" />}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-8 flex justify-end gap-5 border-t border-white/10 mt-8">
                                        {isEditing && (
                                            <button type="button" onClick={resetForm} className="px-8 py-3.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all font-medium">Discard Changes</button>
                                        )}
                                        <button type="submit" className="bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-black font-bold px-10 py-3.5 rounded-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                                            <Save size={18} /> {isEditing ? 'Commit Update' : 'Publish Masterpiece'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </GlassCard>

                        {/* Product Grid Header & Filters */}
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-4">
                                <div>
                                    <h3 className="text-xl font-serif text-white">Collection ({filteredProducts.length})</h3>
                                    <p className="text-xs text-white/40 mt-1">Manage your inventory and stock</p>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <input 
                                        type="file" 
                                        id="csv-import"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={handleImportCSV}
                                    />
                                    <button onClick={() => document.getElementById('csv-import')?.click()} className="px-3 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-[#D4AF37] border border-white/10 hover:border-[#D4AF37]/50 transition-all flex items-center gap-1.5 bg-white/[0.02] hover:bg-[#D4AF37]/5">
                                        <Upload size={14} /> Import CSV
                                    </button>
                                    <button onClick={() => exportCSV('products')} className="px-3 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white border border-white/10 hover:border-white/30 transition-all flex items-center gap-1.5 bg-white/[0.02]">
                                        <Download size={14} /> Export
                                    </button>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                    <div className="relative shrink-0">
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                                        <select
                                            className="appearance-none bg-white/[0.03] border border-white/10 text-white text-xs py-2 pl-9 pr-8 rounded-lg outline-none focus:border-[#D4AF37]/50 focus:bg-white/[0.05] transition-all cursor-pointer"
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                        >
                                            <option value="" className="bg-[#0f0f0f]">All Categories</option>
                                            {categories.map(cat => <option key={cat} value={cat} className="bg-[#0f0f0f]">{cat}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={12} />
                                    </div>
                                    <div className="relative shrink-0">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                                        <select
                                            className="appearance-none bg-white/[0.03] border border-white/10 text-white text-xs py-2 pl-9 pr-8 rounded-lg outline-none focus:border-[#D4AF37]/50 focus:bg-white/[0.05] transition-all cursor-pointer"
                                            value={supplierFilter}
                                            onChange={(e) => setSupplierFilter(e.target.value)}
                                        >
                                            <option value="" className="bg-[#0f0f0f]">All Suppliers</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id} className="bg-[#0f0f0f]">{s.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={12} />
                                    </div>
                                    <div className="relative shrink-0">
                                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                                        <select
                                            className="appearance-none bg-white/[0.03] border border-white/10 text-white text-xs py-2 pl-9 pr-8 rounded-lg outline-none focus:border-[#D4AF37]/50 focus:bg-white/[0.05] transition-all cursor-pointer"
                                            value={stockFilter}
                                            onChange={(e) => setStockFilter(e.target.value)}
                                        >
                                            <option value="all" className="bg-[#0f0f0f]">All Active Stock</option>
                                            <option value="in-stock" className="bg-[#0f0f0f]">In Stock ({'>'}0)</option>
                                            <option value="low-stock" className="bg-[#0f0f0f]">Low Stock ({'<'}5)</option>
                                            <option value="out-of-stock" className="bg-[#0f0f0f]">Out of Stock (0)</option>
                                            <option value="archived" className="bg-[#0f0f0f] text-orange-400">Archived Collection</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={12} />
                                    </div>
                                    <div className="relative shrink-0">
                                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/60" size={14} />
                                        <select
                                            className="appearance-none bg-white/[0.03] border border-white/10 text-white text-xs py-2 pl-9 pr-8 rounded-lg outline-none focus:border-[#D4AF37]/50 focus:bg-white/[0.05] transition-all cursor-pointer"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                        >
                                            <option value="newest" className="bg-[#0f0f0f]">Newest First</option>
                                            <option value="price-desc" className="bg-[#0f0f0f]">Price: High to Low</option>
                                            <option value="price-asc" className="bg-[#0f0f0f]">Price: Low to High</option>
                                            <option value="stock-desc" className="bg-[#0f0f0f]">Stock: High to Low</option>
                                            <option value="stock-asc" className="bg-[#0f0f0f]">Stock: Low to High</option>
                                            <option value="margin-desc" className="bg-[#0f0f0f]">Highest Margin</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={12} />
                                    </div>
                                    <GlassInput
                                        className="w-48 py-2 shrink-0 border-white/10"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {/* Bulk Actions Header */}
                            <div className="flex items-center gap-4 py-2 px-1">
                                <button
                                    onClick={() => {
                                        if (selectedProducts.length === filteredProducts.length && filteredProducts.length > 0) {
                                            setSelectedProducts([]);
                                        } else {
                                            setSelectedProducts(filteredProducts.map(p => p.id));
                                        }
                                    }}
                                    className={`flex items-center gap-2 text-sm transition-colors ${selectedProducts.length > 0 && selectedProducts.length === filteredProducts.length ? 'text-[#D4AF37]' : 'text-white/50 hover:text-white'}`}
                                >
                                    {selectedProducts.length > 0 && selectedProducts.length === filteredProducts.length ? <CheckSquare size={16} /> : <Square size={16} />}
                                    Select All
                                </button>
                                
                                <AnimatePresence>
                                    {selectedProducts.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="flex items-center gap-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-4 py-1.5 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                                        >
                                            <span className="text-xs font-bold text-[#D4AF37] border-r border-[#D4AF37]/20 pr-3 mr-1">{selectedProducts.length} Selected</span>
                                            
                                            <button onClick={handleBulkArchive} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors px-2" title="Archive Selected">
                                                <Archive size={12} /> Archive
                                            </button>
                                            
                                            <button onClick={handleBulkFeatureToggle} className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors px-2 border-l border-[#D4AF37]/20" title="Toggle Featured Status">
                                                <Sparkles size={12} /> Toggle Featured
                                            </button>

                                            <div className="flex items-center gap-1 border-l border-[#D4AF37]/20 pl-3">
                                                <select
                                                    className="appearance-none bg-black/40 border border-white/10 text-white text-xs py-1 pl-2 pr-6 rounded outline-none focus:border-[#D4AF37]/50"
                                                    value={bulkSupplierId}
                                                    onChange={(e) => setBulkSupplierId(e.target.value)}
                                                >
                                                    <option value="">Assign To Supplier...</option>
                                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                                <button onClick={handleBulkSupplierAssign} disabled={!bulkSupplierId} className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors disabled:opacity-50">Apply</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                layout
                                            >
                                                <div className="p-5 rounded-xl bg-gradient-to-r from-white/[0.04] to-transparent border border-white/[0.06] hover:border-[#D4AF37]/30 backdrop-blur-md flex items-center gap-6 group transition-all duration-500 shadow-lg hover:shadow-[0_8px_40px_rgba(212,175,55,0.06)] relative overflow-hidden">
                                                    {product.isFeatured && (
                                                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#D4AF37]/20 to-transparent flex justify-end p-2 pointer-events-none">
                                                            <Sparkles size={12} className="text-[#D4AF37]" />
                                                        </div>
                                                    )}
                                                    
                                                    {/* Bulk Selection Checkbox */}
                                                    <button
                                                        onClick={() => {
                                                            if (selectedProducts.includes(product.id)) {
                                                                setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                                                            } else {
                                                                setSelectedProducts([...selectedProducts, product.id]);
                                                            }
                                                        }}
                                                        className={`shrink-0 transition-colors ${selectedProducts.includes(product.id) ? 'text-[#D4AF37]' : 'text-white/20 hover:text-white/50'}`}
                                                    >
                                                        {selectedProducts.includes(product.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                                    </button>

                                                    <div className="w-14 h-14 relative rounded-xl overflow-hidden bg-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all duration-500 border border-white/[0.05] shrink-0">
                                                        <SrivariImage
                                                            src={product.images.find(img => img && img.trim() !== "") || ""}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                    </div>

                                                    <div className="flex-1 grid grid-cols-6 gap-4 items-center min-w-0">
                                                        <div className="col-span-3 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-serif text-lg text-white group-hover:text-[#D4AF37] transition-colors truncate">{product.name}</h4>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {product.sku && <span className="text-[9px] bg-[#D4AF37]/10 text-[#D4AF37] px-1.5 py-0.5 rounded border border-[#D4AF37]/20 font-mono tracking-wider">{product.sku}</span>}
                                                                <p className="text-[10px] tracking-widest uppercase text-white/50 truncate border-l border-white/10 pl-2">{product.category}</p>
                                                                {product.locationBin && <p className="text-[10px] tracking-widest uppercase text-amber-500/70 truncate border-l border-white/10 pl-2" title="Storage Location"><MapPin size={10} className="inline mr-1 -mt-0.5" />{product.locationBin}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Selling</p>
                                                            <p className="font-semibold text-white tracking-wide">₹{product.price.toLocaleString()}</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Stock</p>
                                                            <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => updateInlineStock(product.id, product.stock - 1)} className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors" aria-label="Decrease Stock"><Minus size={12} /></button>
                                                                <div className={`inline-flex items-center justify-center min-w-[30px] h-[30px] rounded-full text-xs font-bold border transition-colors ${product.stock <= (product.lowStockThreshold ?? 5) ? 'border-red-500/30 text-red-400 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
                                                                    {product.stock}
                                                                </div>
                                                                <button onClick={() => updateInlineStock(product.id, product.stock + 1)} className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors" aria-label="Increase Stock"><Plus size={12} /></button>
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Margin</p>
                                                            <span className={`text-xs px-2 py-0.5 rounded border ${margin > 20 ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                                                                {margin.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setFormData(product); setIsEditing(product.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="p-2 hover:bg-white/10 rounded-lg text-[#D4AF37]" aria-label="Edit product"><Edit2 size={18} /></button>
                                                        <button onClick={() => viewHistory(product.id, product.name)} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white" aria-label="View history"><History size={18} /></button>
                                                        {product.isArchived ? (
                                                            <button
                                                                onClick={() => {
                                                                    setConfirmDialog({
                                                                        isOpen: true,
                                                                        title: "Restore Item",
                                                                        message: "Restore this product? It will be visible on the store again.",
                                                                        confirmText: "Restore",
                                                                        cancelText: "Cancel",
                                                                        type: "info",
                                                                        onConfirm: async () => {
                                                                            try {
                                                                                await fetch(`/api/products?id=${product.id}&action=restore`, { method: 'PATCH' });
                                                                                fetchData();
                                                                                setConfirmDialog(null);
                                                                            } catch (err) { alert('Restore failed'); }
                                                                        }
                                                                    });
                                                                }}
                                                                className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-400"
                                                                aria-label="Restore product"
                                                                title="Restore Product"
                                                            >
                                                                <Repeat size={18} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setConfirmDialog({
                                                                        isOpen: true,
                                                                        title: "Archive Item",
                                                                        message: "Archive this product? It will be hidden from the store but accounting records will remain safe.",
                                                                        confirmText: "Archive",
                                                                        cancelText: "Cancel",
                                                                        type: "warning",
                                                                        onConfirm: async () => {
                                                                            try {
                                                                                await fetch(`/api/products?id=${product.id}`, { method: 'DELETE' });
                                                                                fetchData();
                                                                                setConfirmDialog(null);
                                                                            } catch (err) { alert('Archive failed'); }
                                                                        }
                                                                    });
                                                                }}
                                                                className="p-2 hover:bg-orange-500/20 rounded-lg text-orange-400"
                                                                aria-label="Archive product"
                                                                title="Archive Product"
                                                            >
                                                                <Archive size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
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
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                            <div>
                                <h2 className="text-3xl font-serif bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] bg-clip-text text-transparent">Order Ledger</h2>
                                <p className="text-sm text-white/40 mt-1">Track and manage boutique fulfillment</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => exportCSV('orders')} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 hover:bg-white/[0.04]">
                                    <Download size={14} /> Export CSV
                                </button>
                                <button onClick={() => setIsOrderModalOpen(true)} className="bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-black px-6 py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                                    <Plus size={20} /> Record Manual Order
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {orders.map(order => (
                                <GlassCard key={order.id} className="p-8 group hover:border-white/20 transition-all duration-500">
                                    <div className="flex flex-col md:flex-row justify-between items-start mb-6 border-b border-white/5 pb-6 gap-6">
                                        <div>
                                            <p className="text-xs text-[#D4AF37] mb-2 tracking-widest uppercase font-semibold">Order #{order.id}</p>
                                            <h3 className="font-serif text-2xl text-white tracking-wide">{order.customerName}</h3>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-xs text-white/40">{new Date(order.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                {order.customerPhone && <span className="text-xs text-white/30 px-2 py-0.5 rounded-full border border-white/10">{order.customerPhone}</span>}
                                            </div>
                                            {/* Customer Insights */}
                                            {(() => {
                                                const customerOrders = orders.filter(o => o.customerPhone === order.customerPhone && o.status !== 'Cancelled');
                                                const totalSpend = customerOrders.reduce((s, o) => s + o.totalAmount, 0);
                                                return customerOrders.length > 1 ? (
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <span className="text-[10px] px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                            <Repeat size={10} /> Repeat Buyer
                                                        </span>
                                                        <span className="text-[10px] text-white/30">
                                                            {customerOrders.length} orders · ₹{totalSpend.toLocaleString()} lifetime
                                                        </span>
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                        <div className="text-left md:text-right">
                                            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Total Amount</p>
                                            <p className="text-3xl font-bold text-white tracking-tight mb-4">₹{order.totalAmount.toLocaleString()}</p>
                                            <div className="relative inline-block">
                                                <select
                                                    aria-label="Order Status"
                                                    value={order.status}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value as any;
                                                        const updatedOrder = { ...order, status: newStatus };
                                                        setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
                                                        try {
                                                            await fetch('/api/orders', {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify(updatedOrder)
                                                            });
                                                            fetchData();
                                                        } catch (err) {
                                                            alert("Failed to update order");
                                                            fetchData();
                                                        }
                                                    }}
                                                    className={`appearance-none text-xs font-bold py-2 pl-4 pr-10 rounded-full border bg-[#050505]/80 outline-none cursor-pointer shadow-inner transition-colors ${order.status === 'Delivered' ? 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10' :
                                                        order.status === 'Cancelled' ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' :
                                                            order.status === 'Shipped' ? 'border-blue-500/50 text-blue-400 hover:bg-blue-500/10' :
                                                                'border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                                                        }`}
                                                >
                                                    <option className="bg-[#0f0f0f]" value="Pending">Pending Validation</option>
                                                    <option className="bg-[#0f0f0f]" value="Shipped">In Transit (Shipped)</option>
                                                    <option className="bg-[#0f0f0f]" value="Delivered">Successfully Delivered</option>
                                                    <option className="bg-[#0f0f0f]" value="Cancelled">Cancelled Order</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" size={14} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Timeline */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between relative">
                                            <div className="absolute top-3 left-0 right-0 h-0.5 bg-white/10" />
                                            {['Pending', 'Shipped', 'Delivered'].map((step, i) => {
                                                const steps = ['Pending', 'Shipped', 'Delivered'];
                                                const currentIdx = steps.indexOf(order.status);
                                                const isCancelled = order.status === 'Cancelled';
                                                const isActive = !isCancelled && i <= currentIdx;
                                                const isCurrent = !isCancelled && i === currentIdx;
                                                return (
                                                    <div key={step} className="relative z-10 flex flex-col items-center gap-1.5">
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isCancelled ? 'border-red-500/50 bg-red-500/10' :
                                                            isActive ? 'border-[#D4AF37] bg-[#D4AF37]/20' :
                                                                'border-white/20 bg-white/5'
                                                            } ${isCurrent ? 'shadow-[0_0_12px_rgba(212,175,55,0.4)] scale-110' : ''}`}>
                                                            {isActive && !isCancelled && <Check size={12} className="text-[#D4AF37]" />}
                                                            {isCancelled && i === 0 && <X size={12} className="text-red-400" />}
                                                        </div>
                                                        <span className={`text-[9px] uppercase tracking-wider font-bold ${isActive && !isCancelled ? 'text-[#D4AF37]' : 'text-white/30'
                                                            }`}>{step}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-3 bg-white/[0.02] p-6 rounded-xl border border-white/5">
                                        <h4 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-4">Line Items</h4>
                                        {order.items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                                    <span className="text-white/80">{item.productName}</span>
                                                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/50 border border-white/5">x{item.quantity}</span>
                                                </div>
                                                <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* --- Analytics Tab --- */}
                {activeTab === 'analytics' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="border-b border-white/10 pb-6">
                            <h2 className="text-3xl font-serif bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] bg-clip-text text-transparent">Business Intelligence</h2>
                            <p className="text-sm text-white/40 mt-1">Revenue trends, top performers, and order analytics</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Revenue Sparkline */}
                            <GlassCard className="p-8">
                                <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2"><TrendingUp size={14} /> 7-Day Revenue</h3>
                                <div className="flex items-end gap-2 h-40">
                                    {dailyRevenue.map((rev, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                            <span className="text-[9px] text-white/40 font-mono">{rev > 0 ? `₹${(rev / 1000).toFixed(0)}k` : ''}</span>
                                            <div
                                                className="w-full rounded-t-lg bg-gradient-to-t from-[#D4AF37]/80 to-[#F2D06B]/60 transition-all duration-700 hover:from-[#D4AF37] hover:to-[#F2D06B] cursor-default relative group"
                                                style={{ height: `${Math.max((rev / maxDailyRevenue) * 100, 4)}%`, minHeight: '4px' }}
                                            >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-[#D4AF37] text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#D4AF37]/30">
                                                    ₹{rev.toLocaleString()}
                                                </div>
                                            </div>
                                            <span className="text-[9px] text-white/30">{last7Days[i].toLocaleDateString(undefined, { weekday: 'short' })}</span>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>

                            {/* Order Funnel */}
                            <GlassCard className="p-8">
                                <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2"><Activity size={14} /> Order Funnel</h3>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Pending', count: orderFunnel.pending, color: 'bg-[#D4AF37]', total: orders.length },
                                        { label: 'Shipped', count: orderFunnel.shipped, color: 'bg-blue-500', total: orders.length },
                                        { label: 'Delivered', count: orderFunnel.delivered, color: 'bg-emerald-500', total: orders.length },
                                        { label: 'Cancelled', count: orderFunnel.cancelled, color: 'bg-red-500', total: orders.length },
                                    ].map(f => (
                                        <div key={f.label} className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-white/60">{f.label}</span>
                                                <span className="text-white/80 font-bold">{f.count}</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className={`h-full ${f.color} rounded-full transition-all duration-700`} style={{ width: `${f.total > 0 ? (f.count / f.total) * 100 : 0}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>

                            {/* Top Sellers */}
                            <GlassCard className="p-8">
                                <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2"><ArrowUpRight size={14} /> Top Sellers</h3>
                                {topSellersSorted.length > 0 ? (
                                    <div className="space-y-3">
                                        {topSellersSorted.map(([name, qty], i) => (
                                            <div key={name} className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-white/60'}`}>{i + 1}</span>
                                                <span className="flex-1 text-sm text-white/80 truncate">{name}</span>
                                                <span className="text-xs font-bold text-[#D4AF37]">{qty} sold</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-white/30 text-sm">No sales data yet.</p>
                                )}
                            </GlassCard>

                            {/* Category Breakdown */}
                            <GlassCard className="p-8">
                                <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2"><BarChart3 size={14} /> Revenue by Category</h3>
                                {Object.keys(categoryRevenue).length > 0 ? (
                                    <div className="space-y-3">
                                        {Object.entries(categoryRevenue)
                                            .sort((a, b) => (b[1] as number) - (a[1] as number))
                                            .map(([cat, rev]) => {
                                                const maxCatRev = Math.max(...Object.values(categoryRevenue), 1);
                                                return (
                                                    <div key={cat} className="space-y-1.5">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-white/60">{cat}</span>
                                                            <span className="text-white/80 font-bold">₹{rev.toLocaleString()}</span>
                                                        </div>
                                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] rounded-full transition-all duration-700" style={{ width: `${(rev / maxCatRev) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                ) : (
                                    <p className="text-white/30 text-sm">No categorized revenue yet.</p>
                                )}
                            </GlassCard>
                        </div>

                        {/* Activity Feed */}
                        <GlassCard className="p-8">
                            <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2"><Clock size={14} /> Recent Activity</h3>
                            <div className="space-y-4">
                                {activityFeed.length > 0 ? activityFeed.map((event, i) => (
                                    <div key={i} className="flex items-start gap-3 group">
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${event.type === 'alert' ? 'bg-amber-400' : event.status === 'Delivered' ? 'bg-emerald-400' : event.status === 'Cancelled' ? 'bg-red-400' : 'bg-[#D4AF37]'}`} />
                                        <div className="flex-1">
                                            <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors">{event.text}</p>
                                            <p className="text-[10px] text-white/30 mt-0.5">{event.time.toLocaleString()}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider shrink-0 ${event.type === 'alert' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                            event.status === 'Delivered' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                                                event.status === 'Cancelled' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                                                    'text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10'
                                            }`}>
                                            {event.status}
                                        </span>
                                    </div>
                                )) : (
                                    <p className="text-white/30 text-sm">No recent activity.</p>
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </main>

            {/* Manual Order Modal */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <GlassCard className="max-w-xl w-full p-10 border-[#D4AF37]/50 shadow-[0_0_50px_rgba(212,175,55,0.15)]">
                        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                            <div>
                                <h3 className="text-2xl text-[#D4AF37] font-serif">Record Manual Order</h3>
                                <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">In-store or telephone purchase</p>
                            </div>
                            <button onClick={() => setIsOrderModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors" aria-label="Close order modal"><X className="text-white/50 hover:text-white" size={20} /></button>
                        </div>

                        <form className="space-y-6" onSubmit={async (e) => {
                            e.preventDefault();
                            const product = products.find(p => p.id === orderFormData.productId);
                            if (!product) return alert('Select a valid product');
                            if (product.stock < orderFormData.quantity) return alert('Not enough stock available');

                            const newOrderStr = {
                                customerName: orderFormData.customerName,
                                customerPhone: orderFormData.customerPhone,
                                customerEmail: orderFormData.customerEmail || 'manual@srivaristore.com',
                                items: [{ productId: product.id, productName: product.name, quantity: orderFormData.quantity, price: product.price }],
                                totalAmount: product.price * orderFormData.quantity,
                                paymentId: 'MANUAL_' + Math.random().toString(36).substring(2, 9).toUpperCase()
                            };

                            try {
                                const res = await fetch('/api/orders/create', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(newOrderStr)
                                });

                                if (!res.ok) throw new Error(await res.text());

                                // Show Success Toast
                                const toast = document.createElement('div');
                                toast.className = 'fixed bottom-10 right-10 bg-green-500 text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(74,222,128,0.4)] z-50 animate-bounce cursor-pointer flex items-center gap-2';
                                toast.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Manual Order Pushed to Ledger`;
                                document.body.appendChild(toast);
                                setTimeout(() => toast.remove(), 4000);

                                fetchData(); // Refresh data to get latest DB stock & orders
                                setIsOrderModalOpen(false);
                                setOrderFormData({ customerName: '', customerPhone: '', customerEmail: '', productId: '', quantity: 1 });
                            } catch (err) {
                                alert('Error creating order: ' + err);
                            }
                        }}>
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Customer Name</label>
                                        <GlassInput placeholder="Full Name" required value={orderFormData.customerName} onChange={e => setOrderFormData({ ...orderFormData, customerName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Phone Number</label>
                                        <GlassInput placeholder="+91..." required value={orderFormData.customerPhone} onChange={e => setOrderFormData({ ...orderFormData, customerPhone: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-[#D4AF37] uppercase tracking-widest block mb-2 font-medium flex justify-between">
                                        <span>Select Artifact</span>
                                        {orderFormData.productId && <span className="text-white/50">In Stock: {products.find(p => p.id === orderFormData.productId)?.stock || 0}</span>}
                                    </label>
                                    <div className="relative">
                                        <GlassSelect required value={orderFormData.productId} onChange={e => setOrderFormData({ ...orderFormData, productId: e.target.value })}>
                                            <option value="" className="bg-[#0f0f0f]">-- Browse Catalog --</option>
                                            {products.filter(p => p.stock > 0).map(p => <option key={p.id} value={p.id} className="bg-[#0f0f0f]">{p.name} - ₹{p.price}</option>)}
                                        </GlassSelect>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]" size={18} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Quantity</label>
                                    <GlassInput type="number" min="1" max={products.find(p => p.id === orderFormData.productId)?.stock || 1} required value={orderFormData.quantity} onChange={e => setOrderFormData({ ...orderFormData, quantity: Number(e.target.value) })} className="text-center font-bold text-xl" />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-black font-bold py-4 rounded-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] mt-8 transition-transform transform hover:-translate-y-0.5 uppercase tracking-widest">
                                Finalize Transaction
                            </button>
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

            {/* --- Suppliers Tab --- */}
            {activeTab === 'suppliers' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {/* Supplier Form */}
                    <GlassCard className="p-8 md:p-10 border-[#D4AF37]/20">
                        <h2 className="text-2xl md:text-3xl font-serif bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] bg-clip-text text-transparent mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
                            {isSupplierEditing ? <Edit2 size={28} className="text-[#D4AF37]" /> : <Plus size={28} className="text-[#D4AF37]" />}
                            {isSupplierEditing ? 'Edit Supplier' : 'Add New Supplier'}
                        </h2>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                const res = await fetch('/api/admin/suppliers', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        ...supplierFormData,
                                        id: isSupplierEditing || undefined
                                    })
                                });
                                if (res.ok) {
                                    await fetchData();
                                    setSupplierFormData({ name: '', contactName: '', email: '', phone: '', address: '', notes: '' });
                                    setIsSupplierEditing(null);
                                    const toast = document.createElement('div');
                                    toast.className = 'fixed bottom-10 right-10 bg-[#D4AF37] text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(212,175,55,0.4)] z-50 animate-bounce';
                                    toast.textContent = '✓ Supplier Saved';
                                    document.body.appendChild(toast);
                                    setTimeout(() => toast.remove(), 3000);
                                } else {
                                    const errData = await res.json();
                                    alert(`Failed: ${errData.error}`);
                                }
                            } catch { alert('Error saving supplier'); }
                        }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Company / Supplier Name *</label>
                                <GlassInput placeholder="e.g. Kanjivaram Weavers Co-op" value={supplierFormData.name || ''} onChange={e => setSupplierFormData({ ...supplierFormData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Contact Person</label>
                                <GlassInput placeholder="e.g. Ramesh Kumar" value={supplierFormData.contactName || ''} onChange={e => setSupplierFormData({ ...supplierFormData, contactName: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Phone</label>
                                <GlassInput placeholder="+91 98765 43210" value={supplierFormData.phone || ''} onChange={e => setSupplierFormData({ ...supplierFormData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Email</label>
                                <GlassInput type="email" placeholder="supplier@example.com" value={supplierFormData.email || ''} onChange={e => setSupplierFormData({ ...supplierFormData, email: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Address</label>
                                <GlassInput placeholder="Full postal address" value={supplierFormData.address || ''} onChange={e => setSupplierFormData({ ...supplierFormData, address: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-white/50 uppercase tracking-widest block mb-2 font-medium">Notes</label>
                                <textarea
                                    placeholder="Any internal notes about this supplier..."
                                    rows={3}
                                    value={supplierFormData.notes || ''}
                                    onChange={e => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                                    className="w-full bg-black/50 border border-white/[0.08] p-4 rounded-xl text-white placeholder-white/25 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 hover:border-white/15 outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] font-sans text-sm resize-none"
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-4 pt-4 border-t border-white/10">
                                {isSupplierEditing && (
                                    <button type="button" onClick={() => { setSupplierFormData({ name: '', contactName: '', email: '', phone: '', address: '', notes: '' }); setIsSupplierEditing(null); }} className="px-8 py-3 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all font-medium">Cancel</button>
                                )}
                                <button type="submit" className="bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-black font-bold px-10 py-3.5 rounded-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                                    <Save size={18} /> {isSupplierEditing ? 'Update Supplier' : 'Add Supplier'}
                                </button>
                            </div>
                        </form>
                    </GlassCard>

                    {/* Supplier List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-serif text-white">Supplier Directory</h3>
                            <GlassInput className="w-64 py-2" placeholder="Search suppliers..." value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} />
                        </div>

                        {suppliers.length === 0 ? (
                            <GlassCard className="p-12 text-center">
                                <Users size={48} className="mx-auto text-white/20 mb-4" />
                                <h4 className="text-lg font-serif text-white/60 mb-2">No Suppliers Yet</h4>
                                <p className="text-sm text-white/30">Add your first supplier using the form above.</p>
                            </GlassCard>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                <AnimatePresence>
                                    {suppliers
                                        .filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()) || (s.contactName || '').toLowerCase().includes(supplierSearch.toLowerCase()))
                                        .map(supplier => {
                                            const linkedProducts = products.filter(p => p.supplierId === supplier.id);
                                            return (
                                                <motion.div key={supplier.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} layout>
                                                    <div className="p-5 rounded-xl bg-gradient-to-r from-white/[0.04] to-transparent border border-white/[0.06] hover:border-[#D4AF37]/30 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center gap-4 group transition-all duration-500">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shrink-0 font-serif text-xl font-bold">
                                                            {supplier.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-serif text-lg text-white group-hover:text-[#D4AF37] transition-colors truncate">{supplier.name}</h4>
                                                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                                                {supplier.contactName && <span className="text-xs text-white/40">{supplier.contactName}</span>}
                                                                {supplier.phone && <span className="text-xs text-white/30 px-2 py-0.5 rounded-full border border-white/10">{supplier.phone}</span>}
                                                                {supplier.email && <span className="text-xs text-white/30">{supplier.email}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="text-center px-4">
                                                            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Products</p>
                                                            <span className={`inline-flex items-center justify-center min-w-[30px] h-[30px] rounded-full text-xs font-bold border ${linkedProducts.length > 0 ? 'border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 text-white/30 bg-white/5'}`}>
                                                                {linkedProducts.length}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    setSupplierFormData(supplier);
                                                                    setIsSupplierEditing(supplier.id);
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}
                                                                className="p-2 hover:bg-white/10 rounded-lg text-[#D4AF37]" aria-label="Edit supplier"
                                                            ><Edit2 size={18} /></button>
                                                            <button
                                                                onClick={async () => {
                                                                    if (!confirm(`Delete supplier "${supplier.name}"? Products linked to this supplier will be unlinked.`)) return;
                                                                    try {
                                                                        await fetch('/api/admin/suppliers', {
                                                                            method: 'DELETE',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ id: supplier.id })
                                                                        });
                                                                        fetchData();
                                                                    } catch { alert('Delete failed'); }
                                                                }}
                                                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-500" aria-label="Delete supplier"
                                                            ><Trash2 size={18} /></button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Confirm Dialog Modal */}
            <AnimatePresence>
                {confirmDialog?.isOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className={`max-w-md w-full p-8 rounded-2xl border flex flex-col shadow-2xl ${
                                confirmDialog.type === 'danger' ? 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.15)] bg-[#1a0f0f]' :
                                confirmDialog.type === 'warning' ? 'border-orange-500/50 shadow-[0_0_50px_rgba(249,115,22,0.15)] bg-[#1a140f]' :
                                'border-[#D4AF37]/50 shadow-[0_0_50px_rgba(212,175,55,0.15)] bg-[#101010]'
                            }`}
                        >
                            <h3 className={`text-xl font-serif mb-2 ${
                                confirmDialog.type === 'danger' ? 'text-red-400' :
                                confirmDialog.type === 'warning' ? 'text-orange-400' :
                                'text-[#D4AF37]'
                            }`}>{confirmDialog.title}</h3>
                            <p className="text-white/70 text-sm mb-8 leading-relaxed">{confirmDialog.message}</p>
                            
                            <div className="flex gap-4 items-center justify-end">
                                <button
                                    onClick={() => setConfirmDialog(null)}
                                    className="px-5 py-2 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    {confirmDialog.cancelText}
                                </button>
                                <button
                                    onClick={confirmDialog.onConfirm}
                                    className={`px-5 py-2 rounded-xl text-sm justify-center flex items-center gap-2 font-bold transition-all hover:scale-105 active:scale-95 ${
                                        confirmDialog.type === 'danger' ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' :
                                        confirmDialog.type === 'warning' ? 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30' :
                                        'bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30'
                                    }`}
                                >
                                    {confirmDialog.confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* History Modal */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <GlassCard className="max-w-2xl w-full p-8 border-[#D4AF37]/50 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <div>
                                <h3 className="text-xl text-[#D4AF37] font-serif flex items-center gap-2"><History size={20} /> Inventory Audit Log</h3>
                                <p className="text-xs text-white/50 mt-1 uppercase tracking-widest">{selectedProductName}</p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors" aria-label="Close history modal"><X className="text-white/50 hover:text-white" size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {selectedHistory.length === 0 ? (
                                <p className="text-white/40 text-center py-8 text-sm">No transaction history found.</p>
                            ) : (
                                selectedHistory.map((log) => (
                                    <div key={log.id} className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-start gap-4">
                                        <div className={`mt-1 p-2 rounded-full ${log.quantity > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {log.quantity > 0 ? <TrendingUp size={14} /> : <Activity size={14} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h5 className="font-bold text-sm text-white flex items-center gap-2">
                                                    {log.type} 
                                                    <span className={`text-xs ml-2 px-1.5 py-0.5 rounded ${log.quantity > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                        {log.quantity > 0 ? '+' : ''}{log.quantity}
                                                    </span>
                                                </h5>
                                                <span className="text-[10px] text-white/40">{new Date(log.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-xs text-white/60 mb-1">{log.notes || 'No description provided.'}</p>
                                            <div className="flex items-center gap-3 text-[10px] text-white/30 uppercase tracking-wider font-mono">
                                                <span>Actor: {log.actor}</span>
                                                {log.reference && <span>Ref: {log.reference}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Command Palette (Ctrl+K) */}
            <AnimatePresence>
                {isCommandPaletteOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] bg-black/70 backdrop-blur-md"
                        onClick={() => setIsCommandPaletteOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            <div className="flex items-center gap-3 p-4 border-b border-white/10">
                                <Search size={18} className="text-white/30" />
                                <input
                                    autoFocus
                                    value={commandQuery}
                                    onChange={e => setCommandQuery(e.target.value)}
                                    placeholder="Type a command..."
                                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && filteredCommands.length > 0) {
                                            filteredCommands[0].action();
                                        }
                                    }}
                                />
                                <kbd className="text-[10px] text-white/20 border border-white/10 px-1.5 py-0.5 rounded">ESC</kbd>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {filteredCommands.map((cmd, i) => (
                                    <button
                                        key={cmd.label}
                                        onClick={cmd.action}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${i === 0 ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-white/60 hover:bg-white/[0.04] hover:text-white'}`}
                                    >
                                        <Command size={14} className="shrink-0 opacity-40" />
                                        {cmd.label}
                                    </button>
                                ))}
                                {filteredCommands.length === 0 && (
                                    <p className="px-4 py-6 text-sm text-white/30 text-center">No matching commands</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
