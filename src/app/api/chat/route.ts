import { chatComplete, isLLMConfigured, LLM_NOT_CONFIGURED_MSG } from '@/lib/llm';
import { rateLimit } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/adminAuth';

// Allow responses up to 60 seconds (free/local endpoints can be slower)
export const maxDuration = 60;

// Admin-only: the sole consumer is the admin product-description enhancer.
// (The public storefront concierge uses /api/stylist instead.)
export async function POST(req: Request) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    try {
        if (!isLLMConfigured()) {
            return Response.json({ error: LLM_NOT_CONFIGURED_MSG }, { status: 503 });
        }

        const ip = req.headers.get('x-forwarded-for') || 'anonymous';
        if (!rateLimit(`chat:${ip}`, 20).success) {
            return Response.json({ error: 'Too many requests — please slow down.' }, { status: 429 });
        }

        const body = await req.json();
        const { messages, prompt } = body;
        if (prompt && String(prompt).length > 8000) {
            return Response.json({ error: 'Prompt too long' }, { status: 400 });
        }

        const text = await chatComplete({
            system: "You are a professional luxury fashion copywriter for 'The Srivari'. Write elegant, sophisticated, and shorter product descriptions. Produce ONLY plain text paragraphs for the main description. NEVER use markdown like **, #, or bullet points in the description section itself. If the user prompt specifically includes a 'Wash & Care Instructions' block at the end, simply append that exact block to your output verbatim, exactly as it was provided.",
            messages: messages || undefined,
            prompt: messages ? undefined : prompt,
            maxTokens: 900,
        });

        return Response.json({ text });
    } catch (error: any) {
        console.error("AI Generation Error:", error);
        return Response.json({ error: `AI error: ${error.message}` }, { status: 500 });
    }
}
