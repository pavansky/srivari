export default function Loading() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-24 animate-pulse">
            <div className="container mx-auto px-4">
                <div className="w-48 h-3 bg-black/10 mb-8"></div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                    {/* Gallery skeleton */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="w-full aspect-[3/4] bg-black/10"></div>
                        <div className="flex gap-3">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="w-16 h-20 bg-black/10"></div>
                            ))}
                        </div>
                    </div>

                    {/* Details skeleton */}
                    <div className="lg:col-span-5 pt-4 space-y-8">
                        <div className="w-40 h-2.5 bg-black/10"></div>
                        <div className="w-3/4 h-12 bg-black/10"></div>
                        <div className="flex justify-between items-baseline border-b border-black/10 pb-6">
                            <div className="w-28 h-7 bg-black/10"></div>
                            <div className="w-20 h-2.5 bg-black/5"></div>
                        </div>
                        <div className="space-y-3">
                            <div className="w-full h-3 bg-black/10"></div>
                            <div className="w-full h-3 bg-black/10"></div>
                            <div className="w-2/3 h-3 bg-black/5"></div>
                        </div>
                        <div className="w-full h-12 bg-black/10"></div>
                        <div className="w-full h-12 border border-black/10"></div>
                        <div className="w-full h-40 border border-black/10 bg-black/5"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
