import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { name, category, additionalDetails } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        // Use a Pro model for high-quality creative writing
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const prompt = `
        You are an expert luxury copywriter for "Srivari", a high-end heritage saree store.
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
        `;

        const result = await model.generateContent(prompt);
        const description = result.response.text();

        return NextResponse.json({ description });

    } catch (error: any) {
        console.error("Gemini API Describe Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));

        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('quota') || errorMessage.includes('429')) {
            return NextResponse.json({ error: 'Quota Exceeded. Please wait a moment.' }, { status: 429 });
        }

        return NextResponse.json({ error: 'Failed to generate description', details: error.message }, { status: 500 });
    }
}
