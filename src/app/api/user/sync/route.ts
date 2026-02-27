import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';

/**
 * POST /api/user/sync
 * Syncs the Supabase user with our internal Prisma User table.
 */
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Upsert the user in our Prisma DB
        const syncedUser = await prisma.user.upsert({
            where: { id: user.id },
            update: {
                email: user.email!,
                name: user.user_metadata?.full_name || user.email?.split('@')[0],
                avatar: user.user_metadata?.avatar_url,
                // We keep loyalty points and preferences from the DB side
            },
            create: {
                id: user.id,
                email: user.email!,
                name: user.user_metadata?.full_name || user.email?.split('@')[0],
                avatar: user.user_metadata?.avatar_url,
                loyaltyPoints: 0,
                preferences: {}
            }
        });

        return NextResponse.json(syncedUser);
    } catch (error) {
        console.error('User sync failed:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
