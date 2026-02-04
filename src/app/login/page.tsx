"use client";

import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import Image from 'next/image';

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
        // If successful, Supabase handles the redirect to provider
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F5F0] relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#4A0404_1px,transparent_1px)] bg-[size:20px_20px]">
            </div>

            <div className="relative z-10 w-full max-w-md p-8 bg-white border border-[#E5E5E5] shadow-2xl rounded-none md:rounded-lg text-center">

                {/* Logo & Branding */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#4A0404] text-white flex items-center justify-center rounded-full mb-4 shadow-lg">
                        <span className="font-serif text-2xl font-bold">S</span>
                    </div>
                    <h1 className="text-3xl font-serif text-[#1A1A1A] mb-2 tracking-wide">Welcome Back</h1>
                    <p className="text-gray-500 font-sans text-sm tracking-widest uppercase">The Srivari Legacy</p>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-4">
                    <button
                        onClick={() => handleSocialLogin('google')}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded transition-all duration-300 hover:shadow-md disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C.79 9.81 0 12.92 0 16c0 3.09.79 6.19 2.18 8.95l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        <span className="font-medium">Continue with Google</span>
                    </button>

                    <button
                        onClick={() => handleSocialLogin('facebook')}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white py-3 px-4 rounded transition-all duration-300 hover:shadow-md disabled:opacity-50"
                    >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        <span className="font-medium">Continue with Facebook</span>
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                        <ShieldCheck size={14} className="text-[#D4AF37]" />
                        <span>Secure Access • Your data is protected</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
