"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Script from "next/script";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check, Edit2, ImageIcon, Loader2, Plus, Save, Sparkles, Trash2, Upload, Wand2, X
} from "lucide-react";
import { Product, Supplier } from "@/types";
import { getTemplateForCategory } from "@/lib/product-templates";
import { GlassCard, GlassInput, GlassSelect, GlassTextarea, FieldLabel, GoldButton } from "./ui";
import { useToast } from "./Toast";

interface ProductFormProps {
    editing: Product | null;
    categories: string[];
    suppliers: Supplier[];
    onAddCategory: (name: string) => void;
    onSaved: () => void;
    onCancel: () => void;
}

const EMPTY_FORM: Partial<Product> = {
    name: "", sku: "", barcode: "", price: 0, description: "", category: "", stock: 0,
    lowStockThreshold: 5, locationBin: "", images: [""], video: "", isFeatured: false,
    priceCps: 0, shipping: 0,
};

export default function ProductForm({ editing, categories, suppliers, onAddCategory, onSaved, onCancel }: ProductFormProps) {
    const { toast } = useToast();
    const [formData, setFormData] = useState<Partial<Product>>(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [isAIWriting, setIsAIWriting] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryInput, setNewCategoryInput] = useState("");

    // AI Studio modal
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const [studioTab, setStudioTab] = useState<"text" | "image">("text");
    const [studioStyle, setStudioStyle] = useState("Editorial");
    const [studioImage, setStudioImage] = useState<File | null>(null);
    const [studioPreview, setStudioPreview] = useState<string | null>(null);
    const [imagePrompt, setImagePrompt] = useState("");
    const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    useEffect(() => {
        setFormData(editing ? { ...editing, images: editing.images?.length ? editing.images : [""] } : EMPTY_FORM);
    }, [editing]);

    // ZERO-TOKEN TEMPLATE GENERATION
    const generateDescription = () => {
        if (!formData.name || !formData.category) {
            toast("error", "Enter a name and select a category first");
            return;
        }
        const template = getTemplateForCategory(formData.category as string);
        const newDesc = `${template.description}\n\n--- \n**Wash & Care Instructions:**\n${template.washCare}`;
        setFormData(prev => ({ ...prev, description: newDesc }));
        toast("success", "Template applied");
    };

    // AI ENHANCEMENT
    const rewriteWithAI = async () => {
        if (!formData.description) {
            toast("error", "Generate the base template first");
            return;
        }
        setIsAIWriting(true);
        const prompt = `Rewrite this luxury saree description to make it sound exquisite, highly premium, and completely unique. DO NOT change or remove the "Wash & Care Instructions" section at the end. Make it 1 cohesive paragraph of description, then append exactly the existing wash care instructions verbatim. \n\nCurrent Text: \n${formData.description}`;
        try {
            const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ prompt }) });
            const data = await res.json();
            if (data.error) toast("error", data.error);
            else {
                const cleanText = data.text.replace(/^["']|["']$/g, "");
                setFormData(prev => ({ ...prev, description: cleanText }));
                toast("success", "Description enhanced");
            }
        } catch (err: any) {
            toast("error", `Network error: ${err.message}`);
        } finally {
            setIsAIWriting(false);
        }
    };

    const handleGenerateStudioImage = async () => {
        if (!imagePrompt && !studioImage) {
            toast("error", "Describe what you want or upload an image");
            return;
        }
        setIsGeneratingImage(true);
        try {
            const fd = new FormData();
            fd.append("prompt", imagePrompt);
            fd.append("style", studioStyle);
            if (studioImage) fd.append("image", studioImage);

            const res = await fetch("/api/admin/ai-studio-generate", { method: "POST", body: fd });
            const data = await res.json();
            if (data.imageData) {
                const prefix = data.mimeType === "image/png" ? "data:image/png;base64," : "data:image/jpeg;base64,";
                setGeneratedPreview(`${prefix}${data.imageData}`);
            } else if (data.error) {
                toast("error", data.error);
            }
        } catch {
            toast("error", "Failed to connect to AI service");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const openCloudinaryWidget = () => {
        // @ts-ignore
        const cloudinary = window.cloudinary;
        if (!cloudinary) {
            toast("error", "Upload widget still loading — try again in a moment");
            return;
        }
        const widget = cloudinary.createUploadWidget(
            {
                cloudName: "SrivariData",
                uploadPreset: "uploadPreset",
                folder: "srivari/products",
                sources: ["local", "url", "camera", "instagram"],
                multiple: false,
                clientAllowedFormats: ["image", "video"],
                maxImageFileSize: 10000000,
                styles: {
                    palette: {
                        window: "#000000", sourceBg: "#000000", windowBorder: "#D4AF37",
                        tabIcon: "#D4AF37", inactiveTabIcon: "#555a5f", menuIcons: "#D4AF37",
                        link: "#D4AF37", action: "#D4AF37", inProgress: "#0433ff",
                        complete: "#33ff00", error: "#cc0000", textDark: "#000000", textLight: "#fcfffd",
                    },
                },
            },
            (error: any, result: any) => {
                if (!error && result && result.event === "success") {
                    setFormData(prev => ({ ...prev, images: [...(prev.images || []).filter(Boolean), result.info.secure_url] }));
                }
            }
        );
        widget.open();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const cleanedImages = formData.images?.filter(img => img && img.trim() !== "") || [];
        const productData = {
            ...formData,
            price: Number(formData.price) || 0,
            stock: parseInt(String(formData.stock)) || 0,
            lowStockThreshold: parseInt(String(formData.lowStockThreshold)) || 5,
            priceCps: Number(formData.priceCps) || 0,
            shipping: Number(formData.shipping) || 0,
            images: cleanedImages,
            id: editing?.id || undefined,
        };

        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(productData),
            });
            if (res.ok) {
                toast("success", editing ? "Product updated" : "Product published");
                setFormData(EMPTY_FORM);
                onSaved();
            } else {
                const errData = await res.json().catch(() => ({}));
                toast("error", `Save failed: ${errData.details || errData.error || res.statusText}`);
            }
        } catch {
            toast("error", "Error saving product");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddCategory = () => {
        const newCat = newCategoryInput.trim();
        if (newCat) {
            onAddCategory(newCat);
            setFormData(prev => ({ ...prev, category: newCat }));
            setNewCategoryInput("");
            setIsAddingCategory(false);
        }
    };

    return (
        <GlassCard className="p-6 md:p-10 border-[#D4AF37]/20 relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                <Sparkles size={300} />
            </div>

            <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
                <h2 className="text-2xl md:text-3xl font-serif bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] bg-clip-text text-transparent flex items-center gap-4">
                    {editing ? <Edit2 size={26} className="text-[#D4AF37]" /> : <Plus size={26} className="text-[#D4AF37]" />}
                    {editing ? "Modify Masterpiece" : "Add New Masterpiece"}
                </h2>
                <button type="button" onClick={onCancel} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors" aria-label="Close product form">
                    <X className="text-white/50 hover:text-white" size={18} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
                {/* Left: media & core info */}
                <div className="md:col-span-6 space-y-6">
                    <div>
                        <FieldLabel>Product Name</FieldLabel>
                        <GlassInput placeholder="e.g. Royal Kanjivaram Silk" value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="text-xl font-serif placeholder:font-sans" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FieldLabel gold className="flex justify-between">
                                <span>SKU</span>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, sku: `SRI-${formData.category?.substring(0, 3).toUpperCase() || "GEN"}-${Math.floor(1000 + Math.random() * 9000)}` })}
                                    className="text-[9px] hover:text-white transition-colors normal-case"
                                >
                                    Auto-Gen
                                </button>
                            </FieldLabel>
                            <GlassInput placeholder="Stock Keeping Unit" value={formData.sku || ""} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                        </div>
                        <div>
                            <FieldLabel>Barcode (UPC/EAN)</FieldLabel>
                            <GlassInput placeholder="Scan or enter barcode" value={formData.barcode || ""} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                            <FieldLabel className="mb-0">Curator&apos;s Description</FieldLabel>
                            <div className="flex gap-2">
                                <button type="button" onClick={generateDescription} className="text-xs flex items-center gap-1.5 text-[#D4AF37] hover:text-[#F2D06B] hover:bg-[#D4AF37]/10 px-3 py-1.5 rounded border border-[#D4AF37]/30 transition-all">
                                    <Wand2 size={12} /> Auto-Generate
                                </button>
                                {formData.description && (
                                    <button type="button" onClick={rewriteWithAI} disabled={isAIWriting} className="text-xs flex items-center gap-1.5 text-[#D4AF37] bg-[#D4AF37]/5 hover:bg-[#D4AF37]/15 px-3 py-1.5 rounded border border-[#D4AF37]/20 transition-all disabled:opacity-50">
                                        {isAIWriting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        {isAIWriting ? "Enhancing…" : "Enhance with AI"}
                                    </button>
                                )}
                            </div>
                        </div>
                        <GlassTextarea
                            placeholder="Enter the exquisite details or click 'Auto-Generate' to pull a beautiful template…"
                            rows={7}
                            value={formData.description || ""}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    {/* Images */}
                    <div className="space-y-3">
                        <FieldLabel gold>Visual Assets</FieldLabel>

                        {(formData.images || []).map((img, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                {img && (
                                    <div className="w-11 h-11 relative rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/40">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <GlassInput value={img} onChange={e => { const n = [...(formData.images ?? [])]; n[idx] = e.target.value; setFormData({ ...formData, images: n }); }} placeholder="Image URL" />
                                {(formData.images?.length || 0) > 1 && (
                                    <button type="button" onClick={() => setFormData({ ...formData, images: formData.images?.filter((_, i) => i !== idx) })} className="p-2 text-white/30 hover:text-red-400 transition-colors shrink-0" aria-label="Remove image">
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                        ))}

                        <div className="flex gap-3 text-xs items-center flex-wrap">
                            <button type="button" onClick={() => setFormData({ ...formData, images: [...(formData.images || []), ""] })} className="text-[#D4AF37] hover:underline">+ Add URL</button>
                            <span className="text-white/20">|</span>
                            <button type="button" onClick={openCloudinaryWidget} className="text-[#D4AF37] hover:underline cursor-pointer flex items-center gap-1">
                                <Upload size={12} /> Upload Media
                            </button>
                        </div>

                        <button type="button" onClick={() => setIsStudioOpen(true)} className="w-full py-3 mt-1 rounded-lg border border-[#D4AF37]/30 text-[#D4AF37] text-sm flex items-center justify-center gap-2 hover:bg-[#D4AF37]/10 transition-colors">
                            <Wand2 size={16} /> Open AI Image Studio
                        </button>
                        <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
                    </div>

                    <div>
                        <FieldLabel>Product Video URL (optional)</FieldLabel>
                        <GlassInput placeholder="https://…" value={formData.video || ""} onChange={e => setFormData({ ...formData, video: e.target.value })} />
                    </div>
                </div>

                {/* Right: details */}
                <div className="md:col-span-6 space-y-6">
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <FieldLabel gold>Selling Price</FieldLabel>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-serif">₹</span>
                                <GlassInput type="number" placeholder="0.00" value={formData.price || ""} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required className="pl-10 text-lg font-medium" />
                            </div>
                        </div>
                        <div>
                            <FieldLabel>Inventory Stock</FieldLabel>
                            <GlassInput type="number" placeholder="Qty" value={formData.stock || ""} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} required className="text-lg" />
                        </div>
                        <div>
                            <FieldLabel gold>Low Stock Alert At</FieldLabel>
                            <GlassInput type="number" placeholder="5" value={formData.lowStockThreshold || ""} onChange={e => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })} className="text-lg" />
                        </div>
                        <div>
                            <FieldLabel>Location Bin</FieldLabel>
                            <GlassInput placeholder="Aisle 4, Shelf B…" value={formData.locationBin || ""} onChange={e => setFormData({ ...formData, locationBin: e.target.value })} className="text-lg" />
                        </div>
                    </div>

                    {/* Cost analysis */}
                    <div className="p-6 rounded-2xl bg-[#050505]/40 border border-white/5 grid grid-cols-2 gap-6 shadow-inner relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <div>
                            <FieldLabel className="text-white/40">Cost Price (CPS)</FieldLabel>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">₹</span>
                                <GlassInput type="number" placeholder="0" value={formData.priceCps || ""} onChange={e => setFormData({ ...formData, priceCps: Number(e.target.value) })} className="bg-black/40 pl-9" />
                            </div>
                        </div>
                        <div>
                            <FieldLabel className="text-white/40">Base Shipping</FieldLabel>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">₹</span>
                                <GlassInput type="number" placeholder="0" value={formData.shipping || ""} onChange={e => setFormData({ ...formData, shipping: Number(e.target.value) })} className="bg-black/40 pl-9" />
                            </div>
                        </div>
                        {Number(formData.price) > 0 && Number(formData.priceCps) > 0 && (
                            <div className="col-span-2 text-xs text-white/50 flex justify-between border-t border-white/5 pt-3">
                                <span>Projected profit</span>
                                <span className="text-emerald-400 font-bold">
                                    ₹{(Number(formData.price) - Number(formData.priceCps || 0) - Number(formData.shipping || 0)).toLocaleString("en-IN")}
                                    {" "}({(((Number(formData.price) - Number(formData.priceCps || 0) - Number(formData.shipping || 0)) / Number(formData.price)) * 100).toFixed(0)}%)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <FieldLabel>Product Category</FieldLabel>
                        <div className="flex gap-3 h-14">
                            {isAddingCategory ? (
                                <div className="flex-1 flex gap-2">
                                    <GlassInput autoFocus placeholder="New category name…" value={newCategoryInput} onChange={e => setNewCategoryInput(e.target.value)} />
                                    <button type="button" onClick={handleAddCategory} className="bg-emerald-500/20 text-emerald-400 aspect-square h-full rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center justify-center transition-all" aria-label="Confirm new category"><Check size={20} /></button>
                                    <button type="button" onClick={() => setIsAddingCategory(false)} className="bg-red-500/20 text-red-400 aspect-square h-full rounded-xl border border-red-500/30 hover:bg-red-500/30 flex items-center justify-center transition-all" aria-label="Cancel new category"><X size={20} /></button>
                                </div>
                            ) : (
                                <>
                                    <GlassSelect wrapperClassName="flex-1" value={formData.category || ""} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                                        <option value="" className="bg-[#0f0f0f]">Select Category</option>
                                        {categories.map(cat => <option key={cat} value={cat} className="bg-[#0f0f0f]">{cat}</option>)}
                                    </GlassSelect>
                                    <button type="button" onClick={() => setIsAddingCategory(true)} className="aspect-square h-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] rounded-xl hover:bg-[#D4AF37] hover:text-black transition-all duration-300 flex items-center justify-center" title="Add New Category">
                                        <Plus size={22} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Supplier */}
                    <div>
                        <FieldLabel>Supplier</FieldLabel>
                        <GlassSelect value={formData.supplierId || ""} onChange={e => setFormData({ ...formData, supplierId: e.target.value || undefined })}>
                            <option value="" className="bg-[#0f0f0f]">No Supplier</option>
                            {suppliers.map(s => <option key={s.id} value={s.id} className="bg-[#0f0f0f]">{s.name}</option>)}
                        </GlassSelect>
                    </div>

                    {/* Featured toggle */}
                    <div
                        className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${formData.isFeatured ? "bg-gradient-to-r from-[#D4AF37]/20 to-transparent border-[#D4AF37]/50" : "bg-white/5 border-white/10 hover:border-white/30"}`}
                        onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                    >
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${formData.isFeatured ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-transparent border-white/30"}`}>
                            {formData.isFeatured && <Check size={16} className="text-black" />}
                        </div>
                        <div className="flex-1">
                            <span className="text-sm text-white font-medium select-none block">Highlight as Featured</span>
                            <span className="text-xs text-white/40 block mt-0.5">Showcase this masterpiece on the homepage</span>
                        </div>
                        {formData.isFeatured && <Sparkles size={22} className="text-[#D4AF37]" />}
                    </div>

                    {/* Actions */}
                    <div className="pt-6 flex justify-end gap-4 border-t border-white/10">
                        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all font-medium">
                            {editing ? "Discard Changes" : "Cancel"}
                        </button>
                        <GoldButton type="submit" disabled={isSaving} className="px-10">
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {editing ? "Commit Update" : "Publish Masterpiece"}
                        </GoldButton>
                    </div>
                </div>
            </form>

            {/* --- AI Image Studio Modal --- portaled to <body>: the GlassCard's
                backdrop-filter creates a containing block that would otherwise
                trap this fixed overlay inside the form card. */}
            {typeof document !== "undefined" && createPortal(
            <AnimatePresence>
                {isStudioOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
                        <GlassCard className="max-w-5xl w-full p-0 border-[#D4AF37]/50 relative overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[80vh]">
                            {/* Controls */}
                            <div className="w-full md:w-1/3 p-6 border-r border-white/10 overflow-y-auto space-y-6 bg-black/40">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl text-[#D4AF37] font-serif flex items-center gap-2">
                                        <Wand2 className="animate-pulse" /> AI Studio
                                    </h3>
                                    <button onClick={() => setIsStudioOpen(false)} className="md:hidden" aria-label="Close studio"><X className="text-white/50" /></button>
                                </div>

                                <div className="flex p-1 bg-white/5 rounded-lg">
                                    <button onClick={() => setStudioTab("text")} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${studioTab === "text" ? "bg-[#D4AF37] text-black" : "text-white/50 hover:text-white"}`}>Text to Image</button>
                                    <button onClick={() => setStudioTab("image")} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${studioTab === "image" ? "bg-[#D4AF37] text-black" : "text-white/50 hover:text-white"}`}>Image Remix</button>
                                </div>

                                <AnimatePresence>
                                    {studioTab === "image" && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                                            <label className="text-xs text-white/40 uppercase">Reference Image</label>
                                            <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center transition-colors hover:border-[#D4AF37]/50 relative group">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    aria-label="Upload Reference Image"
                                                    onChange={e => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setStudioImage(file);
                                                            setStudioPreview(URL.createObjectURL(file));
                                                        }
                                                    }}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
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

                                <div className="space-y-2">
                                    <label className="text-xs text-white/40 uppercase">Vision Prompt</label>
                                    <textarea
                                        placeholder={studioTab === "text" ? "Describe your masterpiece…" : "Describe how to change this image…"}
                                        rows={4}
                                        value={imagePrompt}
                                        onChange={e => setImagePrompt(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white text-sm focus:border-[#D4AF37] outline-none resize-none placeholder:text-white/20"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs text-white/40 uppercase">Style Presets</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["Editorial", "Flat Lay", "Texture Macro", "Ghost Mannequin"].map(style => (
                                            <button key={style} onClick={() => setStudioStyle(style)} className={`p-3 rounded-xl text-xs text-left transition-all border ${studioStyle === style ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]" : "bg-white/5 border-transparent text-white/60 hover:bg-white/10"}`}>
                                                {style}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <GoldButton onClick={handleGenerateStudioImage} disabled={isGeneratingImage || (!imagePrompt && !studioImage)} className="w-full py-4">
                                    {isGeneratingImage ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                    {isGeneratingImage ? "Creating Magic…" : "Generate Studio Shot"}
                                </GoldButton>
                            </div>

                            {/* Preview canvas */}
                            <div className="flex-1 bg-[#0a0a0a] relative flex items-center justify-center p-8">
                                <button onClick={() => setIsStudioOpen(false)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-colors z-50" aria-label="Close preview"><X size={20} /></button>

                                {generatedPreview ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-2xl aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/50 group">
                                        <Image src={generatedPreview} alt="Generated" fill className="object-contain" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6 gap-4">
                                            <button
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, images: [generatedPreview!, ...(prev.images || []).filter(Boolean)] }));
                                                    setIsStudioOpen(false);
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
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body)}
        </GlassCard>
    );
}
