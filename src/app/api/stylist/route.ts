import { chatComplete, isLLMConfigured } from '@/lib/llm';
import { getProducts } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

// Allow responses up to 60 seconds (free/local endpoints can be slower)
export const maxDuration = 60;

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
        if (!isLLMConfigured()) {
            return Response.json({ error: "KEY_MISSING" }, { status: 503 });
        }

        const ip = req.headers.get('x-forwarded-for') || 'anonymous';
        if (!rateLimit(`stylist:${ip}`, 20).success) {
            return Response.json({ error: 'Too many requests' }, { status: 429 });
        }

        const body = await req.json();
        const { messages, prompt } = body;
        // Coerce to a string — a non-string prompt (e.g. {} or a number sent by a
        // malformed client) would otherwise throw on .toLowerCase() below.
        const userQuery = String(prompt || messages?.[messages.length - 1]?.content || "saree").slice(0, 2000);

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

        // A graceful non-AI answer built from the keyword ranking. Used whenever
        // the LLM is unavailable, empty, or unparseable — the concierge still
        // surfaces relevant pieces instead of a dead error.
        const fallbackResponse = () => {
            const picks = rankedProducts.filter(p => (p as any).relevanceScore > 0).slice(0, 3);
            const chosen = picks.length ? picks : rankedProducts.slice(0, 3);
            return {
                text: chosen.length
                    ? "Here are a few pieces from our collection that suit what you're looking for. Tell me more about the occasion or colour and I'll refine the selection."
                    : "I couldn't find a close match just yet — tell me the occasion, colour, or fabric you have in mind and I'll curate something befitting.",
                recommendations: chosen.map(p => ({
                    id: p.id,
                    matchReason: `A ${p.category.toLowerCase()} piece well suited to your request.`,
                    confidence: 0.6,
                    stylerTip: "Pair with temple jewellery and fresh jasmine for a timeless finish.",
                })),
            };
        };

        // 5. Intelligent Generation via the configured open/free endpoint.
        // Any failure (endpoint down, rate-limited, empty/garbled) degrades to
        // the keyword-ranked fallback rather than a 500.
        let raw: string;
        try {
            raw = await chatComplete({
                system: systemPrompt,
                messages: [{ role: 'user', content: userQuery }],
                temperature: 0.6,
                maxTokens: 1200,
            });
        } catch (llmError) {
            console.warn("Stylist LLM unavailable, using keyword fallback:", (llmError as Error)?.message);
            return Response.json(fallbackResponse());
        }

        // 6. Robust Universal JSON Parser
        const text = raw.trim();
        const tryParse = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
        let resultData =
            tryParse(text.replace(/```json/g, '').replace(/```/g, '').trim()) ||
            tryParse(text.match(/\{[\s\S]*\}/)?.[0] || '');

        // If the model returned prose (or nothing) instead of JSON, or JSON with
        // no usable recommendations, fall back to the keyword ranking.
        if (!resultData || !Array.isArray(resultData.recommendations) || resultData.recommendations.length === 0) {
            const fb = fallbackResponse();
            resultData = {
                text: (resultData && typeof resultData.text === 'string' && resultData.text) || fb.text,
                recommendations: fb.recommendations,
            };
        }

        return Response.json(resultData);

    } catch (error: any) {
        console.error("Pro Stylist API Error:", error);
        // Don't leak internal error details to the client.
        return Response.json({
            error: "The stylist is momentarily unavailable. Please try again shortly.",
        }, { status: 500 });
    }
}
