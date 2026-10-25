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
  mode, devices = [], selectedDeviceId, mirror, shotOverride, countdownDuration, flashEnabled,
  builtinTemplates = [], hiddenBuiltins = [], customTemplates = [],
  isPrinting, canTestPrint, onSelectOutput, onOpenOutput, onSelectDigi,
  cloudQrMode, cloudStatus, onCloudQrModeChange, onTestCloud,
  onPrinterChange, onSavePrinter, onTestPrint, onModeChange, onDeviceChange, onMirrorChange,
  onShotOverride, onCountdownDuration, onFlashChange, onOpenVisualEditor, onBack,
}) {
  const [activeTab, setActiveTab] = useState('appearance');
  const [remoteUrl, setRemoteUrl] = useState('');

  useEffect(() => {
    let active = true;
    window.electronAPI?.getRemoteControlUrl?.().then(url => {
      if (active && url) setRemoteUrl(url);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const totalVisibleTemplates = (builtinTemplates.length - (hiddenBuiltins?.length || 0)) + (customTemplates?.filter(t => t.enabled !== false)?.length || 0);

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
                <p>Configure default thermal or inkjet photo printers and test physical output.</p>
              </div>

              <section className="settings-section">
                <h3>Windows Printer Selection</h3>
                <select
                  className="settings-select"
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

                {printers.length === 0 ? (
                  <p className="settings-hint settings-hint--error">No Windows printers detected. Connect a printer or install drivers.</p>
                ) : (
                  <p className="settings-hint">
                    Default printer: <strong>{printers.find(p => p.isDefault)?.displayName || 'None'}</strong>
                  </p>
                )}

                <div className="settings-pill-group" style={{ marginTop: '0.75rem' }}>
                  <button type="button" className="settings-add-btn" onClick={onSavePrinter} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                    <DisketteLinearIcon size={16} /> Save Printer Preference
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
                  <small style={{ color: 'var(--text-hint)', fontSize: '0.72rem' }}>
                    Tip: Complete a session or select a strip in Gallery to run a test print.
                  </small>
                )}
              </section>

              <section className="settings-section">
                <h3>4R Borderless Printing Information</h3>
                <p className="settings-hint">
                  BorderLens automatically formats vertical photo strips onto standard 4R (4×6 inch) photo paper:
                </p>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.6' }}>
                  <li><strong>Multi-shot Vertical Strips:</strong> Automatically duplicated side-by-side (two 2×6 strips on one 4×6 print) for clean center cutting.</li>
                  <li><strong>Single-shot &amp; Landscape:</strong> Scaled and centered with high-quality Lanczos3 resampling for sharp 300 DPI output.</li>
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
                  Open the full-screen visual canvas to drag-and-drop transparent photo slots, auto-detect cutout regions, import custom PNG overlays, and set orientation.
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
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{builtinTemplates.length}</span>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Built-in Studio Templates</p>
                  </div>
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
                  Attendants or guests can scan this QR code with any phone connected to the same Wi-Fi network to select templates and trigger the countdown hands-free.
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
                  Allows guests on mobile 4G/5G data to immediately download full-resolution photos and boomerang GIFs without connecting to the booth Wi-Fi.
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

                <p className={`settings-hint ${cloudStatus?.configured && cloudStatus?.online ? 'settings-hint--success' : 'settings-hint--error'}`}>
                  {cloudStatus?.configured && cloudStatus?.online
                    ? '✅ Cloud Service Connected & Verified (Automatic 7-day retention)'
                    : '⚠️ Missing .env credentials or offline — booth defaults to Local Wi-Fi fallback'}
                </p>

                <button
                  type="button"
                  className="settings-add-btn"
                  onClick={onTestCloud}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
                >
                  <RefreshCircleLinearIcon size={16} /> Test Cloud Connection &amp; Purge Expired Files
                </button>
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
