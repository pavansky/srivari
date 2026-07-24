"use client";

import { useState, useEffect, useRef } from "react";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag, MapPin, User, LogOut, Package,
    ChevronRight, Clock, Star, Edit3, Trash2, Plus, X,
    Mail, Phone, CalendarDays, ExternalLink
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AddressForm {
    id?: string;
    type: string;
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    isDefault: boolean;
}

const EMPTY_ADDRESS: AddressForm = {
    type: "Home",
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    isDefault: false,
};

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "profile">("orders");
    const [loading, setLoading] = useState(true);

    // Data States
    const [orders, setOrders] = useState<any[]>([]);
    const [addresses, setAddresses] = useState<any[]>([]);

    // Address modal state
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_ADDRESS);
    const [addressError, setAddressError] = useState("");
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

    // Toast
    const [toast, setToast] = useState<string | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const showToast = (message: string) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast(message);
        toastTimer.current = setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        return () => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
        };
    }, []);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
                return;
            }
            setUser(session.user);
            setToken(session.access_token);
            // Sync user metadata to Prisma
            fetch("/api/user/sync", {
                method: "POST",
                headers: { Authorization: `Bearer ${session.access_token}` }
            }).catch(console.error);

            fetchData(session.access_token);
        };
        checkUser();
    }, []);

    const fetchData = async (accessToken: string) => {
        setLoading(true);
        try {
            const [ordersRes, addressesRes] = await Promise.all([
                fetch("/api/user/orders", { headers: { Authorization: `Bearer ${accessToken}` } }),
                fetch("/api/user/addresses", { headers: { Authorization: `Bearer ${accessToken}` } })
            ]);

            if (ordersRes.ok) setOrders(await ordersRes.json());
            if (addressesRes.ok) setAddresses(await addressesRes.json());
        } catch (error) {
            console.error("Failed to fetch account data");
        } finally {
            setLoading(false);
        }
    };

    const refreshAddresses = async () => {
        try {
            const res = await fetch("/api/user/addresses", { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setAddresses(await res.json());
        } catch {
            // Keep the stale list
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    // --- Address CRUD ---

    const openAddAddress = () => {
        setAddressForm(EMPTY_ADDRESS);
        setAddressError("");
        setIsAddressModalOpen(true);
    };

    const openEditAddress = (address: any) => {
        setAddressForm({
            id: address.id,
            type: address.type || "Home",
            firstName: address.firstName || "",
            lastName: address.lastName || "",
            addressLine1: address.addressLine1 || "",
            addressLine2: address.addressLine2 || "",
            landmark: address.landmark || "",
            city: address.city || "",
            state: address.state || "",
            pincode: address.pincode || "",
            phone: address.phone || "",
            isDefault: Boolean(address.isDefault),
        });
        setAddressError("");
        setIsAddressModalOpen(true);
    };

    const handleAddressField = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setAddressForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddressError("");
        setIsSavingAddress(true);
        try {
            const res = await fetch("/api/user/addresses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(addressForm)
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setAddressError(data.error || "Failed to save address. Please try again.");
                return;
            }
            await refreshAddresses();
            setIsAddressModalOpen(false);
            showToast(addressForm.id ? "Address updated" : "Address added");
        } catch {
            setAddressError("Failed to save address. Please check your connection.");
        } finally {
            setIsSavingAddress(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        setDeletingAddressId(id);
        try {
            const res = await fetch(`/api/user/addresses?id=${encodeURIComponent(id)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setAddresses(prev => prev.filter(a => a.id !== id));
                showToast("Address removed");
            } else {
                showToast("Could not delete address");
            }
        } catch {
            showToast("Could not delete address");
        } finally {
            setDeletingAddressId(null);
        }
    };

    if (!user) return null;

    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0];
    const memberSince = user.created_at
        ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
        : "—";
    const userPhone = user.phone || user.user_metadata?.phone || "";

    return (
        <main className="bg-[#FDFBF7] min-h-screen text-[#1A1A1A] font-sans">

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        role="status"
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-black/90 backdrop-blur-md border border-gold/50 text-gold px-6 py-3 rounded-sm shadow-2xl text-xs uppercase tracking-widest font-bold"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <section className="bg-obsidian text-marble pt-32 pb-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold text-4xl font-serif shadow-2xl">
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-serif text-gold mb-2">Namaste, {displayName}</h1>
                        <p className="text-white/60 text-sm tracking-widest uppercase font-light">
                            Srivari Royal Member • {orders.length} Order{orders.length === 1 ? "" : "s"}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="md:ml-auto flex items-center gap-2 text-white/40 hover:text-gold transition-colors text-xs uppercase tracking-widest font-bold"
                    >
                        <LogOut size={16} aria-hidden="true" /> Logout
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
                            icon={<Package size={18} aria-hidden="true" />}
                            label="Order History"
                        />
                        <TabButton
                            active={activeTab === "addresses"}
                            onClick={() => setActiveTab("addresses")}
                            icon={<MapPin size={18} aria-hidden="true" />}
                            label="Address Book"
                        />
                        <TabButton
                            active={activeTab === "profile"}
                            onClick={() => setActiveTab("profile")}
                            icon={<User size={18} aria-hidden="true" />}
                            label="My Profile"
                        />
                    </aside>

                    {/* Main View Area */}
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
                                            <ShoppingBag className="mx-auto w-12 h-12 text-gold/20" aria-hidden="true" />
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
                                        <button
                                            onClick={openAddAddress}
                                            className="flex items-center gap-2 bg-obsidian text-gold px-4 py-2 rounded-sm text-[10px] uppercase tracking-widest font-bold hover:bg-gold hover:text-obsidian transition-all"
                                        >
                                            <Plus size={14} aria-hidden="true" /> Add Address
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div className="py-20 text-center text-neutral-400">Retrieving locations...</div>
                                    ) : addresses.length === 0 ? (
                                        <div className="py-20 text-center space-y-6">
                                            <MapPin className="mx-auto w-12 h-12 text-gold/20" aria-hidden="true" />
                                            <p className="text-neutral-500 italic font-serif">No addresses saved yet.</p>
                                            <button
                                                onClick={openAddAddress}
                                                className="inline-block text-xs font-bold uppercase tracking-widest text-gold hover:text-obsidian transition-colors underline underline-offset-8"
                                            >
                                                Add your first residence
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {addresses.map((address) => (
                                                <AddressCard
                                                    key={address.id}
                                                    address={address}
                                                    onEdit={() => openEditAddress(address)}
                                                    onDelete={() => handleDeleteAddress(address.id)}
                                                    isDeleting={deletingAddressId === address.id}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === "profile" && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <h3 className="text-2xl font-serif text-[#4A0404] mb-6 border-b pb-4">My Profile</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ProfileField
                                            icon={<User size={16} aria-hidden="true" />}
                                            label="Full Name"
                                            value={user.user_metadata?.full_name || "Not provided"}
                                        />
                                        <ProfileField
                                            icon={<Mail size={16} aria-hidden="true" />}
                                            label="Email Address"
                                            value={user.email || "—"}
                                        />
                                        <ProfileField
                                            icon={<Phone size={16} aria-hidden="true" />}
                                            label="Phone Number"
                                            value={userPhone || "Not provided"}
                                        />
                                        <ProfileField
                                            icon={<CalendarDays size={16} aria-hidden="true" />}
                                            label="Member Since"
                                            value={memberSince}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pt-4">
                                        <div className="border border-gold/20 bg-[#FDFBF7] rounded-sm p-6 text-center">
                                            <p className="text-4xl font-serif text-[#4A0404] mb-1">{orders.length}</p>
                                            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                                                Order{orders.length === 1 ? "" : "s"} Placed
                                            </p>
                                        </div>
                                        <div className="border border-gold/20 bg-[#FDFBF7] rounded-sm p-6 text-center">
                                            <p className="text-4xl font-serif text-[#4A0404] mb-1">{addresses.length}</p>
                                            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                                                Saved Address{addresses.length === 1 ? "" : "es"}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-neutral-400 leading-relaxed pt-2">
                                        Your name and contact details are managed through your sign-in provider. To update
                                        delivery details, use the Address Book tab.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </section>

            {/* Address Add/Edit Modal */}
            <AnimatePresence>
                {isAddressModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddressModalOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 26, stiffness: 220 }}
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-white z-50 shadow-2xl flex flex-col"
                            role="dialog"
                            aria-modal="true"
                            aria-label={addressForm.id ? "Edit address" : "Add address"}
                        >
                            <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100">
                                <div>
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold block mb-1">Address Book</span>
                                    <h2 className="text-xl font-serif text-[#4A0404]">
                                        {addressForm.id ? "Edit Residence" : "New Residence"}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsAddressModalOpen(false)}
                                    className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                                    aria-label="Close address form"
                                >
                                    <X size={20} className="text-neutral-500" aria-hidden="true" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveAddress} className="flex-1 overflow-y-auto px-8 py-6 space-y-5 custom-scrollbar">
                                <div className="space-y-2">
                                    <label htmlFor="addr-type" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Label</label>
                                    <select
                                        id="addr-type"
                                        name="type"
                                        value={addressForm.type}
                                        onChange={handleAddressField}
                                        className="w-full bg-[#FDFBF7] border border-neutral-200 px-4 py-3 rounded-sm focus:outline-none focus:border-gold transition-colors text-sm"
                                    >
                                        <option value="Home">Home</option>
                                        <option value="Office">Office</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="addr-firstName" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">First Name</label>
                                        <input
                                            id="addr-firstName"
                                            name="firstName"
                                            required
                                            value={addressForm.firstName}
                                            onChange={handleAddressField}
                                            className="w-full bg-[#FDFBF7] border border-neutral-200 px-4 py-3 rounded-sm focus:outline-none focus:border-gold transition-colors text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="addr-lastName" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Last Name</label>
                                        <input
                                            id="addr-lastName"
                                            name="lastName"
                                            value={addressForm.lastName}
                                            onChange={handleAddressField}
                                            className="w-full bg-[#FDFBF7] border border-neutral-200 px-4 py-3 rounded-sm focus:outline-none focus:border-gold transition-colors text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="addr-line1" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Address Line 1</label>
                                    <input
                                        id="addr-line1"
                                        name="addressLine1"
                                        required
                                        value={addressForm.addressLine1}
                                        onChange={handleAddressField}
                                        placeholder="House / Flat, Street"
                                        className="w-full bg-[#FDFBF7] border border-neutral-200 px-4 py-3 rounded-sm focus:outline-none focus:border-gold transition-colors text-sm placeholder:text-neutral-300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="addr-line2" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Address Line 2</label>
                                    <input
                                        id="addr-line2"
                                        name="addressLine2"
                                        value={addressForm.addressLine2}
                                        onChange={handleAddressField}
                                        placeholder="Area, Locality (optional)"
                                        className="w-full bg-[#FDFBF7] border border-neutral-200 px-4 py-3 rounded-sm focus:outline-none focus:border-gold transition-colors text-sm placeholder:text-neutral-300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="addr-landmark" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Landmark</label>
                                    <input
                                        id="addr-landmark"
                                        name="landmark"
                                        value={addressForm.landmark}
                                        onChange={handleAddressField}
                                        placeholder="Near... (optional)"
                                        className="w-full bg-[#FDFBF7] border border-neutral-200 px-4 py-3 rounded-sm focus:outline-none focus:border-gold transition-colors text-sm placeholder:text-neutral-300"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="addr-city" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">City</label>
                                        <input
                                            id="addr-city"
                                            name="city"
                                            required
                                            value={addressForm.city}
                                            onChange={handleAddressField}
                                            className="w-full bg-[#FDFBF7] border border-neutral-200 px-4 py-3 rounded-sm focus:outline-none focus:border-gold transition-colors text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="addr-state" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">State</label>
                                        <input
                                            id="addr-state"
                                            name="state"
                                            required
                                            value={addressForm.state}
                                            onChange={handleAddressField}
                                            className="w-full bg-[#FDFBF7] border border-neutral-200 px-4 py-3 rounded-sm focus:outline-none focus:border-gold transition-colors text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="addr-pincode" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Pincode</label>
                                        <input
                                            id="addr-pincode"
                                            name="pincode"
                                            required
                                            pattern="[0-9]{6}"
                                            inputMode="numeric"
                                            value={addressForm.pincode}
                                            onChange={handleAddressField}
                                            placeholder="6-digit PIN"
                                            className="w-full bg-[#FDFBF7] border border-neutral-200 px-4 py-3 rounded-sm focus:outline-none focus:border-gold transition-colors text-sm placeholder:text-neutral-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="addr-phone" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Phone</label>
                                        <input
                                            id="addr-phone"
                                            name="phone"
                                            required
                                            type="tel"
                                            pattern="[0-9]{10,12}"
                                            value={addressForm.phone}
                                            onChange={handleAddressField}
                                            className="w-full bg-[#FDFBF7] border border-neutral-200 px-4 py-3 rounded-sm focus:outline-none focus:border-gold transition-colors text-sm"
                                        />
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer pt-2">
                                    <input
                                        type="checkbox"
                                        checked={addressForm.isDefault}
                                        onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                                        className="w-4 h-4 accent-[#D4AF37]"
                                    />
                                    <span className="text-sm text-neutral-600">Set as primary residence</span>
                                </label>

                                {addressError && (
                                    <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-sm px-4 py-3" role="alert">
                                        {addressError}
                                    </p>
                                )}

                                <div className="pt-4 pb-8">
                                    <button
                                        type="submit"
                                        disabled={isSavingAddress}
                                        className="w-full py-4 bg-obsidian text-gold rounded-sm uppercase tracking-widest text-xs font-bold hover:bg-gold hover:text-obsidian transition-all disabled:opacity-60"
                                    >
                                        {isSavingAddress ? "Saving..." : addressForm.id ? "Update Address" : "Save Address"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <Footer />
        </main>
    );
}

// --- Sub-components ---

function TabButton({ active, onClick, icon, label }: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
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
            {active && <ChevronRight size={14} className="ml-auto" aria-hidden="true" />}
        </button>
    );
}

function ProfileField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="border border-neutral-100 rounded-sm p-5 bg-neutral-50/30">
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2">
                <span className="text-gold">{icon}</span>
                {label}
            </span>
            <p className="text-sm font-medium text-[#1A1A1A] break-words">{value}</p>
        </div>
    );
}

function OrderCard({ order }: { order: any }) {
    const statusColors: Record<string, string> = {
        "Paid": "bg-green-50 text-green-700 border-green-200",
        "Shipped": "bg-blue-50 text-blue-700 border-blue-200",
        "Delivered": "bg-gold/10 text-gold border-gold/20",
        "Cancelled": "bg-red-50 text-red-700 border-red-200",
        "Pending": "bg-amber-50 text-amber-700 border-amber-200",
        "Placed": "bg-neutral-50 text-neutral-700 border-neutral-200"
    };

    return (
        <div className="border border-neutral-100 rounded-sm p-6 hover:shadow-md transition-shadow bg-neutral-50/30">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                    <span className="text-[10px] text-neutral-400 font-bold tracking-widest uppercase block mb-1">Order ID</span>
                    <h4 className="font-bold text-lg">{order.id}</h4>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                            <Clock size={10} aria-hidden="true" /> {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <span className="w-1 h-1 rounded-full bg-neutral-300" aria-hidden="true"></span>
                        <p className="text-[10px] font-bold text-gold uppercase tracking-tighter">
                            {order.payment_method === 'COD' ? 'Cash on Delivery' : order.payment_method}
                        </p>
                    </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[order.status] || statusColors.Pending}`}>
                    {order.status === 'Pending' && order.payment_method === 'Razorpay' ? 'Payment Pending' : order.status}
                </div>
            </div>

            {(order.tracking_number || order.delivery_eta) && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 px-4 bg-white border border-gold/20 rounded-sm mb-2">
                    {order.tracking_number && (
                        <div>
                            <span className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold">Tracking No.</span>
                            <span className="text-xs font-bold text-[#1A1A1A]">{order.tracking_number}</span>
                        </div>
                    )}
                    {order.delivery_eta && (
                        <div>
                            <span className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold">Expected By</span>
                            <span className="text-xs font-bold text-[#1A1A1A]">{order.delivery_eta}</span>
                        </div>
                    )}
                    {order.tracking_url && (
                        <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#4A0404] hover:text-gold transition-colors underline underline-offset-4"
                        >
                            Track Shipment <ExternalLink size={10} aria-hidden="true" />
                        </a>
                    )}
                </div>
            )}

            <div className="flex items-center gap-4 py-4 border-t border-dashed border-neutral-200 mt-4">
                <div className="flex -space-x-3 overflow-hidden">
                    {(order.items as any[]).slice(0, 3).map((item, i) => (
                        <div key={i} className="inline-flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-white bg-[#FAF8F5] border border-gold/20 text-[#4A0404] font-serif text-sm overflow-hidden">
                            {(item.productName || item.name || "S")[0]}
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

function AddressCard({ address, onEdit, onDelete, isDeleting }: {
    address: any;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting: boolean;
}) {
    return (
        <div className="border border-neutral-100 rounded-sm p-6 bg-white shadow-sm relative group">
            {address.isDefault && (
                <div className="absolute top-0 right-0 bg-gold text-obsidian text-[8px] font-bold uppercase px-3 py-1 tracking-widest">
                    Primary
                </div>
            )}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400">
                    <MapPin size={16} aria-hidden="true" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">{address.type}</span>
            </div>
            <h5 className="font-bold text-lg mb-2">{address.firstName} {address.lastName}</h5>
            <div className="text-sm text-neutral-500 space-y-1 mb-6">
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                {address.landmark && <p className="italic text-xs font-light">Landmark: {address.landmark}</p>}
                <p>{address.city}, {address.state} - {address.pincode}</p>
                <p className="mt-2 flex items-center gap-2"><Star size={12} className="text-gold" aria-hidden="true" /> {address.phone}</p>
            </div>
            <div className="flex gap-4 pt-4 border-t border-neutral-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onEdit}
                    className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-gold transition-colors flex items-center gap-1"
                >
                    <Edit3 size={12} aria-hidden="true" /> Edit
                </button>
                {!address.isDefault && (
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="text-[10px] font-bold uppercase tracking-widest text-red-300 hover:text-red-500 transition-colors flex items-center gap-1 ml-auto disabled:opacity-50"
                    >
                        <Trash2 size={12} aria-hidden="true" /> {isDeleting ? "Removing..." : "Delete"}
                    </button>
                )}
            </div>
        </div>
    );
}
