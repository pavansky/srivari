export const SITE_CONFIG = {
    name: "The Srivari",
    description: "Premium Silk & Bridal Sarees",
    contact: {
        phone: "919739988771", // The user can update this here once
        email: "support@thesrivari.com",
        whatsapp: "919739988771"
    },
    links: {
        whatsapp: (message: string) => `https://wa.me/919739988771?text=${encodeURIComponent(message)}`,
        instagram: "https://instagram.com/thesrivari",
        facebook: "https://facebook.com/thesrivari"
    }
};
