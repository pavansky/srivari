"use client";

import React, { createContext, useContext, useRef, ReactNode, useEffect } from 'react';

interface AudioContextType {
    playBell: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // We use a high-quality temple bell sound commonly used for Tirupati/Tirumala vibes
        // A clear, resonant brass bell sound. Replace with a specific file if you have one.
        audioRef.current = new Audio('/audio/temple-bell.mp3');
        audioRef.current.volume = 0.5; // Start at 50% volume so it's not jarring
    }, []);

    const playBell = () => {
        if (audioRef.current) {
            // Reset time to 0 to allow rapid clicking (overlapping sounds)
            audioRef.current.currentTime = 0;

            // Play returns a promise, which can reject if the user hasn't interacted with the document yet
            audioRef.current.play().catch(e => {
                console.warn("Audio play blocked by browser. User must interact with document first.", e);
            });
        }
    };

    return (
        <AudioContext.Provider value={{ playBell }}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
}
