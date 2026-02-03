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
        <div className="border-b border-[#E5E5E5] last:border-none">
            <button
                onClick={onClick}
                className="w-full py-6 flex justify-between items-center text-left bg-transparent group"
            >
                <span className={`text-lg font-serif tracking-wide transition-colors duration-300 ${isOpen ? 'text-[#4A0404]' : 'text-[#1A1A1A] group-hover:text-[#D4AF37]'}`}>
                    {title}
                </span>
                <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    {isOpen ? (
                        <ChevronUp size={20} className="text-[#D4AF37]" />
                    ) : (
                        <ChevronDown size={20} className="text-gray-400 group-hover:text-[#D4AF37]" />
                    )}
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pb-6 text-[#595959] text-base leading-relaxed font-sans font-light">
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
        <div className="mt-8 bg-white p-6 md:p-8 rounded-sm shadow-sm border border-[#F0F0F0]">
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
