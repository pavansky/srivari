"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, ShieldCheck, Truck, Package, CheckCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OrderTrackingPage() {
    const [step, setStep] = useState<"input" | "otp" | "dashboard">("input");
    const [orderId, setOrderId] = useState("");
    const [otp, setOtp] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch('/api/otp/send', {
                method: 'POST',
                body: JSON.stringify({ orderId }),
            });
            const data = await res.json();

            if (data.success) {
                setMaskedEmail(data.maskedEmail);
                setStep("otp");
                // For "Free Email" mode: We still show alert for dev convenience, 
                // but in production, this would be hidden.
                if (data.debugOtp) {
                    alert(`SRIVARI: OTP sent to ${data.maskedEmail}. (Debug: ${data.debugOtp})`);
                } else {
                    alert(`SRIVARI: An OTP has been sent to your email ${data.maskedEmail}`);
                }
            } else {
                setError(data.message || "Order not found");
            }
        } catch (err) {
            setError("Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch('/api/otp/verify', {
                method: 'POST',
                body: JSON.stringify({ orderId, otp }),
            });
            const data = await res.json();

            if (data.success) {
                setOrderDetails(data.order);
                setStep("dashboard");
            } else {
                setError(data.message || "Invalid OTP");
            }
        } catch (err) {
            setError("Verification failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="bg-[#FDFBF7] min-h-screen flex flex-col font-sans">
            <Navbar />

            <div className="flex-grow pt-32 pb-20 px-6 max-w-2xl mx-auto w-full">

                <h1 className="text-3xl md:text-4xl font-serif text-[#4A0404] text-center mb-2">Concierge Tracking</h1>
                <p className="text-center text-[#595959] mb-12 text-sm uppercase tracking-widest">Trace the journey of your heirloom</p>

                <AnimatePresence mode="wait">

                    {step === "input" && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="bg-white p-8 border border-neutral-200 shadow-sm rounded-lg"
                        >
                            <form onSubmit={handleSendOtp} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-[#4A0404] uppercase tracking-wider mb-2">Order ID</label>
                                    <div className="relative">
                                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                                        <input
                                            type="text"
                                            value={orderId}
                                            onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                                            placeholder="e.g. ORD-8821"
                                            className="w-full pl-12 pr-4 py-4 bg-white border border-neutral-300 text-[#4A0404] placeholder:text-neutral-400 focus:border-[#D4AF37] outline-none transition-colors uppercase font-bold text-lg"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#4A0404] text-gold font-bold py-4 uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-70"
                                >
                                    {loading ? "Locating..." : "Track Order"}
                                </button>
                                {error && <p className="text-red-600 text-xs text-center">{error}</p>}
                            </form>
                        </motion.div>
                    )}

                    {step === "otp" && (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="bg-white p-8 border border-neutral-200 shadow-sm rounded-lg"
                        >
                            <div className="text-center mb-6">
                                <ShieldCheck className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
                                <h3 className="text-xl font-serif text-[#4A0404]">Security Verification</h3>
                                <p className="text-sm text-neutral-500 mt-2">
                                    We sent a One-Time Password to your registered email <span className="font-bold text-black">{maskedEmail}</span>
                                </p>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter 4-digit OTP"
                                        maxLength={4}
                                        className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 bg-white border-2 border-neutral-300 text-[#4A0404] focus:border-[#D4AF37] outline-none transition-colors placeholder:text-neutral-300 placeholder:text-lg placeholder:tracking-normal placeholder:font-normal"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#4A0404] text-gold font-bold py-4 uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-70"
                                >
                                    {loading ? "Verifying..." : "Verify Identity"}
                                </button>
                                {error && <p className="text-red-600 text-xs text-center">{error}</p>}
                                <button onClick={() => setStep("input")} type="button" className="block w-full text-center text-xs text-neutral-400 hover:text-black mt-4 underline">Wrong Order ID?</button>
                            </form>
                        </motion.div>
                    )}

                    {step === "dashboard" && orderDetails && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Status Card */}
                            <div className="bg-white p-8 border border-[#D4AF37] shadow-lg rounded-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Truck size={100} /></div>
                                <div className="relative z-10">
                                    <span className="bg-[#4A0404] text-white text-[10px] uppercase font-bold px-2 py-1 tracking-widest rounded-sm">Current Status</span>
                                    <h2 className="text-3xl font-serif text-[#4A0404] mt-4 mb-2">{orderDetails.status}</h2>
                                    <p className="text-[#595959]">Expected Delivery: <span className="font-bold">{orderDetails.estimatedDelivery}</span></p>
                                    <div className="mt-6 flex items-center gap-2 text-sm text-[#D4AF37] font-medium">
                                        <CheckCircle size={16} /> Location: {orderDetails.currentLocation}
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="bg-white p-6 border border-neutral-200 rounded-lg">
                                <h3 className="text-sm font-bold text-[#4A0404] uppercase tracking-wider mb-4 border-b pb-2">Package Contents</h3>
                                <ul className="space-y-4">
                                    {orderDetails.items.map((item: any, i: number) => (
                                        <li key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-[#595959]">{item.name}</span>
                                            <span className="font-medium">₹{item.price.toLocaleString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button onClick={() => setStep("input")} className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 py-3 uppercase text-xs font-bold tracking-widest transition-colors">
                                Track Another Order
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>

            </div>

            <Footer />
        </main>
    );
}
