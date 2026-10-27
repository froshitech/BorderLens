import { useState, useRef, useEffect, useCallback } from 'react';
import THEMES from '../themes.js';
import {
  FILTERS, STEP_LABELS, PAUSE_BETWEEN_SHOTS_MS, FLASH_DURATION_MS, AUTO_PROCEED_SEC,
  LS_CUSTOM_TEMPLATES, LS_LAST_TEMPLATE, LS_MODE, LS_SELECTED_DEVICE, LS_MIRROR,
  LS_SHOT_OVERRIDE, LS_COUNTDOWN_DURATION, LS_FLASH_ENABLED, LS_THEME, LS_CUSTOM_ACCENT,
  makeSessionTs, lsGet, lsSet, normalizeCustomTemplates, formatDate, applyTheme,
  stopAllMediaStreams,
} from '../utils/helpers.js';

export default function useBooth() {
  const [step, setStep] = useState('TEMPLATE_SELECTION');

  // ── Operator Settings page ───────────────────────────────────────────────────
  const settingsReturnStepRef = useRef('TEMPLATE_SELECTION');
  const [builtinTemplates, setBuiltinTemplates] = useState([]);
  const [outputDir, setOutputDir] = useState('');
  const [digiCamControlPath, setDigiCamControlPath] = useState('');
  const [digiCamControlAvailable, setDigiCamControlAvailable] = useState(false);
  const [mode,           setMode]           = useState(() => lsGet(LS_MODE, 'webcam'));
  const [mirror,         setMirror]         = useState(() => lsGet(LS_MIRROR, true));
  const [shotOverride,   setShotOverride]   = useState(() => lsGet(LS_SHOT_OVERRIDE, null));
  const [countdownDuration, setCountdownDuration] = useState(() => {
    const saved = lsGet(LS_COUNTDOWN_DURATION, 3);
    return [3, 5, 10].includes(saved) ? saved : 3;
  });
  const [flashEnabled, setFlashEnabled] = useState(() => lsGet(LS_FLASH_ENABLED, true));
  const [cloudQrMode, setCloudQrMode] = useState(() => lsGet('pb_cloud_qr_mode', 'local'));
  const [cloudStatus, setCloudStatus] = useState({ configured: false, online: false });
  const [hiddenBuiltins, setHiddenBuiltins] = useState(() => lsGet('pb_hidden_builtins', []));
  const [builtinSlotOverrides, setBuiltinSlotOverrides] = useState(() => lsGet('pb_builtin_slot_overrides', {}));
  const [activeTheme, setActiveTheme] = useState(() => lsGet(LS_THEME, 'lavender-dream'));
  const [customAccent, setCustomAccent] = useState(() => lsGet(LS_CUSTOM_ACCENT, null));
  const [templateEditorId, setTemplateEditorId] = useState(null);

  // ── Template & filter ───────────────────────────────────────────────────────
  const [selectedTemplate,    setSelectedTemplate]    = useState(null);
  const [customTemplates,     setCustomTemplates]     = useState(() => normalizeCustomTemplates(lsGet(LS_CUSTOM_TEMPLATES, [])));
  const [activeFilter,        setActiveFilter]        = useState('normal');
  const [templateThumbSrc,    setTemplateThumbSrc]    = useState(null); // for strip preview
  const [templateInfo,        setTemplateInfo]        = useState(null);

  // ── Result ──────────────────────────────────────────────────────────────────
  const [resultFilename, setResultFilename] = useState(null);
  const [resultPhotoUrl, setResultPhotoUrl] = useState(null);
  const [resultShareUrl, setResultShareUrl] = useState(null);
  const [resultLoopUrl, setResultLoopUrl] = useState(null);

  // ── Camera ──────────────────────────────────────────────────────────────────
  const [isStreamReady,    setIsStreamReady]    = useState(false);
  const [devices,          setDevices]          = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => lsGet(LS_SELECTED_DEVICE, ''));

  // ── Shooting sequence ────────────────────────────────────────────────────────
  const [shotCount,      setShotCount]      = useState(2);
  const [countdown,      setCountdown]      = useState(null);
  const [isCapturing,    setIsCapturing]    = useState(false);
  const [isProcessing,   setIsProcessing]   = useState(false);
  const [currentShotIdx, setCurrentShotIdx] = useState(0);
  const [capturedCount,  setCapturedCount]  = useState(0);
  const [showFlash,      setShowFlash]      = useState(false);
  const [error,          setError]          = useState(null);

  const [rawFrames,      setRawFrames]      = useState([]);
  const [sessionTs,      setSessionTs]      = useState(null);
  const [retakingIdx,    setRetakingIdx]    = useState(null);
  const [autoProceedSec, setAutoProceedSec] = useState(null);

  // ── Gallery ──────────────────────────────────────────────────────────────────
  const [sessions,        setSessions]        = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeSession,   setActiveSession]   = useState(null);
  const [lightboxUrl,     setLightboxUrl]     = useState(null);
  const [lightboxLabel,   setLightboxLabel]   = useState('');

  // ── Misc ─────────────────────────────────────────────────────────────────────
  const [isPrinting, setIsPrinting] = useState(false);
  const [printMsg,   setPrintMsg]   = useState(null);
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [paperType, setPaperType] = useState(() => lsGet('pb_paper_type', 'matte'));
  const [printQuality, setPrintQuality] = useState(() => lsGet('pb_print_quality', 'high'));
  const [stripLayout, setStripLayout] = useState(() => lsGet('pb_strip_layout', 'dual'));
  const [silentPrint, setSilentPrint] = useState(() => lsGet('pb_silent_print', true));
  const [printerToast, setPrinterToast] = useState(null);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const videoRef          = useRef(null);
  const streamRef         = useRef(null);
  const activeStreamRef   = useRef(null);
  const countdownTimerRef = useRef(null);
  const pauseTimeoutRef   = useRef(null);
  const autoProceedRef    = useRef(null);
  const captureSequenceRef = useRef(0);
  const retakeStartedRef = useRef(null);

  // ─── Persist settings ────────────────────────────────────────────────────────
  useEffect(() => { lsSet(LS_MODE,   mode);   }, [mode]);
  useEffect(() => { lsSet(LS_SELECTED_DEVICE, selectedDeviceId); }, [selectedDeviceId]);
  useEffect(() => { lsSet(LS_MIRROR, mirror); }, [mirror]);
  useEffect(() => { lsSet(LS_SHOT_OVERRIDE, shotOverride); }, [shotOverride]);
  useEffect(() => { lsSet(LS_COUNTDOWN_DURATION, countdownDuration); }, [countdownDuration]);
  useEffect(() => { lsSet(LS_FLASH_ENABLED, flashEnabled); }, [flashEnabled]);
  useEffect(() => { lsSet('pb_cloud_qr_mode', cloudQrMode); }, [cloudQrMode]);
  useEffect(() => { lsSet(LS_CUSTOM_TEMPLATES, customTemplates); }, [customTemplates]);
  useEffect(() => { lsSet(LS_THEME, activeTheme); }, [activeTheme]);
  useEffect(() => { lsSet(LS_CUSTOM_ACCENT, customAccent); }, [customAccent]);
  useEffect(() => { applyTheme(THEMES[activeTheme] || THEMES['lavender-dream'], customAccent); }, [activeTheme, customAccent]);
  useEffect(() => { lsSet('pb_hidden_builtins', hiddenBuiltins); }, [hiddenBuiltins]);
  useEffect(() => { lsSet('pb_builtin_slot_overrides', builtinSlotOverrides); }, [builtinSlotOverrides]);
  useEffect(() => { lsSet('pb_paper_type', paperType); }, [paperType]);
  useEffect(() => { lsSet('pb_print_quality', printQuality); }, [printQuality]);
  useEffect(() => { lsSet('pb_strip_layout', stripLayout); }, [stripLayout]);
  useEffect(() => { lsSet('pb_silent_print', silentPrint); }, [silentPrint]);

  useEffect(() => {
    if (step !== 'SETTINGS') return;
    Promise.all([
      window.electronAPI.getSystemPrinters(),
      window.electronAPI.getSavedPrinter(),
      window.electronAPI.getPrinterConfig ? window.electronAPI.getPrinterConfig() : Promise.resolve(null),
    ]).then(([availablePrinters, savedPrinter, printerCfg]) => {
      setPrinters(availablePrinters || []);
      const activePrinterName = printerCfg?.printerName || savedPrinter || availablePrinters?.find(p => p.isDefault)?.name || '';
      setSelectedPrinter(activePrinterName);
      if (printerCfg?.paperType) setPaperType(printerCfg.paperType);
      if (printerCfg?.printQuality) setPrintQuality(printerCfg.printQuality);
      if (printerCfg?.stripLayout) setStripLayout(printerCfg.stripLayout);
      if (printerCfg?.silentPrint !== undefined) setSilentPrint(printerCfg.silentPrint);
    }).catch(err => setError(`Could not load printers: ${err.message}`));
    window.electronAPI.getCloudStatus()
      .then(setCloudStatus)
      .catch(err => setCloudStatus({ configured: false, online: false, error: err.message }));
  }, [step]);

  useEffect(() => {
    Promise.all([
      window.electronAPI.getBuiltinTemplates(),
      window.electronAPI.getSettings(),
    ]).then(([templates, settings]) => {
      setBuiltinTemplates(templates || []);
      setOutputDir(settings?.outputDir || '');
      setDigiCamControlPath(settings?.digiCamControlPath || '');
      setDigiCamControlAvailable(Boolean(settings?.digiCamControlAvailable));
    }).catch(err => setError(`Could not load studio settings: ${err.message}`));
  }, []);

  // ─── Load template thumbnail for strip preview ────────────────────────────────
  useEffect(() => {
    if (!selectedTemplate?.overlayPngPath) { setTemplateThumbSrc(null); setTemplateInfo(null); return; }
    window.electronAPI.getTemplateThumbnail(selectedTemplate.overlayPngPath)
      .then(url => setTemplateThumbSrc(url || null))
      .catch(() => setTemplateThumbSrc(null));
    window.electronAPI.getTemplateInfo(selectedTemplate.overlayPngPath)
      .then(info => setTemplateInfo(info || null))
      .catch(() => setTemplateInfo(null));
  }, [selectedTemplate]);

  // ─── Auto-detect shot count from template slots ───────────────────────────────
  useEffect(() => {
    if (shotOverride !== null) { setShotCount(shotOverride); return; }
    if (!selectedTemplate?.overlayPngPath) return;
    window.electronAPI.getTemplateInfo(selectedTemplate.overlayPngPath)
      .then(info => { if (info?.slots?.length > 1) setShotCount(info.slots.length); })
      .catch(() => {});
  }, [selectedTemplate, shotOverride]);

  // ─── Webcam lifecycle ─────────────────────────────────────────────────────────
  const isCaptureViewActive = (step === 'LIVE_VIEW' || (step === 'REVIEW_SHOTS' && retakingIdx !== null));

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch (_) {}
      });
      streamRef.current = null;
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch (_) {}
      });
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause?.();
        videoRef.current.srcObject = null;
      } catch (_) {}
    }
    stopAllMediaStreams();
    setIsStreamReady(false);
  }, []);

  useEffect(() => {
    let activeStream = null;
    let isCurrentEffect = true;

    async function startCamera() {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        if (!isCurrentEffect) return;
        const vids = all.filter(d => d.kind === 'videoinput');
        setDevices(vids);
        const savedDevice = selectedDeviceId && vids.find(d => d.deviceId === selectedDeviceId);
        const deviceId = savedDevice?.deviceId || vids[0]?.deviceId || '';
        if (deviceId !== selectedDeviceId) setSelectedDeviceId(deviceId);

        const constraints = { video: deviceId ? { deviceId: { exact: deviceId } } : true, audio: false };
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isCurrentEffect) {
          activeStream.getTracks().forEach(track => {
            try { track.stop(); } catch (_) {}
          });
          return;
        }

        activeStreamRef.current = activeStream;
        streamRef.current = activeStream;
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          videoRef.current.play?.().catch(() => {});
        }
        setIsStreamReady(true);
      } catch (err) {
        if (isCurrentEffect) {
          setError('Camera access error: ' + err.message);
          setIsStreamReady(false);
        }
      }
    }

    if (isCaptureViewActive && mode === 'webcam') {
      startCamera();
    } else {
      stopWebcam();
    }

    return () => {
      isCurrentEffect = false;
      if (activeStream) {
        activeStream.getTracks().forEach(track => {
          try { track.stop(); } catch (_) {}
        });
      }
      stopWebcam();
    };
  }, [isCaptureViewActive, mode, selectedDeviceId, stopWebcam]);

  const switchDevice = async (deviceId) => {
    setSelectedDeviceId(deviceId);
    stopWebcam();
  };

  const clearCountdown = () => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    setCountdown(null);
  };

  useEffect(() => {
    if (step !== 'LIVE_VIEW') {
      captureSequenceRef.current += 1;
      clearCountdown();
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      setIsCapturing(false);
    }
    if (step !== 'REVIEW_SHOTS') clearAutoProceed();
  }, [step]);

  useEffect(() => {
    return () => {
      clearCountdown();
      clearAutoProceed();
      stopWebcam();
    };
  }, [stopWebcam]);

  useEffect(() => {
    if (step === 'GALLERY' || step === 'SETTINGS' || step === 'TEMPLATE_SELECTION') {
      setRawFrames([]);
      setActiveSession(null);
    }
  }, [step]);

  // ─── Countdown ───────────────────────────────────────────────────────────────
  const runCountdown = useCallback((onComplete) => {
    let current = countdownDuration;
    setCountdown(current);
    const tick = () => {
      current -= 1;
      if (current > 0) { setCountdown(current); countdownTimerRef.current = setTimeout(tick, 1000); }
      else { setCountdown('SMILE!'); countdownTimerRef.current = setTimeout(() => { setCountdown(null); onComplete(); }, 700); }
    };
    countdownTimerRef.current = setTimeout(tick, 1000);
  }, [countdownDuration]);

  useEffect(() => {
    if (step !== 'LIVE_VIEW' || retakingIdx === null) return;
    if (mode === 'webcam' && !isStreamReady) return;
    if (retakeStartedRef.current === retakingIdx) return;
    retakeStartedRef.current = retakingIdx;
    const sequence = captureSequenceRef.current;
    runCountdown(() => {
      if (captureSequenceRef.current === sequence) doRetake(retakingIdx, sequence);
    });
  }, [step, retakingIdx, mode, isStreamReady, runCountdown]);

  // ─── Auto-proceed ─────────────────────────────────────────────────────────────
  const startAutoProceed = useCallback((onZero) => {
    setAutoProceedSec(AUTO_PROCEED_SEC);
    let remaining = AUTO_PROCEED_SEC;
    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) { setAutoProceedSec(null); onZero(); }
      else { setAutoProceedSec(remaining); autoProceedRef.current = setTimeout(tick, 1000); }
    };
    autoProceedRef.current = setTimeout(tick, 1000);
  }, []);

  const clearAutoProceed = () => {
    if (autoProceedRef.current) { clearTimeout(autoProceedRef.current); autoProceedRef.current = null; }
    setAutoProceedSec(null);
  };

  const resetAutoProceed = (frames, ts) => {
    clearAutoProceed();
    startAutoProceed(() => generateStrip(frames, ts));
  };

  // ─── Webcam frame helper ──────────────────────────────────────────────────────
  const captureWebcamFrame = () => {
    const video = videoRef.current;
    if (!video) throw new Error('Video element not found');
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (mirror) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg');
  };

  // ─── Main capture flow ────────────────────────────────────────────────────────
  const handleTakePhoto = () => {
    if (step !== 'LIVE_VIEW') return;
    if (isCapturing || countdown !== null || isProcessing) return;
    const sequence = captureSequenceRef.current + 1;
    captureSequenceRef.current = sequence;
    setError(null);
    setIsCapturing(true);
    setCurrentShotIdx(0);
    setCapturedCount(0);
    setRawFrames([]);
    setActiveFilter('normal'); // reset filter for new session

    const ts          = makeSessionTs();
    const totalShots  = shotCount;
    const currentMode = mode;
    setSessionTs(ts);

    const collectedFrames = [];

    const doCapture = async (shotIdx) => {
      try {
        if (captureSequenceRef.current !== sequence || step !== 'LIVE_VIEW') return;
        let rawPath;
        if (currentMode === 'webcam') {
          rawPath = await window.electronAPI.captureWebcam(captureWebcamFrame(), ts, shotIdx);
        } else {
          rawPath = await window.electronAPI.captureDslr(ts, shotIdx);
        }
        if (captureSequenceRef.current !== sequence || step !== 'LIVE_VIEW') return;
        const rawFilename = rawPath.split(/[\\/]/).pop();
        const frameUrl    = `http://localhost:3001/photos/${rawFilename}`;
        collectedFrames.push({ path: rawPath, url: frameUrl });
        setRawFrames([...collectedFrames]);
        if (flashEnabled) {
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), FLASH_DURATION_MS);
        }
        const nextIdx = shotIdx + 1;
        setCapturedCount(nextIdx);
        if (nextIdx < totalShots) {
          setCurrentShotIdx(nextIdx);
          pauseTimeoutRef.current = setTimeout(() => {
            if (captureSequenceRef.current === sequence && step === 'LIVE_VIEW') {
              runCountdown(() => doCapture(nextIdx));
            }
          }, PAUSE_BETWEEN_SHOTS_MS);
        } else {
          setIsCapturing(false);
          setStep('REVIEW_SHOTS');
          startAutoProceed(() => generateStrip([...collectedFrames], ts));
        }
      } catch (err) {
        if (captureSequenceRef.current !== sequence || step !== 'LIVE_VIEW') return;
        setError(err.message || 'Capture failed.');
        setIsCapturing(false);
      }
    };

    runCountdown(() => doCapture(0));
  };

  // ─── Generate strip ───────────────────────────────────────────────────────────
  const generateStrip = async (frames, ts) => {
    clearAutoProceed();
    setIsProcessing(true);
    try {
      const { filename, photoUrl, shareUrl, loopUrl } = await window.electronAPI.processStrip(
        frames.map(f => f.path),
        selectedTemplate?.overlayPngPath || null,
        activeFilter,
        selectedTemplate?.layoutMode || selectedTemplate?.orientation || null,
        selectedTemplate?.slots || null,
        selectedTemplate?.fitMode || 'cover',
        ts || sessionTs
      );
      setResultFilename(filename);
      setResultPhotoUrl(photoUrl);
      setResultShareUrl(shareUrl);
      setResultLoopUrl(loopUrl || null);
      setStep('RESULT');
    } catch (err) {
      setError(err.message || 'Failed to process strip.');
      setStep('REVIEW_SHOTS');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Retake single shot ───────────────────────────────────────────────────────
  const handleRetakeSingleShot = (idx) => {
    clearAutoProceed();
    captureSequenceRef.current += 1;
    retakeStartedRef.current = null;
    setRetakingIdx(idx);
    setStep('LIVE_VIEW');
    setError(null);
  };

  const doRetake = async (idx, sequence) => {
    try {
      if (captureSequenceRef.current !== sequence || step !== 'LIVE_VIEW') return;
      let rawPath;
      if (mode === 'webcam') {
        rawPath = await window.electronAPI.captureSingleShot('webcam', captureWebcamFrame(), sessionTs, idx);
      } else {
        rawPath = await window.electronAPI.captureSingleShot('dslr', null, sessionTs, idx);
      }
      if (captureSequenceRef.current !== sequence || step !== 'LIVE_VIEW') return;
      const frameUrl = `http://localhost:3001/photos/${rawPath.split(/[\\/]/).pop()}?v=${Date.now()}`;
      if (flashEnabled) {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), FLASH_DURATION_MS);
      }
      setRawFrames(prev => {
        const next = [...prev];
        next[idx] = { path: rawPath, url: frameUrl };
        resetAutoProceed(next, sessionTs);
        return next;
      });
      setRetakingIdx(null);
      retakeStartedRef.current = null;
      setStep('REVIEW_SHOTS');
    } catch (err) {
      if (captureSequenceRef.current !== sequence) return;
      setError(err.message || 'Retake failed.');
      setRetakingIdx(null);
      retakeStartedRef.current = null;
    }
  };

  // ─── Print ────────────────────────────────────────────────────────────────────
  const handlePrint = async (stripFilename, copies = 1, opts = {}) => {
    if (isPrinting) return;
    const count = Math.max(1, Math.min(5, Number(copies) || 1));
    const activePaper = opts.paperType || paperType;
    const activeQuality = opts.printQuality || printQuality;
    const activeLayout = opts.stripLayout || stripLayout;
    const activeSilent = opts.silent !== undefined ? opts.silent : silentPrint;
    setIsPrinting(true); setPrintMsg(null);
    try {
      await window.electronAPI.printStrip({
        stripFilename,
        copies: count,
        printerName: selectedPrinter || null,
        paperType: activePaper,
        printQuality: activeQuality,
        stripLayout: activeLayout,
        silent: activeSilent,
      });
      const paperLabel = activePaper === 'matte' ? 'Matte Photo' : activePaper === 'glossy' ? 'Glossy' : 'Plain';
      const layoutLabel = activeLayout === 'single' ? 'Single Strip' : 'Dual Strips';
      setPrintMsg(`✅ Sent to printer! (${count} ${count === 1 ? 'copy' : 'copies'} • ${paperLabel} • ${layoutLabel})`);
    } catch (err) { setPrintMsg('❌ Print failed: ' + err.message); }
    finally { setIsPrinting(false); setTimeout(() => setPrintMsg(null), 4000); }
  };

  const handlePrinterSave = async () => {
    try {
      if (window.electronAPI.savePrinterConfig) {
        await window.electronAPI.savePrinterConfig({
          printerName: selectedPrinter || null,
          paperType,
          printQuality,
          stripLayout,
          silentPrint,
        });
      } else {
        await window.electronAPI.savePrinterSelection(selectedPrinter || null);
      }
      setPrinterToast('Printer preferences saved');
      setTimeout(() => setPrinterToast(null), 2500);
    } catch (err) {
      setError(`Could not save printer: ${err.message}`);
    }
  };

  const handleOpenPrinterPreferences = async () => {
    try {
      if (window.electronAPI.openPrinterPreferences) {
        await window.electronAPI.openPrinterPreferences(selectedPrinter || null);
      }
    } catch (err) {
      setError(`Could not open printer preferences: ${err.message}`);
    }
  };

  const handlePrinterTest = async () => {
    const stripFilename = resultFilename || activeSession?.stripFilename;
    if (!stripFilename) {
      setError('Complete or open a session before testing the printer.');
      return;
    }
    await handlePrint(stripFilename);
  };

  // ─── Navigation ───────────────────────────────────────────────────────────────
  const handleTemplateSelect = (t) => {
    setSelectedTemplate(t);
    lsSet(LS_LAST_TEMPLATE, t.id);
    setError(null);
  };

  const handleNewSession = () => {
    captureSequenceRef.current += 1;
    clearCountdown();
    clearAutoProceed();
    setIsCapturing(false);
    stopWebcam();
    setResultFilename(null);
    setResultPhotoUrl(null);
    setResultShareUrl(null);
    setResultLoopUrl(null);
    setRawFrames([]);
    setRetakingIdx(null);
    setSessionTs(null);
    setError(null);
    setCapturedCount(0);
    setCurrentShotIdx(0);
    setActiveFilter('normal');
    setStep('TEMPLATE_SELECTION');
  };

  const handleBackToTemplates = () => {
    captureSequenceRef.current += 1;
    retakeStartedRef.current = null;
    clearCountdown();
    clearAutoProceed();
    setIsCapturing(false);
    setRetakingIdx(null);
    stopWebcam();
    setStep('TEMPLATE_SELECTION');
    setSelectedTemplate(null);
    setError(null);
    setCapturedCount(0);
    setCurrentShotIdx(0);
    lsSet(LS_LAST_TEMPLATE, null);
  };

  // Operator helpers
  const handlePickCustomTemplate = async (layoutMode) => {
    try {
      const filePath = await window.electronAPI.pickTemplateFile();
      if (!filePath) return;
      const name = filePath.split(/[\\/]/).pop().replace(/\.[^.]+$/, '');
      const info  = await window.electronAPI.getTemplateInfo(filePath);
      return {
        id: `custom_${Date.now()}`,
        name,
        overlayPngPath: filePath,
        isCustom: true,
        enabled: true,
        width: info?.width || null,
        height: info?.height || null,
        orientation: layoutMode || info?.orientation || ((info?.width || 0) > (info?.height || 0) ? 'landscape' : 'portrait'),
        layoutMode: layoutMode || info?.orientation || ((info?.width || 0) > (info?.height || 0) ? 'landscape' : 'portrait'),
        slots: info?.slots || [],
        fitMode: 'cover',
      };
    } catch (err) { setError('Could not pick template: ' + err.message); }
  };

  const saveCustomTemplate = (template) => {
    setCustomTemplates(prev => [...prev.filter(x => x.overlayPngPath !== template.overlayPngPath), {
      ...template,
      layoutMode: template.layoutMode || template.orientation || 'portrait',
      orientation: template.layoutMode || template.orientation || 'portrait',
    }]);
  };

  const updateCustomTemplateSlots = (id, slotIndex, axis, value) => {
    const numericValue = Math.max(0, Number(value) || 0);
    setCustomTemplates(prev => prev.map(template =>
      template.id === id ? {
        ...template,
        slots: (template.slots || []).map((slot, index) => index === slotIndex ? { ...slot, [axis]: numericValue } : slot),
      } : template
    ));
    setSelectedTemplate(prev => prev?.id === id
      ? { ...prev, slots: (prev.slots || []).map((slot, index) => index === slotIndex ? { ...slot, [axis]: numericValue } : slot) }
      : prev);
    setBuiltinSlotOverrides(prev => {
      const builtin = builtinTemplates.find(item => item.id === id);
      if (!builtin) return prev;
      const slots = (prev[id]?.slots || builtin.slots || []).map((slot, index) => index === slotIndex ? { ...slot, [axis]: numericValue } : slot);
      return { ...prev, [id]: { ...(prev[id] || {}), slots } };
    });
  };

  const updateCustomTemplateFitMode = (id, fitMode) => {
    const normalizedFitMode = ['cover', 'contain', 'fill'].includes(fitMode) ? fitMode : 'cover';
    setCustomTemplates(prev => prev.map(template => template.id === id ? { ...template, fitMode: normalizedFitMode } : template));
    setSelectedTemplate(prev => prev?.id === id ? { ...prev, fitMode: normalizedFitMode } : prev);
    if (builtinTemplates.some(template => template.id === id)) {
      setBuiltinSlotOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {}), fitMode: normalizedFitMode } }));
    }
  };

  const addCustomTemplateSlot = id => {
    const template = customTemplates.find(item => item.id === id);
    const builtin = builtinTemplates.find(item => item.id === id);
    const source = template || (builtin ? { ...builtin, ...(builtinSlotOverrides[id] || {}) } : null);
    if (!source) return;
    const next = [...(source.slots || []), { x: 0, y: 0, w: Math.round((source.width || 400) * 0.8), h: Math.round((source.height || 400) * 0.15) }];
    if (!template) {
      setBuiltinSlotOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {}), slots: next } }));
      return;
    }
    updateCustomTemplateSlots(id, (next.length - 1), 'x', next[next.length - 1].x);
    setCustomTemplates(prev => prev.map(item => item.id === id ? { ...item, slots: next } : item));
    setSelectedTemplate(prev => prev?.id === id ? { ...prev, slots: next } : prev);
  };

  const deleteCustomTemplateSlot = (id, index) => {
    if (builtinTemplates.some(template => template.id === id)) {
      const source = builtinSlotOverrides[id]?.slots || builtinTemplates.find(template => template.id === id)?.slots || [];
      setBuiltinSlotOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {}), slots: source.filter((_, slotIndex) => slotIndex !== index) } }));
      return;
    }
    setCustomTemplates(prev => prev.map(item => item.id === id ? { ...item, slots: (item.slots || []).filter((_, slotIndex) => slotIndex !== index) } : item));
    setSelectedTemplate(prev => prev?.id === id ? { ...prev, slots: (prev.slots || []).filter((_, slotIndex) => slotIndex !== index) } : prev);
  };

  const detectCustomTemplateSlots = async id => {
    const template = customTemplates.find(item => item.id === id) || builtinTemplates.find(item => item.id === id);
    if (!template?.overlayPngPath) throw new Error('Select a saved custom template first.');
    const slots = await window.electronAPI.detectTemplateSlots(template.overlayPngPath);
    if (!Array.isArray(slots) || slots.length === 0) throw new Error('No transparent photo slots were detected.');
    if (template.isCustom) {
      setCustomTemplates(prev => prev.map(item => item.id === id ? { ...item, slots } : item));
    } else {
      setBuiltinSlotOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {}), slots } }));
    }
    setSelectedTemplate(prev => prev?.id === id ? { ...prev, slots } : prev);
    return slots;
  };

  const allTemplates = [
    ...builtinTemplates.map(template => ({ ...template, ...(builtinSlotOverrides[template.id] || {}) })),
    ...customTemplates,
  ];

  const openTemplateEditor = id => {
    setTemplateEditorId(id || allTemplates[0]?.id || null);
    setStep('TEMPLATE_EDITOR');
  };
  const closeTemplateEditor = () => { setTemplateEditorId(null); setStep('SETTINGS'); };

  const updateCustomTemplateLayout = (id, layoutMode) => {
    setCustomTemplates(prev => prev.map(template =>
      template.id === id ? { ...template, layoutMode, orientation: layoutMode } : template
    ));
  };

  const handleRemoveCustomTemplate = (id) => {
    setCustomTemplates(prev => prev.filter(x => x.id !== id));
    if (selectedTemplate?.id === id) { setSelectedTemplate(null); lsSet(LS_LAST_TEMPLATE, null); }
    if (templateEditorId === id) {
      const remaining = allTemplates.filter(template => template.id !== id);
      setTemplateEditorId(remaining[0]?.id || null);
    }
  };

  const toggleBuiltin = (id) => {
    setHiddenBuiltins(prev => {
      const willHide = !prev.includes(id);
      if (willHide && selectedTemplate?.id === id) {
        setSelectedTemplate(null);
        lsSet(LS_LAST_TEMPLATE, null);
      }
      return willHide ? [...prev, id] : prev.filter(x => x !== id);
    });
  };

  const toggleCustomTemplate = (id) => {
    setCustomTemplates(prev => {
      const target = prev.find(template => template.id === id);
      const willDisable = target ? target.enabled !== false : false;
      if (willDisable && selectedTemplate?.id === id) {
        setSelectedTemplate(null);
        lsSet(LS_LAST_TEMPLATE, null);
      }
      return prev.map(template =>
        template.id === id ? { ...template, enabled: template.enabled === false } : template
      );
    });
  };

  // Gallery
  const openGallery = async () => {
    captureSequenceRef.current += 1;
    clearCountdown();
    clearAutoProceed();
    setIsCapturing(false);
    stopWebcam();
    setStep('GALLERY');
    setActiveSession(null);
    setSessionsLoading(true);
    try { setSessions(await window.electronAPI.listSessions()); }
    catch (err) { setError('Could not load gallery: ' + err.message); }
    finally { setSessionsLoading(false); }
  };

  const handleDeleteSession = async () => {
    if (!activeSession || !window.confirm('Delete this session and all of its photos permanently?')) return;
    try {
      await window.electronAPI.deleteSession(activeSession.id);
      setActiveSession(null);
      setSessions(await window.electronAPI.listSessions());
    } catch (err) {
      setError(`Could not delete session: ${err.message}`);
    }
  };

  const handleDeleteSessions = async (sessionIds) => {
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) return;
    const count = sessionIds.length;
    const confirmMsg = count === 1
      ? 'Delete this session and all of its photos permanently?'
      : `Are you sure you want to permanently delete ${count} selected sessions? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await window.electronAPI.deleteSessions(sessionIds);
      if (activeSession && sessionIds.includes(activeSession.id)) {
        setActiveSession(null);
      }
      setSessions(await window.electronAPI.listSessions());
    } catch (err) {
      setError(`Could not delete sessions: ${err.message}`);
    }
  };

  const openLightbox  = (url, label) => { setLightboxUrl(url); setLightboxLabel(label); };
  const closeLightbox = () => { setLightboxUrl(null); setLightboxLabel(''); };



  // ─── Derived ──────────────────────────────────────────────────────────────────

  const isCounting = countdown !== null;
  const isRetaking = retakingIdx !== null;
  const captureDisabled = isCapturing || isProcessing || (mode === 'webcam' && !isStreamReady);
  const activeCss = FILTERS.find(f => f.id === activeFilter)?.css || 'none';
  const visibleBuiltins = builtinTemplates.filter(t => !hiddenBuiltins.includes(t.id));
  const allVisibleTpls = [
    ...visibleBuiltins.map(template => ({ ...template, ...(builtinSlotOverrides[template.id] || {}) })),
    ...customTemplates.filter(template => template.enabled !== false),
  ];

  // Listen for remote template selection from mobile web controller
  useEffect(() => {
    const unsub = window.electronAPI?.onRemoteSelectTemplate?.((templateId) => {
      const match = allTemplates.find(t => t.id === templateId);
      if (match) {
        setSelectedTemplate(match);
        lsSet(LS_LAST_TEMPLATE, match.id);
        setError(null);
      }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [allTemplates]);

  // Listen for remote signal to proceed from template selection into camera
  useEffect(() => {
    const unsub = window.electronAPI?.onRemoteProceedToCamera?.(() => {
      setStep(prevStep => {
        if (prevStep === 'TEMPLATE_SELECTION') {
          setSelectedTemplate(current => {
            if (!current && allVisibleTpls.length > 0) {
              lsSet(LS_LAST_TEMPLATE, allVisibleTpls[0].id);
              return allVisibleTpls[0];
            }
            return current;
          });
          return 'LIVE_VIEW';
        }
        return prevStep;
      });
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [allVisibleTpls]);

  // Sync visible templates, selected template & current step to mobile remote backend
  useEffect(() => {
    window.electronAPI?.syncTemplatesToRemote?.(allVisibleTpls, selectedTemplate?.id, step).catch?.(() => {});
  }, [allVisibleTpls, selectedTemplate, step]);

  const hideNavbar = step === 'LIVE_VIEW' || step === 'TEMPLATE_EDITOR' || step === 'RESULT' || step === 'GALLERY';
  const openSettings = () => {
    captureSequenceRef.current += 1;
    clearCountdown();
    clearAutoProceed();
    setIsCapturing(false);
    stopWebcam();
    settingsReturnStepRef.current = step === 'GALLERY' || step === 'SETTINGS'
      ? 'TEMPLATE_SELECTION'
      : step;
    setStep('SETTINGS');
  };
  const closeSettings = () => {
    const returnStep = settingsReturnStepRef.current;
    setStep(returnStep === 'GALLERY' || returnStep === 'SETTINGS' ? 'TEMPLATE_SELECTION' : (returnStep || 'TEMPLATE_SELECTION'));
  };

  const changeTheme = (themeKey) => {
    setActiveTheme(themeKey);
    setCustomAccent(null);
  };

  const selectOutputFolder = async () => {
    const directory = await window.electronAPI.selectOutputFolder();
    if (directory) setOutputDir(directory);
  };

  const openOutputFolder = async () => {
    try {
      await window.electronAPI.openOutputFolder();
    } catch (err) {
      setError(`Could not open output folder: ${err.message}`);
    }
  };

  const selectDigiCamControl = async () => {
    try {
      const directory = await window.electronAPI.pickDigiCamControlPath();
      if (directory) {
        setDigiCamControlPath(directory);
        setDigiCamControlAvailable(true);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    clearAutoProceed();
    startAutoProceed(() => generateStrip(rawFrames, sessionTs));
  };

  const handleGenerateStrip = () => {
    clearAutoProceed();
    generateStrip(rawFrames, sessionTs);
  };

  const [cloudConfigForm, setCloudConfigForm] = useState({
    cloudName: '',
    apiKey: '',
    apiSecret: '',
    viewerUrl: 'https://froshitech.github.io/BorderLens/viewer.html',
    hasSecret: false,
    isConfigured: false,
  });

  useEffect(() => {
    window.electronAPI?.getCloudConfig?.()
      .then(cfg => {
        if (cfg) {
          setCloudConfigForm(prev => ({
            ...prev,
            cloudName: cfg.cloudName || '',
            apiKey: cfg.apiKey || '',
            hasSecret: Boolean(cfg.hasSecret),
            viewerUrl: cfg.viewerUrl || 'https://froshitech.github.io/BorderLens/viewer.html',
            isConfigured: Boolean(cfg.isConfigured),
          }));
        }
      })
      .catch(() => {});
  }, [step]);

  const handleSaveCloudConfig = async (formData) => {
    const res = await window.electronAPI.saveCloudConfig(formData);
    const updatedStatus = await window.electronAPI.getCloudStatus();
    setCloudStatus(updatedStatus);
    const cfg = await window.electronAPI.getCloudConfig();
    if (cfg) {
      setCloudConfigForm(prev => ({
        ...prev,
        cloudName: cfg.cloudName || '',
        apiKey: cfg.apiKey || '',
        hasSecret: Boolean(cfg.hasSecret),
        viewerUrl: cfg.viewerUrl || 'https://froshitech.github.io/BorderLens/viewer.html',
        isConfigured: Boolean(cfg.isConfigured),
      }));
    }
    return res;
  };

  const handleResetCloudConfig = async () => {
    await window.electronAPI.resetCloudConfig();
    const updatedStatus = await window.electronAPI.getCloudStatus();
    setCloudStatus(updatedStatus);
    setCloudConfigForm({
      cloudName: '',
      apiKey: '',
      apiSecret: '',
      viewerUrl: 'https://froshitech.github.io/BorderLens/viewer.html',
      hasSecret: false,
      isConfigured: false,
    });
  };

  const testCloudConnection = async () => {
    try {
      const result = await window.electronAPI.testAndCleanupCloud();
      setCloudStatus(result);
      return result;
    } catch (err) {
      setCloudStatus({ configured: false, online: false, error: err.message });
      throw err;
    }
  };

  return {
    step, setStep, stepLabels: STEP_LABELS, themes: THEMES,
    showFlash, lightboxUrl, lightboxLabel, closeLightbox, openLightbox,
    isProcessing, activeFilter, printMsg, printerToast, hideNavbar, openGallery, openSettings,
    selectedTemplate, setActiveSession, activeSession, resultPhotoUrl, resultShareUrl, resultLoopUrl, rawFrames, activeCss,
    resultFilename, isPrinting, handlePrint, handleNewSession, sessions, sessionsLoading, formatDate, handleDeleteSession, handleDeleteSessions,
    outputDir, digiCamControlPath, digiCamControlAvailable, printers, selectedPrinter, mode, devices, selectedDeviceId, mirror, shotOverride, countdownDuration, flashEnabled,
    builtinTemplates, hiddenBuiltins, customTemplates, activeTheme, customAccent, setActiveTheme, setCustomAccent,
    saveCustomTemplate, handlePickCustomTemplate, handleRemoveCustomTemplate, toggleBuiltin, toggleCustomTemplate, updateCustomTemplateLayout, updateCustomTemplateSlots, updateCustomTemplateFitMode, addCustomTemplateSlot, deleteCustomTemplateSlot, detectCustomTemplateSlots, openTemplateEditor, closeTemplateEditor,
    templateEditorId, editorTemplate: allTemplates.find(template => template.id === templateEditorId) || allTemplates[0] || null,
    allTemplates, handleTemplateSelect, allVisibleTpls, videoRef, isStreamReady, isCapturing, isCounting, countdown, shotCount, capturedCount, currentShotIdx,
    captureDisabled, handleBackToTemplates, handleTakePhoto, switchDevice, error, retakingIdx, isRetaking, autoProceedSec, handleRetakeSingleShot,
    templateThumbSrc, templateInfo, clearAutoProceed, startAutoProceed, generateStrip, sessionTs, handlePrinterSave, handlePrinterTest,
    paperType, setPaperType, printQuality, setPrintQuality, stripLayout, setStripLayout, silentPrint, setSilentPrint, handleOpenPrinterPreferences,
    setOutputDir, setDigiCamControlPath, setDigiCamControlAvailable, setSelectedPrinter, setMode, setSelectedDeviceId, setMirror, setShotOverride, setCountdownDuration, setFlashEnabled,
    setError, setActiveFilter, closeSettings, changeTheme, selectOutputFolder, openOutputFolder, selectDigiCamControl,
    handleFilterChange, handleGenerateStrip, cloudQrMode, setCloudQrMode, cloudStatus, testCloudConnection,
    cloudConfigForm, handleSaveCloudConfig, handleResetCloudConfig,
    stopWebcam, stopAllMediaStreams,
  };
}
