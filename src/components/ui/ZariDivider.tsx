/**
 * Signature section divider: a hairline of gold thread meeting a woven
 * diamond — the motif of a zari border. Server-renderable, theme-agnostic.
 */
export default function ZariDivider({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
    const line = tone === "dark" ? "rgba(212,175,55,0.35)" : "rgba(200,170,110,0.6)";
    const motif = tone === "dark" ? "#D4AF37" : "#C8AA6E";
    return (
        <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden="true">
            <span className="h-px flex-1 max-w-[180px]" style={{ background: `linear-gradient(90deg, transparent, ${line})` }} />
            <svg width="34" height="14" viewBox="0 0 34 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 1 L23 7 L17 13 L11 7 Z" stroke={motif} strokeWidth="0.8" fill="none" />
                <path d="M17 4 L20 7 L17 10 L14 7 Z" fill={motif} fillOpacity="0.55" />
                <circle cx="4" cy="7" r="1.1" fill={motif} fillOpacity="0.5" />
                <circle cx="30" cy="7" r="1.1" fill={motif} fillOpacity="0.5" />
            </svg>
            <span className="h-px flex-1 max-w-[180px]" style={{ background: `linear-gradient(270deg, transparent, ${line})` }} />
        </div>
    );
}
