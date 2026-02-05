// Simplified Test Script
const https = require('https');
const fs = require('fs');
const path = require('path');

// Helper to read env manually for standalone execution
function getEnv(key) {
    if (process.env[key]) return process.env[key];
    try {
        const envLocal = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
        const match = envLocal.match(new RegExp(`${key}="(.*?)"`)) || envLocal.match(new RegExp(`${key}=(.*)`));
        if (match) return match[1].replace(/"/g, '');

        const env = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
        const match2 = env.match(new RegExp(`${key}="(.*?)"`)) || env.match(new RegExp(`${key}=(.*)`));
        if (match2) return match2[1].replace(/"/g, '');
    } catch (e) { }
    return null;
}

async function run() {
    const email = getEnv('SHIPROCKET_EMAIL');
    const password = getEnv('SHIPROCKET_PASSWORD');

    console.log("--- DEBUG START ---");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password ? password.substring(0, 3) + '...' : 'MISSING'}`);

    if (!email || !password) {
        console.error("CRITICAL: Missing credentials");
        return;
    }

    // 1. LOGIN
    console.log("\n1. Testing Login...");
    const token = await new Promise((resolve) => {
        const req = https.request('https://apiv2.shiprocket.in/v1/external/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                console.log(`Login Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    resolve(JSON.parse(body).token);
                } else {
                    console.error("Login Failed Body:", body);
                    resolve(null);
                }
            });
        });
        req.write(JSON.stringify({ email, password }));
        req.end();
    });

    if (!token) {
        console.log("--- ABORT: Login Failed ---");
        return;
    }
    console.log("Login Success! Token obtained.");

    // 2. CHECK SERVICEABILITY
    console.log("\n2. Testing Serviceability...");
    const pickup = '500033';
    const delivery = '560092';
    const weight = 0.5;
    const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickup}&delivery_postcode=${delivery}&cod=0&weight=${weight}`;

    await new Promise((resolve) => {
        https.get(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                console.log(`Rate Status: ${res.statusCode}`);
                console.log("Rate Response:", body.substring(0, 500) + "..."); // First 500 chars
                resolve();
            });
        });
    });
    console.log("--- DEBUG END ---");
}

run();
