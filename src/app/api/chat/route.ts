import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

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
        console.log("DEBUG: Chat API Hit (GenerateText)");
        const { messages, prompt } = body;

        // Use gemini-3.1-pro-preview (latest model)
        const result = await generateText({
            model: google('gemini-3.1-pro-preview'),
            messages: messages || [{ role: 'user', content: prompt }],
            system: "You are a professional luxury fashion copywriter for 'The Srivari'. Write elegant, sophisticated, and shorter product descriptions. Produce ONLY plain text paragraphs for the main description. NEVER use markdown like **, #, or bullet points in the description section itself. If the user prompt specifically includes a 'Wash & Care Instructions' block at the end, simply append that exact block to your output verbatim, exactly as it was provided.",
        });

        return Response.json({ text: result.text });
    } catch (error: any) {
        console.error("AI Generation Error:", error);
        return Response.json({ error: `API ERROR: ${error.message}` }, { status: 500 });
    }
}
