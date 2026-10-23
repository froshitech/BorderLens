import React, { useEffect } from 'react';

export default function CameraView({
  mode, videoRef, mirror, isStreamReady, isCapturing, isCounting, countdown,
  shotCount, capturedCount, currentShotIdx, retakingIdx, captureDisabled, onStart, onBack, error, rawFrames = [],
}) {
  useEffect(() => {
    const handleShortcut = (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || target.isContentEditable;
      if (isTyping || isCapturing || isCounting || captureDisabled) return;
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      event.preventDefault();
      onStart();
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [captureDisabled, isCapturing, isCounting, onStart]);

  return (
    <div className="live-fullscreen">
      <button className="live-back-btn" type="button" onClick={onBack}>
        ← Templates
      </button>
      <div className="live-camera-stage">
        {mode === 'webcam' ? (
          <video ref={videoRef} autoPlay playsInline className="live-video"
            style={{ filter: 'none', transform: mirror ? 'scaleX(-1)' : 'none' }} />
        ) : (
          <div className="live-dslr-bg"><div className="dslr-icon">📷</div><p>DSLR Ready</p></div>
        )}
        {!isStreamReady && mode === 'webcam' && (
          <div className="live-starting"><div className="spinner-large" /><p>Starting camera…</p></div>
        )}
        {isCounting && (
          <div className="countdown-overlay">
            {shotCount > 1 && <ShotProgress shotCount={shotCount} capturedCount={capturedCount} currentShotIdx={currentShotIdx} />}
            <span key={String(countdown)} className={`countdown-number ${countdown === 'SMILE!' ? 'countdown-smile' : ''}`}>{countdown}</span>
          </div>
        )}
        {!isCapturing && !isCounting && (
          <div className="live-action-area">
            {retakingIdx !== null && <div className="live-retake-prompt">Retaking Shot #{retakingIdx + 1}</div>}
            <div className="live-instruction">
              <span className="live-instruction-icon">✦</span>
              <span>Strike your best pose! {shotCount} shot{shotCount === 1 ? '' : 's'} will be taken automatically.</span>
            </div>
            <button className="live-cta-btn" onClick={onStart} disabled={captureDisabled}>
              📸 Start Capture {shotCount > 1 ? `(${shotCount} Shots)` : ''}
              <small className="live-shortcut-hint">Press SPACEBAR or ENTER</small>
            </button>
          </div>
        )}
        {isCapturing && !isCounting && shotCount > 1 && (
          <ShotProgress shotCount={shotCount} capturedCount={capturedCount} currentShotIdx={currentShotIdx} />
        )}
      </div>
      <CapturedShotsSidebar shotCount={shotCount} frames={rawFrames} />
      {error && <div className="live-error-bar">{error}</div>}
    </div>
  );
}

function CapturedShotsSidebar({ shotCount, frames }) {
  return (
    <aside className="live-shots-sidebar" aria-label="Captured shots">
      <div className="live-shots-sidebar-header">
        <strong>Live shots</strong>
        <span>{frames.length}/{shotCount}</span>
      </div>
      <div className="live-shot-slots">
        {Array.from({ length: shotCount }).map((_, index) => {
          const frame = frames[index];
          return (
            <div className={`live-shot-slot ${frame ? 'live-shot-slot--filled' : ''}`} key={index}>
              {frame ? <img src={frame.url} alt={`Captured shot ${index + 1}`} /> : <span>Shot {index + 1}</span>}
              {frame && <b className="live-shot-check" aria-label="Captured">✓</b>}
              {!frame && <small>Waiting…</small>}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function ShotProgress({ shotCount, capturedCount, currentShotIdx }) {
  return (
    <div className="live-shot-pill">
      Shot {Math.min(capturedCount + 1, shotCount)} of {shotCount}
      {Array.from({ length: shotCount }).map((_, i) => (
        <span key={i} className={`shot-dot-inline ${i < capturedCount ? 'shot-dot-inline--done' : i === currentShotIdx ? 'shot-dot-inline--active' : ''}`} />
      ))}
    </div>
  );
}
