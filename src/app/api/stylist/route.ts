import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
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
            description: p.description.substring(0, 100) + "..."
        }));

        // 3. Prompt Gemini to recommend products
        const systemPrompt = `
            You are the "Royal Stylist" for 'The Srivari', a luxury saree boutique. 
            Your goal is to provide elegant, sophisticated styling advice and recommend specific sarees from our collection.
            
            AVAILABLE COLLECTION:
            ${JSON.stringify(productContext, null, 2)}
            
            INSTRUCTIONS:
            - Be polite, warm, and use terms like "Namaskaram", "Atelier", "Masterpiece".
            - Recommend between 1 to 3 products that best match the user's request.
            - If no perfect match exists, suggest the closest luxury alternatives.
            - YOUR RESPONSE MUST BE IN JSON FORMAT with the following structure:
            {
                "text": "Your elegant styling advice here...",
                "recommendationIds": ["product-id-1", "product-id-2"]
            }
        `;

        const result = await generateText({
            model: google('gemini-1.5-pro'), // Use pro for better reasoning on product matching
            system: systemPrompt,
            prompt: userQuery,
        });

        // Try to parse the AI response as JSON
        let responseData;
        try {
            // Remove markdown code blocks if the AI included them
            const cleanText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
            responseData = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse AI response as JSON:", result.text);
            responseData = {
                text: result.text,
                recommendationIds: []
            };
        }

        return Response.json(responseData);
    } catch (error: any) {
        console.error("Stylist API Error:", error);
        return Response.json({ error: `API ERROR: ${error.message}` }, { status: 500 });
    }
}
