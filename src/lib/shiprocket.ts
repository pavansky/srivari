import fs from 'fs';
import path from 'path';
import https from 'https';
import 'server-only';

const TOKEN_FILE = path.join(process.cwd(), 'data', 'shiprocket_token.json');
const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

interface ShiprocketToken {
    token: string;
    expires_at: number;
}

// Helper: HTTPS Request wrapper
function httpsRequest(url: string, method: string, data?: any, headers: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            const postData = data ? JSON.stringify(data) : null;
            if (postData) {
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const json = JSON.parse(body);
                            resolve(json);
                        } catch (e) {
                            console.error("SR JSON Parse Error:", e, body);
                            resolve(body); // Fallback
                        }
                    } else {
                        console.error(`SR HTTPS Error ${res.statusCode}:`, body);
                        reject({ status: res.statusCode, body });
                    }
                });
            });

            req.on('error', (e) => {
                console.error("SR Network Error:", e);
                reject(e);
            });

            if (postData) {
                req.write(postData);
            }
            req.end();
        } catch (e) {
            reject(e);
        }
    });
}

// Helper: Get Token (Cached or New)
export async function getShiprocketToken(): Promise<string> {
    const now = Date.now();

    // 1. Check local cache
    if (fs.existsSync(TOKEN_FILE)) {
        try {
            const fileContent = fs.readFileSync(TOKEN_FILE, 'utf8');
            if (fileContent) {
                const data: ShiprocketToken = JSON.parse(fileContent);
                if (data.token && data.expires_at > now + 3600000) {
                    // console.log("SR Auth: Using cached token");
                    return data.token;
                }
            }
        } catch (e) {
            console.error("Error reading cached token:", e);
        }
    }

    // 2. Authenticate
    // HARDCODED DEBUG
    const email = "dispatch@thesrivari.com";
    const password = "N!k$sS!J1pb!cLpWiKXX!6Roa&frl&Qk";

    // const email = process.env.SHIPROCKET_EMAIL;
    // const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
        console.error("SR Error: Credentials missing");
        throw new Error("Shiprocket Credentials missing in env");
    }

    console.log("SR Auth: Logging in via HTTPS...");
    try {
        const authData = await httpsRequest(`${BASE_URL}/auth/login`, 'POST', { email, password });
        const token = authData.token;

        if (!token) throw new Error("No token returned");

        // 3. Cache it
        const tokenData: ShiprocketToken = {
            token,
            expires_at: now + (24 * 60 * 60 * 1000)
        };

        const dir = path.dirname(TOKEN_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData));

        return token;
    } catch (e) {
        console.error("SR Auth Failed:", e);
        throw new Error("Shiprocket Authentication Failed");
    }
}

// Helper: Get Rates
export async function getShippingRate(pickupPincode: string, deliveryPincode: string, weightKg: number) {
    try {
        const token = await getShiprocketToken();

        const url = `${BASE_URL}/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&cod=0&weight=${weightKg}`;
        console.log("SR Rate Request:", url);

        const data = await httpsRequest(url, 'GET', null, {
            'Authorization': `Bearer ${token}`
        });

        if (data && data.data && data.data.available_courier_companies) {
            const couriers = data.data.available_courier_companies;
            console.log(`SR Success: Found ${couriers.length} couriers`);
            if (couriers.length === 0) return null;

            couriers.sort((a: any, b: any) => a.rate - b.rate);
            const bestCourier = couriers[0];
            return {
                rate: bestCourier.rate,
                courier_name: bestCourier.courier_name,
                city: bestCourier.city,
                state: bestCourier.state,
                etd: bestCourier.etd
            };
        } else {
            console.log("SR Response: No couriers", JSON.stringify(data));
        }

        return null;

    } catch (e) {
        console.error("SR Rate Fetch Error:", e);
        return null;
    }
}
