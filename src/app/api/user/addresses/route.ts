import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';

async function getAuthenticatedUser(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return null;
    return user;
}

/**
 * GET Handler
 * Fetch all saved addresses for the authenticated user.
 */
export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const addresses = await prisma.address.findMany({
            where: { userId: user.id },
            orderBy: { isDefault: 'desc' }
        });

        return NextResponse.json(addresses);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
    }
}

/**
 * POST Handler
 * Add a new address or update an existing one.
 */
export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { id, type, firstName, lastName, addressLine1, addressLine2, landmark, city, state, pincode, phone, isDefault, isBusiness } = body;

        // If setting as default, unset others first
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: user.id },
                data: { isDefault: false }
            });
        }

        if (id) {
            // Update
            const updated = await prisma.address.update({
                where: { id, userId: user.id },
                data: { type, firstName, lastName, addressLine1, addressLine2, landmark, city, state, pincode, phone, isDefault, isBusiness }
            });
            return NextResponse.json(updated);
        } else {
            // Create
            const created = await prisma.address.create({
                data: {
                    userId: user.id,
                    type: type || 'Home',
                    firstName,
                    lastName,
                    addressLine1,
                    addressLine2,
                    landmark,
                    city,
                    state,
                    pincode,
                    phone,
                    isDefault: isDefault || false,
                    isBusiness: isBusiness || false
                }
            });
            return NextResponse.json(created);
        }
    } catch (error) {
        console.error('Address save failed:', error);
        return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
    }
}

/**
 * DELETE Handler
 * Remove a saved address.
 */
export async function DELETE(request: Request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.address.delete({
            where: { id, userId: user.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
    }
}
