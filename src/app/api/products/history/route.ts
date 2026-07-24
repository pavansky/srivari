import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('id');

        if (!productId) {
            return NextResponse.json({ error: "Product ID is missing." }, { status: 400 });
        }

        const history = await prisma.inventoryTransaction.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json(history);
    } catch (error: any) {
        console.error("Failed to fetch product history:", error);
        return NextResponse.json(
            { error: "Internal server error fetching product history." },
            { status: 500 }
        );
    }
}
