import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  PaletteLinearIcon,
  PaletteBoldIcon,
  CameraLinearIcon,
  CameraBoldIcon,
  VideocameraLinearIcon,
  PrinterLinearIcon,
  PrinterBoldIcon,
  LayersLinearIcon,
  LayersBoldIcon,
  SmartphoneLinearIcon,
  SmartphoneBoldIcon,
  DatabaseLinearIcon,
  DatabaseBoldIcon,
  SettingsBoldIcon,
  AltArrowLeftLinearIcon,
  BoltLinearIcon,
  ClockCircleLinearIcon,
  DisketteLinearIcon,
  FolderLinearIcon,
  FolderOpenLinearIcon,
  MagnifierLinearIcon,
  WiFiLinearIcon,
  WiFiHighLinearIcon,
  CloudLinearIcon,
  RefreshCircleLinearIcon,
  EyeLinearIcon,
  EyeClosedLinearIcon,
  DocumentTextLinearIcon,
  DocumentTextBoldIcon,
  StarsLinearIcon,
  StarsBoldIcon,
  FileLinearIcon,
  FileBoldIcon,
  MagicWand2LinearIcon,
  MagicWand2BoldIcon,
  BoltBoldIcon,
  Tuning2LinearIcon,
  CopyLinearIcon,
  CopyBoldIcon,
  DocumentLinearIcon,
  DocumentBoldIcon,
} from '@solar-icons/react';

const TABS = [
  { id: 'appearance', label: 'Appearance & Theme', icon: PaletteLinearIcon, activeIcon: PaletteBoldIcon, desc: 'Presets & accents' },
  { id: 'camera',     label: 'Camera & Preview',   icon: CameraLinearIcon,  activeIcon: CameraBoldIcon,  desc: 'Source, mirror & flash' },
  { id: 'printer',    label: 'Printer Setup',      icon: PrinterLinearIcon, activeIcon: PrinterBoldIcon, desc: 'Hardware & 4R output' },
  { id: 'templates',  label: 'Template Management',icon: LayersLinearIcon,  activeIcon: LayersBoldIcon,  desc: 'Visual slot editor' },
  { id: 'remote',     label: 'Remote & Network',   icon: SmartphoneLinearIcon, activeIcon: SmartphoneBoldIcon, desc: 'Mobile shutter & cloud' },
  { id: 'storage',    label: 'Storage & System',   icon: DatabaseLinearIcon, activeIcon: DatabaseBoldIcon, desc: 'Folders & DSLR bridge' },
];

