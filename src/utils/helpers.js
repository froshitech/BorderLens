export const FILTERS = [
  { id: 'normal', label: 'Normal', css: 'none' },
  { id: 'bw', label: 'B&W', css: 'grayscale(100%) contrast(118%) brightness(105%)' },
  { id: 'bright', label: 'Bright', css: 'brightness(112%) contrast(96%) saturate(105%)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(25%) contrast(105%) brightness(102%)' },
  { id: 'warm', label: 'Warm Film', css: 'sepia(18%) saturate(112%) contrast(102%) brightness(103%)' },
];

export const STEP_LABELS = {
  TEMPLATE_SELECTION: 'Choose Template',
  LIVE_VIEW: 'Camera',
  REVIEW_SHOTS: 'Review & Customize',
  RESULT: 'Your Strip',
  GALLERY: 'Gallery',
  SETTINGS: 'Operator Settings',
};

export const PAUSE_BETWEEN_SHOTS_MS = 1500;
export const FLASH_DURATION_MS = 350;
export const AUTO_PROCEED_SEC = 15;

export const LS_CUSTOM_TEMPLATES = 'pb_custom_templates';
export const LS_LAST_TEMPLATE = 'pb_last_template_id';
export const LS_MODE = 'pb_camera_mode';
export const LS_SELECTED_DEVICE = 'pb_selected_device_id';
export const LS_MIRROR = 'pb_mirror';
export const LS_SHOT_OVERRIDE = 'pb_shot_override';
export const LS_COUNTDOWN_DURATION = 'pb_countdown_duration';
export const LS_FLASH_ENABLED = 'pb_flash_enabled';
export const LS_THEME = 'pb_theme';
export const LS_CUSTOM_ACCENT = 'pb_custom_accent';

export function makeSessionTs() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function lsGet(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence is best effort.
  }
}

export function normalizeCustomTemplates(templates) {
  return Array.isArray(templates)
    ? templates.map(template => ({
      ...template,
      enabled: template.enabled !== false,
      orientation: template.orientation || (template.width > template.height ? 'landscape' : 'portrait'),
      layoutMode: template.layoutMode || template.orientation || (template.width > template.height ? 'landscape' : 'portrait'),
      fitMode: ['cover', 'contain', 'fill'].includes(template.fitMode) ? template.fitMode : 'cover',
    }))
    : [];
}

export function formatDate(iso) {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function applyTheme(theme, customAccent) {
  if (!theme || typeof document === 'undefined') return;
  Object.entries(theme.colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
  if (customAccent) {
    document.documentElement.style.setProperty('--accent-primary', customAccent);
    document.documentElement.style.setProperty('--accent', customAccent);
    document.documentElement.style.setProperty('--accent-hover', customAccent);
    document.documentElement.style.setProperty('--accent-soft', `${customAccent}1F`);
  }
}
