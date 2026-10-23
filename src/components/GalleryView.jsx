import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RawShots } from './ResultView.jsx';

export default function GalleryView({ sessions, sessionsLoading, activeSession, formatDate, isPrinting,
  onSelect, onBack, onBackToTemplates, onLightbox, onPrint, onDelete, cloudQrMode = 'local' }) {
  const [cloudShareUrl, setCloudShareUrl] = useState(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState(null);
  const [qrExpanded, setQrExpanded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!activeSession || cloudQrMode !== 'cloud') { setCloudShareUrl(activeSession?.cloudShareUrl || null); setCloudError(null); return undefined; }
    if (activeSession.cloudAssets && activeSession.cloudShareUrl) { setCloudShareUrl(activeSession.cloudShareUrl); return undefined; }
    setCloudLoading(true);
    window.electronAPI.uploadSessionCloud(activeSession.id)
      .then(result => { if (!cancelled) setCloudShareUrl(result.cloudShareUrl); })
      .catch(error => { if (!cancelled) setCloudError(error.message); })
      .finally(() => { if (!cancelled) setCloudLoading(false); });
    return () => { cancelled = true; };
  }, [activeSession, cloudQrMode]);
  return (
    <div className="gallery-view">
      {!activeSession ? (
        <>
          <div className="gallery-list-header">
            <button className="back-btn session-back-btn" onClick={onBackToTemplates}>← Choose Template</button>
            <h2 className="section-title">Past Sessions</h2>
          </div>
          {sessionsLoading && <div className="gallery-loading"><div className="spinner-large" /><p>Loading…</p></div>}
          {!sessionsLoading && sessions.length === 0 && <div className="gallery-empty"><span className="gallery-empty-icon">📭</span><p>No sessions yet.</p></div>}
          {!sessionsLoading && sessions.length > 0 && (
            <div className="session-grid">
              {sessions.map(session => (
                <div key={session.id} className="session-card" onClick={() => onSelect(session)}>
                  <img src={session.thumbUrl} alt="" className="session-card-thumb" onError={e => { e.target.src = session.stripUrl; }} />
                  <div className="session-card-info">
                    <span className="session-card-date">{formatDate(session.date)}</span>
                    <span className="session-card-count">{session.rawShots.length} shot{session.rawShots.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="gallery-detail-wrap">
          <div className="gallery-detail-header">
            <button className="back-btn session-back-btn" onClick={onBack}>← Back to Sessions</button>
            <span className="gallery-detail-date">{formatDate(activeSession.date)}</span>
          </div>
          <div className="three-col-layout three-col-layout--gallery">
            <RawShots frames={activeSession.rawShots} activeCss="none" onLightbox={onLightbox} />
            <div className="three-col-center">
              <img src={activeSession.stripUrl} alt="Final strip" className="final-strip-img" onClick={() => onLightbox(activeSession.stripUrl, 'Final Strip')} />
            </div>
            <div className="three-col-right">
              <div className="action-card">
                <h2 className="action-card-title">Share & Print</h2>
                <button type="button" className="qr-wrapper qr-wrapper--interactive" onClick={() => setQrExpanded(true)} aria-label="Enlarge QR code">
                  <QRCodeSVG value={cloudShareUrl || activeSession.shareUrl} size={150} bgColor="#ffffff" fgColor="#1e2022" level="H" />
                </button>
                <p className="qr-status">{cloudLoading ? '☁️ Generating Online QR…' : cloudError ? `📶 Local Wi-Fi QR (Offline Fallback): ${cloudError}` : cloudQrMode === 'cloud' ? '🌍 Online QR (Works on Mobile Data • 7-Day Link)' : '📶 Local Wi-Fi QR'}</p>
                {activeSession.loopUrl && <img className="boomerang-preview" src={activeSession.loopUrl} alt="Boomerang preview" />}
                <button className={`action-btn action-btn--outline ${isPrinting ? 'action-btn--loading' : ''}`} onClick={() => onPrint(activeSession.stripFilename)} disabled={isPrinting}>
                  {isPrinting ? '🖨 Printing…' : '🖨 Print Strip'}
                </button>
                <button className="action-btn action-btn--danger" onClick={() => onDelete(activeSession)}>🗑️ Delete Session</button>
              </div>
              {qrExpanded && <div className="qr-modal" role="presentation" onClick={() => setQrExpanded(false)}>
                <div className="qr-modal-card" onClick={event => event.stopPropagation()}>
                  <QRCodeSVG value={cloudShareUrl || activeSession.shareUrl} size={Math.min(window.innerWidth * 0.72, 520)} bgColor="#ffffff" fgColor="#1e2022" level="H" />
                  <p>Scan to save your photos</p>
                </div>
              </div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
