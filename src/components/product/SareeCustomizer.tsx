"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import {
    AddOn,
    BLOUSE_CODE,
    BLOUSE_MEASUREMENTS,
    EXPRESS_CODE,
    MEASUREMENT_NOTES_KEY,
    MEASUREMENT_NOTES_MAX,
    addOnsExtraDays,
    addOnsTotal,
    getAddOns,
    isExpressEligible,
    missingMeasurements,
    normalizeAddOnCodes,
    selectionSummary,
} from "@/config/customization";

export interface CustomizerValue {
    options: string[];
    measurements: Record<string, string>;
}

interface SareeCustomizerProps extends CustomizerValue {
    onChange: (next: CustomizerValue) => void;
    disabled?: boolean;
    className?: string;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** "+2 days" / "−2 days" / "" — the delivery impact, stated plainly. */
function daysLabel(addsDays: number): string {
    if (!addsDays) return "No added time";
    const n = Math.abs(addsDays);
    const unit = n === 1 ? "day" : "days";
    return addsDays > 0 ? `+${n} ${unit}` : `−${n} ${unit}`;
}

/**
 * The finishing choices an Indian saree buyer expects to be asked about:
 * fall & pico, a blouse cut to her measurements, a matching petticoat — and,
 * once something is on the tailor's table, the option to rush it.
 *
 * Controlled: the parent owns the selection so it can hand the same shape
 * straight to the cart. Prices and delivery impact come from
 * config/customization, which the order route re-derives from server-side.
 */
export default function SareeCustomizer({
    options,
    measurements,
    onChange,
    disabled = false,
    className = "",
}: SareeCustomizerProps) {
    const uid = useId();
    const addOns = getAddOns();
    if (addOns.length === 0) return null;

    const selected = new Set(options);
    const expressUnlocked = isExpressEligible(options);
    const blouseChosen = selected.has(BLOUSE_CODE);

    const visible = addOns.filter(a => a.code !== EXPRESS_CODE || expressUnlocked);
    const express = addOns.find(a => a.code === EXPRESS_CODE);

    const addOnCost = addOnsTotal(options);
    const extraDays = addOnsExtraDays(options);
    const pending = blouseChosen ? missingMeasurements(measurements) : [];

    const toggle = (code: string) => {
        if (disabled) return;
        const next = selected.has(code)
            ? options.filter(c => c !== code)
            : [...options, code];
        // Re-canonicalise so de-selecting the last stitching add-on also drops
        // the priority upgrade that depended on it.
        onChange({ options: normalizeAddOnCodes(next), measurements });
    };

    const setMeasurement = (key: string, value: string) => {
        if (disabled) return;
        onChange({ options, measurements: { ...measurements, [key]: value } });
    };

    const renderRow = (addOn: AddOn) => {
        const isOn = selected.has(addOn.code);
        const inputId = `${uid}-${addOn.code}`;
        const descId = `${inputId}-desc`;

        return (
            <label
                key={addOn.code}
                htmlFor={inputId}
                className={disabled ? "block cursor-not-allowed" : "block cursor-pointer"}
            >
                <input
                    id={inputId}
                    type="checkbox"
                    checked={isOn}
                    disabled={disabled}
                    onChange={() => toggle(addOn.code)}
                    aria-describedby={descId}
                    className="peer sr-only"
                />
                <span
                    className={`flex items-start justify-between gap-5 border bg-white px-5 py-4 transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] peer-focus-visible:ring-1 peer-focus-visible:ring-[#D4AF37] ${disabled
                        ? "border-black/5 opacity-45"
                        : isOn
                            ? "border-[#4A0404] shadow-[0_10px_40px_rgba(74,4,4,0.06)]"
                            : "border-black/10 hover:border-[#D4AF37]/50"
                        }`}
                >
                    <span className="flex items-start gap-4">
                        {/* Square hairline box — gold check when chosen */}
                        <span
                            aria-hidden="true"
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border transition-colors duration-500 ${isOn ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-black/25"
                                }`}
                        >
                            {isOn && <Check size={11} strokeWidth={2.5} className="text-[#D4AF37]" />}
                        </span>
                        <span className="block">
                            <span className="block font-serif text-base leading-snug text-[#1A1A1A]">
                                {addOn.label}
                            </span>
                            <span
                                id={descId}
                                className="mt-2 block max-w-sm text-xs leading-relaxed text-neutral-500"
                            >
                                {addOn.description}
                            </span>
                        </span>
                    </span>
                    <span className="shrink-0 text-right">
                        <span className="block font-serif text-lg text-[#4A0404]">{inr(addOn.price)}</span>
                        <span className="mt-1 block font-sans text-[9px] uppercase tracking-[0.3em] text-neutral-400">
                            {daysLabel(addOn.addsDays)}
                        </span>
                    </span>
                </span>
            </label>
        );
    };

    return (
        <section
            aria-labelledby={`${uid}-heading`}
            className={`space-y-5 ${className}`}
        >
            <div className="flex items-baseline justify-between gap-4 border-b border-black/10 pb-3">
                <h2
                    id={`${uid}-heading`}
                    className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/70"
                >
                    Finish Your Saree
                </h2>
                <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-neutral-400">
                    Optional
                </span>
            </div>

            <div className="space-y-3">{visible.map(renderRow)}</div>

            {/* Priority stitching only makes sense once something is being stitched. */}
            {!expressUnlocked && express && (
                <p className="font-sans text-[9px] uppercase tracking-[0.3em] leading-relaxed text-neutral-400">
                    Priority stitching unlocks with fall &amp; pico or a blouse
                </p>
            )}

            {/* Measurements — revealed only when a blouse is being cut. */}
            {blouseChosen && (
                <div className="border border-[#D4AF37]/30 bg-[#F9F5F0] px-5 py-6 sm:px-6">
                    <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]">
                        Blouse Measurements
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                        In inches. Leave anything you are unsure of blank — our tailor will call you
                        before cutting.
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                        {BLOUSE_MEASUREMENTS.map(field => {
                            const fieldId = `${uid}-m-${field.key}`;
                            return (
                                <div key={field.key} className="space-y-1">
                                    <label
                                        htmlFor={fieldId}
                                        className="block font-sans text-[9px] uppercase tracking-[0.3em] text-neutral-500"
                                    >
                                        {field.label}
                                    </label>
                                    <div className="flex items-baseline gap-2 border-b border-black/20 transition-colors duration-500 focus-within:border-[#D4AF37]">
                                        <input
                                            id={fieldId}
                                            type="text"
                                            inputMode="decimal"
                                            autoComplete="off"
                                            disabled={disabled}
                                            value={measurements[field.key] ?? ""}
                                            onChange={e =>
                                                setMeasurement(
                                                    field.key,
                                                    e.target.value.replace(/[^\d.]/g, "").slice(0, 5)
                                                )
                                            }
                                            placeholder={field.placeholder}
                                            aria-describedby={`${fieldId}-unit`}
                                            className="w-full min-w-0 bg-transparent py-2 font-serif text-lg text-[#1A1A1A] outline-none placeholder:text-neutral-300"
                                        />
                                        <span
                                            id={`${fieldId}-unit`}
                                            className="shrink-0 font-sans text-[9px] uppercase tracking-[0.3em] text-neutral-400"
                                        >
                                            in
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 space-y-1">
                        <label
                            htmlFor={`${uid}-m-notes`}
                            className="block font-sans text-[9px] uppercase tracking-[0.3em] text-neutral-500"
                        >
                            Notes for the tailor
                        </label>
                        <input
                            id={`${uid}-m-notes`}
                            type="text"
                            disabled={disabled}
                            maxLength={MEASUREMENT_NOTES_MAX}
                            value={measurements[MEASUREMENT_NOTES_KEY] ?? ""}
                            onChange={e => setMeasurement(MEASUREMENT_NOTES_KEY, e.target.value)}
                            placeholder="E.g. elbow-length sleeve, deep back"
                            className="w-full border-b border-black/20 bg-transparent py-2 font-serif text-base text-[#1A1A1A] outline-none transition-colors duration-500 placeholder:text-neutral-300 focus:border-[#D4AF37]"
                        />
                    </div>

                    {pending.length > 0 && (
                        <p className="mt-5 flex items-center gap-2 font-sans text-[9px] uppercase tracking-[0.3em] text-neutral-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" aria-hidden="true" />
                            {pending.length} measurement{pending.length > 1 ? "s" : ""} still open — we will
                            call you
                        </p>
                    )}
                </div>
            )}

            {/* Running summary of what is actually being made. */}
            <div className="flex items-end justify-between gap-4 border-t border-black/10 pt-4">
                <div className="min-w-0">
                    <span className="block font-sans text-[9px] uppercase tracking-[0.3em] text-neutral-400">
                        Your piece
                    </span>
                    <span className="mt-2 block font-serif text-base leading-snug text-[#1A1A1A]">
                        {selectionSummary(options)}
                    </span>
                </div>
                <div className="shrink-0 text-right">
                    <span className="block font-serif text-lg text-[#4A0404]">
                        {addOnCost > 0 ? `+ ${inr(addOnCost)}` : "—"}
                    </span>
                    {extraDays > 0 && (
                        <span className="mt-1 block font-sans text-[9px] uppercase tracking-[0.3em] text-neutral-400">
                            +{extraDays} {extraDays === 1 ? "day" : "days"}
                        </span>
                    )}
                </div>
            </div>
        </section>
    );
}
