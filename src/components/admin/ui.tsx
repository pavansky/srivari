"use client";

import { ChevronDown } from "lucide-react";

/* Shared glass primitives for the admin console. Keep all admin surfaces on
   these so the obsidian + gold theme (and the .admin-light overrides in
   globals.css) stay consistent. */

export const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-gradient-to-br from-[#111111]/95 to-[#080808]/95 backdrop-blur-3xl border border-white/[0.08] rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.05)] relative overflow-hidden group/card ${className}`}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none rounded-2xl" />
        {children}
    </div>
);

export const GlassInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className={`w-full bg-black/50 border border-white/[0.08] p-4 rounded-xl text-white placeholder-white/25 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 focus:bg-black/70 hover:border-white/15 outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] font-sans text-sm ${props.className || ""}`}
    />
);

export const GlassTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        {...props}
        className={`w-full bg-[#050505]/60 border border-white/10 p-4 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-white/20 outline-none transition-all duration-300 resize-none font-sans leading-relaxed shadow-inner text-sm ${props.className || ""}`}
    />
);

export const GlassSelect = ({ wrapperClassName = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string }) => (
    <div className={`relative ${wrapperClassName}`}>
        <select
            {...props}
            className={`w-full bg-black/50 border border-white/[0.08] p-4 rounded-xl text-white focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 hover:border-white/15 outline-none transition-all duration-300 appearance-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] font-sans text-sm pr-10 ${props.className || ""}`}
        />
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37] pointer-events-none" size={16} />
    </div>
);

export const FieldLabel = ({ children, gold = false, className = "" }: { children: React.ReactNode; gold?: boolean; className?: string }) => (
    <label className={`text-xs ${gold ? "text-[#D4AF37]" : "text-white/50"} uppercase tracking-widest block mb-2 font-medium ${className}`}>
        {children}
    </label>
);

export const SectionHeading = ({ title, subtitle, icon, actions }: { title: string; subtitle?: string; icon?: React.ReactNode; actions?: React.ReactNode }) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
            <h2 className="text-2xl md:text-3xl font-serif bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] bg-clip-text text-transparent flex items-center gap-3">
                {icon}
                {title}
            </h2>
            {subtitle && <p className="text-sm text-white/40 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
);

export const GoldButton = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
        {...props}
        className={`bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-black font-bold px-6 py-3 rounded-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 ${className}`}
    >
        {children}
    </button>
);

export const GhostButton = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
        {...props}
        className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white border border-white/10 hover:border-white/25 transition-all flex items-center gap-2 hover:bg-white/[0.04] disabled:opacity-40 ${className}`}
    >
        {children}
    </button>
);

const STATUS_STYLES: Record<string, string> = {
    Pending: "text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10",
    Placed: "text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10",
    Paid: "text-sky-400 border-sky-500/30 bg-sky-500/10",
    Shipped: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    Delivered: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    Cancelled: "text-red-400 border-red-500/30 bg-red-500/10",
    Warning: "text-amber-400 border-amber-500/30 bg-amber-500/10",
};

export const StatusBadge = ({ status }: { status: string }) => (
    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap ${STATUS_STYLES[status] || "text-white/50 border-white/20 bg-white/5"}`}>
        {status}
    </span>
);

export const EmptyState = ({ icon, title, subtitle }: { icon?: React.ReactNode; title: string; subtitle?: string }) => (
    <div className="text-center py-16 opacity-60">
        {icon && <div className="mx-auto mb-4 w-14 h-14 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/30">{icon}</div>}
        <p className="text-white/60 font-serif text-lg">{title}</p>
        {subtitle && <p className="text-white/30 text-sm mt-1">{subtitle}</p>}
    </div>
);
