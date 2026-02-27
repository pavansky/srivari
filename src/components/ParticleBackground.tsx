"use client";

import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    baseZ: number;
    baseSize: number;
    size: number;
    alpha: number;
    type: 'heart' | 'butterfly' | 'circle';
    rotation: number;
    rotationSpeed: number;
}

export default function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000, isOffScreen: true });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let time = 0;
        let sphereCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        const handlePointerMove = (e: MouseEvent | TouchEvent) => {
            let clientX, clientY;
            if ('touches' in e) {
                if (e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    return;
                }
            } else {
                clientX = (e as MouseEvent).clientX;
                clientY = (e as MouseEvent).clientY;
            }

            mouseRef.current = {
                x: clientX,
                y: clientY,
                isOffScreen: false
            };
        };

        const handlePointerLeave = () => {
            mouseRef.current.isOffScreen = true;
        };

        const initParticles = () => {
            // About 250 particles for a good dense sphere
            const particleCount = Math.min(window.innerWidth * 0.15, 250);
            particles = [];
            const types = ['heart', 'butterfly', 'circle'] as const;

            // Use Fibonacci sphere algorithm for even distribution
            const radius = Math.min(canvas.width, canvas.height) * 0.4;

            for (let i = 0; i < particleCount; i++) {
                const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
                const theta = Math.PI * (1 + Math.sqrt(5)) * i;

                const baseX = radius * Math.sin(phi) * Math.cos(theta);
                const baseY = radius * Math.sin(phi) * Math.sin(theta);
                const baseZ = radius * Math.cos(phi);

                const size = Math.random() * 3 + 1.5;
                particles.push({
                    // Start particles scattered or at center
                    x: canvas.width / 2 + (Math.random() - 0.5) * 200,
                    y: canvas.height / 2 + (Math.random() - 0.5) * 200,
                    baseX,
                    baseY,
                    baseZ,
                    baseSize: size,
                    size: size,
                    alpha: Math.random() * 0.5 + 0.3,
                    type: types[Math.floor(Math.random() * types.length)],
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.05
                });
            }
        };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Always reset to center on resize
            sphereCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            initParticles();
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Determine target center for the sphere
            // If mouse is off screen, drift back toward the center of the window
            const targetX = mouseRef.current.isOffScreen ? canvas.width / 2 : mouseRef.current.x;
            const targetY = mouseRef.current.isOffScreen ? canvas.height / 2 : mouseRef.current.y;

            // Ease the entire sphere towards the cursor
            sphereCenter.x += (targetX - sphereCenter.x) * 0.06;
            sphereCenter.y += (targetY - sphereCenter.y) * 0.06;

            // Calculate rotation based on time (constant spin) and cursor position (tilt)
            const rotationX = time * 0.4 + (targetY - canvas.height / 2) * 0.001;
            const rotationY = time * 0.4 + (targetX - canvas.width / 2) * 0.001;

            particles.forEach((p) => {
                // 1. Rotate the 3D coordinates
                // Rotate around X-axis
                const y1 = p.baseY * Math.cos(rotationX) - p.baseZ * Math.sin(rotationX);
                const z1 = p.baseY * Math.sin(rotationX) + p.baseZ * Math.cos(rotationX);

                // Rotate around Y-axis
                const x2 = p.baseX * Math.cos(rotationY) + z1 * Math.sin(rotationY);
                const z2 = -p.baseX * Math.sin(rotationY) + z1 * Math.cos(rotationY);

                // 2. Project to 2D
                // Add a perspective divide (objects further away appear smaller/move less)
                const depth = 600; // Perspective strength
                const scale = depth / (depth + z2);

                const targetPx = sphereCenter.x + x2 * scale;
                const targetPy = sphereCenter.y + y1 * scale;

                // 3. Ease particle towards its targeted spot (gives a fluid, trailing swarm feel)
                p.x += (targetPx - p.x) * 0.15;
                p.y += (targetPy - p.y) * 0.15;

                // 4. Update visuals based on depth
                p.size = Math.max(0.5, p.baseSize * scale);
                // Particles in the back of the sphere fade out
                p.alpha = Math.max(0.1, Math.min(0.8, (0.4 + scale * 0.5) - 0.2));

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

            time += 0.01; // Advance time for rotation
            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener("resize", resizeCanvas);
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("touchmove", handlePointerMove, { passive: true });
        window.addEventListener("pointerleave", handlePointerLeave);
        window.addEventListener("touchend", handlePointerLeave);

        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("touchmove", handlePointerMove);
            window.removeEventListener("pointerleave", handlePointerLeave);
            window.removeEventListener("touchend", handlePointerLeave);
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
