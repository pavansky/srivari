import { NextRequest, NextResponse } from 'next/server';
import { chatComplete, isLLMConfigured } from '@/lib/llm';
import { requireAdmin } from '@/lib/adminAuth';

export const maxDuration = 90;

/**
 * AI Image Studio — generates product photography via Pollinations
 * (https://pollinations.ai): free, keyless image generation backed by open
 * models (FLUX). No Gemini, no paid APIs.
 *
 * If a text LLM endpoint is configured, it first expands the admin's short
 * prompt into an art-directed photography prompt; otherwise a solid template
 * is used. A reference image ("remix" mode) informs the prompt only — the
 * image itself is not uploaded to any third party.
 */
const STYLE_DIRECTION: Record<string, string> = {
    "Editorial": "high-fashion Vogue India editorial photograph, elegant Indian model wearing the saree, palatial heritage backdrop, cinematic golden-hour light",
    "Flat Lay": "luxury flat-lay product photograph of the folded saree on dark marble, styled with brass temple lamps and jasmine, soft studio light from above",
    "Texture Macro": "extreme macro photograph of the saree fabric, silk sheen and intricate gold zari threadwork filling the frame, shallow depth of field",
    "Ghost Mannequin": "ghost mannequin product photograph of the draped saree on an invisible form, seamless dark studio background, even softbox lighting",
};

export async function POST(req: NextRequest) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    try {
        const formData = await req.formData();
        const prompt = (formData.get('prompt') as string) || '';
        const stylePreset = (formData.get('style') as string) || 'Editorial';
        const hasReference = !!formData.get('image');

        if (!prompt && !hasReference) {
            return NextResponse.json({ error: 'Describe the shot you want.' }, { status: 400 });
        }

        const direction = STYLE_DIRECTION[stylePreset] || STYLE_DIRECTION["Editorial"];
        let finalPrompt = `${direction}. ${prompt}. Photorealistic, 8k detail, rich silk texture, authentic Indian craftsmanship, no text, no watermark.`;

        // Optional: let the configured free/local LLM art-direct the prompt
        if (isLLMConfigured() && prompt) {
            try {
                finalPrompt = await chatComplete({
                    system: 'You write single-paragraph text-to-image prompts for luxury saree product photography. Return ONLY the prompt text, under 90 words.',
                    prompt: `Style: ${stylePreset} — ${direction}\nRequest: ${prompt}${hasReference ? "\n(The admin supplied a reference photo; describe a faithful, elevated studio recreation of such a saree.)" : ""}`,
                    maxTokens: 220,
                    temperature: 0.8,
                });
            } catch (e) {
                console.warn('Prompt enhancement skipped:', (e as Error)?.message);
            }
        }

        // Pollinations: free, keyless, open-model image generation
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&model=flux&nologo=true&seed=${Math.floor(Math.random() * 1e6)}`;
        const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(80_000) });

        if (!imgRes.ok) {
            console.error('Pollinations generation failed:', imgRes.status);
            return NextResponse.json({ error: 'Image generation is busy — please try again in a moment.' }, { status: 502 });
        }

        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const mimeType = imgRes.headers.get('content-type')?.split(';')[0] || 'image/jpeg';

        return NextResponse.json({
            imageData: buffer.toString('base64'),
            mimeType,
            promptUsed: finalPrompt,
        });
    } catch (error: any) {
        console.error('AI Studio Error:', error?.message);
        return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }
}
