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
  CheckLinearIcon,
} from '@solar-icons/react';

const PAGE_SIZE = 20;

export default function GalleryView({ sessions, sessionsLoading, activeSession, formatDate, isPrinting,
  onSelect, onBack, onBackToTemplates, onLightbox, onPrint, onDelete, onDeleteMultiple, cloudQrMode = 'local' }) {
  const [cloudShareUrl, setCloudShareUrl] = useState(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState(null);
  const [qrExpanded, setQrExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [printCopies, setPrintCopies] = useState(1);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    setPrintCopies(1);
    setIsLandscape(false);
  }, [activeSession?.id]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setSelectedIds(new Set());
    setIsSelectMode(false);
  }, [sessions?.length]);

  const displayedSessions = Array.isArray(sessions) ? sessions.slice(0, visibleCount) : [];

  const toggleSelectSession = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map(s => s.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (onDeleteMultiple) {
      onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectMode(false);
    }
  };

  const cancelSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

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
    <div className={`gallery-view ${activeSession ? 'gallery-view--detail' : ''}`}>
      {!activeSession ? (
        <>
          <div className="gallery-list-header">
            <div className="gallery-list-header-left">
              <button className="back-btn session-back-btn" onClick={onBackToTemplates} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <AltArrowLeftLinearIcon size={16} /> Choose Template
              </button>
              <h2 className="section-title">Past Sessions</h2>
              {sessions.length > 0 && (
                <span className="gallery-count-badge">
                  {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
                </span>
              )}
            </div>

            {sessions.length > 0 && (
              <div className="gallery-list-header-actions">
                {isSelectMode ? (
                  <div className="gallery-bulk-bar">
                    <button
                      type="button"
                      className="bulk-action-btn bulk-action-btn--subtle"
                      onClick={toggleSelectAll}
                    >
                      {selectedIds.size === sessions.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      type="button"
                      className="bulk-action-btn bulk-action-btn--danger"
                      disabled={selectedIds.size === 0}
                      onClick={handleBulkDelete}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <TrashBinTrashLinearIcon size={16} />
                      Delete Selected ({selectedIds.size})
                    </button>
                    <button
                      type="button"
                      className="bulk-action-btn bulk-action-btn--cancel"
                      onClick={cancelSelectMode}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="action-btn action-btn--outline gallery-select-trigger"
                    onClick={() => setIsSelectMode(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', width: 'auto', padding: '0.45rem 1.1rem' }}
                  >
                    <TrashBinTrashLinearIcon size={16} />
                    <span>Select / Bulk Delete</span>
                  </button>
                )}
              </div>
            )}
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
                {displayedSessions.map(session => {
                  const isSelected = selectedIds.has(session.id);
                  return (
                    <div
                      key={session.id}
                      className={`session-card ${isSelectMode ? 'session-card--selectable' : ''} ${isSelected ? 'session-card--selected' : ''}`}
                      onClick={() => (isSelectMode ? toggleSelectSession(session.id) : onSelect(session))}
                    >
                      {isSelectMode && (
                        <div className={`session-card-check ${isSelected ? 'session-card-check--active' : ''}`}>
                          {isSelected && <CheckLinearIcon size={14} color="#ffffff" strokeWidth={3} />}
                        </div>
                      )}
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
                  );
                })}
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
          <div className={`three-col-layout three-col-layout--gallery ${isLandscape ? 'three-col-layout--landscape' : 'three-col-layout--portrait'}`}>
            <RawShots frames={activeSession.rawShots} activeCss="none" onLightbox={onLightbox} loopUrl={activeSession.loopUrl} />
            <div className="three-col-center">
              <img
                src={activeSession.stripUrl}
                alt="Final strip"
                className="final-strip-img"
                onLoad={e => {
                  if (e.target.naturalWidth && e.target.naturalHeight) {
                    setIsLandscape(e.target.naturalWidth > e.target.naturalHeight);
                  }
                }}
                onClick={() => onLightbox(activeSession.stripUrl, 'Final Strip')}
              />
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
                    {isLandscape
                      ? `${printCopies} ${printCopies === 1 ? 'Copy' : 'Copies'} = ${printCopies} 4R ${printCopies === 1 ? 'Photo' : 'Photos'}`
                      : `${printCopies} ${printCopies === 1 ? 'Copy' : 'Copies'} = ${printCopies * 2} Strips on 4x6 (Total: ${printCopies * 2} Strips)`}
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
