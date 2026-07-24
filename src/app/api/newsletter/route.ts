import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

/** POST — public newsletter signup. Body: { email, source? } */
export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'anonymous';
        if (!rateLimit(`newsletter:${ip}`, 10).success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const { email, source } = await request.json();
        const cleaned = String(email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
            return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
        }

        await prisma.newsletterSubscriber.upsert({
            where: { email: cleaned },
            update: {},
            create: { email: cleaned, source: source ? String(source).slice(0, 40) : null }
        });

        return NextResponse.json({ success: true, message: 'Welcome to the inner circle.' });
    } catch (e) {
        console.warn('Newsletter signup failed (table missing?):', e);
        return NextResponse.json({ error: 'Could not subscribe right now. Please try again later.' }, { status: 500 });
    }
}
