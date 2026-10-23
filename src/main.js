const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('node:path');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const http = require('http');
const express = require('express');
const os = require('os');
const fs = require('fs');
const sharp = require('sharp');
const GIFEncoder = require('gif-encoder-2');
const cloudinary = require('cloudinary').v2;
const { ensureDefaultTemplates } = require('./templates');

let OUTPUT_DIR = null;
let SETTINGS_FILE = null;
let CLOUD_CONFIG_FILE = null;
let CLOUD_SESSIONS_FILE = null;
let cloudConfig = { cloudName: '', apiKey: '', apiSecret: '', hasExplicitCredentials: false, hasUrl: false };
let cloudClientConfigured = false;
const PORT = 3001;
let DIGI_CAM_DIR = null;
const DIGI_WS_URL = 'http://localhost:5513/?slc=capture';
let DIGI_CMD = '';
let DIGI_REMOTE = '';
let mainWindow = null;
const HIGH_QUALITY_JPEG = { quality: 98, chromaSubsampling: '4:4:4' };
const HIGH_QUALITY_RESIZE = { kernel: sharp.kernel.lanczos3 };
const cleanCloudValue = value => String(value || '').trim().replace(/^['"]|['"]$/g, '');
function getCloudErrorDetails(err) {
  const errorMsg = err?.message || err?.error?.message || err?.error || (() => {
    try { return JSON.stringify(err); } catch { return String(err); }
  })();
  const httpCode = err?.http_code || err?.statusCode || err?.error?.http_code || err?.error?.statusCode;
  return {
    message: String(errorMsg || 'Unknown Cloudinary error'),
    httpCode: httpCode || null,
  };
}

function logCloudError(operation, err) {
  const details = getCloudErrorDetails(err);
  const suffix = details.httpCode ? ` (HTTP ${details.httpCode})` : '';
  console.error(`[cloud] ${operation} failed: ${details.message}${suffix}`, err);
  return details;
}

// ─── Express server ───────────────────────────────────────────────────────────
const server = express();

// CORS — allow any origin (phones on LAN, dev tools, etc.)
server.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── /share/:sessionId  — mobile download portal ──────────────────────────────
server.get('/share/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const ip = getLocalIPv4Address();
  const base = `http://${ip}:${PORT}`;

  // Collect files for this session
  let files;
  try { files = fs.readdirSync(OUTPUT_DIR); } catch { return res.status(500).send('Server error'); }

  const stripFile = `strip_${sessionId}.jpg`;
  const stripExists = fs.existsSync(path.join(OUTPUT_DIR, stripFile));
  const loopFile = `loop_${sessionId}.gif`;
  const loopExists = fs.existsSync(path.join(OUTPUT_DIR, loopFile));

  const rawFiles = files
    .filter(f => (f.startsWith('raw_dslr_') || f.startsWith('raw_webcam_')) && f.includes(sessionId) && f.endsWith('.jpg'))
    .sort();

  if (!stripExists && rawFiles.length === 0) return res.status(404).send('Session not found');

  const shotCards = rawFiles.map((f, i) => `
    <div class="card">
      <img src="${base}/photos/${f}" alt="Shot ${i + 1}" loading="lazy">
      <p class="label">Shot ${i + 1}</p>
      <a class="dl-btn secondary" href="${base}/download/${f}">⬇ Download</a>
    </div>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PhotoBooth Strip</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #F6F7FB; color: #181A20;
      min-height: 100vh; padding: 1.5rem 1rem 3rem;
    }
    header { text-align: center; padding: 1.5rem 0 2rem; }
    header h1 { font-size: 1.6rem; font-weight: 800;
      background: linear-gradient(135deg, #6C63FF, #9B8CFF);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    header p { color: #687082; font-size: 0.9rem; margin-top: 0.4rem; }
    .section { max-width: 480px; margin: 0 auto 2.5rem; }
    .section h2 { font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 1px; color: #687082; margin-bottom: 1rem; }
    .strip-wrap { border-radius: 16px; overflow: hidden;
      box-shadow: 0 12px 32px rgba(24,26,32,0.12); margin-bottom: 1rem; }
    .strip-wrap img { width: 100%; display: block; }
    .dl-btn {
      display: block; width: 100%; padding: 0.85rem; border-radius: 12px;
      text-align: center; font-weight: 700; font-size: 1rem;
      text-decoration: none; transition: opacity 0.15s;
    }
    .dl-btn:active { opacity: 0.8; }
    .dl-btn.primary {
      background: linear-gradient(135deg, #6C63FF, #574FEB);
      color: #fff; box-shadow: 0 6px 20px rgba(236,72,153,0.4);
    }
    .dl-btn.secondary {
      background: #EEF0F6; color: #181A20;
      border: 1px solid #E4E7F0;
      font-size: 0.85rem; padding: 0.6rem; margin-top: 0.5rem;
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; }
    .card { background: #FFFFFF; border-radius: 12px;
      overflow: hidden; border: 1px solid #E4E7F0; }
    .card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
    .card .label { font-size: 0.75rem; color: #687082;
      text-align: center; padding: 0.35rem 0; }
    footer { text-align: center; color: #334155; font-size: 0.75rem; margin-top: 3rem; }
  </style>
</head>
<body>
  <header>
    <h1>📸 Your PhotoBooth Strip</h1>
    <p>Tap a button to save your photos</p>
  </header>

  ${stripExists ? `
  <div class="section">
    <h2>Final Strip</h2>
    <div class="strip-wrap">
      <img src="${base}/photos/${stripFile}" alt="Final strip">
    </div>
    <a class="dl-btn primary" href="${base}/download/${stripFile}">⬇ Download Strip</a>
  </div>` : ''}

  ${loopExists ? `
  <div class="section">
    <h2>Boomerang</h2>
    <div class="strip-wrap">
      <img src="${base}/photos/${loopFile}" alt="Animated boomerang">
    </div>
    <a class="dl-btn primary" href="${base}/download/${loopFile}">⬇ Download Boomerang</a>
  </div>` : ''}

  ${rawFiles.length > 0 ? `
  <div class="section">
    <h2>Individual Shots (${rawFiles.length})</h2>
    <div class="grid">${shotCards}</div>
  </div>` : ''}

  <footer>Powered by PhotoBooth</footer>
</body>
</html>`;
  res.type('html').send(html);
});

// ── /download/:filename — force-download any output file ─────────────────────
server.get('/download/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(OUTPUT_DIR, safeName);
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  res.download(filePath, safeName);
});

function startServer() {
  server.use('/photos', (req, res, next) => express.static(OUTPUT_DIR)(req, res, next));
  server.listen(PORT, () => console.log(`Express listening on :${PORT}`));
}

function configurePaths() {
  const preferred = 'D:\\photobooth_output';
  SETTINGS_FILE = path.join(app.getPath('userData'), 'config.json');
  CLOUD_CONFIG_FILE = path.join(app.getPath('userData'), 'cloud-config.json');
  CLOUD_SESSIONS_FILE = path.join(app.getPath('userData'), 'cloud-sessions.json');
  loadCloudEnvironment();
  configureCloudinary();
  let saved = {};
  try { saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch {}
  const defaultOutput = fs.existsSync('D:\\') ? preferred : path.join(app.getPath('pictures'), 'PhotoBooth_Output');
  OUTPUT_DIR = saved.outputDir || defaultOutput;
  const candidates = [
    'D:\\Program Files\\digiCamControl',
    'C:\\Program Files (x86)\\digiCamControl',
    'C:\\Program Files\\digiCamControl',
  ];
  DIGI_CAM_DIR = candidates
    .map(dir => saved.digiCamControlPath === dir ? saved.digiCamControlPath : dir)
    .find(dir => fs.existsSync(path.join(dir, 'CameraControlCmd.exe'))
      && fs.existsSync(path.join(dir, 'CameraControlRemoteCmd.exe'))) || null;
  updateDigiCommands();
  try {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.accessSync(OUTPUT_DIR, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    console.warn('[settings] Output directory unavailable, using Pictures folder:', err.message);
    OUTPUT_DIR = path.join(app.getPath('pictures'), 'PhotoBooth_Output');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

}

function loadCloudEnvironment() {
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(app.getAppPath(), '.env'),
    path.resolve(path.dirname(process.execPath), '.env'),
    path.resolve(app.getPath('userData'), '.env'),
  ];
  const envPath = envPaths.find(candidate => fs.existsSync(candidate));
  if (envPath) {
    dotenv.config({ path: envPath, override: true });
    const env = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
    console.log('[cloud] Loaded .env from:', envPath);
    console.log('[cloud] Parsed .env keys:', Object.keys(env));
    cloudConfig = {
      cloudName: cleanCloudValue(env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME),
      apiKey: cleanCloudValue(env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY),
      apiSecret: cleanCloudValue(env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET),
      viewerUrl: cleanCloudValue(env.CLOUDINARY_VIEWER_URL || process.env.CLOUDINARY_VIEWER_URL),
      hasExplicitCredentials: Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET),
      hasUrl: Boolean(env.CLOUDINARY_URL || process.env.CLOUDINARY_URL),
    };
  } else {
    cloudConfig = {
      cloudName: cleanCloudValue(process.env.CLOUDINARY_CLOUD_NAME),
      apiKey: cleanCloudValue(process.env.CLOUDINARY_API_KEY),
      apiSecret: cleanCloudValue(process.env.CLOUDINARY_API_SECRET),
      viewerUrl: cleanCloudValue(process.env.CLOUDINARY_VIEWER_URL),
      hasExplicitCredentials: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
      hasUrl: Boolean(process.env.CLOUDINARY_URL),
    };
    console.warn('[cloud] no local .env file found');
  }
}

function configureCloudinary() {
  if (cloudConfig.hasUrl && !cloudConfig.hasExplicitCredentials) {
    cloudinary.config();
    cloudClientConfigured = true;
    return true;
  }
  if (!cloudConfig.cloudName || !cloudConfig.apiKey || !cloudConfig.apiSecret) {
    cloudClientConfigured = false;
    return false;
  }
  cloudinary.config({
    cloud_name: cloudConfig.cloudName,
    api_key: cloudConfig.apiKey,
    api_secret: cloudConfig.apiSecret,
    secure: true,
  });
  cloudClientConfigured = true;
  return true;
}

function getCloudSessions() {
  try { return JSON.parse(fs.readFileSync(CLOUD_SESSIONS_FILE, 'utf8')); } catch { return {}; }
}

function saveCloudSession(sessionId, cloudSession) {
  const sessions = getCloudSessions();
  sessions[sessionId] = { ...cloudSession, updatedAt: new Date().toISOString() };
  fs.writeFileSync(CLOUD_SESSIONS_FILE, JSON.stringify(sessions, null, 2), { mode: 0o600 });
}

function getCloudAttachmentUrl(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith('res.cloudinary.com') && parsed.pathname.includes('/upload/')) {
      parsed.pathname = parsed.pathname.replace('/upload/', '/upload/fl_attachment/');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function buildCloudViewerUrl({ stripUrl, rawUrls, boomerangUrl }) {
  if (!cloudConfig.viewerUrl) return getCloudAttachmentUrl(stripUrl);
  const separator = cloudConfig.viewerUrl.includes('?') ? '&' : '?';
  return `${cloudConfig.viewerUrl}${separator}strip=${encodeURIComponent(stripUrl)}&raws=${encodeURIComponent(JSON.stringify(rawUrls))}&gif=${encodeURIComponent(boomerangUrl || '')}`;
}

function hasCloudAssetCache(session) {
  return Boolean(
    session?.stripUrl &&
    Array.isArray(session.rawUrls) &&
    Object.prototype.hasOwnProperty.call(session, 'boomerangUrl')
  );
}

function getCloudinaryClient() {
  if (!cloudClientConfigured && !configureCloudinary()) throw new Error('Cloudinary is not configured. Add CLOUDINARY_* values to the local .env file.');
  return cloudinary;
}

async function cleanupExpiredCloudSessions() {
  try {
    const client = getCloudinaryClient();
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const result = await client.search
      .expression(`tags=photobooth_session AND created_at<${cutoffDate}`)
      .max_results(100)
      .execute();
    const resources = result.resources || [];
    const byType = resources.reduce((groups, resource) => {
      const type = resource.resource_type || 'image';
      if (!groups[type]) groups[type] = [];
      groups[type].push(resource.public_id);
      return groups;
    }, {});
    for (const [resourceType, publicIds] of Object.entries(byType)) {
      if (resourceType === 'image' || resourceType === 'video') {
        await client.api.delete_resources(publicIds, { resource_type: resourceType });
      }
    }
    return { deleted: resources.length };
  } catch (err) {
    const details = logCloudError('expired-session cleanup', err);
    throw Object.assign(new Error(details.message), { httpCode: details.httpCode });
  }
}

async function uploadCloudResource(filePath, sessionId) {
  if (!fs.existsSync(filePath)) throw new Error(`Cloud upload file not found: ${filePath}`);
  const safeSessionId = String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safePublicId = path.basename(filePath, path.extname(filePath))
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    return await getCloudinaryClient().uploader.upload(filePath, {
    folder: `photobooth/${safeSessionId}`,
    public_id: safePublicId,
    resource_type: 'auto',
    tags: ['photobooth_session', safeSessionId],
    overwrite: true,
    invalidate: true,
    });
  } catch (err) {
    const details = logCloudError('Cloudinary upload', err);
    throw Object.assign(new Error(details.message), { httpCode: details.httpCode });
  }
}

function saveSettings() {
  try {
    let existing = {};
    try { existing = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch {}
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
      ...existing,
      outputDir: OUTPUT_DIR,
      digiCamControlPath: DIGI_CAM_DIR,
    }, null, 2));
  } catch (err) {
    console.warn('[settings] Could not save settings:', err.message);
  }
}

