"use client";

import { useState, useEffect } from "react";
import { X, Share, PlusSquare, Download } from "lucide-react";

export default function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(isAppInstalled);

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Don't show if already installed
        if (isAppInstalled) return;

        // Listen for standard PWA install prompt (Android/Chrome)
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        });

        // For iOS, show the prompt after a slight delay to not overwhelm on first load
        if (isIosDevice) {
            const timer = setTimeout(() => {
                const hasSeenPrompt = localStorage.getItem("srivari_pwa_prompt_dismissed");
                if (!hasSeenPrompt) {
                    setShowPrompt(true);
                }
            }, 5000);
            return () => clearTimeout(timer);
        }

    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        if (isIOS) {
            localStorage.setItem("srivari_pwa_prompt_dismissed", "true");
        }
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pb-8 md:pb-6 pointer-events-none flex justify-center animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#D4AF37]/30 p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.15)] flex flex-col md:flex-row items-center gap-5 max-w-lg w-full pointer-events-auto relative overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 text-white/40 hover:text-white bg-white/5 rounded-full p-1 transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#8C7320] rounded-xl shrink-0 flex items-center justify-center text-black font-serif text-2xl font-bold shadow-lg">
                    S
                </div>

                <div className="flex-1 text-center md:text-left pr-4">
                    <h3 className="font-serif text-lg text-[#D4AF37] leading-tight">Install The Srivari App</h3>
                    <p className="text-white/60 text-xs mt-1 leading-relaxed">
                        {isIOS
                            ? "Get the premium native experience on your iPhone. Tap 'Share' below and then 'Add to Home Screen'."
                            : "Add our boutique to your home screen for the fastest, most premium shopping experience."
                        }
                    </p>
                </div>

                {!isIOS && deferredPrompt && (
                    <button
                        onClick={handleInstallClick}
                        className="bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-black font-bold text-sm px-6 py-3 rounded-xl whitespace-nowrap shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] hover:-translate-y-0.5 transition-all w-full md:w-auto flex items-center justify-center gap-2"
                    >
                        <Download size={16} /> Install App
                    </button>
                )}

                {isIOS && (
                    <div className="flex items-center gap-2 text-[#D4AF37] bg-[#D4AF37]/10 px-4 py-2 rounded-lg border border-[#D4AF37]/20 w-full md:w-auto justify-center">
                        <Share size={18} />
                        <span className="text-white/40 mx-1">then</span>
                        <PlusSquare size={18} />
                    </div>
                )}
            </div>
        </div>
    );
}
