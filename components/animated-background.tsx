'use client';

import { useEffect, useState } from 'react';

export function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* Animated gradient orbs that follow mouse */}
      <div
        className="fixed w-96 h-96 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl pointer-events-none"
        style={{
          left: `${mousePosition.x - 192}px`,
          top: `${mousePosition.y - 192}px`,
          transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          opacity: 0.3,
        }}
      />

      <style>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(20px);
          }
        }

        @keyframes glow-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 40px rgba(168, 85, 247, 0.5));
          }
        }
      `}</style>
    </>
  );
}
