import { NextResponse } from 'next/server';
import { getShippingRate } from '@/lib/shiprocket';
import { SELLER } from '@/config/commerce';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'anonymous';
        if (!rateLimit(`serviceability:${ip}`, 60).success) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const { pincode, weight } = await req.json();

        if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
            return NextResponse.json({ error: "A valid 6-digit pincode is required" }, { status: 400 });
        }

        // Origin comes from commerce config so a change of boutique doesn't need a deploy.
        const pickupPincode = SELLER.address.pincode;

        // Default weight: 0.5kg per item if not passed, but frontend should pass estimated total.
        // If we want to accept 'items' array, we can calc here, but passing total weight is easier.
        const safeWeight = weight || 0.5;

        const rateData = await getShippingRate(pickupPincode, pincode, safeWeight);

        if (!rateData) {
            return NextResponse.json({ error: "Pincode not serviceable" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            shipping: Math.ceil(rateData.rate), // Round up to nearest rupee
            courier: rateData.courier_name,
            city: rateData.city,
            state: rateData.state,
            eta: rateData.etd // Estimated Time of Delivery
        });

    } catch (error) {
        console.error("Shiprocket Rate Error:", error);
        return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
    }
}
