"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccordionItemProps {
    title: string;
    content: React.ReactNode;
    isOpen: boolean;
    onClick: () => void;
}

const AccordionItem = ({ title, content, isOpen, onClick }: AccordionItemProps) => {
    return (
        <div style={{ borderBottom: '1px solid #eee' }}>
            <button
                onClick={onClick}
                style={{
                    width: '100%',
                    padding: '1.25rem 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                }}
            >
                <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-main)', fontFamily: 'var(--font-sans)' }}>{title}</span>
                {isOpen ? <ChevronUp size={20} color="#888" /> : <ChevronDown size={20} color="#888" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ paddingBottom: '1.25rem', color: '#666', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            {content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function Accordion({ items }: { items: { title: string, content: React.ReactNode }[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleClick = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            {items.map((item, index) => (
                <AccordionItem
                    key={index}
                    title={item.title}
                    content={item.content}
                    isOpen={openIndex === index}
                    onClick={() => handleClick(index)}
                />
            ))}
        </div>
    );
}
