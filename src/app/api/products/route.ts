import { NextResponse } from 'next/server';
import { getProducts, saveProduct, deleteProduct } from '@/lib/db';

export async function GET() {
    try {
        const products = await getProducts();
        return NextResponse.json(products);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const saved = await saveProduct(body);
        return NextResponse.json({ success: true, product: saved });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await deleteProduct(id);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
