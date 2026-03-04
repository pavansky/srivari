"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Order } from '@/types';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { Package, Truck, CheckCircle, Clock, ShoppingBag, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchOrders = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/login';
                return;
            }

            try {
                const res = await fetch('/api/orders');
                const allOrders: Order[] = await res.json();
                const myOrders = allOrders.filter(o =>
                    o.customerEmail?.toLowerCase() === user.email?.toLowerCase() ||
                    o.customerEmail === user.email
                );
                setOrders(myOrders);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
                    <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold">Loading your collection...</span>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] font-sans">
            {/* Hero Header */}
            <section className="bg-obsidian text-marble pt-32 pb-16 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#D4AF37_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="container mx-auto px-6 relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/30 hover:text-gold transition-colors text-xs uppercase tracking-widest font-bold mb-6">
                        <ArrowLeft size={14} /> Back to Boutique
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-serif text-gold">My Orders</h1>
                    <p className="text-white/40 text-sm mt-2 tracking-wider uppercase">Your collection journey</p>
                </div>
            </section>

            <section className="container mx-auto px-6 py-12 -mt-6 relative z-20">
                {orders.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 bg-white rounded-2xl shadow-sm border border-gold/10"
                    >
                        <ShoppingBag className="w-16 h-16 text-gold/20 mx-auto mb-6" />
                        <h2 className="text-2xl font-serif text-[#1A1A1A] mb-3">No orders yet</h2>
                        <p className="text-neutral-400 mb-8 max-w-md mx-auto font-light">Explore our collection and find your perfect drape.</p>
                        <Link href="/shop" className="inline-block bg-obsidian text-gold px-10 py-4 rounded-xl hover:bg-gold hover:text-obsidian transition-all duration-300 uppercase tracking-widest text-xs font-bold shadow-lg">
                            Explore Collection
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        <AnimatePresence>
                            {orders.map((order, i) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white p-8 rounded-2xl shadow-sm border border-gold/10 hover:border-gold/30 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-neutral-100">
                                        <div>
                                            <p className="text-[10px] text-neutral-400 uppercase tracking-[0.2em] font-bold mb-1">Order #{order.id}</p>
                                            <p className="text-sm text-neutral-500 font-light">{new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                        <div className="mt-3 md:mt-0 flex items-center gap-4">
                                            <StatusBadge status={order.status} />
                                            <span className="font-serif text-xl text-[#4A0404] font-medium">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-4 p-3 bg-neutral-50/50 rounded-xl">
                                                <div className="w-2 h-2 rounded-full bg-gold/40" />
                                                <div className="flex-1">
                                                    <h4 className="font-sans font-medium text-[#1A1A1A] text-sm">{item.productName}</h4>
                                                    <p className="text-xs text-neutral-400 font-light">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </section>

            <Footer />
        </main>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
        'Delivered': { icon: <CheckCircle size={14} />, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
        'Shipped': { icon: <Truck size={14} />, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
        'Cancelled': { icon: <Clock size={14} />, bg: 'bg-red-50 border-red-200', text: 'text-red-600' },
    };

    const { icon, bg, text } = config[status] || { icon: <Package size={14} />, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' };

    return (
        <span className={`flex items-center gap-1.5 ${bg} ${text} border px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
            {icon} {status || 'Processing'}
        </span>
    );
}
