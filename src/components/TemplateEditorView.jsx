import React, { useEffect, useRef, useState } from 'react';

const MIN_SIZE = 40;

export default function TemplateEditorView({
  template, templates = [], builtinTemplates = [], hiddenBuiltins = [], customTemplates = [],
  onToggleBuiltin, onToggleCustom, onAddTemplate, onSaveTemplate, onSelectTemplate,
  onUpdateSlot, onUpdateFitMode, onAutoDetectSlots, onAddSlot, onDeleteSlot, onBack,
}) {
  const canvasRef = useRef(null);
  const backgroundRef = useRef(null);
  const [templateSrc, setTemplateSrc] = useState(null);
  const [imageDimensions, setImageDimensions] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [interaction, setInteraction] = useState(null);
  const [detectingSlots, setDetectingSlots] = useState(false);
  const [detectError, setDetectError] = useState(null);
  const width = imageDimensions?.width || template?.width || (template?.orientation === 'landscape' ? 1900 : 900);
  const height = imageDimensions?.height || template?.height || (template?.orientation === 'landscape' ? 900 : 1900);
  const slots = template?.slots || [];

  useEffect(() => {
    let cancelled = false;
    setImageDimensions(null);
    if (!template?.overlayPngPath) return undefined;
    Promise.all([
      window.electronAPI.getTemplateThumbnail(template.overlayPngPath),
      window.electronAPI.getTemplateInfo(template.overlayPngPath),
    ]).then(([url, info]) => {
      if (cancelled) return;
      setTemplateSrc(url);
      if (info?.width && info?.height) setImageDimensions({ width: info.width, height: info.height });
    }).catch(() => {
      if (!cancelled) setTemplateSrc(null);
    });
    return () => { cancelled = true; };
  }, [template]);

  useEffect(() => {
    if (!interaction) return undefined;
    const move = event => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = event.clientX - interaction.startX;
      const dy = event.clientY - interaction.startY;
      let { x, y, w, h } = interaction.origin;
      if (interaction.mode === 'move') {
        x = Math.max(0, Math.min(rect.width - w, interaction.origin.x + dx));
        y = Math.max(0, Math.min(rect.height - h, interaction.origin.y + dy));
      } else {
        w = Math.max(MIN_SIZE, Math.min(rect.width - interaction.origin.x, interaction.origin.w + dx));
        h = Math.max(MIN_SIZE, Math.min(rect.height - interaction.origin.y, interaction.origin.h + dy));
      }
      setInteraction(current => current ? { ...current, draft: { x, y, w, h } } : current);
    };
    const stop = () => {
      const rect = canvasRef.current?.getBoundingClientRect();
      const draft = interaction.draft;
      if (rect && draft) {
        const nativeWidth = imageDimensions?.width || backgroundRef.current?.naturalWidth || width;
        const nativeHeight = imageDimensions?.height || backgroundRef.current?.naturalHeight || height;
        const scaleX = nativeWidth / rect.width;
        const scaleY = nativeHeight / rect.height;
        const values = {
          x: Math.round(draft.x * scaleX),
          y: Math.round(draft.y * scaleY),
          w: Math.round(draft.w * scaleX),
          h: Math.round(draft.h * scaleY),
        };
        Object.entries(values).forEach(([axis, value]) => onUpdateSlot(template.id, interaction.index, axis, value));
      }
      setInteraction(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
  }, [interaction, template, width, height, imageDimensions, onUpdateSlot]);

  if (!template) return <div className="template-editor-empty">Select a template to edit.</div>;

  const startInteraction = (event, index, mode) => {
    event.preventDefault();
    event.stopPropagation();
    const slot = slots[index];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !slot) return;
    const nativeWidth = imageDimensions?.width || backgroundRef.current?.naturalWidth || width;
    const nativeHeight = imageDimensions?.height || backgroundRef.current?.naturalHeight || height;
    const slotWidth = slot.w ?? slot.width;
    const slotHeight = slot.h ?? slot.height;
    setSelectedIndex(index);
    setInteraction({
      index,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      origin: {
        x: slot.x * rect.width / nativeWidth,
        y: slot.y * rect.height / nativeHeight,
        w: slotWidth * rect.width / nativeWidth,
        h: slotHeight * rect.height / nativeHeight,
      },
      draft: {
        x: slot.x * rect.width / nativeWidth,
        y: slot.y * rect.height / nativeHeight,
        w: slotWidth * rect.width / nativeWidth,
        h: slotHeight * rect.height / nativeHeight,
      },
    });
  };

  const autoDetectSlots = async () => {
    if (!onAutoDetectSlots) return;
    setDetectingSlots(true);
    setDetectError(null);
    try {
      await onAutoDetectSlots();
    } catch (error) {
      setDetectError(error.message || 'Could not detect transparent slots.');
    } finally {
      setDetectingSlots(false);
    }
  };

  const addTemplate = async layoutMode => {
    const next = await onAddTemplate(layoutMode);
    if (next) onSaveTemplate({ ...next, orientation: layoutMode, layoutMode });
  };

  return (
    <div className="template-editor-page">
      <header className="template-editor-header">
        <div><button className="back-btn" onClick={onBack}>← Back to Settings</button><h1>Visual Template Editor</h1><p>{template.name} · {width}×{height}px</p></div>
      </header>
      <div className="template-editor-layout">
        <aside className="template-editor-toolbar">
          <h3>Tools &amp; Library</h3>
          <p>Choose a template, then drag slots to position them. Drag the orange corner to resize.</p>
          <div className="template-editor-library">
            {templates.map(item => (
              <div key={item.id} className={`template-editor-library-row ${item.id === template.id ? 'template-editor-library-row--active' : ''}`}>
                <button onClick={() => onSelectTemplate(item.id)}>{item.name}</button>
                <label title="Show template on guest selection">
                  <input type="checkbox" checked={item.isCustom ? item.enabled !== false : !hiddenBuiltins.includes(item.id)} onChange={() => item.isCustom ? onToggleCustom(item.id) : onToggleBuiltin(item.id)} />
                  <span />
                </label>
              </div>
            ))}
          </div>
          <button className="settings-add-btn" onClick={() => addTemplate('portrait')}>＋ Add Portrait Template</button>
          <button className="settings-add-btn" onClick={() => addTemplate('landscape')}>＋ Add Landscape Template</button>
          <button className="settings-add-btn" onClick={autoDetectSlots} disabled={detectingSlots}>
            {detectingSlots ? 'Detecting Slots…' : 'Auto-Detect Slots'}
          </button>
          {detectError && <p className="settings-hint settings-hint--error">{detectError}</p>}
        </aside>
        <main className="template-editor-canvas-wrap">
          <div ref={canvasRef} className="template-editor-canvas" style={{ aspectRatio: `${width} / ${height}` }} onPointerDown={() => setSelectedIndex(null)}>
            {templateSrc && <img ref={backgroundRef} src={templateSrc} alt="" className="template-editor-background" onLoad={event => {
              if (!imageDimensions && event.currentTarget.naturalWidth && event.currentTarget.naturalHeight) {
                setImageDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight });
              }
            }} />}
            {slots.map((slot, index) => {
              const slotWidth = slot.w ?? slot.width;
              const slotHeight = slot.h ?? slot.height;
              const rect = canvasRef.current?.getBoundingClientRect();
              const draft = interaction?.index === index ? interaction.draft : null;
              const displaySlot = draft && rect
                ? {
                  x: draft.x * width / rect.width,
                  y: draft.y * height / rect.height,
                  w: draft.w * width / rect.width,
                  h: draft.h * height / rect.height,
                }
                : { x: slot.x, y: slot.y, w: slotWidth, h: slotHeight };
              return <div key={index} className={`template-editor-slot ${selectedIndex === index ? 'template-editor-slot--active' : ''}`} style={{ left: `${displaySlot.x / width * 100}%`, top: `${displaySlot.y / height * 100}%`, width: `${displaySlot.w / width * 100}%`, height: `${displaySlot.h / height * 100}%` }} onPointerDown={event => startInteraction(event, index, 'move')}>
                <span>Photo {index + 1}</span>
                {selectedIndex === index && <button className="template-editor-handle" onPointerDown={event => startInteraction(event, index, 'resize')} aria-label="Resize photo slot">↘</button>}
              </div>;
            })}
          </div>
        </main>
        <aside className="template-editor-layers">
          <h3>Layers</h3>
          <button className="settings-add-btn" onClick={onAddSlot}>＋ Add Photo Slot</button>
          <label className="template-editor-fit-label">Fit mode<select value={template.fitMode || 'cover'} onChange={event => onUpdateFitMode(template.id, event.target.value)}>
            <option value="cover">Cover</option><option value="contain">Contain</option><option value="fill">Fill</option>
          </select></label>
          <button className="template-editor-layer template-editor-layer--background">Background</button>
          {slots.map((slot, index) => <div key={index} className={`template-editor-layer ${selectedIndex === index ? 'template-editor-layer--active' : ''}`}><button onClick={() => setSelectedIndex(index)}>Photo {index + 1}</button><button className="template-editor-delete" onClick={() => onDeleteSlot(index)}>Delete</button></div>)}
        </aside>
      </div>
    </div>
  );
}
