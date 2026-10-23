import React from 'react';

const AXES = [
  { key: 'x', label: 'X' },
  { key: 'y', label: 'Y' },
  { key: 'w', label: 'W' },
  { key: 'h', label: 'H' },
];

export default function SlotFineTuner({ template, onUpdateSlot, onUpdateFitMode }) {
  const slots = template?.slots || [];

  return (
    <div className="template-slot-editor rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-xs font-semibold text-gray-700">Fine-tune photo slots</strong>
        <select
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
          value={template?.fitMode || 'cover'}
          onChange={event => onUpdateFitMode(template.id, event.target.value)}
          aria-label="Photo slot fit mode"
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
        </select>
      </div>

      {!slots.length ? (
        <p className="mt-2 text-xs text-gray-500">No slots detected for this template.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {slots.map((slot, slotIndex) => (
            <div key={slotIndex} className="grid grid-cols-[3.5rem_repeat(4,minmax(0,1fr))] items-end gap-2">
              <span className="pb-1 text-xs font-medium text-gray-500">Shot {slotIndex + 1}</span>
              {AXES.map(axis => (
                <label key={axis.key} className="flex min-w-0 flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wide text-gray-400">{axis.label}</span>
                  <input
                    type="number"
                    min="0"
                    value={slot[axis.key] ?? (axis.key === 'w' ? slot.width : axis.key === 'h' ? slot.height : 0)}
                    onChange={event => onUpdateSlot(template.id, slotIndex, axis.key, event.target.value)}
                    className="w-full min-w-0 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                    aria-label={`Shot ${slotIndex + 1} ${axis.label}`}
                  />
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
