"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    Archive, ArchiveRestore, Download, History, Minus, PackageSearch,
    Pencil, Plus, Star, Upload, X
} from "lucide-react";
import { Product } from "@/types";
import { useAdminData, calculateMargin, formatINR, exportCSV } from "@/components/admin/AdminContext";
import {
    GlassCard, GlassInput, GlassSelect, SectionHeading, GoldButton,
    GhostButton, EmptyState
} from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import ProductForm from "@/components/admin/ProductForm";
import HistoryModal from "@/components/admin/HistoryModal";

const SESSION_MSG = "Session expired — please log in again.";
const STOCK_OPTIONS = ["all", "in-stock", "low-stock", "out-of-stock", "archived"];

const STATE_STYLES = {
    Archived: "text-red-400 border-red-500/30 bg-red-500/10",
    Out: "text-red-400 border-red-500/30 bg-red-500/10",
    "Low Stock": "text-amber-400 border-amber-500/30 bg-amber-500/10",
    Live: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};

const productState = (p: Product): keyof typeof STATE_STYLES => {
    if (p.isArchived) return "Archived";
    if (p.stock === 0) return "Out";
    if (p.stock <= (p.lowStockThreshold ?? 5)) return "Low Stock";
    return "Live";
};

const marginClass = (m: number) => (m >= 30 ? "text-emerald-400" : m >= 10 ? "text-amber-400" : "text-red-400");

export default function ProductsPage() {
    return (
        <Suspense fallback={null}>
            <ProductsInner />
        </Suspense>
    );
}

