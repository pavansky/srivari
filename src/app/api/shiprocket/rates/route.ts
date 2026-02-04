import { NextResponse } from 'next/server';
import { getShippingRate } from '@/lib/shiprocket';

export async function POST(req: Request) {
    try {
        const { pincode, weight } = await req.json();

        if (!pincode) {
            return NextResponse.json({ error: "Pincode is required" }, { status: 400 });
        }

        const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || '500033'; // Default to a Hyderabad zip if missing

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
            eta: rateData.etd // Estimated Time of Delivery
        });

    } catch (error) {
        console.error("Shiprocket Rate Error:", error);
        return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
    }
}
