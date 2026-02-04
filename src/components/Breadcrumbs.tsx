"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs() {
    const pathname = usePathname();
    const paths = pathname.split('/').filter(Boolean);

    if (paths.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="flex items-center text-[10px] md:text-xs uppercase tracking-widest text-marble/60 mb-6 font-sans">
            <Link href="/" className="hover:text-gold transition-colors flex items-center">
                <Home className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                HOME
            </Link>
            {paths.map((path, index) => {
                const href = `/${paths.slice(0, index + 1).join('/')}`;
                const isLast = index === paths.length - 1;

                // Decode URI components (e.g. "Royal%20Collection" -> "Royal Collection")
                const label = decodeURIComponent(path).replace(/-/g, ' ');

                return (
                    <div key={path} className="flex items-center">
                        <ChevronRight className="w-3 h-3 mx-2 text-gold/50" />
                        {isLast ? (
                            <span className="text-gold font-medium truncate max-w-[150px] md:max-w-none">
                                {label}
                            </span>
                        ) : (
                            <Link href={href} className="hover:text-gold transition-colors">
                                {label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
