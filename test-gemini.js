
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Key verified from .env.local
const key = "AIzaSyBIvAazlPWWYyrIAVCjwQvhY8Mwaqv2JcQ";
const genAI = new GoogleGenerativeAI(key);

async function test() {
    const modelName = "gemini-3-pro-image-preview";
    console.log(`\nAttempting image generation with model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        // Simple text-to-image test
        const result = await model.generateContent("A red apple on a wooden table");
        console.log(`Success with ${modelName}!`);
        // Check if we got an image output (inline_data usually for images in some SDK versions, or specific response structure)
        console.log("Response parts:", JSON.stringify(result.response.candidates[0].content.parts));
    } catch (e) {
        console.error(`Failed with ${modelName}:`, e.message);
    }
}

test();
