import React from 'react';
import {
  PrinterBoldIcon,
  DocumentTextLinearIcon,
  DocumentTextBoldIcon,
  StarsLinearIcon,
  StarsBoldIcon,
  FileLinearIcon,
  FileBoldIcon,
  MagicWand2LinearIcon,
  MagicWand2BoldIcon,
  BoltLinearIcon,
  BoltBoldIcon,
  CheckCircleBoldIcon,
  CopyLinearIcon,
  CopyBoldIcon,
  DocumentLinearIcon,
  DocumentBoldIcon,
} from '@solar-icons/react';

export default function PrintOptionsModal({
  isOpen,
  onClose,
  paperType = 'matte',
  onPaperTypeChange,
  printQuality = 'high',
  onPrintQualityChange,
  stripLayout = 'dual',
  onStripLayoutChange,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal print-config-modal"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <PrinterBoldIcon size={22} color="var(--accent)" />
            <span>Print Settings</span>
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close print settings"
          >
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Strip Layout Selection */}
          <div className="print-modal-section">
            <span className="print-modal-label">Strip Layout &amp; Copies Per Page</span>
            <div className="print-modal-options print-modal-options--grid">
              {/* Dual Strips (2 Copies) */}
              <div
                className={`print-modal-option ${stripLayout === 'dual' ? 'print-modal-option--active' : ''}`}
                onClick={() => onStripLayoutChange?.('dual')}
              >
                <div className="print-modal-option-header">
                  <div className="print-modal-option-title">
                    {stripLayout === 'dual' ? (
                      <CopyBoldIcon size={18} color="var(--accent)" />
                    ) : (
                      <CopyLinearIcon size={18} />
                    )}
                    <span>2 Strips (Dual 2×6 on 4×6)</span>
                  </div>
                  {stripLayout === 'dual' && <CheckCircleBoldIcon size={18} color="var(--accent)" />}
                </div>
                <p className="print-modal-option-desc">
                  Duplicates strips side-by-side. Fills standard 4×6 photo paper or 105mm half-cut A4 sheets.
                </p>
              </div>

              {/* Single Strip (1 Copy) */}
              <div
                className={`print-modal-option ${stripLayout === 'single' ? 'print-modal-option--active' : ''}`}
                onClick={() => onStripLayoutChange?.('single')}
              >
                <div className="print-modal-option-header">
                  <div className="print-modal-option-title">
                    {stripLayout === 'single' ? (
                      <DocumentBoldIcon size={18} color="var(--accent)" />
                    ) : (
                      <DocumentLinearIcon size={18} />
                    )}
                    <span>1 Strip (Single 2×6)</span>
                  </div>
                  {stripLayout === 'single' && <CheckCircleBoldIcon size={18} color="var(--accent)" />}
                </div>
                <p className="print-modal-option-desc">
                  Prints one single strip aligned to the leading edge of the sheet.
                </p>
              </div>
            </div>
          </div>

          {/* Paper Media Selection */}
          <div className="print-modal-section">
            <span className="print-modal-label">Paper Media Type</span>
            <div className="print-modal-options">
              {/* Matte */}
              <div
                className={`print-modal-option ${paperType === 'matte' ? 'print-modal-option--active' : ''}`}
                onClick={() => onPaperTypeChange?.('matte')}
              >
                <div className="print-modal-option-header">
                  <div className="print-modal-option-title">
                    {paperType === 'matte' ? (
                      <DocumentTextBoldIcon size={18} color="var(--accent)" />
                    ) : (
                      <DocumentTextLinearIcon size={18} />
                    )}
                    <span>Matte Photo Paper</span>
                  </div>
                  {paperType === 'matte' && <CheckCircleBoldIcon size={18} color="var(--accent)" />}
                </div>
                <p className="print-modal-option-desc">
                  Optimized for non-reflective matte sheets. Adds unsharp masking &amp; saturation lift to counter ink absorption.
                </p>
              </div>

              {/* Glossy */}
              <div
                className={`print-modal-option ${paperType === 'glossy' ? 'print-modal-option--active' : ''}`}
                onClick={() => onPaperTypeChange?.('glossy')}
              >
                <div className="print-modal-option-header">
                  <div className="print-modal-option-title">
                    {paperType === 'glossy' ? (
                      <StarsBoldIcon size={18} color="var(--accent)" />
                    ) : (
                      <StarsLinearIcon size={18} />
                    )}
                    <span>Glossy Photo Paper</span>
                  </div>
                  {paperType === 'glossy' && <CheckCircleBoldIcon size={18} color="var(--accent)" />}
                </div>
                <p className="print-modal-option-desc">
                  Standard reflective photo media. Delivers vibrant highlights and natural balanced contrast.
                </p>
              </div>

              {/* Plain */}
              <div
                className={`print-modal-option ${paperType === 'plain' ? 'print-modal-option--active' : ''}`}
                onClick={() => onPaperTypeChange?.('plain')}
              >
                <div className="print-modal-option-header">
                  <div className="print-modal-option-title">
                    {paperType === 'plain' ? (
                      <FileBoldIcon size={18} color="var(--accent)" />
                    ) : (
                      <FileLinearIcon size={18} />
                    )}
                    <span>Standard / Plain Paper</span>
                  </div>
                  {paperType === 'plain' && <CheckCircleBoldIcon size={18} color="var(--accent)" />}
                </div>
                <p className="print-modal-option-desc">
                  For draft test runs on standard copy/bond paper without consuming photo media.
                </p>
              </div>
            </div>
          </div>

          {/* Print Resolution Selection */}
          <div className="print-modal-section">
            <span className="print-modal-label">Print Resolution &amp; Quality</span>
            <div className="print-modal-options print-modal-options--grid">
              {/* High Quality */}
              <div
                className={`print-modal-option ${printQuality === 'high' ? 'print-modal-option--active' : ''}`}
                onClick={() => onPrintQualityChange?.('high')}
              >
                <div className="print-modal-option-header">
                  <div className="print-modal-option-title">
                    {printQuality === 'high' ? (
                      <MagicWand2BoldIcon size={18} color="var(--accent)" />
                    ) : (
                      <MagicWand2LinearIcon size={18} />
                    )}
                    <span>High Quality (600 DPI)</span>
                  </div>
                  {printQuality === 'high' && <CheckCircleBoldIcon size={18} color="var(--accent)" />}
                </div>
                <p className="print-modal-option-desc">
                  Maximum sharpness and fine detail. Ideal for event keepsakes.
                </p>
              </div>

              {/* Standard Quality */}
              <div
                className={`print-modal-option ${printQuality === 'standard' ? 'print-modal-option--active' : ''}`}
                onClick={() => onPrintQualityChange?.('standard')}
              >
                <div className="print-modal-option-header">
                  <div className="print-modal-option-title">
                    {printQuality === 'standard' ? (
                      <BoltBoldIcon size={18} color="var(--accent)" />
                    ) : (
                      <BoltLinearIcon size={18} />
                    )}
                    <span>Standard Quality (300 DPI)</span>
                  </div>
                  {printQuality === 'standard' && <CheckCircleBoldIcon size={18} color="var(--accent)" />}
                </div>
                <p className="print-modal-option-desc">
                  Faster printing throughput for high-volume queues.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
          <button
            type="button"
            className="cta-btn"
            onClick={onClose}
            style={{ padding: '0.65rem 1.4rem', fontSize: '0.85rem' }}
          >
            Apply &amp; Done
          </button>
        </div>
      </div>
    </div>
  );
}
