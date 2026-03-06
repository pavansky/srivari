import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getProducts } from '@/lib/db';

// Allow responses up to 30 seconds
export const maxDuration = 30;

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
    console.log("DEBUG: Stylist API Triggered");
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error("API Key Missing");
            return Response.json({ error: "SYSTEM: KEY_MISSING" }, { status: 500 });
        }

        const body = await req.json();
        const { messages, prompt } = body;
        const userQuery = prompt || (messages && messages[messages.length - 1]?.content) || "saree";

        // 1. Fetch real products from DB
        const allProducts = await getProducts();

        if (!allProducts || allProducts.length === 0) {
            console.warn("No products found in database.");
            // We can still pick some mock ones or just tell the AI we are empty
        }

        // 2. Prepare product context (limited to 40 items to avoid token bloat)
        const productContext = allProducts.slice(0, 40).map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            description: p.description?.substring(0, 100)
        }));

        // 3. Generate structured object
        const result = await generateObject({
            model: google('gemini-1.5-flash'), // Standard model name
            schema: z.object({
                text: z.string(),
                recommendations: z.array(z.object({
                    id: z.string(),
                    matchReason: z.string(),
                    confidence: z.number()
                })).max(3)
            }),
            system: `
                You are the "Royal Stylist" for 'The Srivari', a luxury saree boutique. 
                Saree knowledge: Banarasi, Kanjivaram, Organza, Soft Silk, Chiffon.
                
                AVAILABLE COLLECTION:
                ${JSON.stringify(productContext)}
                
                INSTRUCTIONS:
                - Be polite and elegant.
                - Analyze user query for color, fabric, and occasion.
                - Provide 1-3 recommendations from the collection.
                - If no match, suggest pieces that represent our heritage.
            `,
            prompt: userQuery,
        });

        return Response.json(result.object);
    } catch (error: any) {
        console.error("Critical Stylist API Error:", error);
        // Return a structured error so the frontend can display it if it wants
        return Response.json({
            error: "STYLING_ERROR",
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
