import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Your Cart | The Srivari",
    description: "Review your selected royal silk sarees.",
    robots: {
        index: false,
        follow: false,
    }
};

export default function CartLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