export default function SettingsView({
  themes = {}, activeTheme, customAccent, onThemeChange, onAccentChange,
  outputDir, digiCamControlPath, digiCamControlAvailable, printers = [], selectedPrinter,
  paperType = 'matte', onPaperTypeChange,
  printQuality = 'high', onPrintQualityChange,
  stripLayout = 'dual', onStripLayoutChange,
  silentPrint = true, onSilentPrintChange,
  onOpenPrinterPreferences,
  mode, devices = [], selectedDeviceId, mirror, shotOverride, countdownDuration, flashEnabled,
  builtinTemplates = [], hiddenBuiltins = [], customTemplates = [], allVisibleTpls = [],
  isPrinting, canTestPrint, onSelectOutput, onOpenOutput, onSelectDigi,
  cloudQrMode, cloudStatus, onCloudQrModeChange, onTestCloud,
  cloudConfigForm, onSaveCloudConfig, onResetCloudConfig,
  onPrinterChange, onSavePrinter, onTestPrint, onModeChange, onDeviceChange, onMirrorChange,
  onShotOverride, onCountdownDuration, onFlashChange, onOpenVisualEditor, onBack,
}) {
  const [activeTab, setActiveTab] = useState('appearance');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [cloudForm, setCloudForm] = useState({
    cloudName: cloudConfigForm?.cloudName || '',
    apiKey: cloudConfigForm?.apiKey || '',
    apiSecret: '',
    viewerUrl: cloudConfigForm?.viewerUrl || 'https://froshitech.github.io/BorderLens/viewer.html',
  });
  const [cloudStatusMsg, setCloudStatusMsg] = useState(null);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [showCloudName, setShowCloudName] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  const maskCloudName = (name) => {
    if (!name) return 'Configured';
    if (showCloudName) return name;
    if (name.length <= 4) return '••••';
    return `${name.slice(0, 2)}••••${name.slice(-2)}`;
  };

  useEffect(() => {
    if (cloudConfigForm) {
      setCloudForm(prev => ({
        ...prev,
        cloudName: cloudConfigForm.cloudName || '',
        apiKey: cloudConfigForm.apiKey || '',
        viewerUrl: cloudConfigForm.viewerUrl || 'https://froshitech.github.io/BorderLens/viewer.html',
      }));
    }
  }, [cloudConfigForm]);

  const handleSaveCredentials = async (e) => {
    e?.preventDefault?.();
    setIsSavingCloud(true);
    setCloudStatusMsg(null);
    try {
      const res = await onSaveCloudConfig?.({
        cloudName: cloudForm.cloudName.trim(),
        apiKey: cloudForm.apiKey.trim(),
        apiSecret: cloudForm.apiSecret ? cloudForm.apiSecret.trim() : undefined,
        viewerUrl: cloudForm.viewerUrl.trim(),
      });
      if (res?.ok) {
        setCloudStatusMsg({ type: 'success', text: `Saved & Verified! Connected to Cloudinary (${maskCloudName(res.cloudName)}).` });
        setCloudForm(prev => ({ ...prev, apiSecret: '' }));
        setShowCloudName(false);
        setShowApiKey(false);
        setShowApiSecret(false);
      } else {
        setCloudStatusMsg({ type: 'error', text: `Verification failed: ${res?.error || 'Unknown error'}` });
      }
    } catch (err) {
      setCloudStatusMsg({ type: 'error', text: `Save error: ${err.message}` });
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleResetCredentials = async () => {
    if (!window.confirm('Reset Cloudinary credentials and revert to default settings?')) return;
    setIsSavingCloud(true);
    setCloudStatusMsg(null);
    try {
      await onResetCloudConfig?.();
      setCloudForm({
        cloudName: '',
        apiKey: '',
        apiSecret: '',
        viewerUrl: 'https://froshitech.github.io/BorderLens/viewer.html',
      });
      setShowCloudName(false);
      setShowApiKey(false);
      setShowApiSecret(false);
      setCloudStatusMsg({ type: 'success', text: 'Cloud credentials removed. Local Wi-Fi QR mode will be used.' });
    } catch (err) {
      setCloudStatusMsg({ type: 'error', text: `Reset error: ${err.message}` });
    } finally {
      setIsSavingCloud(false);
    }
  };

  useEffect(() => {
    let active = true;
    window.electronAPI?.getRemoteControlUrl?.().then(url => {
      if (active && url) setRemoteUrl(url);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const totalVisibleTemplates = Array.isArray(allVisibleTpls) && allVisibleTpls.length > 0
    ? allVisibleTpls.length
    : (builtinTemplates.filter(t => !hiddenBuiltins?.includes(t.id)).length + (customTemplates?.filter(t => t.enabled !== false)?.length || 0));

  return (
    <div className="settings-dashboard">
      {/* ── Left Sidebar Navigation ────────────────────────────────────────── */}
      <aside className="settings-sidebar" aria-label="Settings navigation">
        <div className="settings-sidebar-top">
          <div className="settings-sidebar-brand">
            <span className="settings-brand-icon">
              <SettingsBoldIcon size={20} color="var(--accent)" />
            </span>
            <div>
              <h3>Operator Hub</h3>
              <p>Studio Settings</p>
            </div>
          </div>

          <nav className="settings-nav-list" role="tablist">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const IconComp = isActive ? tab.activeIcon : tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`settings-nav-item ${isActive ? 'settings-nav-item--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="settings-nav-icon">
                    <IconComp size={20} color={isActive ? 'var(--accent)' : 'currentColor'} />
                  </span>
                  <div className="settings-nav-text">
                    <span className="settings-nav-title">{tab.label}</span>
                    <span className="settings-nav-desc">{tab.desc}</span>
                  </div>
                  {isActive && <span className="settings-nav-indicator" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="settings-sidebar-bottom">
          <div className="settings-sidebar-status">
            <span className="status-dot-pulse" />
            <span>Booth Ready</span>
          </div>
          {onBack && (
            <button type="button" className="settings-sidebar-back-btn" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
              <AltArrowLeftLinearIcon size={16} /> Back to Booth
            </button>
          )}
        </div>
      </aside>

      {/* ── Right Content Panel ────────────────────────────────────────────── */}
      <main className="settings-content" role="tabpanel">
        <div className="settings-content-inner" key={activeTab}>

          {/* ── 1. Appearance & Theme ───────────────────────────────────────── */}
          {activeTab === 'appearance' && (
            <>
              <div className="settings-tab-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <PaletteBoldIcon size={28} color="var(--accent)" /> Appearance &amp; Theme
                </h2>
                <p>Customize the booth visual theme, color palette, and interface accents.</p>
              </div>

              <section className="settings-section theme-customizer-section">
                <h3>Studio Interface Themes</h3>
                <p className="settings-hint">Select a curated theme preset tailored for events, parties, and studio aesthetics.</p>
                <div className="theme-preset-grid">
                  {Object.entries(themes).map(([key, theme]) => (
                    <button
                      key={key}
                      type="button"
                      className={`theme-preset-card ${activeTheme === key && !customAccent ? 'theme-preset-card--active' : ''}`}
                      onClick={() => onThemeChange(key)}
                    >
                      <span className="theme-preset-swatch" style={{ background: theme.colors['bg-main'], borderColor: theme.colors.accent }}>
                        <span style={{ background: theme.colors.accent }} />
                        <span style={{ background: theme.colors['text-primary'] }} />
                      </span>
                      <strong>{theme.name}</strong>
                      <small>{theme.description}</small>
                    </button>
                  ))}
                </div>

                <div className="camera-source-divider" />

                <label className="theme-accent-picker">
                  <span>Custom Accent Color:</span>
                  <input
                    type="color"
                    value={customAccent || themes[activeTheme]?.colors.accent || '#6C63FF'}
                    onChange={e => onAccentChange(e.target.value)}
                  />
                  <code>{customAccent || themes[activeTheme]?.colors.accent || '#6C63FF'}</code>
                </label>
              </section>
            </>
          )}

          {/* ── 2. Camera & Preview ─────────────────────────────────────────── */}
          {activeTab === 'camera' && (
            <>
              <div className="settings-tab-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CameraBoldIcon size={28} color="var(--accent)" /> Camera &amp; Live Preview
                </h2>
                <p>Configure capture hardware, operator mirror feed, countdown timing, and flash.</p>
              </div>

              <section className="settings-section">
                <h3>Camera Source</h3>
                <div className="camera-source-controls">
                  <div className="camera-source-mode-group" role="group" aria-label="Camera source">
                    <button
                      type="button"
                      className={`camera-source-mode ${mode === 'dslr' ? 'camera-source-mode--active' : ''}`}
                      onClick={() => onModeChange('dslr')}
                    >
                      <CameraLinearIcon size={24} />
                      <strong>DSLR</strong>
                      <small>External camera via digiCamControl</small>
                    </button>
                    <button
                      type="button"
                      className={`camera-source-mode ${mode === 'webcam' ? 'camera-source-mode--active' : ''}`}
                      onClick={() => onModeChange('webcam')}
                    >
                      <VideocameraLinearIcon size={24} />
                      <strong>Webcam</strong>
                      <small>USB / built-in high-res camera</small>
                    </button>
                  </div>
                </div>

                {mode === 'dslr' && !digiCamControlAvailable && (
                  <p className="settings-hint settings-hint--error">
                    ⚠️ digiCamControl was not detected in default directories. Please select the folder in the Storage &amp; System tab.
                  </p>
                )}

                {mode === 'webcam' && (
                  <label className="camera-device-field">
                    <span>Active Webcam Device:</span>
                    <select
                      className="settings-select"
                      value={selectedDeviceId}
                      onChange={e => onDeviceChange(e.target.value)}
                      disabled={devices.length === 0}
                    >
                      {devices.length === 0 && <option value="">No webcam devices detected</option>}
                      {devices.map((device, i) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="camera-source-divider" />

                <label className="settings-toggle camera-mirror-toggle">
                  <input type="checkbox" checked={mirror} onChange={e => onMirrorChange(e.target.checked)} />
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                  <span><strong>Mirror Live Feed</strong><small>Flips the webcam horizontally so guests see their reflection naturally.</small></span>
                </label>
              </section>

              <section className="settings-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <BoltLinearIcon size={16} /> Capture Flash
                </h3>
                <p className="settings-hint">Illuminates the screen with a brief studio flash when each photo is captured.</p>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={flashEnabled !== false}
                    onChange={event => onFlashChange?.(event.target.checked)}
                  />
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                  <span>Use screen flash effect on capture</span>
                </label>
              </section>

              <section className="settings-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ClockCircleLinearIcon size={16} /> Countdown Duration
                </h3>
                <p className="settings-hint">Preparation time before each photo snap so guests can pose.</p>
                <div className="settings-pill-group" role="group" aria-label="Countdown duration">
                  {[3, 5, 10].map(duration => (
                    <button
                      key={duration}
                      type="button"
                      className={`settings-pill ${countdownDuration === duration ? 'settings-pill--active' : ''}`}
                      onClick={() => onCountdownDuration(duration)}
                    >
                      {duration} Seconds
                    </button>
                  ))}
                </div>
              </section>

              <section className="settings-section">
                <h3>Shot Count Override</h3>
                <p className="settings-hint">By default, shot count automatically adapts to match the transparent slots in the selected template.</p>
                <div className="settings-pill-group" role="group" aria-label="Shot count override">
                  <button
                    type="button"
                    className={`settings-pill ${shotOverride === null ? 'settings-pill--active' : ''}`}
                    onClick={() => onShotOverride(null)}
                  >
                    Auto (Template Default)
                  </button>
                  {[1, 2, 3, 4].map(number => (
                    <button
                      key={number}
                      type="button"
                      className={`settings-pill ${shotOverride === number ? 'settings-pill--active' : ''}`}
                      onClick={() => onShotOverride(number)}
                    >
                      {number} Shot{number > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ── 3. Printer Setup ───────────────────────────────────────────── */}
          {activeTab === 'printer' && (
            <>
              <div className="settings-tab-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <PrinterBoldIcon size={28} color="var(--accent)" /> Printer Setup
                </h2>
                <p>Configure default thermal or inkjet photo printers, paper media type, and test physical output.</p>
              </div>

              <section className="settings-section">
                <h3>Windows Printer Selection</h3>
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    className="settings-select"
                    style={{ flex: '1 1 240px' }}
                    value={selectedPrinter}
                    onChange={e => onPrinterChange(e.target.value)}
                    disabled={printers.length === 0}
                  >
                    <option value="">Windows Default Printer</option>
                    {printers.map(printer => (
                      <option key={printer.name} value={printer.name}>
                        {printer.displayName || printer.name} {printer.isDefault ? ' (System Default)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="settings-add-btn"
                    onClick={onOpenPrinterPreferences}
                    title="Open native Windows printer driver preferences (paper tray, media profile, nozzle check)"
                    style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 0.95rem' }}
                  >
                    <Tuning2LinearIcon size={16} /> Driver Properties
                  </button>
                </div>

                {printers.length === 0 ? (
                  <p className="settings-hint settings-hint--error">No Windows printers detected. Connect a printer or install drivers.</p>
                ) : (
                  <p className="settings-hint">
                    Default printer: <strong>{printers.find(p => p.isDefault)?.displayName || 'None'}</strong>
                  </p>
                )}
              </section>

              {/* ── Strip Layout & Paper Optimization ── */}
              <section className="settings-section">
                <h3>Strip Layout &amp; Copies Per Page</h3>
                <p className="settings-hint">
                  Choose how vertical 2×6 photo strips are arranged. Dual strips fill a 4×6 sheet (or an A4 sheet cut in half lengthwise). Single strip prints 1 copy aligned to the leading edge.
                </p>
                <div className="printer-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '0.65rem' }}>
                  <div
                    onClick={() => onStripLayoutChange('dual')}
                    style={{
                      border: stripLayout === 'dual' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: stripLayout === 'dual' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: stripLayout === 'dual' ? '0 0 0 1px var(--accent)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 700, fontSize: '0.92rem', color: stripLayout === 'dual' ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {stripLayout === 'dual' ? <CopyBoldIcon size={20} color="var(--accent)" /> : <CopyLinearIcon size={20} />}
                      <span>2 Strips (Dual 2×6 on 4×6)</span>
                    </div>
                    <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.4' }}>
                      Duplicates strips side-by-side. Fits 4×6 photo paper or 105mm half-cut A4 sheets perfectly.
                    </small>
                  </div>

                  <div
                    onClick={() => onStripLayoutChange('single')}
                    style={{
                      border: stripLayout === 'single' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: stripLayout === 'single' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: stripLayout === 'single' ? '0 0 0 1px var(--accent)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 700, fontSize: '0.92rem', color: stripLayout === 'single' ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {stripLayout === 'single' ? <DocumentBoldIcon size={20} color="var(--accent)" /> : <DocumentLinearIcon size={20} />}
                      <span>1 Strip (Single 2×6)</span>
                    </div>
                    <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.4' }}>
                      Prints a single strip aligned to the edge of the sheet.
                    </small>
                  </div>
                </div>
              </section>

              {/* ── Paper Media Selection ── */}
              <section className="settings-section">
                <h3>Photo Paper Media Type</h3>
                <p className="settings-hint">
                  Select your active paper stock. Matte papers receive tailored unsharp compensation and tone curves to counteract ink spread and ensure deep, rich blacks.
                </p>
                <div className="printer-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.65rem' }}>
                  <div
                    onClick={() => onPaperTypeChange('matte')}
                    style={{
                      border: paperType === 'matte' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: paperType === 'matte' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: paperType === 'matte' ? '0 0 0 1px var(--accent)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 700, fontSize: '0.92rem', color: paperType === 'matte' ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {paperType === 'matte' ? <DocumentTextBoldIcon size={20} color="var(--accent)" /> : <DocumentTextLinearIcon size={20} />}
                      <span>Matte Photo Paper</span>
                    </div>
                    <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.4' }}>
                      Optimized for non-glossy/matte paper. Automatically boosts unsharp masking &amp; saturation to counteract matte ink spread.
                    </small>
                  </div>

                  <div
                    onClick={() => onPaperTypeChange('glossy')}
                    style={{
                      border: paperType === 'glossy' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: paperType === 'glossy' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: paperType === 'glossy' ? '0 0 0 1px var(--accent)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 700, fontSize: '0.92rem', color: paperType === 'glossy' ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {paperType === 'glossy' ? <StarsBoldIcon size={20} color="var(--accent)" /> : <StarsLinearIcon size={20} />}
                      <span>Glossy Photo Paper</span>
                    </div>
                    <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.4' }}>
                      Standard reflective photo paper. Vibrant highlights and balanced natural tones.
                    </small>
                  </div>

                  <div
                    onClick={() => onPaperTypeChange('plain')}
                    style={{
                      border: paperType === 'plain' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: paperType === 'plain' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: paperType === 'plain' ? '0 0 0 1px var(--accent)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 700, fontSize: '0.92rem', color: paperType === 'plain' ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {paperType === 'plain' ? <FileBoldIcon size={20} color="var(--accent)" /> : <FileLinearIcon size={20} />}
                      <span>Standard / Plain Paper</span>
                    </div>
                    <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.4' }}>
                      For draft runs or standard bond paper tests without consuming expensive photo media.
                    </small>
                  </div>
                </div>
              </section>

              {/* ── Print Quality & Spooler Options ── */}
              <section className="settings-section">
                <h3>Print Resolution &amp; Quality</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '0.65rem' }}>
                  <div
                    onClick={() => onPrintQualityChange('high')}
                    style={{
                      border: printQuality === 'high' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: printQuality === 'high' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: printQuality === 'high' ? '0 0 0 1px var(--accent)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 700, fontSize: '0.9rem', color: printQuality === 'high' ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {printQuality === 'high' ? <MagicWand2BoldIcon size={20} color="var(--accent)" /> : <MagicWand2LinearIcon size={20} />}
                      <span>High Quality (600 DPI Fine Detail)</span>
                    </div>
                    <small style={{ display: 'block', marginTop: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                      Maximum sharpness and color fidelity. Perfect for event keepsakes and customer prints.
                    </small>
                  </div>

                  <div
                    onClick={() => onPrintQualityChange('standard')}
                    style={{
                      border: printQuality === 'standard' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: printQuality === 'standard' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: printQuality === 'standard' ? '0 0 0 1px var(--accent)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 700, fontSize: '0.9rem', color: printQuality === 'standard' ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {printQuality === 'standard' ? <BoltBoldIcon size={20} color="var(--accent)" /> : <BoltLinearIcon size={20} />}
                      <span>Standard Quality (300 DPI Fast)</span>
                    </div>
                    <small style={{ display: 'block', marginTop: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                      Faster spooling throughput. Standard continuous-feed and thermal printer speed.
                    </small>
                  </div>
                </div>

                <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem', display: 'block' }}>Background Silent Printing</strong>
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                      {silentPrint ? 'Direct printing without popup dialogs (fast photobooth workflow).' : 'Opens Windows printer dialog each time for manual tray selection.'}
                    </small>
                  </div>
                  <button
                    type="button"
                    className={`settings-pill ${silentPrint ? 'settings-pill--active' : ''}`}
                    onClick={() => onSilentPrintChange(!silentPrint)}
                  >
                    {silentPrint ? 'Silent Mode ON' : 'Dialog Prompt ON'}
                  </button>
                </div>

                <div className="settings-pill-group" style={{ marginTop: '1rem' }}>
                  <button type="button" className="settings-add-btn" onClick={onSavePrinter} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                    <DisketteLinearIcon size={16} /> Save All Printer Preferences
                  </button>
                  <button
                    type="button"
                    className="settings-add-btn"
                    onClick={onTestPrint}
                    disabled={isPrinting || !canTestPrint}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
                  >
                    <PrinterLinearIcon size={16} /> {isPrinting ? 'Printing Test...' : 'Test Print (Current Session)'}
                  </button>
                </div>
                {!canTestPrint && (
                  <small style={{ color: 'var(--text-hint)', fontSize: '0.72rem', display: 'block', marginTop: '0.35rem' }}>
                    Tip: Complete a session or select a strip in Gallery to run a test print.
                  </small>
                )}
              </section>

              <section className="settings-section">
                <h3>4R Borderless Output Specifications</h3>
                <p className="settings-hint">
                  BorderLens automatically formats vertical photo strips onto standard 4R (4×6 inch) photo paper:
                </p>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.6' }}>
                  <li><strong>Multi-shot Vertical Strips:</strong> Automatically duplicated side-by-side (two 2×6 strips on one 4×6 print) for clean center cutting.</li>
                  <li><strong>Single-shot &amp; Postcards:</strong> Centered with zero offset margins for borderless photo prints.</li>
                  <li><strong>Paper Compensation:</strong> Matte photo paper automatically receives edge unsharp masking to prevent ink bleed and softness.</li>
                </ul>
              </section>
            </>
          )}

          {/* ── 4. Template Management ─────────────────────────────────────── */}
          {activeTab === 'templates' && (
            <>
              <div className="settings-tab-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <LayersBoldIcon size={28} color="var(--accent)" /> Template Management
                </h2>
                <p>Design photo strip overlays, configure photo slots, and manage custom templates.</p>
              </div>

              <section className="settings-section">
                <h3>Visual Template Editor Workspace</h3>
                <p className="settings-hint">
                  Open the full-screen visual canvas to transparent photo slots, auto-detect cutout regions, import custom PNG overlays, and set orientation.
                </p>
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="action-btn action-btn--outline"
                    style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={() => onOpenVisualEditor()}
                  >
                    <LayersLinearIcon size={18} /> Open Visual Template Editor
                  </button>
                </div>
              </section>

              <section className="settings-section">
                <h3>Template Library Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', margin: '0.5rem 0' }}>
                  <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{customTemplates.length}</span>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Custom Imported Overlays</p>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalVisibleTemplates}</span>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Active on Booth Screen</p>
                  </div>
                </div>
                <p className="settings-hint" style={{ marginTop: '0.5rem' }}>
                  Templates can be enabled, hidden, or customized anytime inside the Visual Template Editor.
                </p>
              </section>
            </>
          )}

          {/* ── 5. Remote & Network ─────────────────────────────────────────── */}
          {activeTab === 'remote' && (
            <>
              <div className="settings-tab-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <SmartphoneBoldIcon size={28} color="var(--accent)" /> Remote &amp; Network
                </h2>
                <p>Configure hands-free mobile shutter controls and Cloudinary QR sharing.</p>
              </div>

              <section className="settings-section remote-shutter-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <SmartphoneLinearIcon size={18} /> Remote Mobile Shutter Control
                </h3>
                <p className="settings-hint">
                  only ITSC should scan this QR code with any phone connected to the same Wi-Fi network to select templates and trigger the countdown hands-free.
                </p>
                {remoteUrl ? (
                  <div className="remote-shutter-qr-card">
                    <div className="remote-shutter-qr-wrap">
                      <QRCodeSVG value={remoteUrl} size={130} bgColor="#ffffff" fgColor="#111827" level="M" />
                    </div>
                    <div className="remote-shutter-info">
                      <span className="remote-shutter-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <WiFiHighLinearIcon size={14} /> Wi-Fi Shutter Ready
                      </span>
                      <a href={remoteUrl} target="_blank" rel="noreferrer" className="remote-shutter-url">{remoteUrl}</a>
                      <p className="settings-hint">
                        Open in mobile Safari or Chrome to trigger shutter, browse templates, or monitor booth status remotely.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="settings-hint">Acquiring local network address...</p>
                )}
              </section>

              <section className="settings-section cloud-sharing-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CloudLinearIcon size={18} /> Cloud QR Sharing (Cloudinary)
                </h3>
                <p className="settings-hint">
                  Allows guests on mobile 4G/5G cellular data to immediately download full-resolution photos, raw shots, and boomerang GIFs by scanning a QR code without connecting to the booth's local Wi-Fi.
                </p>
                <div className="settings-pill-group" role="group" aria-label="QR sharing mode">
                  <button
                    type="button"
                    className={`settings-pill ${cloudQrMode === 'cloud' ? 'settings-pill--active' : ''}`}
                    onClick={() => onCloudQrModeChange('cloud')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <CloudLinearIcon size={14} /> Online Cloud QR (7-Day Auto-Cleanup)
                  </button>
                  <button
                    type="button"
                    className={`settings-pill ${cloudQrMode !== 'cloud' ? 'settings-pill--active' : ''}`}
                    onClick={() => onCloudQrModeChange('local')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <WiFiLinearIcon size={14} /> Local Wi-Fi QR Only
                  </button>
                </div>

                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: cloudStatus?.configured && cloudStatus?.online ? '#10b981' : '#f59e0b' }}>
                      {cloudStatus?.configured && cloudStatus?.online
                        ? `✅ Cloud Service Active (${maskCloudName(cloudConfigForm?.cloudName)})`
                        : '⚠️ Cloud Credentials Not Configured / Offline'}
                    </span>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {cloudStatus?.configured && cloudStatus?.online
                        ? 'Photos and GIFs auto-upload with 7-day retention. Viewer page is ready.'
                        : 'Booth will automatically fallback to Local Wi-Fi QR code mode for guests.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="settings-add-btn"
                    onClick={onTestCloud}
                    style={{ margin: 0, padding: '0.4rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RefreshCircleLinearIcon size={14} /> Test Connection &amp; Purge Expired
                  </button>
                </div>

                {cloudStatusMsg && (
                  <p className={`settings-hint ${cloudStatusMsg.type === 'success' ? 'settings-hint--success' : 'settings-hint--error'}`} style={{ margin: '0.25rem 0' }}>
                    {cloudStatusMsg.text}
                  </p>
                )}

                <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.4rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Cloud Name *
                      </label>
                      <div className="settings-input-wrap">
                        <input
                          type={showCloudName ? 'text' : 'password'}
                          className="settings-input"
                          placeholder="e.g. my-photobooth"
                          value={cloudForm.cloudName}
                          onChange={e => setCloudForm(f => ({ ...f, cloudName: e.target.value }))}
                          required
                        />
                        <button
                          type="button"
                          className="settings-input-eye-btn"
                          onClick={() => setShowCloudName(v => !v)}
                          aria-label={showCloudName ? "Hide Cloud Name" : "Show Cloud Name"}
                          title={showCloudName ? "Hide Cloud Name" : "Show Cloud Name"}
                        >
                          {showCloudName ? <EyeClosedLinearIcon size={18} /> : <EyeLinearIcon size={18} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        API Key *
                      </label>
                      <div className="settings-input-wrap">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          className="settings-input"
                          placeholder="e.g. 123456789012345"
                          value={cloudForm.apiKey}
                          onChange={e => setCloudForm(f => ({ ...f, apiKey: e.target.value }))}
                          required
                        />
                        <button
                          type="button"
                          className="settings-input-eye-btn"
                          onClick={() => setShowApiKey(v => !v)}
                          aria-label={showApiKey ? "Hide API Key" : "Show API Key"}
                          title={showApiKey ? "Hide API Key" : "Show API Key"}
                        >
                          {showApiKey ? <EyeClosedLinearIcon size={18} /> : <EyeLinearIcon size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      API Secret * {cloudConfigForm?.hasSecret && <span style={{ color: '#10b981', fontWeight: 500 }}>(Already saved securely)</span>}
                    </label>
                    <div className="settings-input-wrap">
                      <input
                        type={showApiSecret ? 'text' : 'password'}
                        className="settings-input"
                        placeholder={cloudConfigForm?.hasSecret ? '•••••••••••••••• (Leave blank to keep existing)' : 'Enter Cloudinary API Secret'}
                        value={cloudForm.apiSecret}
                        onChange={e => setCloudForm(f => ({ ...f, apiSecret: e.target.value }))}
                        required={!cloudConfigForm?.hasSecret}
                      />
                      <button
                        type="button"
                        className="settings-input-eye-btn"
                        onClick={() => setShowApiSecret(v => !v)}
                        aria-label={showApiSecret ? "Hide API Secret" : "Show API Secret"}
                        title={showApiSecret ? "Hide API Secret" : "Show API Secret"}
                      >
                        {showApiSecret ? <EyeClosedLinearIcon size={18} /> : <EyeLinearIcon size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Viewer Web URL
                    </label>
                    <input
                      type="url"
                      className="settings-input"
                      placeholder="https://froshitech.github.io/BorderLens/viewer.html"
                      value={cloudForm.viewerUrl}
                      onChange={e => setCloudForm(f => ({ ...f, viewerUrl: e.target.value }))}
                    />
                    <small style={{ color: 'var(--text-hint)', fontSize: '0.72rem' }}>
                      Hosted web landing page that downloads and displays the photos from Cloudinary.
                    </small>
                  </div>

                  <div className="settings-pill-group" style={{ marginTop: '0.25rem' }}>
                    <button
                      type="submit"
                      className="settings-add-btn"
                      disabled={isSavingCloud || !cloudForm.cloudName || !cloudForm.apiKey || (!cloudForm.apiSecret && !cloudConfigForm?.hasSecret)}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
                    >
                      <DisketteLinearIcon size={16} /> {isSavingCloud ? 'Saving & Verifying...' : 'Save & Verify Cloud Credentials'}
                    </button>

                    {cloudConfigForm?.isConfigured && (
                      <button
                        type="button"
                        className="settings-add-btn"
                        onClick={handleResetCredentials}
                        disabled={isSavingCloud}
                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        Remove Saved Credentials
                      </button>
                    )}
                  </div>
                </form>

                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', marginTop: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    💡 How to get free Cloudinary credentials for portable distribution:
                  </h4>
                  <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
                    <li>Sign up for a free account at <strong>cloudinary.com</strong> (free tier provides 25GB monthly storage &amp; bandwidth).</li>
                    <li>Go to your <strong>Cloudinary Dashboard &gt; Settings &gt; API Keys</strong>.</li>
                    <li>Copy your <strong>Cloud Name</strong>, <strong>API Key</strong>, and <strong>API Secret</strong> into the fields above and click Save.</li>
                    <li>Settings are securely saved to your local user data directory (<code style={{ color: 'var(--accent)' }}>cloud-config.json</code>) and persist across app updates without requiring a <code style={{ color: 'var(--accent)' }}>.env</code> file!</li>
                  </ol>
                </div>
              </section>
            </>
          )}

          {/* ── 6. Storage & System ─────────────────────────────────────────── */}
          {activeTab === 'storage' && (
            <>
              <div className="settings-tab-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <DatabaseBoldIcon size={28} color="var(--accent)" /> Storage &amp; System
                </h2>
                <p>Manage photo output folders, DSLR camera bridge utilities, and directory locations.</p>
              </div>

              <section className="settings-section">
                <h3>Photo Output Directory</h3>
                <p className="settings-hint">
                  Location where raw DSLR/webcam frames, composited strips, and animated boomerangs are stored:
                </p>
                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.82rem', color: 'var(--accent)', wordBreak: 'break-all' }}>
                  {outputDir || 'Default Output Directory'}
                </div>
                <div className="settings-pill-group" style={{ marginTop: '0.75rem' }}>
                  <button type="button" className="settings-add-btn" onClick={onSelectOutput} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                    <FolderLinearIcon size={16} /> Choose Output Folder
                  </button>
                  <button type="button" className="settings-add-btn" onClick={onOpenOutput} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                    <FolderOpenLinearIcon size={16} /> Open in File Explorer
                  </button>
                </div>
              </section>

              <section className="settings-section">
                <h3>DSLR Integration Bridge (digiCamControl)</h3>
                <p className="settings-hint">
                  BorderLens interfaces with Canon, Nikon, and Sony DSLRs via digiCamControl command utilities:
                </p>
                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.82rem', color: digiCamControlAvailable ? '#10b981' : 'var(--text-hint)', wordBreak: 'break-all' }}>
                  {digiCamControlPath || 'digiCamControl not detected'}
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <button type="button" className="settings-add-btn" onClick={onSelectDigi} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                    <MagnifierLinearIcon size={16} /> Browse for digiCamControl Directory
                  </button>
                </div>
                {!digiCamControlAvailable && (
                  <p className="settings-hint settings-hint--error" style={{ marginTop: '0.5rem' }}>
                    Install digiCamControl to program files, or manually select its folder containing CameraControlCmd.exe.
                  </p>
                )}
              </section>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
