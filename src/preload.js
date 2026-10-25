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
  processStrip: (rawFilepaths, templatePath, filterType, orientation, slots, fitMode, sessionTs) =>
    ipcRenderer.invoke('process-strip', rawFilepaths, templatePath, filterType, orientation, slots, fitMode, sessionTs),

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
  getCloudConfig:      () => ipcRenderer.invoke('get-cloud-config'),
  saveCloudConfig:     (config) => ipcRenderer.invoke('save-cloud-config', config),
  resetCloudConfig:    () => ipcRenderer.invoke('reset-cloud-config'),
  testAndCleanupCloud: () => ipcRenderer.invoke('test-and-cleanup-cloud'),
  uploadSessionCloud:  (sessionId) => ipcRenderer.invoke('upload-session-cloud', sessionId),
  selectOutputFolder:   ()     => ipcRenderer.invoke('select-output-folder'),
  openOutputFolder:     ()     => ipcRenderer.invoke('open-output-folder'),
  pickDigiCamControlPath:()    => ipcRenderer.invoke('pick-digicamcontrol-directory'),

  // ── Remote Shutter & Template Control ──────────────────────────────────────
  onRemoteTrigger: (callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on('remote-trigger-capture', subscription);
    return () => ipcRenderer.removeListener('remote-trigger-capture', subscription);
  },
  onRemoteSelectTemplate: (callback) => {
    const subscription = (event, templateId) => callback(templateId);
    ipcRenderer.on('remote-select-template', subscription);
    return () => ipcRenderer.removeListener('remote-select-template', subscription);
  },
  onRemoteProceedToCamera: (callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on('remote-proceed-to-camera', subscription);
    return () => ipcRenderer.removeListener('remote-proceed-to-camera', subscription);
  },
  syncTemplatesToRemote: (templates, selectedTemplateId, step) =>
    ipcRenderer.invoke('sync-templates-to-remote', templates, selectedTemplateId, step),
  getRemoteControlUrl: () => ipcRenderer.invoke('get-remote-control-url'),

  // ── Utilities ──────────────────────────────────────────────────────────────
  pickTemplateFile:     ()             => ipcRenderer.invoke('pick-template-file'),
  getTemplateInfo:      (templatePath) => ipcRenderer.invoke('get-template-info', templatePath),
  detectTemplateSlots:  (templatePath) => ipcRenderer.invoke('detect-template-slots', templatePath),
  getTemplateThumbnail: (filePath)     => ipcRenderer.invoke('get-template-thumbnail', filePath),
});
