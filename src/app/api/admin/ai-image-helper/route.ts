import { NextRequest, NextResponse } from 'next/server';
import { chatComplete, isLLMConfigured, LLM_NOT_CONFIGURED_MSG } from '@/lib/llm';
import { requireAdmin } from '@/lib/adminAuth';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    try {
        const { prompt: userPrompt } = await req.json();

        if (!isLLMConfigured()) {
            return NextResponse.json({ error: LLM_NOT_CONFIGURED_MSG }, { status: 503 });
        }

        const refinedPrompt = await chatComplete({
            system: 'You are a professional photographer and art director for luxury Indian fashion.',
            prompt: `
        Refine the following user input into a highly detailed text-to-image prompt suitable for a high-end fashion photoshoot.

        User Input: "${userPrompt}"

        Requirements:
        - Subject: Indian Saree / Traditional Fashion.
        - Lighting: Cinematic, Golden Hour, or Studio Softbox.
        - Style: Photorealistic, 8k, Vogue India Editorial.
        - Add details about texture like silk sheen, zari work, and intricate borders.
        - Return ONLY the refined prompt text.
        `,
            maxTokens: 400,
        });

        return NextResponse.json({ refinedPrompt });
    } catch (error: any) {
        console.error("AI Prompt Helper Error:", error?.message);
        return NextResponse.json({ error: 'Failed to generate prompt' }, { status: 500 });
    }
}
