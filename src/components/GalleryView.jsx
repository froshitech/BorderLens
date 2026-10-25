import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RawShots } from './ResultView.jsx';
import {
  AltArrowLeftLinearIcon,
  PrinterLinearIcon,
  TrashBinTrashLinearIcon,
  InboxLinearIcon,
  CloudLinearIcon,
  WiFiLinearIcon,
  EarthLinearIcon,
  MinusCircleLinearIcon,
  AddCircleLinearIcon,
} from '@solar-icons/react';

const PAGE_SIZE = 20;

export default function GalleryView({ sessions, sessionsLoading, activeSession, formatDate, isPrinting,
  onSelect, onBack, onBackToTemplates, onLightbox, onPrint, onDelete, cloudQrMode = 'local' }) {
  const [cloudShareUrl, setCloudShareUrl] = useState(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState(null);
  const [qrExpanded, setQrExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [printCopies, setPrintCopies] = useState(1);

  useEffect(() => {
    setPrintCopies(1);
  }, [activeSession?.id]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sessions?.length]);

  const displayedSessions = Array.isArray(sessions) ? sessions.slice(0, visibleCount) : [];

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
            <button className="back-btn session-back-btn" onClick={onBackToTemplates} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <AltArrowLeftLinearIcon size={16} /> Choose Template
            </button>
            <h2 className="section-title">Past Sessions</h2>
          </div>
          {sessionsLoading && <div className="gallery-loading"><div className="spinner-large" /><p>Loading…</p></div>}
          {!sessionsLoading && sessions.length === 0 && (
            <div className="gallery-empty">
              <span className="gallery-empty-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <InboxLinearIcon size={54} color="var(--text-hint)" />
              </span>
              <p>No sessions yet.</p>
            </div>
          )}
          {!sessionsLoading && sessions.length > 0 && (
            <>
              <div className="session-grid">
                {displayedSessions.map(session => (
                  <div key={session.id} className="session-card" onClick={() => onSelect(session)}>
                    <img
                      src={session.thumbUrl}
                      alt=""
                      className="session-card-thumb"
                      loading="lazy"
                      decoding="async"
                      onError={e => { e.target.src = session.stripUrl; }}
                    />
                    <div className="session-card-info">
                      <span className="session-card-date">{formatDate(session.date)}</span>
                      <span className="session-card-count">{session.rawShots.length} shot{session.rawShots.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
              {visibleCount < sessions.length && (
                <div className="gallery-pagination">
                  <button
                    type="button"
                    className="action-btn action-btn--outline"
                    onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                  >
                    Load More Sessions ({displayedSessions.length} of {sessions.length})
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="gallery-detail-wrap">
          <div className="gallery-detail-header">
            <button className="back-btn session-back-btn" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <AltArrowLeftLinearIcon size={16} /> Back to Sessions
            </button>
            <span className="gallery-detail-date">{formatDate(activeSession.date)}</span>
          </div>
          <div className="three-col-layout three-col-layout--gallery">
            <RawShots frames={activeSession.rawShots} activeCss="none" onLightbox={onLightbox} loopUrl={activeSession.loopUrl} />
            <div className="three-col-center">
              <img src={activeSession.stripUrl} alt="Final strip" className="final-strip-img" onClick={() => onLightbox(activeSession.stripUrl, 'Final Strip')} />
            </div>
            <div className="three-col-right">
              <div className="action-card">
                <h2 className="action-card-title">Share &amp; Print</h2>
                <button type="button" className="qr-wrapper qr-wrapper--interactive" onClick={() => !cloudLoading && setQrExpanded(true)} aria-label="Enlarge QR code">
                  {cloudLoading ? (
                    <div style={{ width: 150, height: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#ffffff', borderRadius: '12px' }}>
                      <div className="spinner" style={{ width: 28, height: 28 }} />
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Uploading…</span>
                    </div>
                  ) : (
                    <QRCodeSVG value={cloudShareUrl || activeSession.shareUrl} size={150} bgColor="#ffffff" fgColor="#1e2022" level="H" />
                  )}
                </button>
                <p className="qr-status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                  {cloudLoading ? (
                    <><CloudLinearIcon size={15} /> Generating Online QR…</>
                  ) : cloudError ? (
                    <><WiFiLinearIcon size={15} /> Local Wi-Fi QR (Offline Fallback): {cloudError}</>
                  ) : cloudQrMode === 'cloud' ? (
                    <><EarthLinearIcon size={15} /> Online QR (Works on Mobile Data • 7-Day Link)</>
                  ) : (
                    <><WiFiLinearIcon size={15} /> Local Wi-Fi QR</>
                  )}
                </p>

                {/* Copy Quantity Counter */}
                <div className="print-qty-control">
                  <span className="print-qty-label">Print Quantity</span>
                  <div className="print-qty-stepper">
                    <button
                      type="button"
                      className="print-qty-btn"
                      onClick={() => setPrintCopies(prev => Math.max(1, prev - 1))}
                      disabled={isPrinting || printCopies <= 1}
                      aria-label="Decrease copies"
                    >
                      <MinusCircleLinearIcon size={22} />
                    </button>
                    <div className="print-qty-display">
                      <span className="print-qty-num">{printCopies}</span>
                      <span className="print-qty-unit">{printCopies === 1 ? 'copy' : 'copies'}</span>
                    </div>
                    <button
                      type="button"
                      className="print-qty-btn"
                      onClick={() => setPrintCopies(prev => Math.min(5, prev + 1))}
                      disabled={isPrinting || printCopies >= 5}
                      aria-label="Increase copies"
                    >
                      <AddCircleLinearIcon size={22} />
                    </button>
                  </div>
                  <p className="print-qty-hint">
                    {printCopies} {printCopies === 1 ? 'Copy' : 'Copies'} = {printCopies * 2} Strips on 4x6 (Total: {printCopies * 2} Strips)
                  </p>
                </div>

                <button
                  className={`action-btn action-btn--outline ${isPrinting ? 'action-btn--loading' : ''}`}
                  onClick={() => onPrint(activeSession.stripFilename, printCopies)}
                  disabled={isPrinting}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
                >
                  <PrinterLinearIcon size={18} />
                  <span>{isPrinting ? 'Printing…' : `Print ${printCopies} ${printCopies === 1 ? 'Copy' : 'Copies'}`}</span>
                </button>
                <button
                  className="action-btn action-btn--danger"
                  onClick={() => onDelete(activeSession)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
                >
                  <TrashBinTrashLinearIcon size={18} />
                  <span>Delete Session</span>
                </button>
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
