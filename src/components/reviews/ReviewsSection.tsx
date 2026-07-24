"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, PenLine, CheckCircle2, ChevronDown } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

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

const fieldClass =
    "w-full bg-transparent border-0 border-b border-black/20 px-0 py-3 focus:outline-none focus:border-[#4A0404] transition-colors duration-500 font-serif text-lg text-[#1A1A1A] placeholder:font-sans placeholder:text-sm placeholder:text-neutral-400";

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
        <section className="bg-[#F9F5F0] py-28" aria-label="Customer reviews">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                {/* Heading */}
                <SectionHeader tone="light" kicker="Voices of Our Patrons" title="Reviews" className="mb-10" />

                {data.count > 0 ? (
                    <div className="flex items-baseline gap-4 mb-14 border-b border-black/10 pb-8">
                        <span className="font-serif text-5xl text-[#4A0404] leading-none">{data.average.toFixed(1)}</span>
                        <div className="flex flex-col items-start gap-1.5">
                            <Stars value={data.average} size={15} />
                            <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-sans">
                                {data.count} review{data.count > 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>
                ) : (
                    !loading && (
                        <p className="font-serif italic text-lg text-[#595959] mb-14 border-b border-black/10 pb-8">
                            Be the first to share your experience with this masterpiece.
                        </p>
                    )
                )}

                {/* Thank-you state after submission */}
                <AnimatePresence>
                    {submitted && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="mb-12 border border-[#D4AF37]/40 p-8 flex items-start gap-4"
                            role="status"
                        >
                            <CheckCircle2 className="text-[#D4AF37] shrink-0 mt-1" size={20} aria-hidden="true" />
                            <div>
                                <p className="font-serif text-xl text-[#4A0404] mb-1.5">Thank you for your words.</p>
                                <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                                    Your review of {productName} has been received and will appear here once approved by our curators.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Write a review toggle */}
                {!submitted && (
                    <div className="mb-12">
                        <button
                            onClick={() => setIsFormOpen((o) => !o)}
                            aria-expanded={isFormOpen}
                            className="btn-thread font-sans text-[#4A0404]"
                        >
                            <PenLine size={13} aria-hidden="true" />
                            Write a Review
                            <ChevronDown
                                size={13}
                                aria-hidden="true"
                                className={`transition-transform duration-500 ${isFormOpen ? "rotate-180" : ""}`}
                            />
                        </button>
                    </div>
                )}

                {/* Collapsible form — underline fields, no card */}
                <AnimatePresence>
                    {isFormOpen && !submitted && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                        >
                            <form onSubmit={handleSubmit} className="border-y border-black/10 py-10 mb-14 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    <div className="space-y-1">
                                        <label htmlFor="review-name" className="text-[9px] uppercase tracking-[0.3em] text-neutral-500 font-sans">
                                            Your Name <span className="text-[#4A0404]">*</span>
                                        </label>
                                        <input
                                            id="review-name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            maxLength={80}
                                            required
                                            className={fieldClass}
                                            placeholder="E.g. Priya Sharma"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="block text-[9px] uppercase tracking-[0.3em] text-neutral-500 font-sans">
                                            Your Rating <span className="text-[#4A0404]">*</span>
                                        </span>
                                        <div className="flex items-center gap-1 h-[52px]">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setRating(i)}
                                                    onMouseEnter={() => setHoverRating(i)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
                                                    aria-pressed={rating === i}
                                                    className="p-1 transition-transform duration-300 hover:scale-110"
                                                >
                                                    <Star
                                                        size={24}
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

                                <div className="space-y-1">
                                    <label htmlFor="review-title" className="text-[9px] uppercase tracking-[0.3em] text-neutral-500 font-sans">
                                        Title
                                    </label>
                                    <input
                                        id="review-title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        maxLength={120}
                                        className={fieldClass}
                                        placeholder="A drape fit for royalty"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="review-comment" className="text-[9px] uppercase tracking-[0.3em] text-neutral-500 font-sans">
                                        Your Review <span className="text-[#4A0404]">*</span>
                                    </label>
                                    <textarea
                                        id="review-comment"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        maxLength={2000}
                                        rows={4}
                                        required
                                        className={`${fieldClass} resize-y`}
                                        placeholder="Tell us about the weave, the colour, the occasion..."
                                    />
                                </div>

                                {error && (
                                    <p className="text-[#4A0404] text-xs font-sans tracking-wide" role="alert">
                                        {error}
                                    </p>
                                )}

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn-royal btn-royal--oxblood w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? "Submitting..." : "Submit Review"}
                                    </button>
                                    <p className="text-[10px] text-neutral-400 font-sans tracking-wide">
                                        Reviews are moderated and appear after approval.
                                    </p>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Reviews list — editorial, hairline-separated */}
                {loading ? (
                    <div className="divide-y divide-black/10" aria-hidden="true">
                        {[0, 1].map((i) => (
                            <div key={i} className="py-8 animate-pulse">
                                <div className="w-24 h-2.5 bg-black/10 mb-4"></div>
                                <div className="w-48 h-4 bg-black/10 mb-3"></div>
                                <div className="w-full h-3 bg-black/5"></div>
                            </div>
                        ))}
                    </div>
                ) : data.reviews.length > 0 ? (
                    <div className="divide-y divide-black/10 border-t border-b border-black/10">
                        {data.reviews.map((review) => (
                            <article key={review.id} className="py-10">
                                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-4">
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A] font-sans">
                                            {review.name}
                                        </p>
                                        <Stars value={review.rating} size={12} />
                                    </div>
                                    <time
                                        dateTime={review.createdAt}
                                        className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-sans"
                                    >
                                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </time>
                                </div>
                                {review.title && (
                                    <h3 className="font-serif italic text-xl text-[#4A0404] mb-2">{review.title}</h3>
                                )}
                                <p className="font-serif text-base text-[#1A1A1A]/80 leading-relaxed max-w-2xl">
                                    {review.comment}
                                </p>
                            </article>
                        ))}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
