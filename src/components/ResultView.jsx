import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function ResultView({ resultPhotoUrl, resultShareUrl, resultLoopUrl, rawFrames, activeCss,
  template, resultFilename, isPrinting, onPrint, onNewSession, onLightbox, cloudQrMode = 'local' }) {
  const [cloudShareUrl, setCloudShareUrl] = useState(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState(null);
  const [qrExpanded, setQrExpanded] = useState(false);
  const sessionId = resultFilename?.replace(/^strip_/, '').replace(/\.jpg$/, '');
  useEffect(() => {
    let cancelled = false;
    if (cloudQrMode !== 'cloud' || !sessionId) { setCloudShareUrl(null); setCloudError(null); return undefined; }
    setCloudLoading(true);
    window.electronAPI.uploadSessionCloud(sessionId)
      .then(result => { if (!cancelled) setCloudShareUrl(result.cloudShareUrl); })
      .catch(error => { if (!cancelled) setCloudError(error.message); })
      .finally(() => { if (!cancelled) setCloudLoading(false); });
    return () => { cancelled = true; };
  }, [cloudQrMode, sessionId]);
  useEffect(() => {
    if (cloudShareUrl) console.log('[cloud] Viewer QR URL:', cloudShareUrl);
  }, [cloudShareUrl]);
  if (!resultPhotoUrl) return null;
  const qrUrl = cloudShareUrl || resultShareUrl;
  const isLandscape = (template?.width && template?.height)
    ? template.width > template.height
    : template?.orientation === 'landscape' || template?.layoutMode === 'landscape';
  return (
    <>
    <div className={`three-col-layout ${isLandscape ? 'three-col-layout--landscape' : 'three-col-layout--portrait'}`}>
      <RawShots frames={rawFrames} activeCss={activeCss} onLightbox={onLightbox} loopUrl={resultLoopUrl} />
      <div className="three-col-center">
        <img src={resultPhotoUrl} alt="Final strip" className="final-strip-img" onClick={() => onLightbox(resultPhotoUrl, 'Your strip')} />
      </div>
      <div className="three-col-right">
        <div className="action-card">
          <h2 className="action-card-title">🎉 Ready!</h2>
          <p className="action-card-sub">Scan to save on your phone</p>
          <button type="button" className="qr-wrapper qr-wrapper--interactive" onClick={() => setQrExpanded(true)} aria-label="Enlarge QR code">
            <QRCodeSVG value={qrUrl} size={170} bgColor="#ffffff" fgColor="#1e2022" level="H" />
          </button>
          <p className="qr-status">{cloudLoading ? '☁️ Generating Online QR…' : cloudError ? `📶 Local Wi-Fi QR (Offline Fallback): ${cloudError}` : cloudQrMode === 'cloud' ? '🌍 Online QR (Works on Mobile Data • 7-Day Link)' : '📶 Local Wi-Fi QR'}</p>
          <button className={`action-btn action-btn--outline ${isPrinting ? 'action-btn--loading' : ''}`} onClick={() => onPrint(resultFilename)} disabled={isPrinting}>
            {isPrinting ? '🖨 Printing…' : '🖨 Print 4R Strip'}
          </button>
          <button className="cta-btn new-session-btn" onClick={onNewSession}>✨ New Session</button>
        </div>
      </div>
    </div>
    {qrExpanded && <div className="qr-modal" role="presentation" onClick={() => setQrExpanded(false)}>
      <div className="qr-modal-card" onClick={event => event.stopPropagation()}>
        <QRCodeSVG value={qrUrl} size={Math.min(window.innerWidth * 0.72, 520)} bgColor="#ffffff" fgColor="#1e2022" level="H" />
        <p>Scan to save your photos</p>
      </div>
    </div>}
    </>
  );
}

export function RawShots({ frames, activeCss, onLightbox, loopUrl }) {
  return (
    <div className="three-col-left">
      <div className="raw-shots-section">
        <p className="col-label">Raw Shots</p>
        <div className="raw-shots-grid">
          {frames.map((frame, i) => (
            <div key={frame.filename || i} className="raw-shot-card" onClick={() => onLightbox(frame.url, `Shot ${i + 1}`)}>
              <img src={frame.url} alt={`Shot ${i + 1}`} className="raw-shot-img" style={{ filter: activeCss }} />
              <span className="raw-shot-num">Shot {i + 1}</span>
            </div>
          ))}
        </div>
      </div>
      {loopUrl && (
        <div className="gif-section">
          <p className="col-label">Animated GIF</p>
          <div className="gif-container" onClick={() => onLightbox && onLightbox(loopUrl, 'Animated GIF')}>
            <img className="boomerang-preview raw-shots-boomerang" src={loopUrl} alt="Boomerang preview" />
          </div>
        </div>
      )}
    </div>
  );
}
