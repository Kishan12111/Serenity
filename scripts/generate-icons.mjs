import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const svgContent = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf-8');

const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.ico', size: 32 },  // Will be saved as PNG first
];

async function generateIcons() {
  console.log('Generating icons from favicon.svg...\n');

  for (const { name, size } of sizes) {
    const outputPath = path.join(publicDir, name);
    
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(outputPath.replace('.ico', '.png'));
    
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  // Generate og-image.png (1200x630 social preview)
  const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#a855f7"/>
      <stop offset="100%" style="stop-color:#ec4899"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Stars decoration -->
  <circle cx="100" cy="80" r="3" fill="#fbbf24" opacity="0.8"/>
  <circle cx="200" cy="150" r="2" fill="#fbbf24" opacity="0.6"/>
  <circle cx="1050" cy="100" r="4" fill="#fbbf24" opacity="0.7"/>
  <circle cx="1100" cy="200" r="2" fill="#fbbf24" opacity="0.5"/>
  <circle cx="150" cy="500" r="2" fill="#fbbf24" opacity="0.6"/>
  <circle cx="1000" cy="550" r="3" fill="#fbbf24" opacity="0.7"/>
  
  <!-- Timer icon (centered left) -->
  <g transform="translate(250, 215)">
    <circle cx="100" cy="100" r="90" fill="none" stroke="url(#accent)" stroke-width="8" opacity="0.4"/>
    <circle cx="100" cy="100" r="90" fill="none" stroke="url(#accent)" stroke-width="8" 
            stroke-dasharray="226 283" stroke-linecap="round" transform="rotate(-90 100 100)"/>
    <line x1="100" y1="100" x2="100" y2="40" stroke="white" stroke-width="8" stroke-linecap="round"/>
    <line x1="100" y1="100" x2="140" y2="75" stroke="url(#accent)" stroke-width="6" stroke-linecap="round"/>
    <circle cx="100" cy="100" r="10" fill="url(#accent)"/>
  </g>
  
  <!-- Text -->
  <text x="500" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="bold" fill="white">Serinity</text>
  <text x="500" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#a855f7">Focus Companion</text>
  
  <text x="500" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)">Free Pomodoro Timer with Beautiful Stats</text>
  <text x="500" y="460" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="rgba(255,255,255,0.5)">Anime-inspired themes • Cloud sync • 100% Free</text>
  
  <!-- Domain -->
  <text x="600" y="580" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="rgba(255,255,255,0.4)" text-anchor="middle">serinityfocus.app</text>
</svg>
  `;

  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('✓ Generated og-image.png (1200x630)');

  // Generate twitter-image.png (same as og-image)
  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, 'twitter-image.png'));
  console.log('✓ Generated twitter-image.png (1200x630)');

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);