function updateDigiCommands() {
  DIGI_CMD = DIGI_CAM_DIR ? `"${path.join(DIGI_CAM_DIR, 'CameraControlCmd.exe')}"` : '';
  DIGI_REMOTE = DIGI_CAM_DIR ? `"${path.join(DIGI_CAM_DIR, 'CameraControlRemoteCmd.exe')}"` : '';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getLocalIPv4Address() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

// Generates URLs for a given filename
function urls(filename) {
  const ip = getLocalIPv4Address();
  // timestamp is the part after 'strip_' and before '.jpg'
  const ts = filename.replace(/^strip_/, '').replace(/\.jpg$/, '');
  return {
    photoUrl:  `http://localhost:${PORT}/photos/${filename}`,
    httpUrl:   `http://${ip}:${PORT}/photos/${filename}`,
    shareUrl:  `http://${ip}:${PORT}/share/${ts}`,
    thumbUrl:  `http://localhost:${PORT}/photos/thumb_${ts}.jpg`,
  };
}

// Apply a filter to a sharp pipeline before .toBuffer()
function applyFilter(pipeline, filterType) {
  switch (filterType) {
    case 'bw':
      return pipeline.grayscale().linear(1.18, -15);
    case 'bright':
      return pipeline.modulate({ brightness: 1.12, saturation: 1.05 });
    case 'vintage':
      return pipeline
        .modulate({ brightness: 1.03, saturation: 0.85 })
        .tint({ r: 255, g: 240, b: 215 });
    default:
      return pipeline;
  }
}

// ─── Detect transparent photo slots in a template PNG ────────────────────────
// Scans the alpha channel at a reduced resolution, finds connected rectangular
// blocks of fully-transparent pixels, and returns native image coordinates.
async function detectPhotoSlots(templatePath, fullW, fullH, orientation = 'portrait') {
  const SCALE = Math.min(1, 600 / Math.max(fullW, fullH));
  const sw = Math.round(fullW * SCALE);
  const sh = Math.round(fullH * SCALE);
  const { data } = await sharp(templatePath)
    .resize(sw, sh, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const alphaAt = (x, y) => data[(y * sw + x) * 4 + 3];
 
  const isTransparent = (x, y) => alphaAt(x, y) < 128;
 
  const isOpaque = (x, y) => alphaAt(x, y) > 250;

  const visited = new Uint8Array(sw * sh);
  const components = [];
  const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const minWidth = Math.max(4, sw * 0.05);
  const minHeight = Math.max(4, sh * 0.05);

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const start = y * sw + x;
      if (visited[start] || !isTransparent(x, y)) continue;
      visited[start] = 1;
      const queue = [start];
      let head = 0;
      let minX = x, maxX = x, minY = y, maxY = y, area = 0;
      while (head < queue.length) {
        const index = queue[head++];
        const currentX = index % sw;
        const currentY = Math.floor(index / sw);
        area++;
        minX = Math.min(minX, currentX); maxX = Math.max(maxX, currentX);
        minY = Math.min(minY, currentY); maxY = Math.max(maxY, currentY);
        for (const [dx, dy] of neighbors) {
          const nextX = currentX + dx;
          const nextY = currentY + dy;
          if (nextX < 0 || nextX >= sw || nextY < 0 || nextY >= sh) continue;
          const next = nextY * sw + nextX;
          if (!visited[next] && isTransparent(nextX, nextY)) {
            visited[next] = 1;
            queue.push(next);
          }
        }
      }

      
      const touchesEdge = minX === 0 || minY === 0 || maxX === sw - 1 || maxY === sh - 1;

      
      const rowHasGap = ry => { for (let xi = minX; xi <= maxX; xi++) if (!isOpaque(xi, ry)) return true; return false; };
      const colHasGap = cx => { for (let yi = minY; yi <= maxY; yi++) if (!isOpaque(cx, yi)) return true; return false; };
      let changed = true;
      while (changed) {
        changed = false;
        if (minX > 0 && colHasGap(minX - 1)) { minX--; changed = true; }
        if (maxX < sw - 1 && colHasGap(maxX + 1)) { maxX++; changed = true; }
        if (minY > 0 && rowHasGap(minY - 1)) { minY--; changed = true; }
        if (maxY < sh - 1 && rowHasGap(maxY + 1)) { maxY++; changed = true; }
      }

      const componentWidth = maxX - minX + 1;
      const componentHeight = maxY - minY + 1;
     
      const density = area / (componentWidth * componentHeight);
      if (!touchesEdge && componentWidth >= minWidth && componentHeight >= minHeight && density >= 0.5) {
       

        const x0 = Math.max(0, Math.round(minX / SCALE));
        const y0 = Math.max(0, Math.round(minY / SCALE));
        const x1 = Math.min(fullW, Math.round((maxX + 1) / SCALE));
        const y1 = Math.min(fullH, Math.round((maxY + 1) / SCALE));
        components.push({ x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) });
      }
    }
  }
  return components.sort((a, b) => a.y - b.y || a.x - b.x);
}

