import React, { useState } from 'react';

export default function SettingsView({
  themes, activeTheme, customAccent, onThemeChange, onAccentChange,
  outputDir, digiCamControlPath, digiCamControlAvailable, printers, selectedPrinter,
  mode, devices, selectedDeviceId, mirror, shotOverride, countdownDuration, flashEnabled, builtinTemplates, hiddenBuiltins,
  customTemplates, isPrinting, canTestPrint, onSelectOutput, onOpenOutput, onSelectDigi,
  cloudQrMode, cloudStatus, onCloudQrModeChange, onTestCloud,
  onPrinterChange, onSavePrinter, onTestPrint, onModeChange, onDeviceChange, onMirrorChange,
  onShotOverride, onCountdownDuration, onFlashChange, onToggleBuiltin, onToggleCustom, onUpdateCustomLayout, onUpdateCustomSlots, onRemoveCustom, onAddCustom, onSaveCustomTemplate, onBack,
}) {
  const [templateError, setTemplateError] = useState(null);

  const pickCustomTemplate = async (layoutMode) => {
    setTemplateError(null);
    try {
      const template = await onAddCustom(layoutMode);
      if (!template) return;
      onSaveCustomTemplate({ ...template, orientation: layoutMode, layoutMode });
    } catch (err) {
      setTemplateError(err.message || 'Could not prepare template.');
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <div><h2>⚙️ Operator Settings</h2><p>Configure the booth for reliable event operation.</p></div>
      </div>
      <div className="settings-page-grid">
        <div className="settings-column settings-column--left">
          <section className="settings-section theme-customizer-section">
            <h3>🎨 System Interface & Theme</h3>
            <p className="settings-hint">Choose a studio preset or fine-tune the primary accent color.</p>
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
            <label className="theme-accent-picker">
              <span>Custom accent color</span>
              <input type="color" value={customAccent || themes[activeTheme]?.colors.accent || '#6C63FF'} onChange={e => onAccentChange(e.target.value)} />
              <code>{customAccent || themes[activeTheme]?.colors.accent || '#6C63FF'}</code>
            </label>
          </section>
          <section className="settings-section">
            <h3>🖨️ Printer Setup</h3>
            <select className="settings-select" value={selectedPrinter} onChange={e => onPrinterChange(e.target.value)} disabled={printers.length === 0}>
              <option value="">Windows default printer</option>
              {printers.map(printer => <option key={printer.name} value={printer.name}>{printer.displayName || printer.name}{printer.isDefault ? ' (Windows default)' : ''}</option>)}
            </select>
            {printers.length === 0 ? <p className="settings-hint settings-hint--error">No Windows printers detected.</p> : <p className="settings-hint">{printers.find(printer => printer.isDefault)?.displayName || 'No default printer reported'} is the Windows default.</p>}
            <div className="settings-pill-group">
              <button className="settings-add-btn" onClick={onSavePrinter}>Save Printer</button>
              <button className="settings-add-btn" onClick={onTestPrint} disabled={isPrinting || !canTestPrint}>Test Print</button>
            </div>
          </section>
          <section className="settings-section">
            <h3>Storage & Camera Tools</h3>
            <button className="settings-add-btn" onClick={onSelectOutput}>📁 Output Folder</button>
            <p className="settings-hint">{outputDir || 'Default output directory'}</p>
            <button className="settings-add-btn" onClick={onOpenOutput}>Open in Explorer</button>
            <button className="settings-add-btn" onClick={onSelectDigi}>Choose digiCamControl Directory</button>
            <p className="settings-hint">{digiCamControlPath || 'Not detected'}</p>
          </section>
          <section className="settings-section">
            <h3>Camera Source & Live Preview</h3>
            <div className="camera-source-controls">
              <div className="camera-source-mode-group" role="group" aria-label="Camera source">
                <button type="button" className={`camera-source-mode ${mode === 'dslr' ? 'camera-source-mode--active' : ''}`} onClick={() => onModeChange('dslr')}>
                  <span>📷</span><strong>DSLR</strong><small>External camera</small>
                </button>
                <button type="button" className={`camera-source-mode ${mode === 'webcam' ? 'camera-source-mode--active' : ''}`} onClick={() => onModeChange('webcam')}>
                  <span>🎥</span><strong>Webcam</strong><small>USB / built-in camera</small>
                </button>
              </div>
            </div>
            {!digiCamControlAvailable && <p className="settings-hint settings-hint--error">digiCamControl was not detected.</p>}
            {mode === 'webcam' && (
              <label className="camera-device-field">
                <span>Active webcam device</span>
                <select className="settings-select" value={selectedDeviceId} onChange={e => onDeviceChange(e.target.value)} disabled={devices.length === 0}>
                  {devices.length === 0 && <option value="">No webcam devices detected</option>}
                  {devices.map((device, i) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${i + 1}`}</option>)}
                </select>
              </label>
            )}
            <div className="camera-source-divider" />
            <label className="settings-toggle camera-mirror-toggle">
              <input type="checkbox" checked={mirror} onChange={e => onMirrorChange(e.target.checked)} />
              <span className="toggle-track"><span className="toggle-thumb" /></span>
              <span><strong>Mirror live feed</strong><small>Horizontal flip for the operator preview</small></span>
            </label>
          </section>
          <section className="settings-section">
            <h3>⏱️ Countdown Duration</h3>
            <p className="settings-hint">Choose how much preparation time guests get before each shot.</p>
            <div className="settings-pill-group" role="group" aria-label="Countdown duration">
              {[3, 5, 10].map(duration => (
                <button
                  key={duration}
                  type="button"
                  className={`settings-pill ${countdownDuration === duration ? 'settings-pill--active' : ''}`}
                  onClick={() => onCountdownDuration(duration)}
                >
                  {duration}s
                </button>
              ))}
            </div>
          </section>
          <section className="settings-section">
            <h3>📸 Camera Flash</h3>
            <p className="settings-hint">Show a brief white flash after each photo is captured.</p>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={flashEnabled !== false}
                onChange={event => onFlashChange?.(event.target.checked)}
              />
              <span className="toggle-track"><span className="toggle-thumb" /></span>
              Use capture flash
            </label>
          </section>
          <section className="settings-section cloud-sharing-section">
            <h3>☁️ Online QR Sharing</h3>
            <p className="settings-hint">Cloudinary links work over 5G/LTE and are automatically cleaned up after 7 days.</p>
            <div className="settings-pill-group" role="group" aria-label="QR sharing mode">
              <button type="button" className={`settings-pill ${cloudQrMode === 'cloud' ? 'settings-pill--active' : ''}`} onClick={() => onCloudQrModeChange('cloud')}>☁️ Online Cloud QR</button>
              <button type="button" className={`settings-pill ${cloudQrMode !== 'cloud' ? 'settings-pill--active' : ''}`} onClick={() => onCloudQrModeChange('local')}>📶 Local Wi-Fi QR</button>
            </div>
            <p className={`settings-hint ${cloudStatus?.configured && cloudStatus?.online ? 'settings-hint--success' : 'settings-hint--error'}`}>
              {cloudStatus?.configured && cloudStatus?.online
                ? '✅ Cloud Service Connected (Auto-deletes after 7 days)'
                : '⚠️ Missing .env credentials or offline — using Local Wi-Fi fallback'}
            </p>
            <button className="settings-add-btn" onClick={onTestCloud}>🔄 Test Connection &amp; Clean Up Expired Photos</button>
          </section>
          <section className="settings-section">
            <h3>Shot Count Override</h3>
            <p className="settings-hint">Auto-detects from template slots. Override below.</p>
            <div className="settings-pill-group">
              <button className={`settings-pill ${shotOverride === null ? 'settings-pill--active' : ''}`} onClick={() => onShotOverride(null)}>Auto</button>
              {[1, 2, 3, 4].map(number => <button key={number} className={`settings-pill ${shotOverride === number ? 'settings-pill--active' : ''}`} onClick={() => onShotOverride(number)}>{number}</button>)}
            </div>
          </section>
        </div>
        <div className="settings-column settings-column--right">
          <section className="settings-section">
            <h3>Template Manager</h3>
            <p className="settings-hint">Show or hide templates on the guest selection screen.</p>
            <div className="settings-template-list">
              {builtinTemplates.map(template => <TemplateToggle key={template.id} name={template.name} checked={!hiddenBuiltins.includes(template.id)} onChange={() => onToggleBuiltin(template.id)} />)}
              {customTemplates.map(template => (
                <React.Fragment key={template.id}>
                <div className="settings-template-row">
                  <TemplateToggle name={`🖼️ ${template.name}`} checked={template.enabled !== false} onChange={() => onToggleCustom(template.id)} />
                  {template.width && <span className="settings-template-dim">{template.width}×{template.height}</span>}
                  <select
                    className="settings-template-layout"
                    value={template.layoutMode || template.orientation || 'portrait'}
                    onChange={event => onUpdateCustomLayout(template.id, event.target.value)}
                    aria-label={`Layout mode for ${template.name}`}
                  >
                    <option value="portrait">📱 Portrait Strip</option>
                    <option value="landscape">🖼️ Landscape Grid</option>
                  </select>
                  <button className="settings-template-remove" onClick={() => onRemoveCustom(template.id)}>✕ Remove</button>
                </div>
                <TemplateSlotEditor template={template} onChange={onUpdateCustomSlots} />
                </React.Fragment>
              ))}
            </div>
            {templateError && <p className="settings-hint settings-hint--error">{templateError}</p>}
            <div className="template-add-actions">
              <button className="settings-add-btn template-add-btn" onClick={() => pickCustomTemplate('portrait')}>
                📱 + Add Portrait Template
              </button>
              <button className="settings-add-btn template-add-btn" onClick={() => pickCustomTemplate('landscape')}>
                🖼️ + Add Landscape Template
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function TemplateToggle({ name, checked, onChange }) {
  return <label className="settings-toggle settings-toggle--inline">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="toggle-track"><span className="toggle-thumb" /></span><span className="settings-template-name">{name}</span>
  </label>;
}

function TemplateSlotEditor({ template, onChange }) {
  const slots = template.slots || [];
  const updateSlot = (index, key, value) => {
    const next = slots.map((slot, slotIndex) => slotIndex === index
      ? { ...slot, [key]: Math.max(0, Number(value) || 0) }
      : slot);
    onChange(template.id, next, template.fitMode || 'cover');
  };
  return (
    <div className="template-slot-editor">
      <div className="template-slot-editor-header">
        <strong>Fine-tune photo slots</strong>
        <select className="settings-template-fit" value={template.fitMode || 'cover'} onChange={event => onChange(template.id, slots, event.target.value)}>
          <option value="cover">Cover (crop to fill)</option>
          <option value="contain">Contain (fit with padding)</option>
        </select>
      </div>
      {slots.length === 0 ? <p className="settings-hint">No slots detected for this template.</p> : slots.map((slot, index) => (
        <div className="template-slot-fields" key={index}>
          <span>Shot {index + 1}</span>
          {[
            ['x', 'X'], ['y', 'Y'], ['w', 'W'], ['h', 'H'],
          ].map(([key, label]) => (
            <label key={key}><small>{label}</small><input type="number" min="0" value={slot[key] ?? (key === 'w' ? slot.width : key === 'h' ? slot.height : 0)} onChange={event => updateSlot(index, key, event.target.value)} /></label>
          ))}
        </div>
      ))}
    </div>
  );
}
