export default function Loading() {
    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* Header Skeleton */}
            <div className="pt-32 pb-16 px-6 bg-obsidian text-center relative overflow-hidden h-[250px] animate-pulse">
                <div className="w-1/2 h-12 bg-white/10 mx-auto rounded mb-6"></div>
                <div className="w-1/4 h-4 bg-white/5 mx-auto rounded"></div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-8">
                {/* Command Bar Skeleton */}
                <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center py-4 border-b border-[#E5E5E5]/50 animate-pulse">
                    <div className="w-32 h-10 bg-gray-200 rounded-full"></div>
                    <div className="w-24 h-10 bg-gray-200 rounded-full"></div>
                </div>

                {/* Grid Skeleton */}
                <div className="grid gap-x-6 gap-y-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="w-full aspect-[3/4] bg-gray-200 rounded-sm mb-4"></div>
                            <div className="w-1/3 h-3 bg-gray-200 rounded mb-2 mx-auto"></div>
                            <div className="w-3/4 h-5 bg-gray-200 rounded mb-2 mx-auto"></div>
                            <div className="w-1/4 h-4 bg-gray-200 rounded mx-auto"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
