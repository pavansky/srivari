
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
let url = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=(.*)/);
    if (match) {
        url = match[1].trim().replace(/['"]/g, '');
    }
} catch (e) {
    console.error("Could not read .env file:", e.message);
}


if (!url) {
    console.error("❌ DATABASE_URL is not defined in .env");
} else {
    try {
        // Handle postgres://... format
        // If it starts with postgresql:// or postgres://
        // URLs might differ, so we parse it carefully.
        const parsed = new URL(url);
        console.log("✅ DATABASE_URL is loaded.");
        console.log(`   Host: ${parsed.hostname}`);
        console.log(`   Port: ${parsed.port}`);
        console.log(`   Protocol: ${parsed.protocol}`);

        if (parsed.port === '6543') {
            console.log("\n⚠️  WARNING: You are using Port 6543 (Transaction Pooler).");
            console.log("   This port is often blocked on some networks.");
            console.log("   Recommended: Change it to 5432 in your .env file.");
        } else if (parsed.port === '5432') {
            console.log("\n✅ Port 5432 is configured. This is usually correct for direct connections.");
        } else {
            console.log(`\nℹ️  Using custom port: ${parsed.port}`);
        }

    } catch (e) {
        console.error("❌ Could not parse DATABASE_URL. Is it a valid URL?");
    }
}
