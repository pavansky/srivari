import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient() as any;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('id');

        if (!productId) {
            return NextResponse.json({ error: "Product ID is missing." }, { status: 400 });
        }

        const history = await prisma.inventoryTransaction.findMany({
            where: { productId },
            orderBy: { timestamp: 'desc' },
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
