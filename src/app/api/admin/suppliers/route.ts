import { NextResponse } from 'next/server';
import { getSuppliers, saveSupplier, deleteSupplier } from '@/lib/db';

export async function GET() {
    try {
        const suppliers = await getSuppliers();
        return NextResponse.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supplier = await request.json();
        const saved = await saveSupplier(supplier);
        return NextResponse.json(saved);
    } catch (error) {
        console.error('Error saving supplier:', error);
        return NextResponse.json({ error: 'Failed to save supplier' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        await deleteSupplier(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
    }
}