function ProductsInner() {
    const searchParams = useSearchParams();
    const { products, suppliers, categories, isLoaded, error, refresh, addCategory } = useAdminData();
    const { toast } = useToast();
    const { confirm } = useConfirm();

    // Form panel
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);

    // Filters
    const [search, setSearch] = useState(() => searchParams.get("q") || "");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [supplierFilter, setSupplierFilter] = useState("all");
    const [stockFilter, setStockFilter] = useState(() => {
        const s = searchParams.get("stock");
        return s && STOCK_OPTIONS.includes(s) ? s : "all";
    });
    const [sortBy, setSortBy] = useState("newest");

    // Selection + bulk
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkSupplier, setBulkSupplier] = useState("");
    const [isBulkBusy, setIsBulkBusy] = useState(false);

    // Misc
    const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});
    // Products with a mutation (stock/feature) currently in flight — used to
    // block re-entrant clicks that would PUT a stale whole-product object and
    // clobber the other change.
    const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set());
    const [historyProduct, setHistoryProduct] = useState<{ id: string; name: string } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Re-sync from the URL on every param change — the command palette pushes
    // /admin/products?q=... while this page may already be mounted.
    useEffect(() => {
        if (searchParams.get("new") === "1") setIsFormOpen(true);
        const q = searchParams.get("q");
        if (q !== null) setSearch(q);
        const s = searchParams.get("stock");
        if (s && STOCK_OPTIONS.includes(s)) setStockFilter(s);
    }, [searchParams]);

    const activeCount = useMemo(() => products.filter(p => !p.isArchived).length, [products]);
    const archivedCount = products.length - activeCount;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = products.filter(p => {
            if (stockFilter === "archived") {
                if (!p.isArchived) return false;
            } else if (p.isArchived) return false;
            if (q && !`${p.name} ${p.category} ${p.sku || ""}`.toLowerCase().includes(q)) return false;
            if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
            if (supplierFilter !== "all" && p.supplierId !== supplierFilter) return false;
            if (stockFilter === "in-stock" && p.stock <= 0) return false;
            if (stockFilter === "low-stock" && !(p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5))) return false;
            if (stockFilter === "out-of-stock" && p.stock !== 0) return false;
            return true;
        });
        const marginOf = (p: Product) => calculateMargin(p.price, p.priceCps, p.shipping).margin;
        const sorted = [...list];
        switch (sortBy) {
            case "price-desc": sorted.sort((a, b) => b.price - a.price); break;
            case "price-asc": sorted.sort((a, b) => a.price - b.price); break;
            case "stock-desc": sorted.sort((a, b) => b.stock - a.stock); break;
            case "stock-asc": sorted.sort((a, b) => a.stock - b.stock); break;
            case "margin-desc": sorted.sort((a, b) => marginOf(b) - marginOf(a)); break;
            default: sorted.sort((a, b) =>
                new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
        return sorted;
    }, [products, search, categoryFilter, supplierFilter, stockFilter, sortBy]);

    const selectedProducts = useMemo(() => products.filter(p => selected.has(p.id)), [products, selected]);
    const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));

    /* --- API helpers --- */

    const putProduct = (body: Product) => fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const markMutating = (id: string, on: boolean) =>
        setMutatingIds(prev => {
            const next = new Set(prev);
            if (on) next.add(id); else next.delete(id);
            return next;
        });

    const adjustStock = async (p: Product, delta: number) => {
        if (mutatingIds.has(p.id)) return; // ignore rapid double-clicks
        const current = stockOverrides[p.id] ?? p.stock;
        const newStock = Math.max(0, current + delta);
        if (newStock === current) return;
        setStockOverrides(prev => ({ ...prev, [p.id]: newStock }));
        markMutating(p.id, true);
        try {
            const res = await putProduct({ ...p, stock: newStock });
            if (!res.ok) throw new Error(res.status === 401 ? SESSION_MSG : "Failed to update stock");
            await refresh();
        } catch (e) {
            toast("error", e instanceof Error ? e.message : "Failed to update stock");
        } finally {
            markMutating(p.id, false);
            setStockOverrides(prev => {
                const next = { ...prev };
                delete next[p.id];
                return next;
            });
        }
    };

    const toggleFeatured = async (p: Product) => {
        if (mutatingIds.has(p.id)) return; // ignore rapid double-clicks
        markMutating(p.id, true);
        try {
            const res = await putProduct({ ...p, isFeatured: !p.isFeatured });
            if (!res.ok) throw new Error(res.status === 401 ? SESSION_MSG : "Failed to update product");
            await refresh();
        } catch (e) {
            toast("error", e instanceof Error ? e.message : "Failed to update product");
        } finally {
            markMutating(p.id, false);
        }
    };

    const archiveProduct = async (p: Product) => {
        const ok = await confirm({
            title: "Archive this piece?",
            message: `"${p.name}" will be hidden from the storefront. You can restore it anytime.`,
            confirmText: "Archive",
            type: "danger",
        });
        if (!ok) return;
        try {
            const res = await fetch(`/api/products?id=${encodeURIComponent(p.id)}`, { method: "DELETE" });
            if (!res.ok) throw new Error(res.status === 401 ? SESSION_MSG : "Failed to archive product");
            toast("success", `"${p.name}" archived`);
            await refresh();
        } catch (e) {
            toast("error", e instanceof Error ? e.message : "Failed to archive product");
        }
    };

    const restoreProduct = async (p: Product) => {
        try {
            const res = await fetch(`/api/products?id=${encodeURIComponent(p.id)}&action=restore`, { method: "PATCH" });
            if (!res.ok) throw new Error(res.status === 401 ? SESSION_MSG : "Failed to restore product");
            toast("success", `"${p.name}" restored`);
            await refresh();
        } catch (e) {
            toast("error", e instanceof Error ? e.message : "Failed to restore product");
        }
    };

    /* --- Bulk actions --- */

    const bulkArchive = async () => {
        const count = selected.size;
        const ok = await confirm({
            title: "Archive selected pieces?",
            message: `${count} product${count === 1 ? "" : "s"} will be hidden from the storefront. You can restore them anytime.`,
            confirmText: "Archive",
            type: "warning",
        });
        if (!ok) return;
        setIsBulkBusy(true);
        try {
            const results = await Promise.all(Array.from(selected).map(id =>
                fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: "DELETE" })));
            const failed = results.filter(r => !r.ok).length;
            if (results.some(r => r.status === 401)) toast("error", SESSION_MSG);
            else if (failed > 0) toast("error", `${failed} of ${results.length} could not be archived`);
            else toast("success", `${results.length} product${results.length === 1 ? "" : "s"} archived`);
            setSelected(new Set());
            await refresh();
        } catch {
            toast("error", "Bulk archive failed — network error");
        } finally {
            setIsBulkBusy(false);
        }
    };

    const bulkToggleFeatured = async () => {
        setIsBulkBusy(true);
        try {
            const results = await Promise.all(selectedProducts.map(p =>
                putProduct({ ...p, isFeatured: !p.isFeatured })));
            const failed = results.filter(r => !r.ok).length;
            if (results.some(r => r.status === 401)) toast("error", SESSION_MSG);
            else if (failed > 0) toast("error", `${failed} of ${results.length} could not be updated`);
            else toast("success", `Featured toggled on ${results.length} product${results.length === 1 ? "" : "s"}`);
            await refresh();
        } catch {
            toast("error", "Bulk update failed — network error");
        } finally {
            setIsBulkBusy(false);
        }
    };

    const bulkAssignSupplier = async () => {
        if (!bulkSupplier) return;
        const supplierName = suppliers.find(s => s.id === bulkSupplier)?.name;
        setIsBulkBusy(true);
        try {
            const results = await Promise.all(selectedProducts.map(p =>
                putProduct({ ...p, supplierId: bulkSupplier, supplierName })));
            const failed = results.filter(r => !r.ok).length;
            if (results.some(r => r.status === 401)) toast("error", SESSION_MSG);
            else if (failed > 0) toast("error", `${failed} of ${results.length} could not be assigned`);
            else toast("success", `Supplier assigned to ${results.length} product${results.length === 1 ? "" : "s"}`);
            await refresh();
        } catch {
            toast("error", "Bulk assign failed — network error");
        } finally {
            setIsBulkBusy(false);
        }
    };

    /* --- CSV import / export --- */

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const text = await file.text();
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
            toast("error", "CSV needs a header row and at least one product row");
            return;
        }
        // Proper CSV field walk: preserves empty cells, unquoted spaces, quoted
        // commas, and "" escapes — a regex split silently shifts columns here.
        const parseLine = (line: string): string[] => {
            const fields: string[] = [];
            let current = "";
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (inQuotes) {
                    if (ch === '"') {
                        if (line[i + 1] === '"') { current += '"'; i++; }
                        else inQuotes = false;
                    } else current += ch;
                } else if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ",") {
                    fields.push(current.trim());
                    current = "";
                } else {
                    current += ch;
                }
            }
            fields.push(current.trim());
            return fields;
        };
        const header = parseLine(lines[0]).map(h => h.toLowerCase());
        const parsed = lines.slice(1).map(line => {
            const vals = parseLine(line);
            const get = (name: string) => {
                const i = header.indexOf(name);
                return i >= 0 ? (vals[i] || "") : "";
            };
            return {
                sku: get("sku"),
                barcode: get("barcode"),
                name: get("name"),
                category: get("category"),
                price: parseFloat(get("price")) || 0,
                stock: parseInt(get("stock"), 10) || 0,
                isFeatured: /^(true|yes|1)$/i.test(get("featured")),
                images: [],
                description: "",
            };
        }).filter(p => p.name);
        if (parsed.length === 0) {
            toast("error", "No valid rows found — expected headers: sku,barcode,name,category,price,stock,featured");
            return;
        }
        const ok = await confirm({
            title: "Import products",
            message: `Import ${parsed.length} product${parsed.length === 1 ? "" : "s"} from ${file.name}?`,
            confirmText: "Import",
            type: "info",
        });
        if (!ok) return;
        setIsImporting(true);
        try {
            const res = await fetch("/api/products/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products: parsed }),
            });
            if (res.status === 401) {
                toast("error", SESSION_MSG);
                return;
            }
            const data = await res.json().catch(() => null);
            if (!res.ok || !data) {
                toast("error", data?.error || "Import failed");
                return;
            }
            if (data.failed > 0) {
                toast("error", `${data.successful} imported, ${data.failed} failed${data.errors?.length ? ` — ${data.errors[0]}` : ""}`);
            } else {
                toast("success", `${data.successful} product${data.successful === 1 ? "" : "s"} imported`);
            }
            await refresh();
        } catch {
            toast("error", "Import failed — network error");
        } finally {
            setIsImporting(false);
        }
    };

    const handleExport = () => {
        exportCSV(
            "srivari-products",
            ["SKU", "Barcode", "Name", "Category", "Price", "Stock", "Featured"],
            filtered.map(p => [p.sku, p.barcode, p.name, p.category, p.price, p.stock, p.isFeatured ? "Yes" : "No"]),
        );
        toast("success", `Exported ${filtered.length} product${filtered.length === 1 ? "" : "s"}`);
    };

    /* --- Selection + form --- */

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        setSelected(allSelected ? new Set() : new Set(filtered.map(p => p.id)));
    };

    const startEdit = (p: Product) => {
        setEditing(p);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleForm = () => {
        setEditing(null);
        setIsFormOpen(prev => !prev);
    };

    const handleSaved = async () => {
        setIsFormOpen(false);
        setEditing(null);
        await refresh();
    };

    /* --- Render fragments --- */

    const renderThumb = (p: Product) => (
        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white/[0.06] border border-white/10 shrink-0">
            {p.images?.[0] ? (
                <Image src={p.images[0]} alt={p.name} fill sizes="56px" className="object-cover" />
            ) : (
                <div className="w-full h-full bg-white/[0.06]" />
            )}
        </div>
    );

    const renderMargin = (p: Product) => {
        if (!p.priceCps) return <span className="text-white/25 text-sm">—</span>;
        const { margin } = calculateMargin(p.price, p.priceCps, p.shipping);
        return <span className={`text-sm font-bold tabular-nums ${marginClass(margin)}`}>{margin.toFixed(0)}%</span>;
    };

    const renderStock = (p: Product) => {
        const stock = stockOverrides[p.id] ?? p.stock;
        const busy = mutatingIds.has(p.id);
        return (
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => adjustStock(p, -1)}
                    disabled={stock <= 0 || busy}
                    aria-label={`Decrease stock for ${p.name}`}
                    className="w-7 h-7 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/25 flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:border-white/10"
                >
                    <Minus size={12} />
                </button>
                <span className="w-9 text-center text-sm font-bold text-white/90 tabular-nums">{stock}</span>
                <button
                    onClick={() => adjustStock(p, 1)}
                    disabled={busy}
                    aria-label={`Increase stock for ${p.name}`}
                    className="w-7 h-7 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/25 flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:border-white/10"
                >
                    <Plus size={12} />
                </button>
            </div>
        );
    };

    const renderFeaturedToggle = (p: Product) => (
        <button
            onClick={() => toggleFeatured(p)}
            disabled={mutatingIds.has(p.id)}
            aria-label={p.isFeatured ? `Remove ${p.name} from featured` : `Feature ${p.name}`}
            className="p-2 rounded-lg hover:bg-white/[0.05] transition-all disabled:opacity-40"
        >
            <Star size={16} className={p.isFeatured ? "text-[#D4AF37] fill-[#D4AF37]" : "text-white/25"} />
        </button>
    );

    const renderStateChip = (p: Product) => {
        const state = productState(p);
        return (
            <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap ${STATE_STYLES[state]}`}>
                {state}
            </span>
        );
    };

    const renderActions = (p: Product) => (
        <div className="flex items-center gap-1">
            <button
                onClick={() => startEdit(p)}
                aria-label={`Edit ${p.name}`}
                className="p-2 rounded-lg text-white/40 hover:text-[#D4AF37] hover:bg-white/[0.05] transition-all"
            >
                <Pencil size={15} />
            </button>
            <button
                onClick={() => setHistoryProduct({ id: p.id, name: p.name })}
                aria-label={`Stock history for ${p.name}`}
                className="p-2 rounded-lg text-white/40 hover:text-sky-400 hover:bg-white/[0.05] transition-all"
            >
                <History size={15} />
            </button>
            {p.isArchived ? (
                <button
                    onClick={() => restoreProduct(p)}
                    aria-label={`Restore ${p.name}`}
                    className="p-2 rounded-lg text-white/40 hover:text-emerald-400 hover:bg-white/[0.05] transition-all"
                >
                    <ArchiveRestore size={15} />
                </button>
            ) : (
                <button
                    onClick={() => archiveProduct(p)}
                    aria-label={`Archive ${p.name}`}
                    className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/[0.05] transition-all"
                >
                    <Archive size={15} />
                </button>
            )}
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <SectionHeading
                title="Inventory"
                subtitle={isLoaded
                    ? `${activeCount} active piece${activeCount === 1 ? "" : "s"} · ${archivedCount} archived`
                    : "Loading collection…"}
                actions={
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={handleImportFile}
                            aria-label="Import products CSV file"
                        />
                        <GhostButton onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                            <Upload size={14} /> {isImporting ? "Importing…" : "Import CSV"}
                        </GhostButton>
                        <GhostButton onClick={handleExport}>
                            <Download size={14} /> Export CSV
                        </GhostButton>
                        <GoldButton onClick={toggleForm} className="!px-5 !py-2.5 text-sm">
                            {isFormOpen ? <X size={16} /> : <Plus size={16} />}
                            {isFormOpen ? "Close" : "Add Product"}
                        </GoldButton>
                    </>
                }
            />

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
                    <p className="text-sm flex-1">{error}</p>
                    <button onClick={refresh} className="bg-red-500/20 px-3 py-1 rounded text-sm hover:bg-red-500/40">Retry</button>
                </div>
            )}

            {/* Collapsible add/edit form */}
            <AnimatePresence initial={false}>
                {isFormOpen && (
                    <motion.div
                        key="product-form"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <ProductForm
                            editing={editing}
                            categories={categories}
                            suppliers={suppliers}
                            onAddCategory={addCategory}
                            onSaved={handleSaved}
                            onCancel={() => { setIsFormOpen(false); setEditing(null); }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filters */}
            <GlassCard className="p-4 sticky top-4 z-30">
                <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
                    <div className="flex-1 min-w-[220px]">
                        <GlassInput
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search name, category, SKU…"
                            aria-label="Search products"
                            className="!p-3"
                        />
                    </div>
                    <GlassSelect
                        wrapperClassName="min-w-[160px]"
                        className="!py-3"
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        aria-label="Filter by category"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </GlassSelect>
                    <GlassSelect
                        wrapperClassName="min-w-[160px]"
                        className="!py-3"
                        value={supplierFilter}
                        onChange={e => setSupplierFilter(e.target.value)}
                        aria-label="Filter by supplier"
                    >
                        <option value="all">All Suppliers</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </GlassSelect>
                    <GlassSelect
                        wrapperClassName="min-w-[150px]"
                        className="!py-3"
                        value={stockFilter}
                        onChange={e => setStockFilter(e.target.value)}
                        aria-label="Filter by stock level"
                    >
                        <option value="all">All Stock</option>
                        <option value="in-stock">In Stock</option>
                        <option value="low-stock">Low Stock</option>
                        <option value="out-of-stock">Out of Stock</option>
                        <option value="archived">Archived</option>
                    </GlassSelect>
                    <GlassSelect
                        wrapperClassName="min-w-[180px]"
                        className="!py-3"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        aria-label="Sort products"
                    >
                        <option value="newest">Newest First</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="stock-desc">Stock: High to Low</option>
                        <option value="stock-asc">Stock: Low to High</option>
                        <option value="margin-desc">Margin: Best First</option>
                    </GlassSelect>
                </div>
            </GlassCard>

            {/* Product list */}
            {!isLoaded ? (
                <GlassCard className="p-8">
                    <EmptyState title="Loading inventory…" />
                </GlassCard>
            ) : filtered.length === 0 ? (
                <GlassCard className="p-8">
                    <EmptyState
                        icon={<PackageSearch size={22} />}
                        title="No pieces match"
                        subtitle="Try adjusting the search or filters, or add a new product."
                    />
                </GlassCard>
            ) : (
                <>
                    {/* Desktop table */}
                    <GlassCard className="hidden md:block">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.08]">
                                        <th className="px-5 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={toggleSelectAll}
                                                aria-label="Select all products"
                                                className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                                            />
                                        </th>
                                        {["Product", "Category", "Price", "Margin", "Stock", "Featured", "Status", ""].map((h, i) => (
                                            <th key={i} className={`px-4 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold ${h === "" ? "text-right" : "text-left"}`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(p => (
                                        <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                            <td className="px-5 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(p.id)}
                                                    onChange={() => toggleSelect(p.id)}
                                                    aria-label={`Select ${p.name}`}
                                                    className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3 min-w-[220px]">
                                                    {renderThumb(p)}
                                                    <div className="min-w-0">
                                                        <p className="text-white/90 font-medium truncate max-w-[260px]">{p.name}</p>
                                                        {p.sku && <p className="text-[11px] font-mono text-white/30 mt-0.5">{p.sku}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-white/50 uppercase tracking-wider whitespace-nowrap">
                                                    {p.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-white/90 font-bold whitespace-nowrap">{formatINR(p.price)}</td>
                                            <td className="px-4 py-3">{renderMargin(p)}</td>
                                            <td className="px-4 py-3">{renderStock(p)}</td>
                                            <td className="px-4 py-3">{renderFeaturedToggle(p)}</td>
                                            <td className="px-4 py-3">{renderStateChip(p)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end">{renderActions(p)}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                        {filtered.map(p => (
                            <GlassCard key={p.id} className="p-4">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(p.id)}
                                        onChange={() => toggleSelect(p.id)}
                                        aria-label={`Select ${p.name}`}
                                        className="w-4 h-4 accent-[#D4AF37] cursor-pointer mt-1 shrink-0"
                                    />
                                    {renderThumb(p)}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-white/90 font-medium truncate">{p.name}</p>
                                        {p.sku && <p className="text-[11px] font-mono text-white/30 mt-0.5">{p.sku}</p>}
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-white/50 uppercase tracking-wider">
                                                {p.category}
                                            </span>
                                            {renderStateChip(p)}
                                        </div>
                                    </div>
                                    {renderFeaturedToggle(p)}
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-baseline gap-2.5">
                                        <span className="text-white/90 font-bold">{formatINR(p.price)}</span>
                                        {renderMargin(p)}
                                    </div>
                                    {renderStock(p)}
                                </div>
                                <div className="flex justify-end border-t border-white/[0.06] mt-4 pt-3">
                                    {renderActions(p)}
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </>
            )}

            {/* Floating bulk actions bar */}
            <AnimatePresence>
                {selected.size > 0 && (
                    <motion.div
                        key="bulk-bar"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[calc(100%-2rem)] max-w-3xl"
                    >
                        <GlassCard className="px-5 py-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest whitespace-nowrap">
                                    {selected.size} selected
                                </span>
                                <GhostButton onClick={bulkArchive} disabled={isBulkBusy}>
                                    <Archive size={14} /> Archive
                                </GhostButton>
                                <GhostButton onClick={bulkToggleFeatured} disabled={isBulkBusy}>
                                    <Star size={14} /> Toggle Featured
                                </GhostButton>
                                <div className="flex items-center gap-2">
                                    <GlassSelect
                                        wrapperClassName="w-44"
                                        className="!py-2.5 text-xs"
                                        value={bulkSupplier}
                                        onChange={e => setBulkSupplier(e.target.value)}
                                        aria-label="Supplier to assign"
                                    >
                                        <option value="">Select supplier…</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </GlassSelect>
                                    <GhostButton onClick={bulkAssignSupplier} disabled={isBulkBusy || !bulkSupplier}>
                                        Assign
                                    </GhostButton>
                                </div>
                                <GhostButton onClick={() => setSelected(new Set())} disabled={isBulkBusy} className="ml-auto">
                                    <X size={14} /> Clear
                                </GhostButton>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stock history modal */}
            <AnimatePresence>
                {historyProduct && (
                    <HistoryModal
                        key="history-modal"
                        productId={historyProduct.id}
                        productName={historyProduct.name}
                        onClose={() => setHistoryProduct(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
