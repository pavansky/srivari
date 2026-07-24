/**
 * True when the URL can plausibly render as an image. Catalogue data sometimes
 * contains Instagram *post page* links (instagram.com/p/...) — an HTML page,
 * not an image — which would otherwise 404/refuse and flash an ugly void.
 *
 * Lives outside any "use client" module so both server and client code can
 * call it (SrivariImage.tsx re-exports it for client-side convenience).
 */
export function isRenderableImageSrc(src: string | undefined | null): src is string {
    if (!src || src.trim() === "") return false;
    const s = src.trim();
    if (s.startsWith("/") || s.startsWith("data:image/")) return true;
    if (!/^https?:\/\//i.test(s)) return false;
    if (/instagram\.com\/(p|reel|share)\//i.test(s)) return false;
    return true;
}
