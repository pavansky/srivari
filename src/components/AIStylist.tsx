"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Bot, User, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import SrivariImage from "./SrivariImage";
import { Product } from "@/types";

type Recommendation = {
    id: string;
    matchReason: string;
    confidence: number;
};

type Message = {
    id: string;
    sender: 'ai' | 'user';
    text: string;
    recommendations?: Recommendation[];
    isError?: boolean;
};

export default function AIStylist() {
    const [isOpen, setIsOpen] = useState(false);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", sender: "ai", text: "Namaskaram. I am the Royal Stylist of The Srivari. Are you seeking a bridal masterpiece, an authentic Banarasi, or something specific for an upcoming occasion?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch products once to use for rendering recommendations
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setAllProducts(data);
                }
            } catch (err) {
                console.error("Failed to fetch products for stylist:", err);
            }
        };
        fetchProducts();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        try {
            const res = await fetch('/api/stylist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.map(m => ({
                        role: m.sender === 'ai' ? 'assistant' : 'user',
                        content: m.text
                    })).concat({ role: 'user', content: userMsg.text }),
                    prompt: userMsg.text
                })
            });

            const data = await res.json();

            if (data.error) throw new Error(data.error);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: data.text || "I apologize, I'm having a moment of reflection. How else can I assist you with our sacred collection?",
                recommendations: data.recommendations || []
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error: any) {
            console.error("Stylist API Error:", error);
            const detailText = error.message || "Unknown error";
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                isError: true,
                text: `Namaskaram. My apologies, the digital ink has blurred (${detailText.substring(0, 50)}). Could you please rephrase your request?`
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-24 lg:bottom-28 right-6 lg:right-10 z-[60] w-14 h-14 bg-[#1A1A1A] text-[#D4AF37] rounded-full shadow-2xl flex items-center justify-center border border-[#D4AF37] ${isOpen ? 'hidden' : 'flex'}`}
            >
                <div className="relative">
                    <Sparkles size={24} className="animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4AF37]"></span>
                    </span>
                </div>
            </motion.button>

            {/* AI Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-24 lg:bottom-28 right-6 lg:right-10 z-[70] w-full max-w-[360px] md:max-w-[400px] h-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-[#D4AF37]/30 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-[#1A1A1A] p-4 flex items-center justify-between border-b border-[#D4AF37]/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 border border-[#D4AF37] flex items-center justify-center">
                                    <Bot size={20} className="text-[#D4AF37]" />
                                </div>
                                <div>
                                    <h3 className="text-white font-serif text-lg leading-tight">Royal Stylist</h3>
                                    <p className="text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase">The Srivari AI</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors p-2">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat History */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/aztec.png')] bg-black/5">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.sender === 'user'
                                        ? 'bg-[#1A1A1A] text-white rounded-tr-none'
                                        : msg.isError
                                            ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-none'
                                            : 'bg-white border border-[#D4AF37]/20 text-[#1A1A1A] rounded-tl-none'
                                        }`}>
                                        <p className="text-sm font-sans leading-relaxed">{msg.text}</p>

                                        {/* AI Recommendation Cards */}
                                        {msg.recommendations && msg.recommendations.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-black/10 space-y-4">
                                                {msg.recommendations.map(rec => {
                                                    const recProduct = allProducts.find(p => p.id === rec.id);
                                                    if (!recProduct) return null;
                                                    return (
                                                        <div key={rec.id} className="space-y-2">
                                                            <Link href={`/product/${recProduct.id}`} onClick={() => setIsOpen(false)} className="block group bg-[#FDFBF7] p-3 rounded-xl border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 transition-all">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="relative w-14 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-black/5">
                                                                        <SrivariImage src={recProduct.images[0]} alt={recProduct.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                                                                    </div>
                                                                    <div className="flex-1 overflow-hidden">
                                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] mb-0.5 truncate">{recProduct.category}</p>
                                                                        <p className="text-xs font-serif group-hover:text-[#4A0404] transition-colors line-clamp-1">{recProduct.name}</p>
                                                                        <p className="text-[10px] font-bold text-gray-400 mt-1">₹{recProduct.price.toLocaleString('en-IN')}</p>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                            {/* Semantic Similarity Reason */}
                                                            <div className="flex items-start gap-1.5 px-2">
                                                                <CheckCircle2 size={12} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                                                                <p className="text-[10px] font-medium text-gray-600 leading-tight italic">
                                                                    {rec.matchReason}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-[#D4AF37]/20 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-black/5">
                            <form onSubmit={handleSend} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Describe your desired style..."
                                    className="w-full bg-[#F5F2EB] text-[#1A1A1A] placeholder-gray-400 rounded-full pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-shadow border border-transparent"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || isTyping}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#1A1A1A] text-white rounded-full hover:bg-[#D4AF37] hover:text-[#1A1A1A] disabled:opacity-50 disabled:hover:bg-[#1A1A1A] transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                            <p className="text-center text-[10px] text-gray-400 mt-3 font-medium tracking-wide">
                                AI Stylist • <Link href="/atelier" className="underline hover:text-[#D4AF37]">Book human stylist</Link>
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
