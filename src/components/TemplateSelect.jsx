import React, { useEffect, useState } from 'react';
import {
  CheckLinearIcon,
  AltArrowRightLinearIcon,
} from '@solar-icons/react';

function TemplateThumbnail({ overlayPngPath, name, onLoadRatio }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let cancelled = false;
    window.electronAPI.getTemplateThumbnail(overlayPngPath)
      .then(url => { if (!cancelled && url) setSrc(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [overlayPngPath]);

  if (!src) return <div className="tpl-thumb-placeholder"><div className="spinner-small" /></div>;
  return (
    <img
      src={src}
      alt={name}
      className="tpl-thumb-img"
      onLoad={e => {
        if (e.target.naturalWidth && e.target.naturalHeight && onLoadRatio) {
          onLoadRatio(e.target.naturalWidth / e.target.naturalHeight);
        }
      }}
    />
  );
}

function TemplateCard({ template, isSelected, onSelect }) {
  const [naturalRatio, setNaturalRatio] = useState(() => {
    if (template.width && template.height) {
      return template.width / template.height;
    }
    return template.layoutMode === 'landscape' || template.orientation === 'landscape' ? 1.5 : 0.333;
  });

  const isLandscape = (naturalRatio && naturalRatio > 1.05) ||
                      template.layoutMode === 'landscape' ||
                      template.orientation === 'landscape' ||
                      (template.width && template.height && template.width > template.height);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`tpl-card ${isLandscape ? 'tpl-card--landscape' : 'tpl-card--portrait'} ${isSelected ? 'tpl-card--active' : ''}`}
      onClick={() => onSelect(template)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(template);
        }
      }}
    >
      {isSelected && (
        <span className="tpl-active-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          Selected <CheckLinearIcon size={12} strokeWidth={2.5} />
        </span>
      )}
      <div
        className="tpl-preview-wrap"
        style={naturalRatio ? { aspectRatio: `${naturalRatio}` } : undefined}
      >
        <TemplateThumbnail
          overlayPngPath={template.overlayPngPath}
          name={template.name}
          onLoadRatio={ratio => setNaturalRatio(ratio)}
        />
      </div>
      <div className="tpl-card-footer">
        <div className="tpl-card-title-row">
          <span className="tpl-card-name" title={template.name}>{template.name}</span>
          <span className="tpl-card-badge">{template.isCustom ? 'Custom' : 'Studio'}</span>
        </div>
        <span className="tpl-card-hint">{isSelected ? 'Ready for your session' : 'Tap to preview'}</span>
      </div>
    </div>
  );
}

export default function TemplateSelect({ templates, selectedTemplate, onSelect, onContinue, onOpenEditor }) {
  const count = templates.length;
  const isSingleRow = count <= 5;

  return (
    <div className="tpl-screen">
      <div className="tpl-screen-header">
        <h2 className="tpl-screen-title">Choose Your Template</h2>
        <p className="tpl-screen-sub">Pick the frame design for your photo strip</p>
      </div>
      {count === 0 ? (
        <div className="tpl-empty-state" style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--card-bg, #1a1c23)', borderRadius: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.08))', maxWidth: '480px', margin: '2rem auto' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main, #ffffff)' }}>No Templates Added Yet</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #9ca3af)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Import your custom PNG frame overlays or design cutouts in the Template Editor to start.
          </p>
          {onOpenEditor && (
            <button type="button" className="cta-btn" onClick={onOpenEditor} style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Open Template Editor</span>
              <AltArrowRightLinearIcon size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className={`tpl-grid ${isSingleRow ? 'tpl-grid--single-row' : 'tpl-grid--multi-row'}`}>
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate?.id === template.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
      {selectedTemplate && (
        <div className="tpl-action-bar">
          <div>
            <span className="tpl-action-eyebrow">Template selected</span>
            <strong>{selectedTemplate.name}</strong>
          </div>
          <button className="cta-btn tpl-start-btn" onClick={onContinue} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
            <span>Select &amp; Start</span>
            <AltArrowRightLinearIcon size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
