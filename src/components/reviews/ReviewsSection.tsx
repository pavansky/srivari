"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, PenLine, CheckCircle2, ChevronDown } from "lucide-react";

interface ReviewItem {
    id: string;
    name: string;
    rating: number;
    title?: string | null;
    comment: string;
    createdAt: string;
}

interface ReviewsPayload {
    reviews: ReviewItem[];
    count: number;
    average: number;
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
    return (
        <div className="flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={size}
                    aria-hidden="true"
                    className={i <= Math.round(value) ? "text-[#D4AF37] fill-[#D4AF37]" : "text-neutral-300"}
                />
            ))}
        </div>
    );
}

export default function ReviewsSection({ productId, productName }: { productId: string; productName: string }) {
    const [data, setData] = useState<ReviewsPayload>({ reviews: [], count: 0, average: 0 });
    const [loading, setLoading] = useState(true);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [name, setName] = useState("");
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
                if (res.ok) {
                    const payload = await res.json();
                    if (!cancelled) setData(payload);
                }
            } catch {
                // Leave the empty state
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!rating) {
            setError("Please choose a star rating.");
            return;
        }
        if (!name.trim() || !comment.trim()) {
            setError("Please share your name and a few words about the piece.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    name: name.trim(),
                    rating,
                    title: title.trim() || undefined,
                    comment: comment.trim(),
                }),
            });
            const payload = await res.json();
            if (!res.ok || payload.error) {
                setError(payload.error || "Could not submit your review right now. Please try again.");
            } else {
                setSubmitted(true);
                setIsFormOpen(false);
            }
        } catch {
            setError("Could not submit your review right now. Please check your connection.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="bg-[#FAF8F5] border-t border-[#D4AF37]/10 py-16 md:py-24" aria-label="Customer reviews">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                {/* Heading */}
                <div className="text-center mb-12">
                    <span className="text-[#D4AF37] text-[10px] font-sans font-bold uppercase tracking-[0.4em] block mb-3">
                        Voices of Our Patrons
                    </span>
                    <h2 className="text-3xl md:text-4xl font-serif text-[#1A1A1A] mb-4">Reviews</h2>
                    {data.count > 0 ? (
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-3xl font-serif text-[#4A0404]">{data.average.toFixed(1)}</span>
                            <div className="flex flex-col items-start gap-1">
                                <Stars value={data.average} size={16} />
                                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-sans font-bold">
                                    {data.count} review{data.count > 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>
                    ) : (
                        !loading && (
                            <p className="text-sm text-neutral-500 font-sans font-light">
                                Be the first to share your experience with this masterpiece.
                            </p>
                        )
                    )}
                </div>

                {/* Thank-you state after submission */}
                <AnimatePresence>
                    {submitted && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-10 bg-white border border-[#D4AF37]/30 rounded-sm p-6 flex items-start gap-4 shadow-sm"
                            role="status"
                        >
                            <CheckCircle2 className="text-[#D4AF37] shrink-0 mt-0.5" size={20} aria-hidden="true" />
                            <div>
                                <p className="font-serif text-lg text-[#4A0404] mb-1">Thank you for your words.</p>
                                <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                                    Your review of {productName} has been received and will appear here once approved by our curators.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Write a review toggle */}
                {!submitted && (
                    <div className="text-center mb-12">
                        <button
                            onClick={() => setIsFormOpen((o) => !o)}
                            aria-expanded={isFormOpen}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-[#1A1A1A] text-[#D4AF37] uppercase tracking-widest text-xs font-bold hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-all duration-300 rounded-full shadow-md"
                        >
                            <PenLine size={14} aria-hidden="true" />
                            Write a Review
                            <ChevronDown
                                size={14}
                                aria-hidden="true"
                                className={`transition-transform duration-300 ${isFormOpen ? "rotate-180" : ""}`}
                            />
                        </button>
                    </div>
                )}

                {/* Collapsible form */}
                <AnimatePresence>
                    {isFormOpen && !submitted && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <form
                                onSubmit={handleSubmit}
                                className="bg-white border border-[#D4AF37]/20 rounded-sm p-6 md:p-8 mb-12 space-y-6 shadow-sm"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="review-name" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 font-sans">
                                            Your Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            id="review-name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            maxLength={80}
                                            required
                                            className="w-full bg-[#FDFBF7] border border-neutral-200 px-4 py-3 rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors font-sans text-sm"
                                            placeholder="E.g. Priya Sharma"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="block text-[10px] uppercase font-bold tracking-widest text-neutral-500 font-sans">
                                            Your Rating <span className="text-red-400">*</span>
                                        </span>
                                        <div className="flex items-center gap-1 h-[46px]">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setRating(i)}
                                                    onMouseEnter={() => setHoverRating(i)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
                                                    aria-pressed={rating === i}
                                                    className="p-1 transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        size={26}
                                                        aria-hidden="true"
                                                        className={
                                                            i <= (hoverRating || rating)
                                                                ? "text-[#D4AF37] fill-[#D4AF37]"
                                                                : "text-neutral-300"
                                                        }
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="review-title" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 font-sans">
                                        Title
                                    </label>
                                    <input
                                        id="review-title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        maxLength={120}
                                        className="w-full bg-[#FDFBF7] border border-neutral-200 px-4 py-3 rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors font-sans text-sm"
                                        placeholder="A drape fit for royalty"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="review-comment" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 font-sans">
                                        Your Review <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        id="review-comment"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        maxLength={2000}
                                        rows={4}
                                        required
                                        className="w-full bg-[#FDFBF7] border border-neutral-200 px-4 py-3 rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors font-sans text-sm resize-y"
                                        placeholder="Tell us about the weave, the colour, the occasion..."
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-600 text-xs font-sans" role="alert">
                                        {error}
                                    </p>
                                )}

                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full sm:w-auto px-10 py-3.5 bg-[#4A0404] text-white uppercase tracking-widest text-xs font-bold hover:bg-[#1A1A1A] transition-colors rounded-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? "Submitting..." : "Submit Review"}
                                    </button>
                                    <p className="text-[10px] text-neutral-400 font-sans">
                                        Reviews are moderated and appear after approval.
                                    </p>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Reviews list */}
                {loading ? (
                    <div className="space-y-4" aria-hidden="true">
                        {[0, 1].map((i) => (
                            <div key={i} className="bg-white rounded-sm border border-neutral-100 p-6 animate-pulse">
                                <div className="w-24 h-3 bg-neutral-200 rounded mb-3"></div>
                                <div className="w-48 h-4 bg-neutral-200 rounded mb-2"></div>
                                <div className="w-full h-3 bg-neutral-100 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : data.reviews.length > 0 ? (
                    <div className="space-y-4">
                        {data.reviews.map((review) => (
                            <article
                                key={review.id}
                                className="bg-white rounded-sm border border-neutral-100 hover:border-[#D4AF37]/30 transition-colors p-6 shadow-sm"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#4A0404]/5 border border-[#D4AF37]/20 flex items-center justify-center text-[#4A0404] font-serif text-base">
                                            {review.name?.[0]?.toUpperCase() || "S"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#1A1A1A] font-sans">{review.name}</p>
                                            <Stars value={review.rating} />
                                        </div>
                                    </div>
                                    <time
                                        dateTime={review.createdAt}
                                        className="text-[10px] uppercase tracking-widest text-neutral-400 font-sans font-bold"
                                    >
                                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </time>
                                </div>
                                {review.title && <h3 className="font-serif text-lg text-[#4A0404] mb-1">{review.title}</h3>}
                                <p className="text-sm text-neutral-600 font-sans font-light leading-relaxed">{review.comment}</p>
                            </article>
                        ))}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
