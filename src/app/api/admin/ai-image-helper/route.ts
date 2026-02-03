import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { prompt: userPrompt } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        // Use Pro model for better understanding of art styles and lighting
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const enhancementPrompt = `
        Act as a professional photographer and art director.
        Refine the following user input into a highly detailed text-to-image prompt suitable for a high-end fashion photoshoot.
        
        User Input: "${userPrompt}"
        
        Requirements:
        - Subject: Indian Saree / Tradition Fashion.
        - Lighting: Cinematic, Golden Hour, or Studio Softbox.
        - Style: Photorealistic, 8k, Vogue India Editorial.
        - Add details about texture like silk sheen, zari work, and intricate borders.
        - Return ONLY the refined prompt text.
        `;

        const result = await model.generateContent(enhancementPrompt);
        const refinedPrompt = result.response.text();

        return NextResponse.json({ refinedPrompt });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: 'Failed to generate prompt' }, { status: 500 });
    }
}
