import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { getProducts } from '@/lib/db';

// Allow responses up to 30 seconds for complex reasoning
export const maxDuration = 30;

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

/**
 * World-Class AI Stylist API
 * Features:
 * 1. Semantic Pre-ranking (Keyword matching)
 * 2. High-context luxury persona
 * 3. Robust JSON error handling
 * 4. Advanced model selection
 */
export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return Response.json({ error: "KEY_MISSING" }, { status: 500 });
        }

        const body = await req.json();
        const { messages, prompt } = body;
        const userQuery = prompt || (messages && messages[messages.length - 1]?.content) || "saree";

        // 1. Fetch ALL products for semantic pre-processing
        const allProducts = await getProducts();

        // 2. Semantic Pre-ranking Layer (The "Pro Architect" approach)
        // We filter and rank the most relevant products before sending to AI
        const queryKeywords = userQuery.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);

        const rankedProducts = allProducts.map(p => {
            let score = 0;
            const searchableText = `${p.name} ${p.category} ${p.description}`.toLowerCase();

            queryKeywords.forEach((word: string) => {
                if (searchableText.includes(word)) score += 1;
                if (p.name.toLowerCase().includes(word)) score += 2; // Weight name higher
                if (p.category.toLowerCase().includes(word)) score += 3; // Weight category highest
            });

            return { ...p, relevanceScore: score };
        })
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 40); // Send top 40 most relevant to AI

        // 3. Prepare product context minified
        const productContext = rankedProducts.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            description: p.description?.substring(0, 150) // More context for better reasoning
        }));

        // 4. Advanced System Instruction for the "Royal Stylist"
        const systemPrompt = `
            You are the "Royal Stylist" for 'The Srivari', a globally renowned heritage saree boutique. 
            You possess deep knowledge of Indian textiles: Kanjivaram zari work, Banarasi silk weaving, Organza delicacy, and Soft Silk comfort.
            
            YOUR OBJECTIVE:
            1. Provide a world-class, sophisticated styling recommendation.
            2. Extract products that match the user's intent, occasion, or color preference.
            3. Act with the grace of high-fashion atelier consultants.

            OUTPUT RULE:
            - Return ONLY a valid JSON object.
            - Do not include markdown formatting or backticks.
            
            JSON Structure:
            {
                "text": "Your sophisticated dialogue...",
                "recommendations": [
                    { 
                        "id": "uuid", 
                        "matchReason": "Semantic reason (e.g. 'The ivory hue and delicate border perfectly match your request for a minimalist bridal look')",
                        "confidence": 0.98,
                        "stylerTip": "A professional tip for wearing this specific piece"
                    }
                ]
            }

            AVAILABLE COLLECTION (Top Matches):
            ${JSON.stringify(productContext)}
        `;

        // 5. Intelligent Generation (Using stable gemini-1.5-pro for reasoning)
        const result = await generateText({
            model: google('gemini-1.5-pro'),
            system: systemPrompt,
            messages: [{ role: 'user', content: userQuery }],
        });

        // 6. Robust Universal JSON Parser
        let resultData;
        const text = result.text.trim();
        try {
            // Remove markdown blocks if present
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            resultData = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Architectural Parser Error:", text);
            // Fallback: Check if we can extract a JSON block using regex
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    resultData = JSON.parse(jsonMatch[0]);
                } catch (innerE) {
                    resultData = { text: text.substring(0, 400), recommendations: [] };
                }
            } else {
                resultData = { text: text.substring(0, 400), recommendations: [] };
            }
        }

        return Response.json(resultData);

    } catch (error: any) {
        console.error("Pro Stylist API Error:", error);
        return Response.json({
            error: "SERVER_ERROR",
            message: error.message,
            code: error.status || 500
        }, { status: 500 });
    }
}
