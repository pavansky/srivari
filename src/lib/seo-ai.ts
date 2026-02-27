import { Metadata } from "next";

/**
 * AI-Driven SEO Generation Service
 * 
 * This service provides the architecture for dynamically generating perfectly 
 * tuned SEO metadata using an AI model (like Google Gemini or OpenAI).
 * 
 * Instead of manually writing descriptions and guessing keywords, this service
 * takes the product details (name, category, price, materials) and asks the AI 
 * to generate the optimal SEO strategy for current search algorithms.
 */

interface ProductData {
    name: string;
    description: string;
    category: string;
    materials?: string[];
    price?: number;
    imageUrl?: string;
}

interface AI_SEO_Response {
    title: string;
    description: string;
    keywords: string[];
}

/**
 * MOCK AI CALL:
 * In a production environment, this function would make a fetch() call to an internal
 * API route (e.g., /api/ai/generate-seo) which would securely interact with the AI provider.
 * 
 * @param product The product details to analyze
 * @returns Generated SEO data
 */
async function generateSEOWithAI(product: ProductData): Promise<AI_SEO_Response> {
    // MOCK: Imagine passing this prompt to an AI:
    const prompt = `
        You are an elite SEO expert for an Indian ethnic luxury brand, "The Srivari".
        Generate an optimal Page Title, Meta Description, and a list of 10 targeted keywords 
        for a product with the following details:
        Name: ${product.name}
        Category: ${product.category}
        Description: ${product.description}
        Materials: ${product.materials?.join(", ")}
        
        The description must be compelling, under 160 characters, and encourage clicks.
        Keywords should target high-converting search terms like "buy [material] saree online".
    `;

    console.log("SENDING PROMPT TO AI:", prompt);

    // MOCK RESPONSE: For now, we return a rigidly structured fallback response.
    // When you plug in an actual AI, you would parse the JSON it returns.
    return {
        title: `Buy ${product.name} | Premium ${product.category} | The Srivari`,
        description: `Explore the exquisite ${product.name}. A masterpiece of handwoven ${product.materials?.[0] || 'silk'}. Shop authentic Indian ethnic wear at The Srivari.`,
        keywords: [
            product.name,
            product.category,
            `buy ${product.category}`,
            `premium ${product.materials?.[0] || 'silk'} saree`,
            "indian bridal wear",
            "handwoven sarees",
            "the srivari exclusive"
        ]
    };
}

/**
 * This function is designed to be called directly inside Next.js `generateMetadata` exports.
 * 
 * Usage example in a product page:
 * 
 * export async function generateMetadata({ params }): Promise<Metadata> {
 *     const product = await getProductById(params.id);
 *     return await generateDynamicProductMetadata(product);
 * }
 */
export async function generateDynamicProductMetadata(product: ProductData): Promise<Metadata> {
    // 1. Ask AI for the optimal SEO data
    const aiSeo = await generateSEOWithAI(product);

    const url = `https://thesrivari.com/product/${encodeURIComponent(product.name.toLowerCase().replace(/ /g, '-'))}`;
    const image = product.imageUrl || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop";

    // 2. Map the AI's response into Next.js Metadata format
    return {
        title: aiSeo.title,
        description: aiSeo.description,
        keywords: aiSeo.keywords,

        // Advanced: Social media card generation
        openGraph: {
            title: aiSeo.title,
            description: aiSeo.description,
            url: url,
            siteName: "The Srivari",
            images: [
                {
                    url: image,
                    width: 800,
                    height: 800,
                    alt: product.name
                }
            ],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: aiSeo.title,
            description: aiSeo.description,
            images: [image],
        },
    };
}
