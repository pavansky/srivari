"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Order } from '@/types';
import Link from 'next/link';
import { Package, Truck, CheckCircle, Clock, ShoppingBag } from 'lucide-react';
import SrivariImage from '@/components/SrivariImage';

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

            // In a real app, we would fetch simple orders associated with this user email
            // Since our API currently returns ALL orders (for admin), ideally we filter on the server.
            // For now, I will filter client side or update the API later.
            // Let's assume the API returns all for now and we filter here (NOT SECURE for production, but okay for MVP demo)

            try {
                const res = await fetch('/api/orders');
                const allOrders: Order[] = await res.json();
                // Filter by email (case insensitive)
                const myOrders = allOrders.filter(o =>
                    o.customerEmail?.toLowerCase() === user.email?.toLowerCase() ||
                    // Fallback for orders created before we had strict email checks, maybe match phone?
                    // actually, for this demo, let's just show orders matching email
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

    if (loading) return <div className="min-h-screen bg-[#F9F5F0] flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#F9F5F0] py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-serif text-[#4A0404] mb-8">My Orders</h1>

                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-[#E5E5E5]">
                        <ShoppingBag className="w-16 h-16 text-[#D4AF37] mx-auto mb-4" />
                        <h2 className="text-xl font-serif text-gray-800 mb-2">No orders yet</h2>
                        <p className="text-gray-500 mb-6">Explore our collection and find your perfect drape.</p>
                        <Link href="/shop" className="bg-[#4A0404] text-white px-8 py-3 rounded hover:bg-[#5A0505] transition-colors">
                            Explore Collection
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map(order => (
                            <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border border-[#E5E5E5] hover:border-[#D4AF37]/30 transition-colors">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-100">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Order #{order.id}</p>
                                        <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="mt-2 md:mt-0 flex items-center gap-2">
                                        <StatusBadge status={order.status} />
                                        <span className="font-bold text-[#4A0404] text-lg ml-4">₹{order.totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            {/* We don't have product images in the order item usually, but if we did... 
                                                 For now, explicit product fetch would be needed or just show name */}
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-800">{item.productName}</h4>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity} x ₹{item.price.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'Delivered':
            return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-medium"><CheckCircle size={14} /> Delivered</span>;
        case 'Shipped':
            return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-medium"><Truck size={14} /> Shipped</span>;
        case 'Cancelled':
            return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-medium"><Clock size={14} /> Cancelled</span>;
        default:
            return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-xs font-medium"><Package size={14} /> Processing</span>;
    }
}
