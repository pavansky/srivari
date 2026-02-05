import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const body = await req.json();
    console.log("AI Request Body:", body);
    const { messages, prompt } = body;

    const result = streamText({
        model: google('gemini-1.5-flash', {
            apiKey: process.env.GEMINI_API_KEY,
        }),
        messages: messages || [{ role: 'user', content: prompt }],
        system: "You are a professional luxury fashion copywriter for 'The Srivari', a high-end saree boutique. Write elegant, sophisticated, and shorter product descriptions. Focus on the craftsmanship, heritage, and royal aesthetic.",
    });

    return result.toTextStreamResponse();
}
