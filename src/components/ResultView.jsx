import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function ResultView({ resultPhotoUrl, resultShareUrl, resultLoopUrl, rawFrames, activeCss,
  resultFilename, isPrinting, onPrint, onNewSession, onLightbox, cloudQrMode = 'local' }) {
  const [cloudShareUrl, setCloudShareUrl] = useState(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState(null);
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
  if (!resultPhotoUrl) return null;
  const qrUrl = cloudShareUrl || resultShareUrl;
  return (
    <div className="three-col-layout">
      <RawShots frames={rawFrames} activeCss={activeCss} onLightbox={onLightbox} />
      <div className="three-col-center">
        <img src={resultPhotoUrl} alt="Final strip" className="final-strip-img" onClick={() => onLightbox(resultPhotoUrl, 'Your strip')} />
      </div>
      <div className="three-col-right">
        <div className="action-card">
          <h2 className="action-card-title">🎉 Ready!</h2>
          <p className="action-card-sub">Scan to save on your phone</p>
          <div className="qr-wrapper"><QRCodeSVG value={qrUrl} size={170} bgColor="#ffffff" fgColor="#1e2022" level="H" /></div>
          <p className="qr-status">{cloudLoading ? '☁️ Generating Online QR…' : cloudError ? `📶 Local Wi-Fi QR (Offline Fallback): ${cloudError}` : cloudQrMode === 'cloud' ? '🌍 Online QR (Works on Mobile Data • 7-Day Link)' : '📶 Local Wi-Fi QR'}</p>
          <p className="qr-url">{qrUrl}</p>
          {resultLoopUrl && <img className="boomerang-preview" src={resultLoopUrl} alt="Boomerang preview" />}
          <button className={`action-btn action-btn--outline ${isPrinting ? 'action-btn--loading' : ''}`} onClick={() => onPrint(resultFilename)} disabled={isPrinting}>
            {isPrinting ? '🖨 Printing…' : '🖨 Print 4R Strip'}
          </button>
          <button className="cta-btn new-session-btn" onClick={onNewSession}>✨ New Session</button>
        </div>
      </div>
    </div>
  );
}

export function RawShots({ frames, activeCss, onLightbox }) {
  return (
    <div className="three-col-left">
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
  );
}
