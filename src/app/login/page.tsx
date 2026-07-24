"use client";

import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

/** Square, hairline-bordered provider button — shared by both OAuth options. */
const OAUTH_BUTTON =
    "w-full flex items-center justify-center gap-3.5 border border-marble/15 bg-white/[0.03] px-6 py-4 font-sans text-[10px] uppercase tracking-[0.3em] text-marble/85 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#D4AF37]/50 hover:bg-white/[0.06] hover:text-marble disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-marble/15 disabled:hover:bg-white/[0.03]";

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
        <main className="texture-silk relative min-h-screen overflow-hidden bg-obsidian flex items-center justify-center px-4 py-32">
            {/* Ambient gold — a single, quiet wash from above */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(212,175,55,0.07), transparent 70%)" }}
            />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-md"
            >
                {/* The panel — hairline zari frame, square */}
                <div className="border border-[#D4AF37]/20 bg-white/[0.02] px-8 py-12 sm:px-12 sm:py-14">

                    {/* Brand block */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 flex items-center justify-center border border-[#D4AF37]/50">
                            <span className="font-serif text-2xl leading-none text-[#D4AF37]">S</span>
                        </div>
                        <span className="kicker kicker--plain mt-7">The Srivari Legacy</span>
                        <h1 className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight text-marble mt-5">
                            Welcome Back
                        </h1>
                    </div>

                    {/* Hairline divider */}
                    <div className="mt-11 mb-8 flex items-center gap-5">
                        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
                        <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-marble/40 whitespace-nowrap">
                            Continue With
                        </span>
                        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
                    </div>

                    {/* Providers */}
                    <div className="space-y-4">
                        <button
                            onClick={() => handleSocialLogin('google')}
                            disabled={loading}
                            className={OAUTH_BUTTON}
                        >
                            <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C.79 9.81 0 12.92 0 16c0 3.09.79 6.19 2.18 8.95l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            <span>Continue with Google</span>
                        </button>

                        <button
                            onClick={() => handleSocialLogin('facebook')}
                            disabled={loading}
                            className={OAUTH_BUTTON}
                        >
                            <svg className="w-[18px] h-[18px] shrink-0 fill-current text-[#1877F2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            <span>Continue with Facebook</span>
                        </button>
                    </div>

                    {/* Reassurance */}
                    <div className="mt-11 pt-7 border-t border-marble/10">
                        <p className="flex items-center justify-center gap-2.5 font-sans text-[9px] uppercase tracking-[0.3em] text-marble/35 text-center">
                            <ShieldCheck size={13} className="text-[#D4AF37]/70 shrink-0" aria-hidden="true" />
                            Secure Access — Your Data Is Protected
                        </p>
                    </div>
                </div>

                {/* Below the panel */}
                <div className="mt-10 flex flex-col items-center gap-7">
                    <Link href="/" className="btn-thread text-marble/55 hover:text-[#D4AF37] transition-colors duration-500">
                        Return to the Collection
                    </Link>
                    <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-marble/25 text-center leading-relaxed">
                        By continuing, you agree to our Terms of Service
                    </p>
                </div>
            </motion.div>
        </main>
    );
}
