export default function Loading() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-24 animate-pulse">
            <div className="container mx-auto px-4">
                <div className="w-48 h-3 bg-gray-200 rounded mb-8"></div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                    {/* Gallery skeleton */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="w-full aspect-[3/4] bg-gray-200"></div>
                        <div className="flex gap-3">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="w-16 h-20 bg-gray-200"></div>
                            ))}
                        </div>
                    </div>

                    {/* Details skeleton */}
                    <div className="lg:col-span-5 pt-4 space-y-8">
                        <div className="w-40 h-3 bg-gray-200 rounded"></div>
                        <div className="w-3/4 h-12 bg-gray-200 rounded"></div>
                        <div className="flex justify-between items-center">
                            <div className="w-32 h-8 bg-gray-200 rounded"></div>
                            <div className="w-24 h-6 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="space-y-3">
                            <div className="w-full h-3 bg-gray-200 rounded"></div>
                            <div className="w-full h-3 bg-gray-200 rounded"></div>
                            <div className="w-2/3 h-3 bg-gray-200 rounded"></div>
                        </div>
                        <div className="w-full h-14 bg-gray-200"></div>
                        <div className="w-full h-14 bg-gray-100 border border-gray-200"></div>
                        <div className="w-full h-40 bg-gray-100 rounded-sm"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
