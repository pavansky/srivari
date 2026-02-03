"use client";

import { useState } from 'react';
import { Product } from '@/types';
import { products as initialProducts } from '@/data/products';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Video } from 'lucide-react';
import Image from 'next/image';

export default function AdminDashboard() {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [isEditing, setIsEditing] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        price: 0,
        description: '',
        category: '',
        stock: 0,
        images: [''],
        video: '',
        isFeatured: false
    });

    const resetForm = () => {
        setFormData({
            name: '',
            price: 0,
            description: '',
            category: '',
            stock: 0,
            images: [''],
            video: '',
            isFeatured: false
        });
        setIsEditing(null);
    };

    const handleEdit = (product: Product) => {
        setFormData({ ...product });
        setIsEditing(product.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            setProducts(products.map(p => p.id === isEditing ? { ...formData, id: isEditing } as Product : p));
        } else {
            const newProduct = {
                ...formData,
                id: Math.random().toString(36).substr(2, 9),
            } as Product;
            setProducts([newProduct, ...products]);
        }
        resetForm();
    };

    const updateImage = (index: number, value: string) => {
        const newImages = [...(formData.images || [])];
        newImages[index] = value;
        setFormData({ ...formData, images: newImages });
    };

    const addImageField = () => {
        setFormData({ ...formData, images: [...(formData.images || []), ''] });
    };

    return (
        <div className="min-h-screen pt-24 px-6 md:px-12 bg-obsidian text-marble">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-serif text-gold mb-8">Admin Dashboard</h1>

                {/* Product Form */}
                <div className="glass-card p-8 rounded-lg mb-12 border border-white/10">
                    <h2 className="text-2xl font-serif text-gold mb-6 flex items-center gap-2">
                        {isEditing ? <Edit2 size={24} /> : <Plus size={24} />}
                        {isEditing ? 'Edit Product' : 'Add New Product'}
                    </h2>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-marble/60 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 p-3 rounded text-marble focus:border-gold outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-marble/60 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded text-marble focus:border-gold outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-marble/60 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded text-marble focus:border-gold outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-marble/60 mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 p-3 rounded text-marble focus:border-gold outline-none"
                                >
                                    <option value="" className="bg-obsidian">Select Category</option>
                                    <option value="Silk" className="bg-obsidian">Silk</option>
                                    <option value="Banarasi" className="bg-obsidian">Banarasi</option>
                                    <option value="Cotton" className="bg-obsidian">Cotton</option>
                                    <option value="Mysore Silk" className="bg-obsidian">Mysore Silk</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/10">
                                <input
                                    type="checkbox"
                                    checked={formData.isFeatured}
                                    onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                                    className="w-5 h-5 accent-gold"
                                    id="featured"
                                />
                                <label htmlFor="featured" className="cursor-pointer select-none">Mark as Featured Product</label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-marble/60 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 p-3 rounded text-marble focus:border-gold outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-marble/60 mb-1 flex justify-between">
                                    <span>Images (URL)</span>
                                    <button type="button" onClick={addImageField} className="text-xs text-gold hover:underline">+ Add Another</button>
                                </label>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {formData.images?.map((img, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <div className="bg-white/5 p-2 rounded text-marble/50"><ImageIcon size={18} /></div>
                                            <input
                                                type="text"
                                                value={img}
                                                onChange={e => updateImage(idx, e.target.value)}
                                                placeholder="https://..."
                                                className="w-full bg-white/5 border border-white/10 p-2 rounded text-sm text-marble focus:border-gold outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-marble/60 mb-1">Video (URL) - Optional</label>
                                <div className="flex gap-2">
                                    <div className="bg-white/5 p-2 rounded text-marble/50"><Video size={18} /></div>
                                    <input
                                        type="text"
                                        value={formData.video || ''}
                                        onChange={e => setFormData({ ...formData, video: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-white/5 border border-white/10 p-2 rounded text-sm text-marble focus:border-gold outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3 rounded text-marble/60 hover:text-white flex items-center gap-2"
                                >
                                    <X size={20} /> Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                className="bg-gold text-obsidian font-serif font-bold px-8 py-3 rounded hover:bg-white transition-all flex items-center gap-2"
                            >
                                <Save size={20} /> {isEditing ? 'Update Product' : 'Add Product'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Inventory List */}
                <h2 className="text-2xl font-serif text-gold mb-6">Inventory ({products.length})</h2>
                <div className="grid grid-cols-1 gap-4">
                    {products.map((product) => (
                        <div key={product.id} className="glass-card p-4 rounded-lg flex flex-col md:flex-row items-center gap-6 border border-white/5 hover:border-gold/30 transition-colors">
                            <div className="w-full md:w-20 h-20 relative rounded overflow-hidden bg-white/5 flex-shrink-0">
                                {product.images[0] && (
                                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                                )}
                            </div>

                            <div className="flex-grow text-center md:text-left">
                                <h3 className="text-lg font-medium text-white mb-1">{product.name}</h3>
                                <p className="text-sm text-marble/60 mb-2">{product.category} • ₹{product.price.toLocaleString('en-IN')}</p>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    <span className={`text-xs px-2 py-1 rounded border ${product.stock > 0 ? 'border-green-500/50 text-green-400' : 'border-red-500/50 text-red-400'}`}>
                                        Stock: {product.stock}
                                    </span>
                                    {product.isFeatured && (
                                        <span className="text-xs px-2 py-1 rounded border border-gold/50 text-gold">Featured</span>
                                    )}
                                    {product.video && (
                                        <span className="text-xs px-2 py-1 rounded border border-blue-500/50 text-blue-400">Video</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleEdit(product)}
                                    className="p-2 rounded bg-white/5 hover:bg-gold/20 text-marble hover:text-gold transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 rounded bg-white/5 hover:bg-red-500/20 text-marble hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {products.length === 0 && (
                        <p className="text-center text-marble/40 py-12">No products found. Add one above.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
