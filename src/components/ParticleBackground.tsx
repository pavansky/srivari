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
    type: 'heart' | 'butterfly' | 'circle';
    rotation: number;
    rotationSpeed: number;
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
            const types = ['heart', 'butterfly', 'circle'] as const;

            for (let i = 0; i < particleCount; i++) {
                const size = Math.random() * 4 + 2; // Slightly larger for intricate shapes
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    baseSize: size,
                    size: size,
                    alpha: Math.random() * 0.6 + 0.2, // Higher opacity
                    type: types[Math.floor(Math.random() * types.length)],
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.05
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
                if (p.x < -20) p.x = canvas.width + 20;
                if (p.x > canvas.width + 20) p.x = -20;
                if (p.y < -20) p.y = canvas.height + 20;
                if (p.y > canvas.height + 20) p.y = -20;

                // Draw Particle
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                p.rotation += p.rotationSpeed;

                ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`; // Gold color #D4AF37

                if (p.type === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.type === 'heart') {
                    const s = p.size;
                    ctx.beginPath();
                    ctx.moveTo(0, s * 0.3);
                    ctx.bezierCurveTo(-s * 0.5, -s * 0.1, -s * 0.9, s * 0.5, 0, s * 1.2);
                    ctx.bezierCurveTo(s * 0.9, s * 0.5, s * 0.5, -s * 0.1, 0, s * 0.3);
                    ctx.fill();
                } else if (p.type === 'butterfly') {
                    const s = p.size;
                    ctx.beginPath();
                    // Top left wing
                    ctx.moveTo(0, 0);
                    ctx.bezierCurveTo(-s * 1.2, -s * 0.8, -s * 1.5, s * 0.4, 0, s * 0.4);
                    // Bottom left wing
                    ctx.bezierCurveTo(-s * 0.8, s * 0.8, -s * 0.4, s * 1.2, 0, s * 0.8);
                    // Bottom right wing
                    ctx.bezierCurveTo(s * 0.4, s * 1.2, s * 0.8, s * 0.8, 0, s * 0.4);
                    // Top right wing
                    ctx.bezierCurveTo(s * 1.5, s * 0.4, s * 1.2, -s * 0.8, 0, 0);
                    ctx.fill();
                }

                ctx.restore();
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
