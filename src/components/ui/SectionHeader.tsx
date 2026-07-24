/**
 * Editorial section header: tracked gold kicker, oversized serif title with an
 * italic accent word, optional flanking note. Left-aligned by default — the
 * centered-everything rhythm is what made the old pages feel like a template.
 */
interface SectionHeaderProps {
    kicker: string;
    title: string;
    /** Word(s) inside `title` to render in italic gold. */
    accent?: string;
    note?: string;
    align?: "left" | "center";
    tone?: "dark" | "light";
    className?: string;
}

export default function SectionHeader({ kicker, title, accent, note, align = "left", tone = "dark", className = "" }: SectionHeaderProps) {
    const titleColor = tone === "dark" ? "text-marble" : "text-[#1A1A1A]";
    const noteColor = tone === "dark" ? "text-marble/50" : "text-[#595959]";
    const accentColor = tone === "dark" ? "text-[#D4AF37]" : "text-[#4A0404]";

    const renderTitle = () => {
        if (!accent || !title.includes(accent)) return title;
        const [before, after] = title.split(accent);
        return (
            <>
                {before}
                <em className={`font-serif italic ${accentColor}`}>{accent}</em>
                {after}
            </>
        );
    };

    return (
        <div className={`${align === "center" ? "text-center" : "flex flex-col md:flex-row md:items-end md:justify-between gap-6"} ${className}`}>
            <div className={align === "center" ? "" : "max-w-2xl"}>
                <span className={`kicker ${align === "center" ? "kicker--plain justify-center" : ""} mb-5`}>{kicker}</span>
                <h2 className={`font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight ${titleColor}`}>
                    {renderTitle()}
                </h2>
            </div>
            {note && (
                <p className={`text-sm leading-relaxed font-sans max-w-xs ${noteColor} ${align === "center" ? "mx-auto mt-4" : "md:text-right md:pb-2"}`}>
                    {note}
                </p>
            )}
        </div>
    );
}
