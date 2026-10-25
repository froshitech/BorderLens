const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function ensureDefaultTemplates(outputDir = 'D:\\photobooth_output') {
  const templatesDir = path.join(outputDir, 'templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  // Permanently remove legacy demo templates if present
  ['template_classic.png', 'template_floral.png', 'template_neon.png'].forEach(file => {
    try {
      const p = path.join(templatesDir, file);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (_) {}
  });

  return {
    templates: [],
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
