'use client';

import { useEffect, useState } from 'react';

export type WallpaperScene =
  | 'night-sky'
  | 'balcony-sunset'
  | 'moon-man'
  | 'city-illustration';

const WALLPAPER_IMAGES: Record<WallpaperScene, { path: string; name: string }> = {
  'night-sky': { path: '/Animewalpapers/anime-night-sky-illustration.jpg', name: 'Night Sky' },
  'balcony-sunset': { path: '/Animewalpapers/anime-boy-balcony-watching-sunset-city-illustration.jpg', name: 'Balcony Sunset' },
  'moon-man': { path: '/Animewalpapers/digital-art-moon-man-silhouette-wallpaper.jpg', name: 'Moon & Silhouette' },
  'city-illustration': { path: '/Animewalpapers/illustration-anime-city.jpg', name: 'Anime City' },
};

interface WallpaperBackgroundProps {
  scene: WallpaperScene;
}

export function WallpaperBackground({ scene = 'night-sky' }: WallpaperBackgroundProps) {
  const [isNight, setIsNight] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; size: number; opacity: number; left: number; top: number; drift: number; duration: number; delay: number }>>([]);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsNight(hour < 6 || hour >= 18);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Generate particles only on the client after mount to avoid SSR hydration mismatches
  useEffect(() => {
    const generated = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.2 + 0.05,
      left: Math.random() * 100,
      top: Math.random() * 100,
      drift: Math.random() * 100 - 50,
      duration: Math.random() * 15 + 15,
      delay: Math.random() * 5,
    }));
    setParticles(generated);
  }, []);

  // Ensure scene is valid and has a fallback
  const validScene = (WALLPAPER_IMAGES[scene as WallpaperScene] ? scene : 'night-sky') as WallpaperScene;
  const sceneConfig = WALLPAPER_IMAGES[validScene] || WALLPAPER_IMAGES['night-sky'];
  const imagePath = sceneConfig?.path || '/Animewalpapers/anime-night-sky-illustration.jpg';

  return (
    <div
      className={`fixed inset-0 transition-all duration-1000 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${
        isNight ? 'brightness-75' : 'brightness-100'
      }`}
      style={{
        backgroundImage: `url('${imagePath}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay for readability - lighter for better wallpaper visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/45" />

      {/* Additional subtle overlay */}
      <div
        className="absolute inset-0 mix-blend-multiply"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(100, 150, 200, 0.15) 0%, transparent 50%)',
        }}
      />

      {/* Floating particles effect - generated client-side for hydration safety */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: `rgba(255, 255, 255, ${p.opacity})`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animation: `float-particle ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              ['--drift' as any]: `${p.drift}px`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-300px) translateX(var(--drift, 0px));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
