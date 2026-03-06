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
    try {
        if (!process.env.GEMINI_API_KEY) {
            return Response.json({ error: "SYSTEM: GEMINI_API_KEY missing" }, { status: 500 });
        }

        const body = await req.json();
        const { messages, prompt } = body;
        const userQuery = prompt || (messages && messages[messages.length - 1]?.content);

        // 1. Fetch real products from DB
        const allProducts = await getProducts();

        // 2. Prepare product context for AI (minify it to save tokens)
        const productContext = allProducts.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            description: p.description.substring(0, 150) + "..."
        }));

        // 3. Generate structured object with Gemini
        const result = await generateObject({
            model: google('gemini-1.5-flash'), // Flash is great for structured data extraction and faster
            schema: z.object({
                text: z.string().describe("Elegant styling advice and conversation"),
                recommendations: z.array(z.object({
                    id: z.string().describe("The product ID"),
                    matchReason: z.string().describe("Short semantic reason why this product matches the query (e.g. 'Royal green silk matches your request for traditional elegance')"),
                    confidence: z.number().min(0).max(1).describe("Semantic similarity score from 0 to 1")
                })).max(3)
            }),
            system: `
                You are the "Royal Stylist" for 'The Srivari', a luxury saree boutique. 
                Your goal is to provide elegant, sophisticated styling advice.
                
                AVAILABLE COLLECTION:
                ${JSON.stringify(productContext)}
                
                INSTRUCTIONS:
                - Be polite, warm, and professional.
                - Analyze the user's query for semantic intent (color, occasion, material, vibe).
                - Recommend products that share high semantic similarity with the user's request.
                - For each recommendation, provide a 'matchReason' that highlights the semantic connection.
            `,
            prompt: userQuery,
        });

        return Response.json(result.object);
    } catch (error: any) {
        console.error("Stylist API Error:", error);
        return Response.json({ error: `API ERROR: ${error.message}` }, { status: 500 });
    }
}
