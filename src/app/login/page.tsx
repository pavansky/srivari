"use client";

import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSocialLogin = async (provider: 'google' | 'facebook') => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error('Login error:', error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-obsidian relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gold/3 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                {/* Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-10 md:p-12 shadow-2xl shadow-black/50">

                    {/* Logo & Branding */}
                    <div className="mb-10 flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="relative mb-6"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-gold to-gold-dim rounded-full flex items-center justify-center shadow-lg shadow-gold/20">
                                <span className="font-serif text-3xl font-bold text-obsidian">S</span>
                            </div>
                            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-gold animate-pulse" />
                        </motion.div>
                        <h1 className="text-3xl font-serif text-white mb-2 tracking-wide">Welcome Back</h1>
                        <p className="text-white/40 font-sans text-xs tracking-[0.3em] uppercase">The Srivari Legacy</p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-gold/20" />
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Continue with</span>
                        <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-gold/20" />
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-4">
                        <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSocialLogin('google')}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-white/[0.06] border border-white/10 hover:border-gold/30 hover:bg-white/[0.08] text-white py-4 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-gold/5 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C.79 9.81 0 12.92 0 16c0 3.09.79 6.19 2.18 8.95l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            <span className="font-sans text-sm font-medium tracking-wide">Continue with Google</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSocialLogin('facebook')}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-[#1877F2]/10 border border-[#1877F2]/20 hover:border-[#1877F2]/40 hover:bg-[#1877F2]/20 text-white py-4 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#1877F2]/10 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5 fill-current text-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            <span className="font-sans text-sm font-medium tracking-wide">Continue with Facebook</span>
                        </motion.button>
                    </div>

                    {/* Security Badge */}
                    <div className="mt-10 pt-6 border-t border-white/[0.06]">
                        <div className="flex items-center justify-center gap-2 text-white/25 text-xs">
                            <ShieldCheck size={14} className="text-gold/50" />
                            <span className="tracking-wider">Secure Access • Your data is protected</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Link */}
                <p className="text-center mt-6 text-white/20 text-xs tracking-wider">
                    By continuing, you agree to our Terms of Service
                </p>
            </motion.div>
        </div>
    );
}
