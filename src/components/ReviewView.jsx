import React from 'react';

const FILTERS = [
  { id: 'normal', label: 'Normal', css: 'none' },
  { id: 'bw', label: 'B&W', css: 'grayscale(100%) contrast(118%) brightness(105%)' },
  { id: 'bright', label: 'Bright', css: 'brightness(112%) contrast(96%) saturate(105%)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(25%) contrast(105%) brightness(102%)' },
  { id: 'warm', label: 'Warm Film', css: 'sepia(18%) saturate(112%) contrast(102%) brightness(103%)' },
];

export { FILTERS };

export default function ReviewView({ rawFrames, activeFilter, activeCss, retakingIdx, isRetaking, isProcessing,
  templateThumbSrc, templateInfo, fitMode = 'cover', templateLayoutMode, shotCount, autoProceedSec, onRetake, onFilter, onGenerate, error }) {
  return (
    <div className="review-layout">
      <div className="review-left">
        <h2 className="review-title">Review & Customize</h2>
        <div className="review-grid">
          {rawFrames.map((frame, i) => (
            <div key={i} className={`review-card ${retakingIdx === i ? 'review-card--retaking' : ''}`}>
              <div className="review-card-img-wrap">
                <img src={frame.url} alt={`Shot ${i + 1}`} className="review-card-img" style={{ filter: activeCss }} />
                {retakingIdx === i ? <div className="review-card-retaking-badge">Retaking…</div> : (
                  <button className="review-retake-btn" onClick={() => onRetake(i)} disabled={isRetaking || isProcessing}>
                    ↺ Retake Shot #{i + 1}
                  </button>
                )}
              </div>
              <span className="review-shot-label">Shot {i + 1}</span>
            </div>
          ))}
        </div>
        <div className="review-filter-bar">
          <span className="review-filter-label">Filter</span>
          <div className="review-filter-pills">
            {FILTERS.map(filter => (
              <button key={filter.id} className={`filter-pill ${activeFilter === filter.id ? 'filter-pill--active' : ''}`}
                onClick={() => onFilter(filter.id)} disabled={isRetaking}>
                <span className="filter-pill-swatch" style={{ filter: filter.css }} />{filter.label}
              </button>
            ))}
          </div>
        </div>
        {error && <div className="error-bar">{error}</div>}
      </div>
      <div className="review-right">
        <p className="review-preview-label">Strip Preview</p>
        <div className="review-strip-preview-wrap">
          <StripPreview frames={rawFrames} templateSrc={templateThumbSrc} templateInfo={templateInfo} fitMode={fitMode} layoutMode={templateLayoutMode} shotCount={shotCount} activeCss={activeCss} />
        </div>
        <div className="auto-proceed-wrap">
          <p className="auto-proceed-label">Auto-generating in <strong>{autoProceedSec}s</strong></p>
          <div className="auto-proceed-bar"><div className="auto-proceed-fill" /></div>
        </div>
        <button className="cta-btn" onClick={onGenerate} disabled={isProcessing}>Looks Good! Generate Strip →</button>
      </div>
    </div>
  );
}

function getLandscapeSlots(width, height, count) {
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

function getPreviewSlots(templateInfo, layoutMode, shotCount) {
  const width = templateInfo?.width || (layoutMode === 'landscape' ? 3 : 1);
  const height = templateInfo?.height || (layoutMode === 'landscape' ? 2 : 2);
  const detected = templateInfo?.slots || [];
  if (detected.length) {
    if (detected.length === 1 && shotCount > 1) {
      const base = detected[0];
      const gap = 8;
      const slotHeight = Math.floor((base.h - gap * (shotCount - 1)) / shotCount);
      return Array.from({ length: shotCount }, (_, index) => ({
        x: base.x, y: base.y + index * (slotHeight + gap), w: base.w, h: slotHeight,
      }));
    }
    return Array.from({ length: shotCount }, (_, index) => detected[index % detected.length]);
  }
  if (layoutMode === 'landscape') return getLandscapeSlots(width, height, shotCount);

  const gap = 16;
  const slotHeight = Math.floor((height - gap * (shotCount - 1)) / shotCount);
  return Array.from({ length: shotCount }, (_, index) => ({
    x: 0, y: index * (slotHeight + gap), w: width, h: slotHeight,
  }));
}

function StripPreview({ frames, templateSrc, templateInfo, fitMode, layoutMode, shotCount, activeCss }) {
  const isLandscape = layoutMode === 'landscape';
  const slots = getPreviewSlots(templateInfo, layoutMode, shotCount);
  const canvasWidth = templateInfo?.width || (isLandscape ? 3 : 1);
  const canvasHeight = templateInfo?.height || (isLandscape ? 2 : 2);
  const previewStyle = { aspectRatio: `${canvasWidth} / ${canvasHeight}` };
  return (
    <div className={`strip-preview ${isLandscape ? 'strip-preview--landscape' : 'strip-preview--portrait'}`} style={previewStyle}>
      {templateSrc && <img src={templateSrc} alt="template" className="strip-preview-overlay" />}
      <div className="strip-preview-slots">
        {Array.from({ length: shotCount }).map((_, i) => {
          const slot = slots[i];
          const slotStyle = {
            left: `${(slot.x / canvasWidth) * 100}%`,
            top: `${(slot.y / canvasHeight) * 100}%`,
            width: `${((slot.width ?? slot.w) / canvasWidth) * 100}%`,
            height: `${((slot.height ?? slot.h) / canvasHeight) * 100}%`,
          };
          return (
          <div key={i} className="strip-preview-slot" style={slotStyle}>
            {frames[i] ? <img src={frames[i].url} alt={`Shot ${i + 1}`} className="strip-preview-slot-img" style={{ filter: activeCss, objectFit: fitMode === 'contain' ? 'contain' : 'cover' }} /> : <div className="strip-preview-slot-empty"><span>{i + 1}</span></div>}
          </div>
          );
        })}
      </div>
    </div>
  );
}
