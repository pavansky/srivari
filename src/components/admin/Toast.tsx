"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<{ toast: (kind: ToastKind, message: string) => void }>({
    toast: () => {},
});

export const useToast = () => useContext(ToastContext);

const KIND_STYLES: Record<ToastKind, { wrap: string; icon: React.ReactNode }> = {
    success: {
        wrap: "bg-[#D4AF37] text-black shadow-[0_0_25px_rgba(212,175,55,0.45)]",
        icon: <CheckCircle2 size={18} />,
    },
    error: {
        wrap: "bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.45)]",
        icon: <AlertCircle size={18} />,
    },
    info: {
        wrap: "bg-white/90 text-black shadow-[0_0_25px_rgba(255,255,255,0.25)]",
        icon: <Info size={18} />,
    },
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback((kind: ToastKind, message: string) => {
        const id = nextId++;
        setToasts(prev => [...prev.slice(-3), { id, kind, message }]);
        setTimeout(() => dismiss(id), 4500);
    }, [dismiss]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end pointer-events-none">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 40 }}
                            className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-full font-bold text-sm max-w-md ${KIND_STYLES[t.kind].wrap}`}
                        >
                            {KIND_STYLES[t.kind].icon}
                            <span className="truncate">{t.message}</span>
                            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100 shrink-0" aria-label="Dismiss notification">
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
