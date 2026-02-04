import fs from 'fs';
import path from 'path';

const TOKEN_FILE = path.join(process.cwd(), 'data', 'shiprocket_token.json');
const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

interface ShiprocketToken {
    token: string;
    expires_at: number;
}

// Helper: Get Token (Cached or New)
export async function getShiprocketToken(): Promise<string> {
    const now = Date.now();

    // 1. Check local cache
    if (fs.existsSync(TOKEN_FILE)) {
        try {
            const data: ShiprocketToken = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
            // Reuse if valid for at least another 1 hour
            if (data.token && data.expires_at > now + 3600000) {
                return data.token;
            }
        } catch (e) {
            console.error("Error reading cached token:", e);
        }
    }

    // 2. Authenticate if no valid token
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
        throw new Error("Shiprocket Credentials missing in env");
    }

    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(`Shiprocket Auth Failed: ${JSON.stringify(err)}`);
    }

    const authData = await res.json();
    const token = authData.token;

    // 3. Cache it (Valid for 10 days usually, let's set 24h for safety)
    const tokenData: ShiprocketToken = {
        token,
        expires_at: now + (24 * 60 * 60 * 1000)
    };

    // Ensure directory exists
    const dir = path.dirname(TOKEN_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData));

    return token;
}

// Helper: Get Rates
export async function getShippingRate(pickupPincode: string, deliveryPincode: string, weightKg: number) {
    const token = await getShiprocketToken();

    // Shiprocket expects weight in KG. 0.5 is 500g.
    // Length, Breadth, Height can be approximated for a Saree box.
    const url = `${BASE_URL}/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&cod=0&weight=${weightKg}`;

    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        // If 404/422, it usually means unserviceable
        return null;
    }

    const data = await res.json();

    if (data.status === 200 && data.data && data.data.available_courier_companies) {
        // Filter for reasonable couriers (e.g., recommend 'available_courier_companies' list)
        // We want the customer to pay a standard rate or the actual rate.
        // Let's assume we pick the "lowest rate" from a reputable partner for now.

        const couriers = data.data.available_courier_companies;
        if (couriers.length === 0) return null;

        // Sort by rate
        couriers.sort((a: any, b: any) => a.rate - b.rate);

        return couriers[0]; // Cheapest option
    }

    return null;
}
