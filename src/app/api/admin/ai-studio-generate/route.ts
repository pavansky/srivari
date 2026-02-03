import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const prompt = formData.get('prompt') as string;
        const imageFile = formData.get('image') as File | null;
        const stylePreset = formData.get('style') as string || 'Cinematic';

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

        let finalPrompt = `
        Create a professional, high-end product photograph.
        Subject: ${prompt}
        Style: ${stylePreset}
        Lighting: Studio lighting, soft shadows, 8k resolution.
        `;

        const parts: any[] = [finalPrompt];

        if (imageFile) {
            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            parts.push({
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: imageFile.type
                }
            });
            finalPrompt += "\nUse the provided image as a strict reference for the product's shape and color.";
        }

        // Generating content
        // Note: For image generation models, the response structure ensures an image is returned in the 'parts'.
        const result = await model.generateContent(parts);
        const response = await result.response;

        // Extracting image data from response
        // The SDK returns image bits in various ways depending on version, 
        // usually verify if 'inlineData' or similar exists in candidates.
        // For 'gemini-3-pro-image-preview', it returns an image in the parts.

        // Simplified extraction logic provided SDK version guarantees
        // We will inspect the first part of the first candidate
        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            const firstPart = candidates[0].content.parts[0];
            if (firstPart.inlineData) {
                return NextResponse.json({
                    imageData: firstPart.inlineData.data,
                    mimeType: firstPart.inlineData.mimeType
                });
            }
        }

        return NextResponse.json({ error: 'No image generated' }, { status: 500 });

    } catch (error: any) {
        console.error("AI Studio Error Details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));

        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('quota') || errorMessage.includes('429')) {
            return NextResponse.json({ error: 'Quota Exceeded. Please try again in a minute or add billing.' }, { status: 429 });
        }
        if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
            return NextResponse.json({ error: 'Model overloaded. Please try again shortly.' }, { status: 503 });
        }

        return NextResponse.json({ error: 'Failed to generate image', details: error.message }, { status: 500 });
    }
}
