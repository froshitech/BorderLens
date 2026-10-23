const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function ensureDefaultTemplates(outputDir = 'D:\\photobooth_output') {
  const templatesDir = path.join(outputDir, 'templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  const classicPath = path.join(templatesDir, 'template_classic.png');
  const floralPath = path.join(templatesDir, 'template_floral.png');
  const neonPath = path.join(templatesDir, 'template_neon.png');

  if (!fs.existsSync(classicPath)) {
    const classicSvg = `
      <svg width="900" height="1900" viewBox="0 0 900 1900" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="900" height="1900" fill="none" stroke="#f1f5f9" stroke-width="28" />
        <rect x="0" y="0" width="900" height="75" fill="#09090b" />
        <text x="450" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">PHOTOBOOTH</text>
        <rect x="0" y="1815" width="900" height="85" fill="#09090b" />
        <text x="450" y="1868" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="3">MEMORIES &amp; SMILES</text>
      </svg>
    `;
    await sharp(Buffer.from(classicSvg)).png().toFile(classicPath);
  }

  if (!fs.existsSync(floralPath)) {
    const floralSvg = `
      <svg width="900" height="1900" viewBox="0 0 900 1900" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f59e0b" />
            <stop offset="50%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#d97706" />
          </linearGradient>
        </defs>
        <rect x="16" y="16" width="868" height="1868" fill="none" stroke="url(#gold)" stroke-width="16" rx="20" />
        <rect x="32" y="32" width="836" height="1836" fill="none" stroke="url(#gold)" stroke-width="2" stroke-dasharray="10 8" rx="14" />
        <rect x="180" y="1810" width="540" height="70" fill="#18181b" rx="35" stroke="url(#gold)" stroke-width="3" />
        <text x="450" y="1854" font-family="Georgia, serif" font-size="26" font-style="italic" font-weight="bold" fill="#fef3c7" text-anchor="middle" letter-spacing="4">Celebration &amp; Love</text>
      </svg>
    `;
    await sharp(Buffer.from(floralSvg)).png().toFile(floralPath);
  }

  if (!fs.existsSync(neonPath)) {
    const neonSvg = `
      <svg width="900" height="1900" viewBox="0 0 900 1900" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="neon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ec4899" />
            <stop offset="50%" stop-color="#a855f7" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>
        </defs>
        <rect x="18" y="18" width="864" height="1864" fill="none" stroke="url(#neon)" stroke-width="18" rx="28" />
        <rect x="150" y="1810" width="600" height="70" fill="#0f172a" rx="20" stroke="#ec4899" stroke-width="3" />
        <text x="450" y="1854" font-family="Arial, sans-serif" font-size="26" font-weight="900" fill="#38bdf8" text-anchor="middle" letter-spacing="5">VIP PARTY</text>
      </svg>
    `;
    await sharp(Buffer.from(neonSvg)).png().toFile(neonPath);
  }

  return {
    classicPath,
    floralPath,
    neonPath,
    templates: [
      { id: 'builtin_classic', name: 'Classic', overlayPngPath: classicPath, orientation: 'portrait' },
      { id: 'builtin_floral', name: 'Floral', overlayPngPath: floralPath, orientation: 'portrait' },
      { id: 'builtin_neon', name: 'Neon', overlayPngPath: neonPath, orientation: 'portrait' },
    ],
  };
}

async function getTemplateThumbnail(imagePath) {
  try {
    const buf = await sharp(imagePath)
      .resize({ width: 250, fit: 'inside', withoutEnlargement: false })
      .png()
      .toBuffer();
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch (err) {
    console.error('Failed to generate thumbnail for:', imagePath, err);
    return null;
  }
}

module.exports = {
  ensureDefaultTemplates,
  getTemplateThumbnail
};