async function resizePhotoToSlot(photoPath, slot, filterType, fitMode = 'cover') {
  const width = Math.max(1, Math.round(Number(slot.width ?? slot.w) || 1));
  const height = Math.max(1, Math.round(Number(slot.height ?? slot.h) || 1));
  return applyFilter(
    sharp(photoPath).resize(width, height, {
      fit: 'cover',
      position: 'centre',
      ...HIGH_QUALITY_RESIZE,
    }),
    filterType
  ).toBuffer();
}

function getAbsoluteSlotPosition(slot) {
  return {
    left: Math.max(0, Math.round(Number(slot.x) || 0)),
    top: Math.max(0, Math.round(Number(slot.y) || 0)),
  };
}

async function processPortraitStrip(rawFilepaths, templatePath, outWidth, outHeight, filterType, customSlots = null, fitMode = 'cover') {
  const n = rawFilepaths.length;
  const detectedSlots = templatePath
    ? await detectPhotoSlots(templatePath, outWidth, outHeight, 'portrait')
    : [];
  let slots = Array.isArray(customSlots) && customSlots.length ? customSlots : detectedSlots;

  if (slots.length === 1 && n > 1) {
    const base = slots[0];
    const gap = 8;
    const slotH = Math.floor((base.h - gap * (n - 1)) / n);
    slots = Array.from({ length: n }, (_, i) => ({
      x: base.x, y: base.y + i * (slotH + gap), w: base.w, h: slotH,
    }));
  }

  if (slots.length === 0) {
    const gap = 16;
    const slotH = Math.floor((outHeight - gap * (n - 1)) / n);
    slots = Array.from({ length: n }, (_, i) => ({
      x: 0, y: i * (slotH + gap), w: outWidth, h: slotH,
    }));
  }

  return Promise.all(rawFilepaths.map(async (filePath, i) => {
    const slot = slots[i % slots.length];
    return { input: await resizePhotoToSlot(filePath, slot, filterType, fitMode), ...getAbsoluteSlotPosition(slot) };
  }));
}

