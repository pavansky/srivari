export default function Loading() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] py-24 animate-pulse">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 mb-32">
                    {/* Left: Image Carousel Skeleton */}
                    <div className="w-full aspect-[3/4] bg-gray-200 rounded-xl"></div>

                    {/* Right: Product Details Skeleton */}
                    <div className="flex flex-col justify-center py-10">
                        <div className="w-24 h-4 bg-gray-200 rounded mb-4"></div>
                        <div className="w-3/4 h-10 bg-gray-200 rounded mb-6"></div>
                        <div className="w-32 h-8 bg-gray-200 rounded mb-10"></div>
                        <div className="w-full h-24 bg-gray-200 rounded mb-8"></div>
                        <div className="w-full h-12 bg-gray-200 rounded-full mb-4"></div>
                        <div className="w-full h-12 bg-gray-200 rounded-full mb-8"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
