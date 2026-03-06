import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { getProducts } from '@/lib/db';

// Allow responses up to 30 seconds
export const maxDuration = 30;

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
    console.log("DEBUG: Stylist API Hit - Attempting Robust Generation");
    try {
        if (!process.env.GEMINI_API_KEY) {
            return Response.json({ error: "KEY_MISSING" }, { status: 500 });
        }

        const body = await req.json();
        const { messages, prompt } = body;
        const userQuery = prompt || (messages && messages[messages.length - 1]?.content) || "saree";

        // 1. Fetch real products from DB
        const allProducts = await getProducts();

        // 2. Prepare product context (limited to 30 items for model safety)
        const productContext = allProducts.slice(0, 30).map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            description: p.description?.substring(0, 100)
        }));

        // 3. Prompt Gemini (using the known-working gemini-3.1-pro-preview)
        const systemPrompt = `
            You are the "Royal Stylist" for 'The Srivari'.
            Return ONLY a valid JSON object. No other text.
            
            JSON Structure:
            {
                "text": "Your elegant styling advice...",
                "recommendations": [
                    { "id": "uuid", "matchReason": "Why it matches specifically", "confidence": 0.95 }
                ]
            }

            AVAILABLE COLLECTION:
            ${JSON.stringify(productContext)}
        `;

        const result = await generateText({
            model: google('gemini-3.1-pro-preview'), // Matching working chat model
            system: systemPrompt,
            messages: [{ role: 'user', content: userQuery }],
        });

        // 4. Robust parsing
        let resultData;
        try {
            const cleanJson = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
            resultData = JSON.parse(cleanJson);
        } catch (e) {
            console.error("AI Parse Error:", result.text);
            resultData = {
                text: result.text.substring(0, 300),
                recommendations: []
            };
        }

        return Response.json(resultData);
    } catch (error: any) {
        console.error("Stylist API Error:", error);
        return Response.json({
            error: "SERVER_ERROR",
            details: error.message
        }, { status: 500 });
    }
}
