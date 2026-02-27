import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Contact The Srivari | Get in Touch",
    description: "Reach out to The Srivari for queries about silk sarees, custom orders, styling advice, or visit our boutique in Bangalore. Phone: +91 97399 88771. Email: support@thesrivari.com.",
    alternates: { canonical: "/contact" },
    openGraph: {
        title: "Contact The Srivari | Boutique in Bangalore",
        description: "Visit our boutique or reach out for custom saree orders, styling advice, and more.",
        url: "https://thesrivari.com/contact",
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
