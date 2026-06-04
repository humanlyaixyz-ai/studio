import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ModelType, ProductCategory, ShotConfig } from '../types';
import { IMAGES_PER_GENERATION, NON_FASHION_CATEGORIES } from '../constants';

interface PoseEditorProps {
  selectedModel: ModelType;
  selectedCategory: ProductCategory;
  currentShots: ShotConfig[];
  onShotsChange: (shots: ShotConfig[]) => void;
}

const T = {
  bg:       '#0A0908',
  surface:  '#0F0E0D',
  surfHi:   '#141210',
  border:   '#1C1A18',
  borderHi: '#2C2A28',
  txtPri:   '#E8E3DC',
  txtSec:   '#5A5550',
  txtMid:   '#8A8580',
  gold:     '#C8A97A',
};

const ShotRow: React.FC<{
  shot: ShotConfig;
  index: number;
  total: number;
  isReferenceAllowed: boolean;
  onPromptChange: (v: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onRemove: () => void;
}> = ({ shot, index, total, isReferenceAllowed, onPromptChange, onImageUpload, onRemoveImage, onRemove }) => {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
  };

  useEffect(() => { autoResize(); }, [shot.prompt]);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 14px',
        borderRadius: 6,
        background: focused ? T.surfHi : 'transparent',
        border: `1px solid ${focused ? T.borderHi : 'transparent'}`,
        transition: 'background 0.15s, border-color 0.15s',
        position: 'relative',
      }}
    >
      {/* Index pip */}
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        border: `1px solid ${focused ? T.gold + '60' : T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
        transition: 'border-color 0.15s',
      }}>
        <span style={{ fontSize: 9, color: focused ? T.gold : T.txtSec, fontVariantNumeric: 'tabular-nums', lineHeight: 1, userSelect: 'none' }}>
          {index + 1}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={shot.prompt}
        onChange={e => { onPromptChange(e.target.value); autoResize(); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={`Shot ${index + 1} — describe the scene, pose, or framing…`}
        rows={1}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: shot.prompt ? T.txtPri : T.txtSec,
          fontSize: 12,
          fontFamily: "'Sora', sans-serif",
          lineHeight: 1.75,
          resize: 'none',
          padding: 0,
          minHeight: 22,
          overflow: 'hidden',
          transition: 'color 0.1s',
        }}
      />

      {/* Reference image */}
      {isReferenceAllowed && (
        <div style={{ flexShrink: 0 }}>
          {shot.referenceImage ? (
            <div
              style={{ width: 40, height: 40, borderRadius: 4, overflow: 'hidden', border: `1px solid ${T.border}`, position: 'relative', cursor: 'pointer' }}
              onClick={onRemoveImage}
              title="Click to remove"
            >
              <img
                src={`data:${shot.referenceImage.mimeType};base64,${shot.referenceImage.data}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              >
                <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="1.5" style={{ width: 10, height: 10 }}>
                  <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          ) : (
            <label
              style={{
                width: 40, height: 40, borderRadius: 4,
                border: `1px dashed ${focused ? T.borderHi : T.border}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', gap: 2, transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = T.gold)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = focused ? T.borderHi : T.border)}
              title="Upload reference image"
            >
              <svg viewBox="0 0 12 12" fill="none" stroke={T.txtSec} strokeWidth="1.2" style={{ width: 11, height: 11 }}>
                <rect x="1" y="2" width="10" height="8" rx="1" />
                <circle cx="4" cy="5" r="1" />
                <path d="M1 8l2.5-2.5 2.5 2 2-2 3 2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 7, color: T.txtSec, letterSpacing: '0.03em' }}>ref</span>
              <input type="file" accept="image/*" onChange={onImageUpload} style={{ display: 'none' }} />
            </label>
          )}
        </div>
      )}

      {/* Remove */}
      {total > 1 && (
        <button
          onClick={onRemove}
          style={{
            flexShrink: 0, marginTop: 1,
            width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: T.txtSec, opacity: focused ? 1 : 0,
            transition: 'color 0.12s, opacity 0.15s',
            borderRadius: 3,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#E57373'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = T.txtSec; }}
          title="Remove shot"
        >
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 9, height: 9 }}>
            <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
};

const PoseEditor: React.FC<PoseEditorProps> = ({
  selectedModel,
  selectedCategory,
  currentShots,
  onShotsChange,
}) => {
  const [editableShots, setEditableShots] = useState<ShotConfig[]>(currentShots);

  useEffect(() => {
    setEditableShots(currentShots);
  }, [currentShots]);

  const handlePromptChange = useCallback((index: number, newPrompt: string) => {
    const updated = [...editableShots];
    updated[index] = { ...updated[index], prompt: newPrompt };
    setEditableShots(updated);
    onShotsChange(updated);
  }, [editableShots, onShotsChange]);

  const handleImageUpload = useCallback(async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64String = reader.result.split(',')[1];
          const updated = [...editableShots];
          updated[index] = { ...updated[index], referenceImage: { data: base64String, mimeType: file.type } };
          setEditableShots(updated);
          onShotsChange(updated);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [editableShots, onShotsChange]);

  const handleRemoveImage = useCallback((index: number) => {
    const updated = [...editableShots];
    updated[index] = { ...updated[index], referenceImage: undefined };
    setEditableShots(updated);
    onShotsChange(updated);
  }, [editableShots, onShotsChange]);

  const handleAddShot = useCallback(() => {
    if (editableShots.length < IMAGES_PER_GENERATION) {
      const updated = [...editableShots, { prompt: '' }];
      setEditableShots(updated);
      onShotsChange(updated);
    }
  }, [editableShots, onShotsChange]);

  const handleRemoveShot = useCallback((index: number) => {
    if (editableShots.length > 1) {
      const updated = editableShots.filter((_, i) => i !== index);
      setEditableShots(updated);
      onShotsChange(updated);
    }
  }, [editableShots, onShotsChange]);

  const isReferenceAllowed = NON_FASHION_CATEGORIES.includes(selectedCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Shot list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {editableShots.map((shot, index) => (
          <ShotRow
            key={index}
            shot={shot}
            index={index}
            total={editableShots.length}
            isReferenceAllowed={isReferenceAllowed}
            onPromptChange={v => handlePromptChange(index, v)}
            onImageUpload={e => handleImageUpload(index, e)}
            onRemoveImage={() => handleRemoveImage(index)}
            onRemove={() => handleRemoveShot(index)}
          />
        ))}
      </div>

      {/* Add shot / cap */}
      <div style={{ marginTop: 6, paddingLeft: 14 }}>
        {editableShots.length < IMAGES_PER_GENERATION ? (
          <button
            onClick={handleAddShot}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 0',
              background: 'none', border: 'none',
              color: T.txtSec, fontSize: 11, cursor: 'pointer',
              fontFamily: "'Sora', sans-serif",
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = T.gold)}
            onMouseLeave={e => (e.currentTarget.style.color = T.txtSec)}
          >
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1px dashed currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 8, height: 8 }}>
                <path d="M5 1v8M1 5h8" strokeLinecap="round" />
              </svg>
            </div>
            <span>Add shot</span>
            <span style={{ color: T.border, fontSize: 10 }}>
              {editableShots.length} / {IMAGES_PER_GENERATION}
            </span>
          </button>
        ) : (
          <p style={{ fontSize: 10, color: T.txtSec, paddingTop: 10 }}>
            {IMAGES_PER_GENERATION} shots — maximum reached
          </p>
        )}
      </div>
    </div>
  );
};

export default PoseEditor;
