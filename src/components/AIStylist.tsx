"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import SrivariImage from "./SrivariImage";
import { products } from "@/data/products";

type Message = {
    id: string;
    sender: 'ai' | 'user';
    text: string;
    recommendationId?: string;
};

export default function AIStylist() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", sender: "ai", text: "Namaskaram. I am the Royal Stylist of The Srivari. Are you seeking a bridal masterpiece, an authentic Banarasi, or something specific for an upcoming occasion?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        // Simulate AI Response 
        setTimeout(() => {
            const query = userMsg.text.toLowerCase();
            let aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: "" };

            if (query.includes("wedding") || query.includes("bridal") || query.includes("bride")) {
                aiMsg.text = "For a bride, a pure Kanjivaram zari is unparalleled. Here is my personal recommendation from our Atelier collection.";
                // Find a bridal product
                const bridalProduct = products.find(p => p.category === "Bridal Silk") || products[0];
                if (bridalProduct) aiMsg.recommendationId = bridalProduct.id;
            } else if (query.includes("party") || query.includes("light") || query.includes("organza")) {
                aiMsg.text = "For effortless elegance, I suggest an exquisite soft silk or an organza masterpiece that flows beautifully.";
                const partyProduct = products.find(p => p.category === "Soft Silk" || p.category === "Organza") || products[1];
                if (partyProduct) aiMsg.recommendationId = partyProduct.id;
            } else if (query.includes("budget") || query.includes("under")) {
                aiMsg.text = "We have stunning authentic pieces across all ranges. This Banarasi silk offers regal splendor that is highly sought after.";
                aiMsg.recommendationId = products[2]?.id;
            } else {
                aiMsg.text = "I have scanned our sacred collections. Based on classic aesthetics, this piece is universally admired and currently in our highest demand.";
                aiMsg.recommendationId = products[Math.floor(Math.random() * products.length)]?.id;
            }

            setIsTyping(false);
            setMessages(prev => [...prev, aiMsg]);
        }, 1500);
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
                className={`fixed bottom-6 lg:bottom-10 right-6 lg:right-10 z-[60] w-14 h-14 bg-[#1A1A1A] text-[#D4AF37] rounded-full shadow-2xl flex items-center justify-center border border-[#D4AF37] ${isOpen ? 'hidden' : 'flex'}`}
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
                        className="fixed bottom-6 lg:bottom-10 right-6 lg:right-10 z-[70] w-full max-w-[360px] md:max-w-[400px] h-[600px] max-h-[85vh] bg-[#FDFBF7] rounded-2xl shadow-2xl border border-[#D4AF37]/30 flex flex-col overflow-hidden"
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
                                            : 'bg-white border border-[#D4AF37]/20 text-[#1A1A1A] rounded-tl-none'
                                        }`}>
                                        <p className="text-sm font-sans leading-relaxed">{msg.text}</p>

                                        {/* AI Recommendation Card */}
                                        {msg.recommendationId && (
                                            <div className="mt-4 pt-4 border-t border-black/10">
                                                {(() => {
                                                    const recProduct = products.find(p => p.id === msg.recommendationId);
                                                    if (!recProduct) return null;
                                                    return (
                                                        <Link href={`/product/${recProduct.id}`} onClick={() => setIsOpen(false)} className="block group">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                                    <SrivariImage src={recProduct.images[0]} alt={recProduct.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold uppercase tracking-wider text-[#4A0404] mb-1">{recProduct.category}</p>
                                                                    <p className="text-sm font-serif group-hover:text-[#D4AF37] transition-colors line-clamp-2">{recProduct.name}</p>
                                                                    <p className="text-xs font-bold text-gray-500 mt-1">₹{recProduct.price.toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    )
                                                })()}
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