function getLandscapeGridSlots(width, height, count) {
  const gap = Math.max(8, Math.round(Math.min(width, height) * 0.012));
  const inset = gap;
  const usableWidth = width - inset * 2;
  const usableHeight = height - inset * 2;
  const halfWidth = Math.floor((usableWidth - gap) / 2);
  const halfHeight = Math.floor((usableHeight - gap) / 2);

  if (count <= 1) return [{ x: inset, y: inset, w: usableWidth, h: usableHeight }];
  if (count === 2) return [
    { x: inset, y: inset, w: halfWidth, h: usableHeight },
    { x: inset + halfWidth + gap, y: inset, w: halfWidth, h: usableHeight },
  ];
  if (count === 3) {
    const primaryWidth = Math.floor((usableWidth - gap) / 2);
    const primaryHeight = Math.floor((usableHeight - gap) / 2);
    return [
      { x: inset, y: inset, w: primaryWidth, h: primaryHeight },
      { x: inset, y: inset + primaryHeight + gap, w: primaryWidth, h: primaryHeight },
      { x: inset + primaryWidth + gap, y: inset + primaryHeight + gap, w: primaryWidth, h: primaryHeight },
    ];
  }
  return Array.from({ length: count }, (_, index) => ({
    x: inset + (index % 2) * (halfWidth + gap),
    y: inset + Math.floor(index / 2) * (halfHeight + gap),
    w: halfWidth,
    h: halfHeight,
  }));
}

async function processLandscapeGrid(rawFilepaths, templatePath, outWidth, outHeight, filterType, customSlots = null, fitMode = 'cover') {
  // Landscape artwork can contain transparent regions that touch or overlap
  // after downsampling. Treating those regions as detected slots can create
  // oversized boxes and slice photos across neighboring grid cells. Use the
  // deterministic shot-count layout for compositing instead.
  const slots = Array.isArray(customSlots) && customSlots.length
    ? customSlots
    : getLandscapeGridSlots(outWidth, outHeight, rawFilepaths.length);
  return Promise.all(rawFilepaths.map(async (filePath, index) => {
    const slot = slots[index];
    return { input: await resizePhotoToSlot(filePath, slot, filterType, fitMode), ...getAbsoluteSlotPosition(slot) };
  }));
}

// ─── Fast DSLR trigger ────────────────────────────────────────────────────────
// 1. Try digiCamControl's built-in webserver (instant — no cold start)
// 2. Try CameraControlRemoteCmd.exe (talks to running instance)
// 3. Fall back to CameraControlCmd.exe (spawns full process, ~2-3 s)
function triggerDslrCapture(rawFilepath) {
  return new Promise((resolve, reject) => {
    if (!DIGI_CAM_DIR) {
      return reject(new Error('digiCamControl was not found. Choose its installation folder in Operator Settings before using DSLR mode.'));
    }
    // Attempt 1: webserver GET
    const req = http.get(DIGI_WS_URL, (res) => {
      res.resume(); // drain
      if (res.statusCode < 400) {
        console.log('[DSLR] Triggered via webserver');
        // Give digiCamControl a moment to write the file then verify
        waitForFile(rawFilepath, resolve, reject);
      } else {
        tryRemoteCmd();
      }
    });
    req.setTimeout(1500, () => { req.destroy(); tryRemoteCmd(); });
    req.on('error', tryRemoteCmd);

    // Attempt 2: RemoteCmd
    function tryRemoteCmd() {
      console.warn('[DSLR] Webserver unreachable, trying RemoteCmd…');
      const cmd = `${DIGI_REMOTE} /c capture /filename "${rawFilepath}"`;
      exec(cmd, { timeout: 8000 }, (err) => {
        if (!err && fs.existsSync(rawFilepath)) {
          console.log('[DSLR] Triggered via RemoteCmd');
          return resolve(rawFilepath);
        }
        tryFullCmd();
      });
    }

    // Attempt 3: full CameraControlCmd
    function tryFullCmd() {
      console.warn('[DSLR] RemoteCmd failed, falling back to CameraControlCmd…');
      const cmd = `${DIGI_CMD} /capture /filename "${rawFilepath}"`;
      exec(cmd, { timeout: 20000 }, (err) => {
        if (err) return reject(new Error('DSLR capture failed: ' + err.message));
        resolve(rawFilepath);
      });
    }
  });
}

