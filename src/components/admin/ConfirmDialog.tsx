"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import { GlassCard } from "./ui";

type ConfirmOptions = {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
};

const ConfirmContext = createContext<{ confirm: (opts: ConfirmOptions) => Promise<boolean> }>({
    confirm: async () => false,
});

export const useConfirm = () => useContext(ConfirmContext);

const TYPE_META = {
    danger: { icon: Trash2, accent: "text-red-400 bg-red-500/10 border-red-500/30", button: "bg-red-500 hover:bg-red-400 text-white" },
    warning: { icon: AlertTriangle, accent: "text-amber-400 bg-amber-500/10 border-amber-500/30", button: "bg-amber-500 hover:bg-amber-400 text-black" },
    info: { icon: Info, accent: "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30", button: "bg-[#D4AF37] hover:bg-[#F2D06B] text-black" },
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolverRef = useRef<((v: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        return new Promise<boolean>(resolve => {
            resolverRef.current = resolve;
        });
    }, []);

    const settle = (value: boolean) => {
        resolverRef.current?.(value);
        resolverRef.current = null;
        setOptions(null);
    };

    const meta = TYPE_META[options?.type || "info"];
    const Icon = meta.icon;

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {options && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                        onClick={() => settle(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            onClick={e => e.stopPropagation()}
                            className="max-w-md w-full"
                        >
                            <GlassCard className="p-8">
                                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${meta.accent}`}>
                                    <Icon size={22} />
                                </div>
                                <h3 className="text-xl font-serif text-white mb-2">{options.title}</h3>
                                <p className="text-sm text-white/50 leading-relaxed mb-8">{options.message}</p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => settle(false)}
                                        className="px-5 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        {options.cancelText || "Cancel"}
                                    </button>
                                    <button
                                        onClick={() => settle(true)}
                                        autoFocus
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${meta.button}`}
                                    >
                                        {options.confirmText || "Confirm"}
                                    </button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
}
