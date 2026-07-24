import { NextResponse } from 'next/server';
import { getSuppliers, saveSupplier, deleteSupplier } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const suppliers = await getSuppliers();
        return NextResponse.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const supplier = await request.json();
        if (!supplier?.name) return NextResponse.json({ error: 'Supplier name required' }, { status: 400 });
        const saved = await saveSupplier(supplier);
        return NextResponse.json(saved);
    } catch (error) {
        console.error('Error saving supplier:', error);
        return NextResponse.json({ error: 'Failed to save supplier' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const { id } = await request.json();
        await deleteSupplier(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
    }
}
