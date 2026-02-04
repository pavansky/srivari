import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: google('gemini-1.5-flash'),
        messages,
        system: "You are a professional luxury fashion copywriter for 'The Srivari', a high-end saree boutique. Write elegant, sophisticated, and shorter product descriptions. Focus on the craftsmanship, heritage, and royal aesthetic.",
    });

    return result.toTextStreamResponse();
}
