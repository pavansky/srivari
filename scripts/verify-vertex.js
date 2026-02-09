const fs = require('fs');
const path = require('path');

// 1. Read .env manually
const envPath = path.resolve(__dirname, '../.env');
let envVars = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            envVars[match[1].trim()] = match[2].trim().replace(/['"]/g, ''); // Remove quotes
        }
    });
} catch (e) {
    console.error("❌ Could not read .env file:", e.message);
    process.exit(1);
}

const PROJECT_ID = envVars.GOOGLE_PROJECT_ID;
const API_KEY = envVars.GOOGLE_API_KEY;

console.log(`Checking Credentials for Project: ${PROJECT_ID}`);
console.log(`API Key (First 5 chars): ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'undefined'}`);

if (!PROJECT_ID || !API_KEY) {
    console.error("❌ Missing GOOGLE_PROJECT_ID or GOOGLE_API_KEY in .env");
    process.exit(1);
}

// 2. Test Connection
async function testConnection() {
    const location = "us-central1";
    const modelId = "virtual-try-on-001";
    // We intentionally send an empty payload. 
    // If Auth works, we expect 400 (Invalid argument). 
    // If Auth fails, we expect 401/403.
    // If API/Model wrong, we expect 404.
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${location}/publishers/google/models/${modelId}:predict?key=${API_KEY}`;

    console.log(`\nTesting Endpoint: .../models/${modelId}:predict`);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instances: [] }) // Empty instances
        });

        const status = response.status;
        const text = await response.text();

        console.log(`\nGlobal HTTP Status: ${status}`);

        if (status === 200) {
            console.log("✅ SUCCESS! Auth worked and API is reachable.");
        } else if (status === 400) {
            console.log("✅ SUCCESS! Auth worked (400 is expected for empty payload).");
            console.log("   The API is enabled and reachable.");
        } else if (status === 401 || status === 403) {
            console.error("❌ AUTH FAILED (401/403). Check API Key permissions or Project ID.");
            console.error("   Response:", text);
        } else if (status === 404) {
            console.error("❌ NOT FOUND (404). Check Project ID or Model ID.");
            console.error("   Also ensure 'Vertex AI API' is enabled in Google Cloud Console.");
            console.error("   Response:", text);
        } else {
            console.error("❌ ERROR:", text);
        }

    } catch (e) {
        console.error("❌ NETWORK ERROR:", e.message);
    }
}

testConnection();
