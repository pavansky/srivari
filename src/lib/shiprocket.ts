import fs from 'fs';
import path from 'path';
import https from 'https';
import 'server-only';

import os from 'os';

const TOKEN_FILE = path.join(os.tmpdir(), 'shiprocket_token.json');
let memoryToken: string | null = null;
let memoryTokenExpiry: number = 0;
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
                // Without a timeout, a peer that completes the TCP handshake but
                // never responds hangs this promise forever — stalling the whole
                // serverless function and the customer's checkout. Reject after 8s
                // so getShippingRate's mock-rate fallback can take over.
                timeout: 8000,
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

            req.on('timeout', () => {
                req.destroy(new Error('Shiprocket request timed out'));
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

    // 1. Check Memory Cache
    if (memoryToken && memoryTokenExpiry > now + 3600000) {
        return memoryToken;
    }

    // 2. Check local disk cache (in /tmp)
    if (fs.existsSync(TOKEN_FILE)) {
        try {
            const fileContent = fs.readFileSync(TOKEN_FILE, 'utf8');
            if (fileContent) {
                const data: ShiprocketToken = JSON.parse(fileContent);
                if (data.token && data.expires_at > now + 3600000) {
                    memoryToken = data.token;
                    memoryTokenExpiry = data.expires_at;
                    return data.token;
                }
            }
        } catch (e) {
            console.error("Error reading cached token:", e);
        }
    }

    // 2. Authenticate
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

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
        const expiry = now + (24 * 60 * 60 * 1000);

        memoryToken = token;
        memoryTokenExpiry = expiry;

        const tokenData: ShiprocketToken = {
            token,
            expires_at: expiry
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
        let token;
        try {
            token = await getShiprocketToken();
        } catch (authErr) {
            console.error("SR Auth Failed, mocking rate for checkout:", authErr);
            // Fallback mock rate if Shiprocket Auth is totally broken
            return {
                rate: Math.ceil(weightKg / 0.5) * 150,
                courier_name: "Mock Courier (Auth Failed)",
                city: "Unknown",
                state: "Unknown",
                etd: "3-5 Business Days"
            };
        }

        const url = `${BASE_URL}/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&cod=0&weight=${weightKg}`;
        console.log("SR Rate Request:", url);

        const data = await httpsRequest(url, 'GET', null, {
            'Authorization': `Bearer ${token}`
        });

        if (data && data.data && data.data.available_courier_companies && data.data.available_courier_companies.length > 0) {
            const couriers = data.data.available_courier_companies;
            console.log(`SR Success: Found ${couriers.length} couriers`);

            couriers.sort((a: any, b: any) => a.rate - b.rate);
            const bestCourier = couriers[0];
            return {
                rate: bestCourier.rate,
                courier_name: bestCourier.courier_name,
                city: bestCourier.city || "Unknown",
                state: bestCourier.state || "Unknown",
                etd: bestCourier.etd || "3-5 Business Days"
            };
        } else {
            console.log("SR Response: No couriers or unserviceable", JSON.stringify(data));
            // Fallback to prevent blocking the user if SR says it's unserviceable but we still want to accept the order
            return {
                rate: Math.ceil(weightKg / 0.5) * 200, // Standard fallback rate
                courier_name: "Standard Shipping",
                city: "Local",
                state: "Regional",
                etd: "5-7 Business Days"
            };
        }
    } catch (e) {
        console.error("SR Rate Fetch Error:", e);
        // Absolute fallback
        return {
            rate: Math.ceil(weightKg / 0.5) * 200,
            courier_name: "Standard Shipping",
            city: "Local",
            state: "Regional",
            etd: "5-7 Business Days"
        };
    }
}

/* ============================================================================
   Fulfilment pipeline
   ----------------------------------------------------------------------------
   Everything below turns a paid order into a real shipment: push the order to
   Shiprocket, assign a courier (AWB), request pickup, and read tracking back.

   Every function throws a plain Error with a human-readable message so the
   admin UI can surface exactly what Shiprocket objected to (bad pincode,
   unregistered pickup location, wallet balance, etc.) instead of a generic 500.
   ============================================================================ */

export interface ShipmentItem {
    name: string;
    sku: string;
    units: number;
    /** Unit selling price in rupees (GST-inclusive, as charged). */
    sellingPrice: number;
    hsn?: string;
}

export interface CreateShipmentInput {
    orderId: string;
    orderDate: Date;
    customer: {
        name: string;
        email?: string;
        phone: string;
        address: string;
        address2?: string;
        city: string;
        state: string;
        pincode: string;
    };
    items: ShipmentItem[];
    /** Goods total charged to the customer. */
    subTotal: number;
    /** COD orders must be flagged so the courier collects cash. */
    isCod: boolean;
    weightKg: number;
    pickupLocation: string;
}

function srError(context: string, e: any): Error {
    // Shiprocket returns { message, errors: { field: [msg] } } on 4xx
    const body = e?.body ? (() => { try { return JSON.parse(e.body); } catch { return null; } })() : null;
    const detail =
        body?.message ||
        (body?.errors && Object.entries(body.errors).map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`).join("; ")) ||
        e?.message ||
        "Unknown Shiprocket error";
    return new Error(`${context}: ${detail}`);
}

/** Splits a full name into the first/last pair Shiprocket requires. */
function splitName(full: string): { first: string; last: string } {
    const parts = (full || "Customer").trim().split(/\s+/);
    return { first: parts[0] || "Customer", last: parts.slice(1).join(" ") || "." };
}

/**
 * Creates a custom (self-fulfilled) order in Shiprocket.
 * Returns the shipment + order ids needed for AWB assignment.
 */
export async function createShipment(input: CreateShipmentInput): Promise<{ shipmentId: string; srOrderId: string }> {
    const token = await getShiprocketToken();
    const { first, last } = splitName(input.customer.name);

    const payload = {
        order_id: input.orderId,
        order_date: input.orderDate.toISOString().slice(0, 19).replace("T", " "),
        pickup_location: input.pickupLocation,
        billing_customer_name: first,
        billing_last_name: last,
        billing_address: input.customer.address,
        billing_address_2: input.customer.address2 || "",
        billing_city: input.customer.city,
        billing_pincode: input.customer.pincode,
        billing_state: input.customer.state,
        billing_country: "India",
        billing_email: input.customer.email || "",
        billing_phone: String(input.customer.phone).replace(/\D/g, "").slice(-10),
        shipping_is_billing: true,
        order_items: input.items.map(i => ({
            name: i.name.slice(0, 100),
            sku: i.sku,
            units: i.units,
            selling_price: i.sellingPrice,
            hsn: i.hsn || "",
        })),
        payment_method: input.isCod ? "COD" : "Prepaid",
        sub_total: input.subTotal,
        // Shiprocket requires parcel dimensions; a folded saree box is ~30x25x8cm.
        length: 30,
        breadth: 25,
        height: 8,
        weight: Math.max(0.5, input.weightKg),
    };

    try {
        const res = await httpsRequest(`${BASE_URL}/orders/create/adhoc`, "POST", payload, {
            Authorization: `Bearer ${token}`,
        });
        if (!res?.shipment_id) throw new Error(res?.message || "Shiprocket did not return a shipment id");
        return { shipmentId: String(res.shipment_id), srOrderId: String(res.order_id) };
    } catch (e: any) {
        throw srError("Could not create the shipment", e);
    }
}

/**
 * Assigns a courier (AWB). Omit courierId to let Shiprocket pick its
 * recommended courier for the route.
 */
export async function assignAWB(shipmentId: string, courierId?: number): Promise<{ awb: string; courier: string }> {
    const token = await getShiprocketToken();
    const payload: Record<string, unknown> = { shipment_id: Number(shipmentId) };
    if (courierId) payload.courier_id = courierId;

    try {
        const res = await httpsRequest(`${BASE_URL}/courier/assign/awb`, "POST", payload, {
            Authorization: `Bearer ${token}`,
        });
        const data = res?.response?.data || res?.data || {};
        const awb = data.awb_code || res?.awb_code;
        if (!awb) throw new Error(res?.message || "No AWB returned — check Shiprocket wallet balance and courier availability");
        return { awb: String(awb), courier: String(data.courier_name || "Courier") };
    } catch (e: any) {
        throw srError("Could not assign a courier", e);
    }
}

/** Requests courier pickup for an assigned shipment. Non-fatal by design. */
export async function requestPickup(shipmentId: string): Promise<{ scheduled: boolean; message: string }> {
    const token = await getShiprocketToken();
    try {
        const res = await httpsRequest(`${BASE_URL}/courier/generate/pickup`, "POST",
            { shipment_id: [Number(shipmentId)] },
            { Authorization: `Bearer ${token}` });
        return { scheduled: true, message: res?.response?.pickup_status || res?.message || "Pickup requested" };
    } catch (e: any) {
        // The shipment is already booked; a failed pickup request is recoverable
        // from the Shiprocket dashboard and must not fail the whole ship action.
        return { scheduled: false, message: srError("Pickup not scheduled", e).message };
    }
}

/** Shipping label PDF for an assigned shipment. Optional. */
export async function generateLabel(shipmentId: string): Promise<string | null> {
    const token = await getShiprocketToken();
    try {
        const res = await httpsRequest(`${BASE_URL}/courier/generate/label`, "POST",
            { shipment_id: [Number(shipmentId)] },
            { Authorization: `Bearer ${token}` });
        return res?.label_url || null;
    } catch (e) {
        console.error("SR label generation failed:", e);
        return null;
    }
}

/** Live tracking for an AWB. Returns null when unavailable rather than throwing. */
export async function trackByAWB(awb: string): Promise<{ status: string; activities: any[]; etd?: string } | null> {
    const token = await getShiprocketToken();
    try {
        const res = await httpsRequest(`${BASE_URL}/courier/track/awb/${encodeURIComponent(awb)}`, "GET", undefined, {
            Authorization: `Bearer ${token}`,
        });
        const data = res?.tracking_data || res?.[0]?.tracking_data;
        if (!data) return null;
        return {
            status: data.shipment_track?.[0]?.current_status || "In Transit",
            activities: data.shipment_track_activities || [],
            etd: data.etd,
        };
    } catch (e) {
        console.error("SR tracking failed:", e);
        return null;
    }
}

/** Cancels a booked shipment (used when an order is cancelled after shipping). */
export async function cancelShipment(awb: string): Promise<boolean> {
    const token = await getShiprocketToken();
    try {
        await httpsRequest(`${BASE_URL}/orders/cancel/shipment/awbs`, "POST", { awbs: [awb] }, {
            Authorization: `Bearer ${token}`,
        });
        return true;
    } catch (e) {
        console.error("SR shipment cancel failed:", e);
        return false;
    }
}

/** Public tracking URL customers can open. */
export function trackingUrlFor(awb: string): string {
    return `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;
}