// Poll for a file to appear (for webserver trigger which is fire-and-forget)
function waitForFile(filePath, resolve, reject, tries = 0) {
  if (fs.existsSync(filePath)) return resolve(filePath);
  if (tries > 30) return reject(new Error('DSLR: file never appeared after capture'));
  setTimeout(() => waitForFile(filePath, resolve, reject, tries + 1), 200);
}

// ─── Electron boilerplate ─────────────────────────────────────────────────────
if (require('electron-squirrel-startup')) app.quit();

const createWindow = () => {
  mainWindow = new BrowserWindow({
    title: 'PhotoBooth Studio',
    width: 1280,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Allow the renderer to load images from localhost Express server
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http://localhost:3001 https:;"
        ],
      },
    });
  });

  mainWindow.maximize();
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  // mainWindow.webContents.openDevTools(); // uncomment for debugging
};

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
// Backfill thumbnails for any strip that doesn't have one yet
async function backfillThumbnails() {
  if (!fs.existsSync(OUTPUT_DIR)) return;
  const files = fs.readdirSync(OUTPUT_DIR);
  const strips = files.filter(f => /^strip_.*\.jpg$/.test(f));
  for (const stripFile of strips) {
    const ts        = stripFile.replace(/^strip_/, '').replace(/\.jpg$/, '');
    const thumbFile = `thumb_${ts}.jpg`;
    const thumbPath = path.join(OUTPUT_DIR, thumbFile);
    if (!fs.existsSync(thumbPath)) {
      try {
        await sharp(path.join(OUTPUT_DIR, stripFile))
          .resize(300, null, HIGH_QUALITY_RESIZE)
          .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
          .toFile(thumbPath);
        console.log('[thumb] generated', thumbFile);
      } catch (e) {
        console.warn('[thumb] failed for', stripFile, e.message);
      }
    }
  }
}

