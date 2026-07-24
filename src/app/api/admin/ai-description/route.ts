import { NextRequest, NextResponse } from 'next/server';
import { chatComplete, isLLMConfigured, LLM_NOT_CONFIGURED_MSG } from '@/lib/llm';
import { requireAdmin } from '@/lib/adminAuth';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    try {
        const { name, category, additionalDetails } = await req.json();

        if (!isLLMConfigured()) {
            return NextResponse.json({ error: LLM_NOT_CONFIGURED_MSG }, { status: 503 });
        }

        const description = await chatComplete({
            system: 'You are an expert luxury copywriter for "The Srivari", a high-end heritage saree store.',
            prompt: `
        Write a sophisticated, elegant, and alluring product description for the following saree:

        Product Name: ${name}
        Category: ${category}
        ${additionalDetails ? `Additional Details: ${additionalDetails}` : ''}

        Requirements:
        - Tone: Regal, Heritage, Artistic, Emotional.
        - Length: 2-3 paragraphs.
        - Focus on texture, craftsmanship, and the feeling of wearing it.
        - Do not use hashtags.
        - Return ONLY the description text.
        `,
            maxTokens: 700,
        });

        return NextResponse.json({ description });
    } catch (error: any) {
        console.error("AI Describe Error:", error?.message);
        return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
    }
}
