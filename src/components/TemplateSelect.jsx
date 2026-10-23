import React, { useEffect, useState } from 'react';

function TemplateThumbnail({ overlayPngPath, name }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let cancelled = false;
    window.electronAPI.getTemplateThumbnail(overlayPngPath)
      .then(url => { if (!cancelled && url) setSrc(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [overlayPngPath]);

  if (!src) return <div className="tpl-thumb-placeholder"><div className="spinner-small" /></div>;
  return <img src={src} alt={name} className="tpl-thumb-img" />;
}

export default function TemplateSelect({ templates, selectedTemplate, onSelect, onContinue }) {
  return (
    <div className="tpl-screen">
      <div className="tpl-screen-header">
        <h2 className="tpl-screen-title">Choose Your Template</h2>
        <p className="tpl-screen-sub">Pick the frame design for your photo strip</p>
      </div>
      <div className="tpl-grid">
        {templates.map(template => (
          <div key={template.id}
            role="button"
            tabIndex={0}
            className={`tpl-card ${template.layoutMode === 'landscape' || template.orientation === 'landscape' || template.width > template.height ? 'tpl-card--landscape' : ''} ${selectedTemplate?.id === template.id ? 'tpl-card--active' : ''}`}
            onClick={() => onSelect(template)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(template);
              }
            }}>
            {selectedTemplate?.id === template.id && <span className="tpl-active-badge">Selected ✓</span>}
            <div className="tpl-preview-wrap">
              <TemplateThumbnail overlayPngPath={template.overlayPngPath} name={template.name} />
            </div>
            <div className="tpl-card-footer">
              <div className="tpl-card-title-row">
                <span className="tpl-card-name">{template.name}</span>
                <span className="tpl-card-badge">{template.isCustom ? 'Custom' : 'Studio'}</span>
              </div>
              <span className="tpl-card-hint">{selectedTemplate?.id === template.id ? 'Ready for your session' : 'Tap to preview'}</span>
            </div>
          </div>
        ))}
      </div>
      {selectedTemplate && (
        <div className="tpl-action-bar">
          <div>
            <span className="tpl-action-eyebrow">Template selected</span>
            <strong>{selectedTemplate.name}</strong>
          </div>
          <button className="cta-btn tpl-start-btn" onClick={onContinue}>Select &amp; Start →</button>
        </div>
      )}
    </div>
  );
}
