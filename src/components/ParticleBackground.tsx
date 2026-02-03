"use client";

import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    baseSize: number;
    size: number;
    alpha: number;
}

export default function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            const particleCount = Math.min(window.innerWidth * 0.1, 150); // Increased density
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                const size = Math.random() * 2 + 1.5; // Slightly larger base size
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    baseSize: size,
                    size: size,
                    alpha: Math.random() * 0.6 + 0.2, // Higher opacity
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p) => {
                // Mouse interaction physics
                const dx = mouseRef.current.x - p.x;
                const dy = mouseRef.current.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 150;

                if (distance < maxDistance) {
                    // Attraction force
                    const force = (maxDistance - distance) / maxDistance;
                    const angle = Math.atan2(dy, dx);
                    const pushX = Math.cos(angle) * force * 1.5; // Strength of attraction
                    const pushY = Math.sin(angle) * force * 1.5;

                    p.vx += pushX * 0.05;
                    p.vy += pushY * 0.05;

                    // Grow size when near mouse
                    p.size = p.baseSize + (force * 3);
                } else {
                    // Return to normal size
                    if (p.size > p.baseSize) {
                        p.size -= 0.1;
                    }
                }

                // Friction to prevent infinite acceleration
                p.vx *= 0.98;
                p.vy *= 0.98;

                // Move
                p.x += p.vx;
                p.y += p.vy;

                // Constant ambient movement (so they don't stop completely)
                if (Math.abs(p.vx) < 0.2) p.vx += (Math.random() - 0.5) * 0.05;
                if (Math.abs(p.vy) < 0.2) p.vy += (Math.random() - 0.5) * 0.05;

                // Wrap around edges
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Draw Particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`; // Gold color #D4AF37
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener("resize", resizeCanvas);
        window.addEventListener("mousemove", handleMouseMove);

        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[40]"
        />
    );
}
