import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  PrinterLinearIcon,
  StarsBoldIcon,
  CloudLinearIcon,
  WiFiLinearIcon,
  EarthLinearIcon,
  MinusCircleLinearIcon,
  AddCircleLinearIcon,
  Tuning2LinearIcon,
} from '@solar-icons/react';
import PrintOptionsModal from './PrintOptionsModal.jsx';

export default function ResultView({ resultPhotoUrl, resultShareUrl, resultLoopUrl, rawFrames, activeCss,
  template, resultFilename, isPrinting, onPrint, paperType = 'matte', onPaperTypeChange, printQuality = 'high', onPrintQualityChange,
  stripLayout = 'dual', onStripLayoutChange, onNewSession, onLightbox, cloudQrMode = 'local' }) {
  const [cloudShareUrl, setCloudShareUrl] = useState(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState(null);
  const [qrExpanded, setQrExpanded] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printCopies, setPrintCopies] = useState(1);
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
  const totalStrips = isLandscape ? printCopies : printCopies * (stripLayout === 'single' ? 1 : 2);
  return (
    <>
    <div className={`three-col-layout ${isLandscape ? 'three-col-layout--landscape' : 'three-col-layout--portrait'}`}>
      <RawShots frames={rawFrames} activeCss={activeCss} onLightbox={onLightbox} loopUrl={resultLoopUrl} />
      <div className="three-col-center">
        <img src={resultPhotoUrl} alt="Final strip" className="final-strip-img" onClick={() => onLightbox(resultPhotoUrl, 'Your strip')} />
      </div>
      <div className="three-col-right">
        <div className="action-card">
          <h2 className="action-card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <StarsBoldIcon size={24} color="var(--accent)" /> Ready!
          </h2>
          <p className="action-card-sub">Scan to save on your phone</p>
          <button type="button" className="qr-wrapper qr-wrapper--interactive" onClick={() => setQrExpanded(true)} aria-label="Enlarge QR code">
            <QRCodeSVG value={qrUrl} size={170} bgColor="#ffffff" fgColor="#1e2022" level="H" />
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
                : `${printCopies} ${printCopies === 1 ? 'Copy' : 'Copies'} = ${totalStrips} ${totalStrips === 1 ? 'Strip' : 'Strips'} (${stripLayout === 'single' ? 'Single' : 'Dual on 4x6'})`}
            </p>
          </div>

          {/* Clean Print Options Modal Trigger */}
          <button
            type="button"
            className="print-options-trigger-btn"
            onClick={() => setShowPrintModal(true)}
            title="Configure layout, paper media type and print resolution"
          >
            <div className="print-options-trigger-info">
              <Tuning2LinearIcon size={16} color="var(--accent)" />
              <div className="print-options-trigger-text">
                <strong>{stripLayout === 'single' ? '1 Strip' : '2 Strips'}</strong>
                <span className="print-options-trigger-dot">•</span>
                <span>{paperType === 'matte' ? 'Matte' : paperType === 'glossy' ? 'Glossy' : 'Plain'}</span>
                <span className="print-options-trigger-dot">•</span>
                <span>{printQuality === 'high' ? '600 DPI' : '300 DPI'}</span>
              </div>
            </div>
            <span className="print-options-trigger-action">Options</span>
          </button>

          <button
            className={`action-btn action-btn--outline ${isPrinting ? 'action-btn--loading' : ''}`}
            onClick={() => onPrint(resultFilename, printCopies, { paperType, printQuality, stripLayout })}
            disabled={isPrinting}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
          >
            <PrinterLinearIcon size={18} />
            <span>{isPrinting ? 'Printing…' : `Print ${printCopies} ${printCopies === 1 ? 'Copy' : 'Copies'}`}</span>
          </button>
          <button
            className="cta-btn new-session-btn"
            onClick={onNewSession}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <StarsBoldIcon size={20} />
            <span>New Session</span>
          </button>
        </div>
      </div>
    </div>
    {qrExpanded && <div className="qr-modal" role="presentation" onClick={() => setQrExpanded(false)}>
      <div className="qr-modal-card" onClick={event => event.stopPropagation()}>
        <QRCodeSVG value={qrUrl} size={Math.min(window.innerWidth * 0.72, 520)} bgColor="#ffffff" fgColor="#1e2022" level="H" />
        <p>Scan to save your photos</p>
      </div>
    </div>}
    <PrintOptionsModal
      isOpen={showPrintModal}
      onClose={() => setShowPrintModal(false)}
      paperType={paperType}
      onPaperTypeChange={onPaperTypeChange}
      printQuality={printQuality}
      onPrintQualityChange={onPrintQualityChange}
      stripLayout={stripLayout}
      onStripLayoutChange={onStripLayoutChange}
    />
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
