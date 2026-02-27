import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/admin/'], // Hide API and admin routes from search engines
        },
        sitemap: 'https://thesrivari.com/sitemap.xml',
    }
}
