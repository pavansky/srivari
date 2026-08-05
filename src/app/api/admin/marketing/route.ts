import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, requireAdmin } from '@/lib/adminAuth';
import { getProducts } from '@/lib/db';
import { LLM_NOT_CONFIGURED_MSG, chatComplete, isLLMConfigured } from '@/lib/llm';
import { rateLimit } from '@/lib/rate-limit';
import { SITE_URL, plainText, productUrl } from '@/lib/feeds';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/marketing — AI copy generation for the Marketing Studio.
 *
 * Runs on the same free/self-hosted OpenAI-compatible endpoint as the rest of
 * the console (Groq primary, OpenRouter fallback — see src/lib/llm.ts). No paid
 * SDKs, no key required at build time.
 *
 * Body: { kind, productId?, topic?, tone? }
 */

const KINDS = ['instagram_caption', 'product_story', 'whatsapp_broadcast', 'campaign_plan'] as const;
type Kind = (typeof KINDS)[number];

/** Kinds that are meaningless without a specific saree to write about. */
const PRODUCT_REQUIRED: Kind[] = ['instagram_caption', 'product_story'];

const SYSTEM_PROMPT = `You are the social lead for "The Srivari", a luxury heritage saree house in Bengaluru that sells handwoven Kanjivaram, Banarasi, Mysore silk, tussar and cotton sarees to Indian women.

Your copy is warm, evocative and specific — never generic marketing filler, never overwrought. You know Indian festivals, wedding seasons and drape culture, and you write for a reader who knows the difference between a weave and a print.

Rules you never break:
- Use only the product facts given to you. Never invent a price, fabric, weave, award, certification, weaver name or founding year.
- No markdown headings, no code fences, no preamble, no sign-off. Return only the copy that was asked for.`;

const TONES: Record<string, string> = {
    regal: 'Regal and heritage — stately, reverent, unhurried.',
    warm: 'Warm and personal — like a friend who owns the shop talking to you.',
    modern: 'Modern and minimal — clean, confident, very few adjectives.',
    festive: 'Festive and celebratory — bright, generous, full of occasion.',
};

interface PromptSpec {
    prompt: string;
    maxTokens: number;
    temperature: number;
}

function buildProductContext(product: any): string {
    const price = `₹${Math.round(Number(product.price) || 0).toLocaleString('en-IN')}`;
    const stock = Number(product.stock) || 0;
    const description = plainText(product.description, 600);

    return [
        'The saree this is for:',
        `- Name: ${product.name}`,
        `- Category / weave: ${product.category || 'Handwoven saree'}`,
        `- Price: ${price}`,
        `- Availability: ${stock > 0 ? `In stock (${stock} available)` : 'Currently sold out'}`,
        `- Link: ${productUrl(product.id)}`,
        description ? `- Store description: ${description}` : '',
        '',
        'Use the real name and price above exactly as given.',
    ].filter(Boolean).join('\n');
}

function buildPrompt(kind: Kind, context: string, topic: string, tone: string, shopLink: string): PromptSpec {
    const toneLine = tone && TONES[tone] ? `\nTone: ${TONES[tone]}` : '';
    const angle = topic ? `\nAngle to lean into: ${topic}` : '';

    switch (kind) {
        case 'instagram_caption':
            return {
                maxTokens: 1000,
                temperature: 0.85,
                prompt: `${context}${angle}${toneLine}

Write THREE different Instagram caption options for this saree.

Each option must contain, in this order:
1. An evocative opening line that stops a scroll. At most one emoji.
2. Two or three short body lines — the weave, the colour, the occasion, how it feels to wear.
3. A clear call to action (link in bio, DM to reserve, tap to shop).
4. On the final line, 12 to 15 hashtags: mix broad reach tags with niche Indian saree and handloom tags, plus one or two brand or city tags. Lowercase, separated by single spaces.

Separate the three options with a line containing only: ---
Do not number or label the options.`,
            };

        case 'product_story':
            return {
                maxTokens: 800,
                temperature: 0.8,
                prompt: `${context}${angle}${toneLine}

Write a short heritage and craft narrative for this saree — the kind that plays as a Reel voiceover or reads across a five-slide carousel.

- 120 to 180 words, in four to six short paragraphs of one or two sentences each.
- Ground it in real craft: the loom, the zari, the motifs, the region the weave belongs to, the hands behind it.
- Speak to the woman who will wear it and the occasion she will wear it for.
- No hashtags, no emoji.`,
            };

        case 'whatsapp_broadcast':
            return {
                maxTokens: 400,
                temperature: 0.75,
                prompt: `${context || 'This is a general broadcast for the boutique, not one specific saree.'}${angle}${toneLine}

Write ONE WhatsApp broadcast / status message.

- Under 60 words, in short lines that read easily on a phone.
- One or two emoji, tastefully placed — not at the start of every line.
- Say what is new or special, and why it matters now.
- End with the shop link on its own final line: ${shopLink}
- No hashtags.`,
            };

        case 'campaign_plan':
            return {
                maxTokens: 1400,
                temperature: 0.75,
                prompt: `${context}${context ? '\n' : ''}Build a 7-day social content calendar for: ${topic}${toneLine}

Write it as Day 1 through Day 7. Under each day give exactly these three labelled lines:
Format: one of Reel, Carousel or Story
Hook: the opening line or on-screen text, under 12 words
Caption seed: one or two sentences the full caption can be built from

- Vary the formats across the week; do not use the same format three days running.
- Build towards the occasion, and finish the week on a clear selling moment.
- Plain text only — no tables, no markdown.`,
            };
    }
}

