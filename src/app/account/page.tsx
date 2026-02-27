"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag, MapPin, User, LogOut, Package,
    ChevronRight, Clock, Star, Edit3, Trash2, Plus
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "profile">("orders");
    const [loading, setLoading] = useState(true);

    // Data States
    const [orders, setOrders] = useState<any[]>([]);
    const [addresses, setAddresses] = useState<any[]>([]);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
                return;
            }
            setUser(session.user);
            // Sync user metadata to Prisma
            fetch("/api/user/sync", {
                method: "POST",
                headers: { Authorization: `Bearer ${session.access_token}` }
            }).catch(console.error);

            fetchData(session.access_token);
        };
        checkUser();
    }, []);

    const fetchData = async (token: string) => {
        setLoading(true);
        try {
            const [ordersRes, addressesRes] = await Promise.all([
                fetch("/api/user/orders", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/user/addresses", { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (ordersRes.ok) setOrders(await ordersRes.json());
            if (addressesRes.ok) setAddresses(await addressesRes.json());
        } catch (error) {
            console.error("Failed to fetch account data");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (!user) return null;

    return (
        <main className="bg-[#FDFBF7] min-h-screen text-[#1A1A1A] font-sans">
            <Navbar />

            {/* Header */}
            <section className="bg-obsidian text-marble pt-32 pb-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold text-4xl font-serif shadow-2xl">
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-serif text-gold mb-2">Namaste, {user.user_metadata?.full_name || user.email?.split('@')[0]}</h1>
                        <p className="text-white/60 text-sm tracking-widest uppercase font-light">Srivari Royal Member • 540 Loyalty Points</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="md:ml-auto flex items-center gap-2 text-white/40 hover:text-gold transition-colors text-xs uppercase tracking-widest font-bold"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </section>

            {/* Content Dashboard */}
            <section className="container mx-auto px-6 py-16 -mt-10 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Navigation Sidebar */}
                    <aside className="lg:col-span-3 space-y-2">
                        <TabButton
                            active={activeTab === "orders"}
                            onClick={() => setActiveTab("orders")}
                            icon={<Package size={18} />}
                            label="Order History"
                        />
                        <TabButton
                            active={activeTab === "addresses"}
                            onClick={() => setActiveTab("addresses")}
                            icon={<MapPin size={18} />}
                            label="Address Book"
                        />
                        <TabButton
                            active={activeTab === "profile"}
                            onClick={() => setActiveTab("profile")}
                            icon={<User size={18} />}
                            label="My Profile"
                        />
                    </aside>

                    {/* Main View Area Area */}
                    <div className="lg:col-span-9 bg-white border border-gold/10 rounded-sm shadow-xl p-8 md:p-12">
                        <AnimatePresence mode="wait">
                            {activeTab === "orders" && (
                                <motion.div
                                    key="orders"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <h3 className="text-2xl font-serif text-[#4A0404] mb-6 border-b pb-4">Past Masterpieces</h3>

                                    {loading ? (
                                        <div className="py-20 text-center text-neutral-400">Loading your collection...</div>
                                    ) : orders.length === 0 ? (
                                        <div className="py-20 text-center space-y-6">
                                            <ShoppingBag className="mx-auto w-12 h-12 text-gold/20" />
                                            <p className="text-neutral-500 italic font-serif">Your journey with Srivari's is just beginning.</p>
                                            <Link href="/shop" className="inline-block text-xs font-bold uppercase tracking-widest text-gold hover:text-obsidian transition-colors underline underline-offset-8">
                                                Explore Collections
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {orders.map((order) => (
                                                <OrderCard key={order.id} order={order} />
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === "addresses" && (
                                <motion.div
                                    key="addresses"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <div className="flex justify-between items-center mb-10 border-b pb-4">
                                        <h3 className="text-2xl font-serif text-[#4A0404]">Royal Residences</h3>
                                        <button className="flex items-center gap-2 bg-obsidian text-gold px-4 py-2 rounded-sm text-[10px] uppercase tracking-widest font-bold hover:bg-gold hover:text-obsidian transition-all">
                                            <Plus size={14} /> Add Address
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div className="py-20 text-center text-neutral-400">Retrieving locations...</div>
                                    ) : addresses.length === 0 ? (
                                        <div className="py-20 text-center text-neutral-500 italic font-serif">No addresses saved yet.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {addresses.map((address) => (
                                                <AddressCard key={address.id} address={address} />
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </section>

            <Footer />
        </main>
    );
}

// --- Sub-components ---

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-sm text-sm uppercase tracking-widest font-bold transition-all ${active
                ? "bg-obsidian text-gold shadow-lg translate-x-2"
                : "text-neutral-500 hover:bg-gold/5 hover:text-obsidian"
                }`}
        >
            {icon}
            {label}
            {active && <ChevronRight size={14} className="ml-auto" />}
        </button>
    );
}

function OrderCard({ order }: any) {
    const statusColors: any = {
        "Paid": "bg-green-50 text-green-700 border-green-200",
        "Shipped": "bg-blue-50 text-blue-700 border-blue-200",
        "Delivered": "bg-gold/10 text-gold border-gold/20",
        "Cancelled": "bg-red-50 text-red-700 border-red-200",
        "Pending": "bg-neutral-50 text-neutral-700 border-neutral-200"
    };

    return (
        <div className="border border-neutral-100 rounded-sm p-6 hover:shadow-md transition-shadow bg-neutral-50/30">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                    <span className="text-[10px] text-neutral-400 font-bold tracking-widest uppercase block mb-1">Order ID</span>
                    <h4 className="font-bold text-lg">{order.id}</h4>
                    <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                        <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[order.status] || statusColors.Pending}`}>
                    {order.status}
                </div>
            </div>

            <div className="flex items-center gap-4 py-4 border-t border-dashed border-neutral-200 mt-4">
                <div className="flex -space-x-3 overflow-hidden">
                    {(order.items as any[]).slice(0, 3).map((item, i) => (
                        <div key={i} className="inline-block h-12 w-12 rounded-full ring-2 ring-white bg-neutral-100 overflow-hidden">
                            <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100'} alt="" className="h-full w-full object-cover" />
                        </div>
                    ))}
                    {order.items.length > 3 && (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold ring-2 ring-white">
                            +{order.items.length - 3}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium">{order.items.length} Masterpiece{order.items.length > 1 ? 's' : ''}</p>
                    <p className="text-sm text-[#4A0404] font-bold">₹{order.total.toLocaleString('en-IN')}</p>
                </div>
                <Link href={`/order-tracking?id=${order.id}`} className="text-gold text-xs font-bold uppercase tracking-tighter hover:text-obsidian transition-colors underline">
                    Track Item
                </Link>
            </div>
        </div>
    );
}

function AddressCard({ address }: any) {
    return (
        <div className="border border-neutral-100 rounded-sm p-6 bg-white shadow-sm relative group">
            {address.isDefault && (
                <div className="absolute top-0 right-0 bg-gold text-obsidian text-[8px] font-bold uppercase px-3 py-1 tracking-widest">
                    Primary
                </div>
            )}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400">
                    <MapPin size={16} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">{address.type}</span>
            </div>
            <h5 className="font-bold text-lg mb-2">{address.firstName} {address.lastName}</h5>
            <div className="text-sm text-neutral-500 space-y-1 mb-6">
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                {address.landmark && <p className="italic text-xs font-light">Landmark: {address.landmark}</p>}
                <p>{address.city}, {address.state} - {address.pincode}</p>
                <p className="mt-2 flex items-center gap-2"><Star size={12} className="text-gold" /> {address.phone}</p>
            </div>
            <div className="flex gap-4 pt-4 border-t border-neutral-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-gold transition-colors flex items-center gap-1">
                    <Edit3 size={12} /> Edit
                </button>
                {!address.isDefault && (
                    <button className="text-[10px] font-bold uppercase tracking-widest text-red-300 hover:text-red-500 transition-colors flex items-center gap-1 ml-auto">
                        <Trash2 size={12} /> Delete
                    </button>
                )}
            </div>
        </div>
    );
}
