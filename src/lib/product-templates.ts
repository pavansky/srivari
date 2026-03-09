export interface ProductCategoryTemplate {
    category: string;
    description: string;
    washCare: string;
}

export const productTemplates: Record<string, ProductCategoryTemplate> = {
    "Kanjivaram": {
        category: "Kanjivaram",
        description: "Experience the timeless elegance of this authentic Kanjivaram silk masterpiece. Handwoven by master artisans using pure mulberry silk and steeped in centuries of South Indian heritage, this extraordinary drape features dense zari work that shimmers with regal majesty. Characterized by its unmatched durability, exceptional weight, and signature contrasting borders (korvai), this saree is not just an attire but an heirloom to be passed down through generations. Perfect for bridal ceremonies, grand festivals, and momentous occasions where tradition meets luxury.",
        washCare: "• STRICTLY DRY CLEAN ONLY. Never hand wash or machine wash.\n• Store wrapped in a pure cotton or muslin cloth to allow the silk to breathe.\n• Avoid using plastic covers or naphthalene balls.\n• Refold the saree every few months to prevent deep crease damage to the zari.\n• Iron only on the reverse side with a low-heat setting."
    },
    "Banarasi": {
        category: "Banarasi",
        description: "Embrace the opulence of royalty with this magnificent Banarasi silk. Originating from the spiritual heart of India, Varanasi, this ethereal weave is renowned for its intricate gold and silver brocade (zari) work, fine silk fabric, and rich embroidery. Adorned with Mughal-inspired motifs such as intertwined floral and foliate (kalga and bel), this luxurious garment offers a resplendent sheen and exceptional drape. A coveted treasure for weddings and elite gatherings that demands attention and awe.",
        washCare: "• DRY CLEAN ONLY to preserve the intricate zari work.\n• Store folded in a clean, dry, and dark place inside a muslin cloth.\n• Keep away from direct perfumes, deodorants, or strong sunlight to prevent zari tarnishing.\n• Gently iron on the reverse side at a very low temperature."
    },
    "Mysore Silk": {
        category: "Mysore Silk",
        description: "Discover the understated perfection of authentic Mysore Silk. Renowned globally for its buttery soft texture, minimalist elegance, and incredibly pure gold zari borders, this magnificent drape originates from the royal looms of Karnataka. Woven with 100% pure silk and pure gold zari, it offers a remarkably lightweight feel and a fluid, flawless drape that gracefully contours the silhouette. A sophisticated choice for both formal gatherings and intimate celebrations.",
        washCare: "• Dry cleaning is highly recommended for the first few washes.\n• For subsequent washes, hand wash gently in cold water using a mild silk-friendly detergent.\n• Never wring or twist the fabric.\n• Dry flat in the shade, away from direct sunlight.\n• Iron on a low 'Silk' setting while slightly damp."
    },
    "Cotton": {
        category: "Cotton",
        description: "Breathe easy in this finely handwoven premium Cotton weave. Designed for unparalleled comfort without compromising on elegance, this crisp and lightweight drape is a testament to the rich handloom heritage of India. Whether it features minimalist borders, intricate threadwork, or vibrant block prints, it offers a flawless balance of breathability and structure. The perfect companion for tropical climates, everyday grace, and sophisticated office wear.",
        washCare: "• Gentle hand wash in cold water with mild detergent is recommended.\n• Wash dark colors separately to prevent bleeding.\n• Do not soak for long periods or wring vigorously.\n• Starch can be applied during washing to maintain the crisp texture and flawless drape.\n• Dry in the shade and iron on a high 'Cotton' setting."
    },
    "Tussar": {
        category: "Tussar",
        description: "Step into the wild luxury of Tussar silk (also known as Kosa silk). Sourced from the deep forests of India, this rich, textured weave is celebrated for its natural, earthy gold sheen and distinct woven texture. Cooler than traditional silks and incredibly porous, Tussar holds natural dyes beautifully, resulting in deep, glorious colors and characteristic tribal or floral motifs. An exquisite statement piece that blends rustic charm with aristocratic elegance.",
        washCare: "• DRY CLEAN ONLY to maintain the natural texture and sheen.\n• Store wrapped in a breathable muslin cloth.\n• Do not spray perfumes or deodorants directly onto the fabric.\n• Iron on the reverse side using a low heat setting."
    },
    "Silk": {
        category: "Silk",
        description: "Indulge in the pure luxury of this exquisite Handwoven Silk. Ethically crafted with lustrous yarns, this beautiful drape offers an impossibly smooth finish, a radiant natural sheen, and an effortless, fluid flow that flatters every silhouette. A masterpiece of textile engineering that whispers elegance, it is versatile enough for celebratory parties or sophisticated evening affairs.",
        washCare: "• Dry clean is strictly recommended to preserve the silk's natural luster.\n• Store carefully wrapped in a pure cotton cloth to prevent moisture damage.\n• Keep away from direct sunlight to prevent color fading.\n• Iron strictly on the reverse side on the lowest possible heat setting."
    },
    "Default": {
        category: "Default",
        description: "Adorn yourself in this beautifully crafted masterpiece, an embodiment of impeccable artistry and woven elegance. Designed with meticulous attention to detail, this exquisite garment offers a flawless drape, sophisticated color palettes, and superior comfort. A versatile addition to your curated wardrobe that promises to turn heads whether you are attending a festive celebration or a formal gathering.",
        washCare: "• Professional dry cleaning is highly recommended.\n• Store carefully wrapped in a breathable fabric bag or muslin cloth in a cool, dry place.\n• Keep away from direct sunlight to preserve the color integrity.\n• Gently iron on the reverse side using appropriate medium/low heat."
    }
};

export function getTemplateForCategory(categoryStr: string): ProductCategoryTemplate {
    if (!categoryStr) return productTemplates["Default"];
    
    // Exact match
    if (productTemplates[categoryStr]) {
        return productTemplates[categoryStr];
    }
    
    // Fuzzy match (e.g., "soft silk" -> "Silk")
    const lowerCategory = categoryStr.toLowerCase();
    const matches = Object.keys(productTemplates).filter(k => lowerCategory.includes(k.toLowerCase()));
    
    if (matches.length > 0) {
        return productTemplates[matches[0]];
    }
    
    return productTemplates["Default"];
}
