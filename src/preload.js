const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Multi-shot capture ─────────────────────────────────────────────────────
  // sessionTs: shared ISO timestamp string for this session (generated in renderer)
  // shotIdx:   0-based index of this shot within the session
  captureDslr:   (sessionTs, shotIdx)             => ipcRenderer.invoke('capture-dslr',   sessionTs, shotIdx),
  captureWebcam: (base64Data, sessionTs, shotIdx) => ipcRenderer.invoke('capture-webcam', base64Data, sessionTs, shotIdx),

  // ── Single-shot retake (Review step) ──────────────────────────────────────
  // mode: 'webcam' | 'dslr'
  // base64OrNull: webcam frame data URL, or null for DSLR
  captureSingleShot: (mode, base64OrNull, sessionTs, shotIdx) =>
    ipcRenderer.invoke('capture-single-shot', mode, base64OrNull, sessionTs, shotIdx),

  // ── Strip compositing ──────────────────────────────────────────────────────
  // filterType: 'normal' | 'bw' | 'bright' | 'vintage'
  processStrip: (rawFilepaths, templatePath, filterType, orientation, slots, fitMode) =>
    ipcRenderer.invoke('process-strip', rawFilepaths, templatePath, filterType, orientation, slots, fitMode),

  // ── Printing ──────────────────────────────────────────────────────────────
  // { stripFilename: string, copies: number }
  printStrip: (opts) => ipcRenderer.invoke('print-strip', opts),
  getSystemPrinters:    () => ipcRenderer.invoke('get-system-printers'),
  getSavedPrinter:      () => ipcRenderer.invoke('get-saved-printer'),
  savePrinterSelection: (name) => ipcRenderer.invoke('save-printer-selection', name),

  // ── Gallery ────────────────────────────────────────────────────────────────
  listSessions:    ()         => ipcRenderer.invoke('list-sessions'),
  deleteSession:   (sessionId) => ipcRenderer.invoke('delete-session', sessionId),
  getFileAsDataUrl:(filename) => ipcRenderer.invoke('get-file-as-dataurl', filename),
  getBuiltinTemplates: ()     => ipcRenderer.invoke('get-builtin-templates'),
  getSettings:          ()     => ipcRenderer.invoke('get-settings'),
  getCloudStatus:      () => ipcRenderer.invoke('get-cloud-status'),
  testAndCleanupCloud: () => ipcRenderer.invoke('test-and-cleanup-cloud'),
  uploadSessionCloud:  (sessionId) => ipcRenderer.invoke('upload-session-cloud', sessionId),
  selectOutputFolder:   ()     => ipcRenderer.invoke('select-output-folder'),
  openOutputFolder:     ()     => ipcRenderer.invoke('open-output-folder'),
  pickDigiCamControlPath:()    => ipcRenderer.invoke('pick-digicamcontrol-directory'),

  // ── Utilities ──────────────────────────────────────────────────────────────
  pickTemplateFile:     ()             => ipcRenderer.invoke('pick-template-file'),
  getTemplateInfo:      (templatePath) => ipcRenderer.invoke('get-template-info', templatePath),
  getTemplateThumbnail: (filePath)     => ipcRenderer.invoke('get-template-thumbnail', filePath),
});
