import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://thesrivari.com';

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/collections`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/shop`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/shipping-policy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/returns`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/try-on`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];

    // Dynamic product pages
    let productPages: MetadataRoute.Sitemap = [];
    try {
        const res = await fetch(`${baseUrl}/api/products`, { next: { revalidate: 3600 } });
        if (res.ok) {
            const products = await res.json();
            productPages = products.map((product: any) => ({
                url: `${baseUrl}/product/${product.id}`,
                lastModified: new Date(product.updatedAt || product.createdAt || new Date()),
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            }));
        }
    } catch {
        // If API is unavailable during build, skip product pages
    }

    return [...staticPages, ...productPages];
}
