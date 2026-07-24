"use client";

import { useState, useEffect, useRef } from "react";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import ZariDivider from "@/components/ui/ZariDivider";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag, MapPin, User, LogOut, Package,
    ChevronDown, Clock, Edit3, Trash2, Plus, X,
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

type TabId = "orders" | "addresses" | "profile";

const TABS: { id: TabId; label: string; icon: typeof Package }[] = [
    { id: "orders", label: "Order History", icon: Package },
    { id: "addresses", label: "Address Book", icon: MapPin },
    { id: "profile", label: "My Profile", icon: User },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Underline field — the house input treatment. */
const FIELD =
    "w-full bg-transparent border-0 border-b border-black/20 py-3 font-serif text-lg text-[#1A1A1A] tracking-wide placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-neutral-400 focus:border-[#D4AF37] focus:outline-none transition-colors duration-500";

const FIELD_LABEL = "block text-[9px] font-sans uppercase tracking-[0.3em] text-[#4A0404]/70 mb-1";

const MICRO = "text-[9px] font-sans uppercase tracking-[0.3em]";

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string>("");
    const [activeTab, setActiveTab] = useState<TabId>("orders");
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
            <h1 className="sr-only">My Account</h1>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        role="status"
                        className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-[#0A0A0A]/95 backdrop-blur-md border border-[#D4AF37]/50 text-marble px-6 py-3 shadow-2xl ${MICRO}`}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Editorial header band */}
            <section className="texture-silk relative bg-obsidian text-marble pt-36 pb-20 px-6">
                <div className="container mx-auto">
                    <SectionHeader
                        tone="dark"
                        kicker="Your Private Atelier"
                        title="My Account"
                        accent="Account"
                        note={user.email ? `Namaste, ${displayName} — ${user.email}` : `Namaste, ${displayName}`}
                    />

                    <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-marble/10 pt-6">
                        <p className={`flex items-center gap-3 ${MICRO} text-marble/50`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" aria-hidden="true"></span>
                            Srivari Royal Member — {orders.length} Order{orders.length === 1 ? "" : "s"}
                        </p>
                        <button
                            onClick={handleLogout}
                            className="btn-thread text-marble/55 hover:text-[#D4AF37] transition-colors duration-500"
                        >
                            <LogOut size={13} aria-hidden="true" /> Logout
                        </button>
                    </div>
                </div>
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"
                />
            </section>

            {/* Dashboard */}
            <section className="container mx-auto px-6 pt-16 pb-24">

                {/* Hairline tab bar */}
                <div role="tablist" aria-label="Account sections" className="flex flex-wrap gap-x-10 gap-y-1 border-b border-black/10">
                    {TABS.map(({ id, label, icon: Icon }) => {
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                id={`account-tab-${id}`}
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`account-panel-${id}`}
                                onClick={() => setActiveTab(id)}
                                className={`relative flex items-center gap-2.5 pt-1 pb-5 ${MICRO} transition-colors duration-500 ${isActive ? "text-[#4A0404]" : "text-neutral-400 hover:text-[#1A1A1A]"
                                    }`}
                            >
                                <Icon size={13} aria-hidden="true" />
                                {label}
                                {isActive && (
                                    <motion.span
                                        layoutId="account-tab-thread"
                                        transition={{ duration: 0.6, ease: EASE }}
                                        className="absolute inset-x-0 -bottom-px h-px bg-[#4A0404]"
                                        aria-hidden="true"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="pt-14">
                    <AnimatePresence mode="wait">
                        {activeTab === "orders" && (
                            <motion.div
                                key="orders"
                                id="account-panel-orders"
                                role="tabpanel"
                                aria-labelledby="account-tab-orders"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.6, ease: EASE }}
                            >
                                <div className="flex items-baseline justify-between border-b border-black/10 pb-4 mb-12">
                                    <h3 className="font-serif text-2xl md:text-3xl text-[#4A0404]">Past Masterpieces</h3>
                                    {orders.length > 0 && (
                                        <span className={`${MICRO} text-neutral-400`}>
                                            {orders.length} Order{orders.length === 1 ? "" : "s"}
                                        </span>
                                    )}
                                </div>

                                {loading ? (
                                    <p className="py-24 text-center font-serif text-xl italic text-neutral-400">
                                        Loading your collection...
                                    </p>
                                ) : orders.length === 0 ? (
                                    <div className="py-24 text-center max-w-lg mx-auto">
                                        <ShoppingBag size={28} className="mx-auto text-[#D4AF37] mb-8" strokeWidth={1} aria-hidden="true" />
                                        <h4 className="font-serif text-3xl md:text-4xl leading-[1.1] text-[#1A1A1A] mb-8">
                                            Your journey with Srivari&apos;s is just <em className="italic text-[#4A0404]">beginning</em>
                                        </h4>
                                        <Link href="/shop" className="btn-royal btn-royal--oxblood">
                                            Explore Collections
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
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
                                id="account-panel-addresses"
                                role="tabpanel"
                                aria-labelledby="account-tab-addresses"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.6, ease: EASE }}
                            >
                                <div className="flex flex-wrap items-baseline justify-between gap-6 border-b border-black/10 pb-4 mb-12">
                                    <h3 className="font-serif text-2xl md:text-3xl text-[#4A0404]">Royal Residences</h3>
                                    <button onClick={openAddAddress} className="btn-thread text-[#4A0404]">
                                        <Plus size={13} aria-hidden="true" /> Add Address
                                    </button>
                                </div>

                                {loading ? (
                                    <p className="py-24 text-center font-serif text-xl italic text-neutral-400">
                                        Retrieving locations...
                                    </p>
                                ) : addresses.length === 0 ? (
                                    <div className="py-24 text-center max-w-lg mx-auto">
                                        <MapPin size={28} className="mx-auto text-[#D4AF37] mb-8" strokeWidth={1} aria-hidden="true" />
                                        <h4 className="font-serif text-3xl md:text-4xl leading-[1.1] text-[#1A1A1A] mb-8">
                                            No residences <em className="italic text-[#4A0404]">saved yet</em>
                                        </h4>
                                        <button onClick={openAddAddress} className="btn-royal btn-royal--oxblood">
                                            Add your first residence
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                id="account-panel-profile"
                                role="tabpanel"
                                aria-labelledby="account-tab-profile"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.6, ease: EASE }}
                            >
                                <div className="border-b border-black/10 pb-4 mb-12">
                                    <h3 className="font-serif text-2xl md:text-3xl text-[#4A0404]">My Profile</h3>
                                </div>

                                <dl className="border-t border-black/10 max-w-3xl">
                                    <ProfileRow
                                        icon={<User size={14} aria-hidden="true" />}
                                        label="Full Name"
                                        value={user.user_metadata?.full_name || "Not provided"}
                                    />
                                    <ProfileRow
                                        icon={<Mail size={14} aria-hidden="true" />}
                                        label="Email Address"
                                        value={user.email || "—"}
                                    />
                                    <ProfileRow
                                        icon={<Phone size={14} aria-hidden="true" />}
                                        label="Phone Number"
                                        value={userPhone || "Not provided"}
                                    />
                                    <ProfileRow
                                        icon={<CalendarDays size={14} aria-hidden="true" />}
                                        label="Member Since"
                                        value={memberSince}
                                    />
                                </dl>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-16 max-w-3xl">
                                    <div className="border border-black/10 bg-[#F9F5F0] px-8 py-10">
                                        <p className="font-serif text-5xl text-[#4A0404] leading-none mb-4">{orders.length}</p>
                                        <p className={`${MICRO} text-neutral-400`}>
                                            Order{orders.length === 1 ? "" : "s"} Placed
                                        </p>
                                    </div>
                                    <div className="border border-black/10 bg-[#F9F5F0] px-8 py-10">
                                        <p className="font-serif text-5xl text-[#4A0404] leading-none mb-4">{addresses.length}</p>
                                        <p className={`${MICRO} text-neutral-400`}>
                                            Saved Address{addresses.length === 1 ? "" : "es"}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-neutral-400 leading-relaxed mt-12 max-w-xl">
                                    Your name and contact details are managed through your sign-in provider. To update
                                    delivery details, use the Address Book tab.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <ZariDivider tone="light" className="mt-24" />
            </section>

            {/* Address Add/Edit Panel */}
            <AnimatePresence>
                {isAddressModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: EASE }}
                            onClick={() => setIsAddressModalOpen(false)}
                            className="fixed inset-0 bg-[#0A0A0A]/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ duration: 0.7, ease: EASE }}
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-[#FDFBF7] border-l border-[#D4AF37]/30 z-50 flex flex-col"
                            role="dialog"
                            aria-modal="true"
                            aria-label={addressForm.id ? "Edit address" : "Add address"}
                        >
                            <div className="flex items-start justify-between gap-4 px-8 py-7 border-b border-black/10">
                                <div>
                                    <span className={`${MICRO} text-[#D4AF37] block mb-2`}>Address Book</span>
                                    <h2 className="font-serif text-3xl leading-tight text-[#4A0404]">
                                        {addressForm.id ? "Edit Residence" : "New Residence"}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsAddressModalOpen(false)}
                                    className="w-9 h-9 flex items-center justify-center border border-black/10 text-neutral-400 hover:text-[#4A0404] hover:border-[#4A0404] transition-colors duration-500"
                                    aria-label="Close address form"
                                >
                                    <X size={16} aria-hidden="true" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveAddress} className="flex-1 overflow-y-auto px-8 py-8 space-y-7 custom-scrollbar">
                                <div>
                                    <label htmlFor="addr-type" className={FIELD_LABEL}>Label</label>
                                    <div className="relative">
                                        <select
                                            id="addr-type"
                                            name="type"
                                            value={addressForm.type}
                                            onChange={handleAddressField}
                                            className={`${FIELD} appearance-none pr-8 cursor-pointer`}
                                        >
                                            <option value="Home">Home</option>
                                            <option value="Office">Office</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <ChevronDown
                                            size={16}
                                            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#D4AF37]"
                                            aria-hidden="true"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label htmlFor="addr-firstName" className={FIELD_LABEL}>First Name</label>
                                        <input
                                            id="addr-firstName"
                                            name="firstName"
                                            required
                                            value={addressForm.firstName}
                                            onChange={handleAddressField}
                                            className={FIELD}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="addr-lastName" className={FIELD_LABEL}>Last Name</label>
                                        <input
                                            id="addr-lastName"
                                            name="lastName"
                                            value={addressForm.lastName}
                                            onChange={handleAddressField}
                                            className={FIELD}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="addr-line1" className={FIELD_LABEL}>Address Line 1</label>
                                    <input
                                        id="addr-line1"
                                        name="addressLine1"
                                        required
                                        value={addressForm.addressLine1}
                                        onChange={handleAddressField}
                                        placeholder="House / Flat, Street"
                                        className={FIELD}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="addr-line2" className={FIELD_LABEL}>Address Line 2</label>
                                    <input
                                        id="addr-line2"
                                        name="addressLine2"
                                        value={addressForm.addressLine2}
                                        onChange={handleAddressField}
                                        placeholder="Area, Locality (optional)"
                                        className={FIELD}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="addr-landmark" className={FIELD_LABEL}>Landmark</label>
                                    <input
                                        id="addr-landmark"
                                        name="landmark"
                                        value={addressForm.landmark}
                                        onChange={handleAddressField}
                                        placeholder="Near... (optional)"
                                        className={FIELD}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label htmlFor="addr-city" className={FIELD_LABEL}>City</label>
                                        <input
                                            id="addr-city"
                                            name="city"
                                            required
                                            value={addressForm.city}
                                            onChange={handleAddressField}
                                            className={FIELD}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="addr-state" className={FIELD_LABEL}>State</label>
                                        <input
                                            id="addr-state"
                                            name="state"
                                            required
                                            value={addressForm.state}
                                            onChange={handleAddressField}
                                            className={FIELD}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label htmlFor="addr-pincode" className={FIELD_LABEL}>Pincode</label>
                                        <input
                                            id="addr-pincode"
                                            name="pincode"
                                            required
                                            pattern="[0-9]{6}"
                                            inputMode="numeric"
                                            value={addressForm.pincode}
                                            onChange={handleAddressField}
                                            placeholder="6-digit PIN"
                                            className={FIELD}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="addr-phone" className={FIELD_LABEL}>Phone</label>
                                        <input
                                            id="addr-phone"
                                            name="phone"
                                            required
                                            type="tel"
                                            pattern="[0-9]{10,12}"
                                            value={addressForm.phone}
                                            onChange={handleAddressField}
                                            className={FIELD}
                                        />
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer pt-2">
                                    <input
                                        type="checkbox"
                                        checked={addressForm.isDefault}
                                        onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                                        className="w-4 h-4 rounded-none accent-[#D4AF37]"
                                    />
                                    <span className={`${MICRO} text-neutral-500`}>Set as primary residence</span>
                                </label>

                                {addressError && (
                                    <p className="text-[#4A0404] text-xs leading-relaxed border-l border-[#4A0404]/50 pl-4 py-1" role="alert">
                                        {addressError}
                                    </p>
                                )}

                                <div className="pt-6 pb-10 flex flex-col items-center gap-6">
                                    <button
                                        type="submit"
                                        disabled={isSavingAddress}
                                        className="btn-royal btn-royal--oxblood w-full disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isSavingAddress ? "Saving..." : addressForm.id ? "Update Address" : "Save Address"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddressModalOpen(false)}
                                        className="btn-thread text-neutral-400 hover:text-[#4A0404] transition-colors duration-500"
                                    >
                                        Cancel
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

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-2 sm:gap-10 py-7 border-b border-black/10">
            <dt className={`flex items-center gap-3 ${MICRO} text-neutral-400`}>
                <span className="text-[#D4AF37]">{icon}</span>
                {label}
            </dt>
            <dd className="font-serif text-xl text-[#1A1A1A] break-words">{value}</dd>
        </div>
    );
}

function OrderCard({ order }: { order: any }) {
    const statusLabel = order.status === 'Pending' && order.payment_method === 'Razorpay'
        ? 'Payment Pending'
        : order.status;

    return (
        <article className="border border-black/10 bg-white px-7 py-8 md:px-9 md:py-9 transition-colors duration-500 hover:border-[#D4AF37]/50">
            <div className="flex flex-wrap justify-between items-start gap-6 pb-6 border-b border-black/10">
                <div>
                    <span className={`block ${MICRO} text-neutral-400 mb-2`}>Order</span>
                    <h4 className="font-serif text-2xl text-[#1A1A1A] leading-none">{order.id}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                        <span className={`flex items-center gap-1.5 ${MICRO} text-neutral-400`}>
                            <Clock size={11} aria-hidden="true" /> {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-neutral-300" aria-hidden="true"></span>
                        <span className={`${MICRO} text-[#4A0404]`}>
                            {order.payment_method === 'COD' ? 'Cash on Delivery' : order.payment_method}
                        </span>
                    </div>
                </div>
                <span className={`flex items-center gap-2.5 ${MICRO} text-[#4A0404] md:pt-6`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" aria-hidden="true"></span>
                    {statusLabel}
                </span>
            </div>

            {(order.tracking_number || order.delivery_eta || order.tracking_url) && (
                <div className="flex flex-wrap items-end gap-x-12 gap-y-5 py-6 border-b border-black/10">
                    {order.tracking_number && (
                        <div>
                            <span className={`block ${MICRO} text-neutral-400 mb-1.5`}>Tracking No.</span>
                            <span className="font-serif text-lg text-[#1A1A1A]">{order.tracking_number}</span>
                        </div>
                    )}
                    {order.delivery_eta && (
                        <div>
                            <span className={`block ${MICRO} text-neutral-400 mb-1.5`}>Expected By</span>
                            <span className="font-serif text-lg text-[#1A1A1A]">{order.delivery_eta}</span>
                        </div>
                    )}
                    {order.tracking_url && (
                        <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-thread text-[#4A0404] sm:ml-auto"
                        >
                            Track Shipment <ExternalLink size={11} aria-hidden="true" />
                        </a>
                    )}
                </div>
            )}

            <ul className="py-6 space-y-3">
                {(order.items as any[]).map((item, i) => (
                    <li key={i} className="flex justify-between items-baseline gap-4">
                        <span className="font-serif text-lg text-[#1A1A1A]">
                            {item.productName || item.name || "Masterpiece"}
                            {item.quantity > 1 && <span className="text-neutral-400 font-sans text-xs"> × {item.quantity}</span>}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="flex flex-wrap items-baseline justify-between gap-4 pt-6 border-t border-black/10">
                <span className={`${MICRO} text-neutral-400`}>
                    {order.items.length} Masterpiece{order.items.length > 1 ? 's' : ''}
                </span>
                <div className="flex items-baseline gap-8 ml-auto">
                    <span className="font-serif text-2xl text-[#4A0404]">
                        ₹{order.total.toLocaleString('en-IN')}
                    </span>
                    <Link href={`/order-tracking?id=${order.id}`} className="btn-thread text-[#4A0404]">
                        Track Item
                    </Link>
                </div>
            </div>
        </article>
    );
}

function AddressCard({ address, onEdit, onDelete, isDeleting }: {
    address: any;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting: boolean;
}) {
    return (
        <div className="relative group border border-black/10 bg-white px-7 py-8 transition-colors duration-500 hover:border-[#D4AF37]/50">
            <div className="flex items-start justify-between gap-4 mb-6">
                <span className={`flex items-center gap-2.5 ${MICRO} text-neutral-400`}>
                    <MapPin size={13} className="text-[#D4AF37]" aria-hidden="true" />
                    {address.type}
                </span>
                {address.isDefault && (
                    <span className={`${MICRO} text-[#D4AF37]`}>Primary</span>
                )}
            </div>

            <h5 className="font-serif text-2xl text-[#1A1A1A] mb-4">{address.firstName} {address.lastName}</h5>

            <div className="text-sm text-[#595959] space-y-1.5 leading-relaxed">
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                {address.landmark && <p className="italic text-xs text-neutral-400">Landmark: {address.landmark}</p>}
                <p>{address.city}, {address.state} — {address.pincode}</p>
                <p className="flex items-center gap-2 pt-2">
                    <Phone size={12} className="text-[#D4AF37]" aria-hidden="true" /> {address.phone}
                </p>
            </div>

            <div className="flex items-center gap-8 mt-8 pt-6 border-t border-black/10 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-500">
                <button onClick={onEdit} className="btn-thread text-neutral-400 hover:text-[#4A0404] transition-colors duration-500">
                    <Edit3 size={12} aria-hidden="true" /> Edit
                </button>
                {!address.isDefault && (
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="btn-thread ml-auto text-neutral-400 hover:text-[#4A0404] transition-colors duration-500 disabled:opacity-50"
                    >
                        <Trash2 size={12} aria-hidden="true" /> {isDeleting ? "Removing..." : "Delete"}
                    </button>
                )}
            </div>
        </div>
    );
}