/**
 * Splits a multi-option caption response into individual captions. Returns null
 * unless the split is unambiguous, so the UI never shows garbled fragments.
 */
function splitOptions(text: string): string[] | null {
    const clean = (chunk: string) =>
        chunk
            .replace(/^[^\S\n]*(?:\*\*)?(?:option|caption)\s*\d+\s*[:.)\-–]*\s*(?:\*\*)?[^\S\n]*\n?/i, '')
            .trim();

    // Preferred: the "---" separator we asked the model for.
    const byRule = text
        .split(/^[^\S\n]*(?:-{3,}|={3,}|\*{3,})[^\S\n]*$/m)
        .map(clean)
        .filter(Boolean);
    if (byRule.length >= 2 && byRule.length <= 5 && byRule.every(o => o.length > 40)) return byRule;

    // Fallback: the model labelled the options instead.
    const byLabel = text
        .split(/\n(?=[^\S\n]*(?:\*\*)?(?:Option|Caption)\s*\d+\b)/i)
        .map(clean)
        .filter(Boolean);
    if (byLabel.length >= 2 && byLabel.length <= 5 && byLabel.every(o => o.length > 40)) return byLabel;

    return null;
}

export async function POST(req: NextRequest) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    // Per-admin throttle — the free LLM tiers are the scarce resource here.
    const admin = await getAdminUser(req);
    const { success } = rateLimit(`admin-marketing:${admin?.email || admin?.id || 'unknown'}`, 12);
    if (!success) {
        return NextResponse.json(
            { error: 'Slow down a moment — you have hit the generation limit for this minute.' },
            { status: 429 }
        );
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const kind = String(body?.kind || '') as Kind;
    if (!KINDS.includes(kind)) {
        return NextResponse.json(
            { error: `Unknown copy type. Use one of: ${KINDS.join(', ')}.` },
            { status: 400 }
        );
    }

    const topic = String(body?.topic || '').trim().slice(0, 200);
    const tone = String(body?.tone || '').trim().toLowerCase();
    const productId = body?.productId ? String(body.productId) : '';

    if (kind === 'campaign_plan' && !topic) {
        return NextResponse.json(
            { error: 'Give the campaign a festival or theme to plan around.' },
            { status: 400 }
        );
    }
    if (PRODUCT_REQUIRED.includes(kind) && !productId) {
        return NextResponse.json({ error: 'Choose a saree to write about.' }, { status: 400 });
    }

    // Product lookup is best-effort: a DB hiccup must not block copy that does
    // not strictly need the product (and never leaks cost price into a prompt).
    let product: any = null;
    if (productId) {
        try {
            const products = await getProducts(true);
            product = products.find((p: any) => p.id === productId) || null;
        } catch (e) {
            console.warn('Marketing: product lookup failed:', e);
        }
        if (!product && PRODUCT_REQUIRED.includes(kind)) {
            return NextResponse.json(
                { error: 'That saree could not be loaded. Refresh and pick it again.' },
                { status: 404 }
            );
        }
    }

    if (!isLLMConfigured()) {
        return NextResponse.json({ error: LLM_NOT_CONFIGURED_MSG, code: 'llm_not_configured' }, { status: 503 });
    }

    const context = product ? buildProductContext(product) : '';
    const shopLink = product ? productUrl(product.id) : `${SITE_URL}/shop`;
    const spec = buildPrompt(kind, context, topic, tone, shopLink);

    try {
        const text = (await chatComplete({
            system: SYSTEM_PROMPT,
            prompt: spec.prompt,
            maxTokens: spec.maxTokens,
            temperature: spec.temperature,
        })).trim();

        if (!text) {
            return NextResponse.json(
                { error: 'The AI returned an empty response. Try generating again.' },
                { status: 502 }
            );
        }

        const options = kind === 'instagram_caption' ? splitOptions(text) : null;

        return NextResponse.json({
            kind,
            text,
            ...(options ? { options } : {}),
            ...(product ? { product: { id: product.id, name: product.name } } : {}),
        });
    } catch (error: any) {
        const message = String(error?.message || '');
        console.error('Marketing copy generation failed:', message);

        if (/\b429\b|rate.?limit/i.test(message)) {
            return NextResponse.json(
                { error: 'The free AI tier is rate-limited right now. Wait a minute and try again.' },
                { status: 429 }
            );
        }
        return NextResponse.json(
            { error: 'The AI service could not be reached. Try again in a moment.' },
            { status: 502 }
        );
    }
}
