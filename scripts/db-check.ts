
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("1. Connecting to Database...");
        await prisma.$connect();
        console.log("✅ Database Connected Successfully.");

        console.log("2. Checking Product Schema access...");
        const count = await prisma.product.count();
        console.log(`✅ Product Table Accessible. Total Products: ${count}`);

        console.log("3. Attempting a read...");
        const products = await prisma.product.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
        if (products.length > 0) {
            products.forEach(p => {
                console.log(`✅ Product: ${p.name}, ID: ${p.id}`);
                console.log(`   Images (Type: ${typeof p.images}, IsArray: ${Array.isArray(p.images)}):`, p.images);
                console.log(`   Featured: ${p.isFeatured}`);
            });
        } else {
            console.log("✅ Read Success. Table is empty.");
        }

    } catch (error) {
        console.error("❌ Database Verification Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
