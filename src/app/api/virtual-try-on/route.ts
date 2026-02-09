import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

// Helper to get access token
async function getAccessToken() {
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path to JSON key
        // OR using specific env vars if not using a file path:
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        projectId: process.env.GOOGLE_PROJECT_ID
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
}

export async function POST(request: Request) {
    try {
        const { user_image, product_image, category } = await request.json();

        if (!user_image || !product_image) {
            return NextResponse.json({ error: "Missing images" }, { status: 400 });
        }

        const projectId = process.env.GOOGLE_PROJECT_ID || "gen-lang-client-0727105651";
        const location = "us-central1";
        const modelId = "virtual-try-on-001";
        const apiKey = process.env.GOOGLE_API_KEY;

        let endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;
        let headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        // Auth Strategy: API Key (preferred if present) OR Service Account
        if (apiKey) {
            endpoint += `?key=${apiKey}`;
            // No Bearer token needed if using API Key
        } else {
            const accessToken = await getAccessToken();
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        // Prepare Payload for Vertex AI
        // Note: Actual payload structure for try-on-001
        // Docs: https://cloud.google.com/vertex-ai/docs/generative-ai/image/virtual-try-on#request_body
        const payload = {
            instances: [
                {
                    "personImage": {
                        "image": {
                            "bytesBase64Encoded": user_image.split(',')[1]
                        }
                    },
                    "productImages": [
                        {
                            "image": {
                                "bytesBase64Encoded": product_image.split(',')[1]
                            }
                        }
                    ]
                }
            ],
            parameters: {
                "sampleCount": 1,
                "seed": 1 // Consistent results for testing
            }
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Vertex AI Error:", errorText);

            // Check for Billing/Permission issues
            if (response.status === 403 || errorText.includes("BILLING_DISABLED")) {
                return NextResponse.json(
                    {
                        error: "Google Cloud Billing Disabled",
                        details: "The Project ID in .env does not have billing enabled. Please verify you are using the correct Project ID from Google Cloud Console.",
                        suggestion: "Go to console.cloud.google.com, copy your ACTIVE Project ID, and update GOOGLE_PROJECT_ID in your .env file."
                    },
                    { status: 403 }
                );
            }

            return NextResponse.json(
                { error: `Vertex AI Failed: ${response.statusText}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Extract result image (usually configured in predictions)
        // Adjust based on exact response shape of Try-On model
        const prediction = data.predictions?.[0];
        const outputImage = prediction?.try_on_image?.bytesBase64Encoded;

        if (!outputImage) {
            throw new Error("No image generated in response");
        }

        return NextResponse.json({
            success: true,
            result_image: `data:image/png;base64,${outputImage}`
        });

    } catch (error) {
        console.error("Try-On API Error:", error);
        return NextResponse.json({
            error: "Try-On Failed",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
