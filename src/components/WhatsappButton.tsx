"use client";

import { MessageCircle } from 'lucide-react';

interface WhatsappButtonProps {
    productName?: string;
    price?: number;
    variant?: 'primary' | 'floating';
}

const WhatsappButton: React.FC<WhatsappButtonProps> = ({ productName, price, variant = 'primary' }) => {
    const phoneNumber = "919739988771"; // Updated user number

    const handleClick = () => {
        let message = "Namaste Srivari's, I am interested in your sarees.";
        if (productName) {
            message = `Namaste, I would like to inquire about/order the "${productName}" priced at ₹${price}. Please provide more details.`;
        }

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    if (variant === 'floating') {
        return (
            <button onClick={handleClick} className="floating-wa" aria-label="Chat on WhatsApp">
                <MessageCircle size={24} />
            </button>
        );
    }

    return (
        <button onClick={handleClick} className="btn-primary wa-btn">
            <MessageCircle size={20} style={{ marginRight: '0.5rem' }} />
            Order via WhatsApp
            <style jsx>{`
        .wa-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #25D366; /* WhatsApp Green */
          border-color: #25D366;
        }
        .wa-btn:hover {
          background-color: #128C7E;
          border-color: #128C7E;
        }
      `}</style>
        </button>
    );
};

export default WhatsappButton;
