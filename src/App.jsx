import React from 'react';
import TemplateSelect from './components/TemplateSelect.jsx';
import CameraView from './components/CameraView.jsx';
import ReviewView from './components/ReviewView.jsx';
import ResultView from './components/ResultView.jsx';
import GalleryView from './components/GalleryView.jsx';
import SettingsView from './components/SettingsView.jsx';
import useBooth from './hooks/useBooth.js';

const App = () => {
  const {
    step, setStep, stepLabels, themes, showFlash, lightboxUrl, lightboxLabel, closeLightbox, openLightbox,
    isProcessing, activeFilter, printMsg, printerToast, hideNavbar, openGallery, openSettings, selectedTemplate, setActiveSession,
    activeSession, resultPhotoUrl, resultShareUrl, resultLoopUrl, rawFrames, activeCss, resultFilename, isPrinting, handlePrint,
    handleNewSession, sessions, sessionsLoading, formatDate, handleDeleteSession, outputDir, digiCamControlPath, digiCamControlAvailable,
    printers, selectedPrinter, mode, devices, selectedDeviceId, mirror, shotOverride, countdownDuration, flashEnabled, builtinTemplates, hiddenBuiltins, customTemplates,
    activeTheme, customAccent, setActiveTheme, setCustomAccent, setCountdownDuration, setFlashEnabled, cloudQrMode, setCloudQrMode, cloudStatus, testCloudConnection, saveCustomTemplate, handlePickCustomTemplate, handleRemoveCustomTemplate,
    toggleBuiltin, toggleCustomTemplate, updateCustomTemplateLayout, updateCustomTemplateSlots, handleTemplateSelect, allVisibleTpls, videoRef, isStreamReady, isCapturing, isCounting,
    countdown, shotCount, capturedCount, currentShotIdx, captureDisabled, handleBackToTemplates, handleTakePhoto, switchDevice, error, retakingIdx,
    isRetaking, autoProceedSec, handleRetakeSingleShot, templateThumbSrc, templateInfo, clearAutoProceed, startAutoProceed, generateStrip, sessionTs,
    handlePrinterSave, handlePrinterTest, setSelectedPrinter, setMode, setSelectedDeviceId, setMirror, setShotOverride,
    setError, setActiveFilter, closeSettings, changeTheme, selectOutputFolder, openOutputFolder, selectDigiCamControl,
    handleFilterChange, handleGenerateStrip,
  } = useBooth();
  return (
    <div className="studio">
      {showFlash && <div className="flash-overlay" />}
      {lightboxUrl && (<div className="lightbox-overlay" onClick={closeLightbox}><div className="lightbox-box" onClick={e => e.stopPropagation()}><button className="lightbox-close" onClick={closeLightbox}>X</button><p className="lightbox-label">{lightboxLabel}</p><img src={lightboxUrl} alt={lightboxLabel} className="lightbox-img" /></div></div>)}
      {isProcessing && <div className="loading-overlay"><div className="loading-content"><div className="spinner-large" /><h3>Creating your strip...</h3><p>Applying {activeFilter !== 'normal' ? activeFilter + ' filter + ' : ''}template overlay</p></div></div>}
      {printMsg && <div className="print-toast">{printMsg}</div>}
      {printerToast && <div className="print-toast">{printerToast}</div>}
      {!hideNavbar && <nav className="navbar"><div className="navbar-left">{step === 'LIVE_VIEW' && <button className="nav-btn nav-btn--back" onClick={handleBackToTemplates}>← Choose Template</button>}<span className="navbar-title">BorderLens</span></div><div className="navbar-right">{step === 'SETTINGS' ? <button className="nav-btn nav-btn--back" onClick={closeSettings}>← Back to Booth</button> : (<><button className="nav-btn" onClick={step !== 'GALLERY' ? openGallery : () => { if (activeSession) setActiveSession(null); else setStep(selectedTemplate ? 'LIVE_VIEW' : 'TEMPLATE_SELECTION'); }}>{step === 'GALLERY' ? 'Back' : 'Gallery'}</button><button className="nav-btn nav-btn--icon" onClick={openSettings} title="Operator Settings">Settings</button></>)}</div></nav>}
      {step === 'SETTINGS' ? <SettingsView
        outputDir={outputDir} digiCamControlPath={digiCamControlPath} digiCamControlAvailable={digiCamControlAvailable} printers={printers} selectedPrinter={selectedPrinter} mode={mode} devices={devices} selectedDeviceId={selectedDeviceId} mirror={mirror} shotOverride={shotOverride} countdownDuration={countdownDuration} flashEnabled={flashEnabled} builtinTemplates={builtinTemplates} hiddenBuiltins={hiddenBuiltins} customTemplates={customTemplates} isPrinting={isPrinting} canTestPrint={Boolean(resultFilename || (activeSession && activeSession.stripFilename))}
        onSelectOutput={selectOutputFolder} onOpenOutput={openOutputFolder} onSelectDigi={selectDigiCamControl}
        themes={themes} activeTheme={activeTheme} customAccent={customAccent} onThemeChange={changeTheme} onAccentChange={setCustomAccent}
        cloudQrMode={cloudQrMode} cloudStatus={cloudStatus} onCloudQrModeChange={setCloudQrMode} onTestCloud={testCloudConnection}
        onPrinterChange={setSelectedPrinter} onSavePrinter={handlePrinterSave} onTestPrint={handlePrinterTest} onModeChange={setMode} onDeviceChange={switchDevice} onMirrorChange={setMirror} onShotOverride={setShotOverride} onCountdownDuration={setCountdownDuration} onFlashChange={setFlashEnabled}                 onToggleBuiltin={toggleBuiltin} onToggleCustom={toggleCustomTemplate} onUpdateCustomLayout={updateCustomTemplateLayout} onUpdateCustomSlots={updateCustomTemplateSlots} onRemoveCustom={handleRemoveCustomTemplate} onAddCustom={handlePickCustomTemplate} onSaveCustomTemplate={saveCustomTemplate} onBack={closeSettings}
      /> : <div className={'content ' + (hideNavbar ? 'content--fullscreen' : '')}>
        {step === 'TEMPLATE_SELECTION' && <TemplateSelect templates={allVisibleTpls} selectedTemplate={selectedTemplate} onSelect={handleTemplateSelect} onContinue={() => setStep('LIVE_VIEW')} />}
        {step === 'LIVE_VIEW' && <CameraView mode={mode} videoRef={videoRef} mirror={mirror} isStreamReady={isStreamReady} isCapturing={isCapturing} isCounting={isCounting} countdown={countdown} shotCount={shotCount} capturedCount={capturedCount} currentShotIdx={currentShotIdx} retakingIdx={retakingIdx} captureDisabled={captureDisabled} onStart={handleTakePhoto} onBack={handleBackToTemplates} error={error} rawFrames={rawFrames} />}
        {step === 'REVIEW_SHOTS' && <ReviewView rawFrames={rawFrames} activeFilter={activeFilter} activeCss={activeCss} retakingIdx={retakingIdx} isRetaking={isRetaking} isProcessing={isProcessing} templateThumbSrc={templateThumbSrc} templateInfo={{ ...templateInfo, slots: selectedTemplate?.slots || templateInfo?.slots }} fitMode={selectedTemplate?.fitMode || 'cover'} templateLayoutMode={selectedTemplate?.layoutMode || selectedTemplate?.orientation} shotCount={shotCount} autoProceedSec={autoProceedSec} onRetake={handleRetakeSingleShot} onFilter={handleFilterChange} onGenerate={handleGenerateStrip} error={error} />}
        {step === 'RESULT' && <ResultView resultPhotoUrl={resultPhotoUrl} resultShareUrl={resultShareUrl} resultLoopUrl={resultLoopUrl} rawFrames={rawFrames} activeCss={activeCss} resultFilename={resultFilename} isPrinting={isPrinting} onPrint={handlePrint} onNewSession={handleNewSession} onLightbox={openLightbox} cloudQrMode={cloudQrMode} />}
        {step === 'GALLERY' && <GalleryView sessions={sessions} sessionsLoading={sessionsLoading} activeSession={activeSession} formatDate={formatDate} isPrinting={isPrinting} onSelect={setActiveSession} onBack={() => setActiveSession(null)} onLightbox={openLightbox} onPrint={handlePrint} onDelete={handleDeleteSession} cloudQrMode={cloudQrMode} />}
      </div>}
    </div>
  );
};


export default App;