app.whenReady().then(async () => {
  configurePaths();
  const builtinTemplates = await ensureDefaultTemplates(OUTPUT_DIR);
  startServer();
  await backfillThumbnails();
  if (cloudClientConfigured) {
    cleanupExpiredCloudSessions().catch(error => { logCloudError('startup cleanup', error); });
  }

  ipcMain.handle('get-builtin-templates', () => builtinTemplates.templates);
  ipcMain.handle('get-settings', () => ({
    outputDir: OUTPUT_DIR,
    digiCamControlPath: DIGI_CAM_DIR,
    digiCamControlAvailable: Boolean(DIGI_CAM_DIR),
  }));

  ipcMain.handle('get-cloud-status', async () => {
    if (!cloudClientConfigured) return { configured: false, online: false, reason: 'Missing local .env credentials.' };
    try {
      await cloudinary.api.ping();
      await cleanupExpiredCloudSessions();
      return { configured: true, online: true };
    } catch (err) {
      const details = logCloudError('status check', err);
      return { configured: true, online: false, reason: details.message, httpCode: details.httpCode };
    }
  });

  ipcMain.handle('test-and-cleanup-cloud', async () => {
    if (!cloudClientConfigured) return { configured: false, online: false, reason: 'Missing local .env credentials.' };
    try {
      await cloudinary.api.ping();
      const cleanup = await cleanupExpiredCloudSessions();
      return { configured: true, online: true, deleted: cleanup.deleted };
    } catch (err) {
      const details = logCloudError('test and cleanup', err);
      return { configured: true, online: false, reason: details.message, httpCode: details.httpCode };
    }
  });

  ipcMain.handle('upload-session-cloud', async (event, sessionId) => {
    if (typeof sessionId !== 'string' || !sessionId.trim() || path.basename(sessionId) !== sessionId) {
      throw new Error('Invalid session ID.');
    }
    const cachedSession = getCloudSessions()[sessionId];
    if (hasCloudAssetCache(cachedSession)) {
      const cloudShareUrl = buildCloudViewerUrl(cachedSession);
      if (cachedSession.cloudShareUrl !== cloudShareUrl) {
        saveCloudSession(sessionId, { ...cachedSession, cloudShareUrl });
      }
      return { ...cachedSession, cached: true };
    }

    const files = fs.readdirSync(OUTPUT_DIR);
    const stripFile = `strip_${sessionId}.jpg`;
    const stripPath = path.join(OUTPUT_DIR, stripFile);
    if (!fs.existsSync(stripPath)) throw new Error('Final strip not found for this session.');
    const rawFiles = files
      .filter(file => /^raw_(dslr|webcam)_/.test(file) && file.includes(sessionId) && file.endsWith('.jpg'))
      .sort();
    const loopFile = `loop_${sessionId}.gif`;
    const uploadResult = await uploadCloudResource(stripPath, sessionId);
    const additionalFiles = [...rawFiles, ...(fs.existsSync(path.join(OUTPUT_DIR, loopFile)) ? [loopFile] : [])];
    const secondaryResults = await Promise.allSettled(
      additionalFiles.map(file => uploadCloudResource(path.join(OUTPUT_DIR, file), sessionId))
    );
    const rawUrls = secondaryResults
      .slice(0, rawFiles.length)
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value.secure_url);
    const loopResult = secondaryResults[rawFiles.length];
    const loopUrl = loopResult?.status === 'fulfilled' ? loopResult.value.secure_url : null;
    secondaryResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        const details = logCloudError(`optional upload ${additionalFiles[index]}`, result.reason);
        console.warn(`[cloud] Optional upload skipped for ${additionalFiles[index]}: ${details.message}`);
      }
    });
    const stripUrl = uploadResult.secure_url;
    const boomerangUrl = loopUrl;
    const cloudShareUrl = buildCloudViewerUrl({ stripUrl, rawUrls, boomerangUrl });
    const cloudSession = { cloudShareUrl, stripUrl, rawUrls, boomerangUrl };
    saveCloudSession(sessionId, cloudSession);
    cleanupExpiredCloudSessions().catch(error => { logCloudError('post-upload cleanup', error); });
    return { ...cloudSession, loopUrl: boomerangUrl, cached: false };
  });

  ipcMain.handle('get-system-printers', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return [];
    return mainWindow.webContents.getPrintersAsync();
  });

  ipcMain.handle('get-saved-printer', () => {
    let config = {};
    try { config = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch {}
    return config.printerName || null;
  });

  ipcMain.handle('save-printer-selection', (event, printerName) => {
    if (printerName !== null && typeof printerName !== 'string') {
      throw new Error('Invalid printer selection.');
    }
    let config = {};
    try { config = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch {}
    config.outputDir = OUTPUT_DIR;
    config.digiCamControlPath = DIGI_CAM_DIR;
    config.printerName = printerName || null;
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(config, null, 2));
    return config.printerName;
  });

  ipcMain.handle('select-output-folder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose PhotoBooth output directory',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    OUTPUT_DIR = result.filePaths[0];
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    saveSettings();
    return OUTPUT_DIR;
  });

  ipcMain.handle('open-output-folder', async () => {
    const error = await shell.openPath(OUTPUT_DIR);
    if (error) throw new Error(error);
    return OUTPUT_DIR;
  });

  ipcMain.handle('pick-digicamcontrol-directory', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose digiCamControl directory',
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const dir = result.filePaths[0];
    if (!fs.existsSync(path.join(dir, 'CameraControlCmd.exe'))
      || !fs.existsSync(path.join(dir, 'CameraControlRemoteCmd.exe'))) {
      throw new Error('Selected directory must contain both CameraControlCmd.exe and CameraControlRemoteCmd.exe.');
    }
    DIGI_CAM_DIR = dir;
    updateDigiCommands();
    saveSettings();
    return DIGI_CAM_DIR;
  });

  // ── capture-dslr: fast single raw shot ─────────────────────────────────────
  ipcMain.handle('capture-dslr', async (event, sessionTs, shotIdx) => {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const rawFilepath = path.join(OUTPUT_DIR, `raw_dslr_${sessionTs}_${shotIdx}.jpg`);
    await triggerDslrCapture(rawFilepath);
    return rawFilepath;
  });

  // ── capture-webcam: save base64 frame ──────────────────────────────────────
  ipcMain.handle('capture-webcam', async (event, base64Data, sessionTs, shotIdx) => {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const rawFilepath = path.join(OUTPUT_DIR, `raw_webcam_${sessionTs}_${shotIdx}.jpg`);
    fs.writeFileSync(rawFilepath, base64Data.split(';base64,').pop(), { encoding: 'base64' });
    return rawFilepath;
  });

  // ── capture-single-shot: retake one specific index ──────────────────────────
  // Used by the Review step to replace a single frame without re-capturing all
  ipcMain.handle('capture-single-shot', async (event, mode, base64OrNull, sessionTs, shotIdx) => {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    if (mode === 'webcam') {
      const rawFilepath = path.join(OUTPUT_DIR, `raw_webcam_${sessionTs}_${shotIdx}.jpg`);
      fs.writeFileSync(rawFilepath, base64OrNull.split(';base64,').pop(), { encoding: 'base64' });
      return rawFilepath;
    } else {
      const rawFilepath = path.join(OUTPUT_DIR, `raw_dslr_${sessionTs}_${shotIdx}.jpg`);
      await triggerDslrCapture(rawFilepath);
      return rawFilepath;
    }
  });

  // ── get-template-info: returns actual pixel dimensions + detected photo slots ──
  ipcMain.handle('get-template-info', async (event, templatePath) => {
    if (!templatePath || !fs.existsSync(templatePath)) return null;
    try {
      const meta = await sharp(templatePath).metadata();
      const orientation = meta.width > meta.height ? 'landscape' : 'portrait';
      const slots = await detectPhotoSlots(templatePath, meta.width, meta.height, orientation);
      return { width: meta.width, height: meta.height, orientation, slots };
    } catch {
      return null;
    }
  });

  ipcMain.handle('detect-template-slots', async (event, templatePath) => {
    if (!templatePath || !fs.existsSync(templatePath)) {
      throw new Error('Template file was not found.');
    }
    const meta = await sharp(templatePath).metadata();
    if (!meta.width || !meta.height) throw new Error('Template dimensions are unavailable.');
    const slots = await detectPhotoSlots(
      templatePath,
      meta.width,
      meta.height,
      meta.width > meta.height ? 'landscape' : 'portrait'
    );
    return slots.map(slot => ({
      x: slot.x,
      y: slot.y,
      width: slot.w,
      height: slot.h,
    }));
  });

  // ── process-strip: composite + thumbnail ────────────────────────────────────
  ipcMain.handle('process-strip', async (event, rawFilepaths, templatePath, filterType = 'normal', orientation = null, customSlots = null, fitMode = 'cover') => {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const finalFilename = `strip_${ts}.jpg`;
    const thumbFilename = `thumb_${ts}.jpg`;
    const finalFilepath = path.join(OUTPUT_DIR, finalFilename);
    const thumbFilepath = path.join(OUTPUT_DIR, thumbFilename);

    const hasTemplate = templatePath && fs.existsSync(templatePath);
    let outWidth, outHeight;

    // ── Step 1: Determine canvas size ─────────────────────────────────────────
    if (hasTemplate) {
      const meta = await sharp(templatePath).metadata();
      outWidth  = meta.width;
      outHeight = meta.height;
      orientation = orientation || (outWidth > outHeight ? 'landscape' : 'portrait');
    } else if (rawFilepaths.length === 1) {
      outWidth = 1920; outHeight = 1080;
    } else {
      const STRIP_W = 900, SHOT_H = 600, GAP = 16;
      outWidth  = STRIP_W;
      outHeight = SHOT_H * rawFilepaths.length + GAP * (rawFilepaths.length - 1);
    }

    const n = rawFilepaths.length;
    // Landscape templates use an explicit grid so alpha-channel row artifacts
    // can never turn a photo into thin horizontal bands.
    let compositeInputs;
    if (orientation === 'landscape' && hasTemplate) {
      compositeInputs = await processLandscapeGrid(rawFilepaths, templatePath, outWidth, outHeight, filterType, customSlots, fitMode);
    } else if (hasTemplate || orientation === 'portrait') {
      compositeInputs = await processPortraitStrip(rawFilepaths, templatePath, outWidth, outHeight, filterType, customSlots, fitMode);
    } else if (n === 1) {
      const buf = await resizePhotoToSlot(rawFilepaths[0], { x: 0, y: 0, w: outWidth, h: outHeight }, filterType);
      compositeInputs = [{ input: buf, top: 0, left: 0 }];
    } else {
      compositeInputs = await processPortraitStrip(rawFilepaths, null, outWidth, outHeight, filterType);
    }

    // ── Step 4: Composite template on top ─────────────────────────────────────
    const layers = hasTemplate
      ? [
        ...compositeInputs,
        { input: await sharp(templatePath).toBuffer(), top: 0, left: 0 },
      ]
      : compositeInputs;

    // ── Step 5: Write final strip ─────────────────────────────────────────────
    await sharp({
      create: { width: outWidth, height: outHeight, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } }
    })
      .composite(layers)
      .jpeg(HIGH_QUALITY_JPEG)
      .toFile(finalFilepath);

    // ── Step 6: Write thumbnail ───────────────────────────────────────────────
    await sharp(finalFilepath)
      .resize(300, null, HIGH_QUALITY_RESIZE)
      .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
      .toFile(thumbFilepath);

    const u = urls(finalFilename);
    let loopUrl = null;
    if (n >= 2) {
      const loopFilename = `loop_${ts}.gif`;
      const loopFilepath = path.join(OUTPUT_DIR, loopFilename);
      const frameWidth = 480;
      const frameHeight = 360;
      const frameBuffers = await Promise.all(rawFilepaths.map(filePath =>
        applyFilter(
          sharp(filePath).resize(frameWidth, frameHeight, {
            fit: 'cover',
            position: 'entropy',
            ...HIGH_QUALITY_RESIZE,
          }),
          filterType
        ).ensureAlpha().raw().toBuffer()
      ));
      const encoder = new GIFEncoder(frameWidth, frameHeight, 'neuquant', false, n);
      encoder.setRepeat(0);
      encoder.setDelay(700);
      encoder.start();
      frameBuffers.forEach(frame => encoder.addFrame(frame));
      encoder.finish();
      fs.writeFileSync(loopFilepath, encoder.out.getData());
      loopUrl = `http://localhost:${PORT}/photos/${loopFilename}`;
    }
    return {
      filename: finalFilename,
      thumbUrl: u.thumbUrl,
      photoUrl: u.photoUrl,
      shareUrl: u.shareUrl,
      loopUrl,
    };
  });

  // ── list-sessions ───────────────────────────────────────────────────────────
  ipcMain.handle('list-sessions', async () => {
    if (!fs.existsSync(OUTPUT_DIR)) return [];
    const files = fs.readdirSync(OUTPUT_DIR);
    const stripFiles = files.filter(f => /^strip_.*\.jpg$/.test(f));

    // All raw files with their mtime for proximity matching
    const allRaws = files
      .filter(f => /^raw_(dslr|webcam)_/.test(f) && f.endsWith('.jpg'))
      .map(f => {
        const stat = fs.statSync(path.join(OUTPUT_DIR, f));
        return { filename: f, mtime: stat.mtime.getTime() };
      });

    return stripFiles.map(stripFile => {
      const ts        = stripFile.replace(/^strip_/, '').replace(/\.jpg$/, '');
      const stripStat = fs.statSync(path.join(OUTPUT_DIR, stripFile));
      const stripTime = stripStat.mtime.getTime();

      // Strategy 1: new naming — raw file contains the session timestamp
      let rawFiles = allRaws.filter(r => r.filename.includes(ts));

      // Strategy 2: old naming (no _index suffix) — match raws created within
      // 60 seconds before the strip was written
      if (rawFiles.length === 0) {
        rawFiles = allRaws.filter(r =>
          r.mtime <= stripTime && r.mtime >= stripTime - 60_000
        );
      }

      const ip        = getLocalIPv4Address();
      const thumbFile = `thumb_${ts}.jpg`;
      const thumbExists = fs.existsSync(path.join(OUTPUT_DIR, thumbFile));
      const loopFile = `loop_${ts}.gif`;
      const loopExists = fs.existsSync(path.join(OUTPUT_DIR, loopFile));

      return {
        id:            ts,
        date:          stripStat.mtime.toISOString(),
        stripFilename: stripFile,
        thumbUrl:      thumbExists
                         ? `http://localhost:${PORT}/photos/${thumbFile}`
                         : `http://localhost:${PORT}/photos/${stripFile}`,
        stripUrl:      `http://localhost:${PORT}/photos/${stripFile}`,
        loopUrl:       loopExists ? `http://localhost:${PORT}/photos/${loopFile}` : null,
        shareUrl:      `http://${ip}:${PORT}/share/${ts}`,
        cloudShareUrl: getCloudSessions()[ts]?.cloudShareUrl || null,
        cloudAssets: getCloudSessions()[ts] && hasCloudAssetCache(getCloudSessions()[ts])
          ? {
            stripUrl: getCloudSessions()[ts].stripUrl,
            rawUrls: getCloudSessions()[ts].rawUrls,
            boomerangUrl: getCloudSessions()[ts].boomerangUrl,
          }
          : null,
        rawShots: rawFiles.sort((a, b) => a.mtime - b.mtime).map(r => ({
          filename: r.filename,
          url: `http://localhost:${PORT}/photos/${r.filename}`,
        })),
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  ipcMain.handle('delete-session', async (event, sessionId) => {
    if (typeof sessionId !== 'string' || !sessionId || sessionId !== path.basename(sessionId)) {
      throw new Error('Invalid session ID.');
    }

    const files = fs.readdirSync(OUTPUT_DIR);
    const deletedFiles = [];
    const matchingFiles = new Set(files.filter(filename => filename.includes(sessionId)));
    const stripFilename = `strip_${sessionId}.jpg`;
    const stripPath = path.join(OUTPUT_DIR, stripFilename);
    if (fs.existsSync(stripPath)) {
      const stripTime = fs.statSync(stripPath).mtimeMs;
      for (const filename of files) {
        if (!/^raw_(dslr|webcam)_/.test(filename) || !filename.endsWith('.jpg')) continue;
        const filePath = path.join(OUTPUT_DIR, filename);
        const mtime = fs.statSync(filePath).mtimeMs;
        if (mtime <= stripTime && mtime >= stripTime - 60_000) matchingFiles.add(filename);
      }
    }

    for (const filename of matchingFiles) {
      const filePath = path.join(OUTPUT_DIR, filename);
      if (!fs.statSync(filePath).isFile()) continue;
      fs.unlinkSync(filePath);
      deletedFiles.push(filename);
    }
    return { deletedFiles };
  });

  // ── get-file-as-dataurl (kept for lightbox fallback) ────────────────────────
  ipcMain.handle('get-file-as-dataurl', async (event, filename) => {
    const safeName = path.basename(filename);
    const filePath = path.join(OUTPUT_DIR, safeName);
    if (!fs.existsSync(filePath)) throw new Error('File not found: ' + safeName);
    const buf = fs.readFileSync(filePath);
    const mime = safeName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  });

  // ── get-template-thumbnail: serve any PNG as base64 for template card previews ─
  // Accepts either an absolute path or a bare filename in OUTPUT_DIR / templates subdir
  ipcMain.handle('get-template-thumbnail', async (event, filePath) => {
    // Resolve: if it's an absolute path use it directly, otherwise check output dir
    let resolved = filePath;
    if (!path.isAbsolute(filePath)) {
      const candidate = path.join(OUTPUT_DIR, filePath);
      resolved = fs.existsSync(candidate) ? candidate : path.join(OUTPUT_DIR, 'templates', filePath);
    }
    if (!fs.existsSync(resolved)) return null;
    try {
      const buf = await sharp(resolved)
        .resize(300, null, { withoutEnlargement: true, ...HIGH_QUALITY_RESIZE })
        .png()
        .toBuffer();
      return `data:image/png;base64,${buf.toString('base64')}`;
    } catch { return null; }
  });

  // ── pick-template-file ──────────────────────────────────────────────────────
  ipcMain.handle('pick-template-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select a Template PNG',
      filters: [{ name: 'PNG Images', extensions: ['png'] }],
      properties: ['openFile'],
    });
    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
  });

  // ── print-strip ─────────────────────────────────────────────────────────────
  ipcMain.handle('print-strip', async (event, { stripFilename, copies = 1, printerName = null }) => {
    if (!printerName) {
      try {
        const config = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        printerName = config.printerName || null;
      } catch {}
    }
    const safeName   = path.basename(stripFilename);
    const stripPath  = path.join(OUTPUT_DIR, safeName);
    if (!fs.existsSync(stripPath)) throw new Error('Strip file not found: ' + safeName);

    const ts          = safeName.replace(/^strip_/, '').replace(/\.jpg$/, '');
    const printFile   = `print_${ts}.jpg`;
    const printPath   = path.join(OUTPUT_DIR, printFile);

    // 4R canvas: 1200×1800 px (portrait) or 1800×1200 (landscape for single-shot)
    const meta = await sharp(stripPath).metadata();
    const isLandscape = meta.width > meta.height;

    if (isLandscape) {
      // Single-shot landscape → fit/pad onto 1800×1200 4R canvas
      await sharp({
        create: { width: 1800, height: 1200, channels: 3, background: { r: 0, g: 0, b: 0 } }
      })
        .composite([{
          input: await sharp(stripPath).resize(1800, 1200, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0 },
            ...HIGH_QUALITY_RESIZE,
          }).toBuffer(),
          top: 0, left: 0,
        }])
        .jpeg(HIGH_QUALITY_JPEG)
        .toFile(printPath);
    } else {
      // Multi-shot vertical strip → duplicate side-by-side on 1200×1800 4R canvas
      // Each copy occupies 600px wide; strip is resized to 600×1800
      const halfW = 600, canvasH = 1800;
      const stripBuf = await sharp(stripPath)
        .resize(halfW, canvasH, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0 },
          ...HIGH_QUALITY_RESIZE,
        })
        .toBuffer();
      await sharp({
        create: { width: halfW * 2, height: canvasH, channels: 3, background: { r: 0, g: 0, b: 0 } }
      })
        .composite([
          { input: stripBuf, top: 0, left: 0 },
          { input: stripBuf, top: 0, left: halfW },
        ])
        .jpeg(HIGH_QUALITY_JPEG)
        .toFile(printPath);
    }

    // Print via a hidden BrowserWindow that loads the image and calls window.print()
    const printHtml = `<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: ${isLandscape ? '6in 4in' : '4in 6in'}; margin: 0; }
  body  { margin: 0; padding: 0; }
  img   { width: 100%; height: 100vh; object-fit: contain; display: block; }
</style>
</head>
<body>
  <img src="file:///${printPath.replace(/\\/g, '/')}">
</body>
</html>`;

    const printWin = new BrowserWindow({
      show: false,
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    });

    await printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(printHtml));

    return new Promise((resolve, reject) => {
      // Silent print; repeat for requested copies
      let printed = 0;
      const doPrint = () => {
        const printOptions = { silent: true, printBackground: true };
        if (printerName) printOptions.deviceName = printerName;
        printWin.webContents.print(printOptions, (success, errorType) => {
          if (!success) {
            printWin.destroy();
            return reject(new Error('Print failed: ' + errorType));
          }
          printed++;
          if (printed < copies) return doPrint();
          printWin.destroy();
          resolve({ printFile });
        });
      };
      doPrint();
    });
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
