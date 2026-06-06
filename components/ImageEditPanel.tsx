import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GeneratedImage, UploadedFiles } from '../types';
import { ColorAdjustments, applyColorGrading } from '../utils/imageUtils';
import { ITEMS_TO_UPLOAD } from '../constants';

const WS = {
  bg: '#0A0908', surface: '#111010', surfHi: '#161412',
  border: '#1C1A18', borderHi: '#2C2A28',
  txtPri: '#E8E3DC', txtSec: '#5A5550', txtMid: '#8A8580', gold: '#C8A97A',
};

const DEFAULT_ADJUSTMENTS: ColorAdjustments = {
  exposure: 0, contrast: 0, brightness: 0,
  saturation: 0, temperature: 0, tint: 0, sharpness: 0,
};

type EditTab = 'regenerate' | 'edit' | 'color' | 'crop';

interface ImageEditPanelProps {
  image: GeneratedImage;
  imageIndex: number;
  uploadedFiles: UploadedFiles;
  filename: string;
  onClose: () => void;
  onRegenerate: (index: number) => void;
  onApplyEdit: (
    index: number,
    prompt: string,
    references: { id: string; data: string; mimeType: string }[],
    originalKeys: string[]
  ) => void;
  onApplyColorGrading: (index: number, newBase64: string) => void;
  onDownload: (url: string | undefined, filename: string) => void;
}

function InlineSlider({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: WS.txtSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{label}</span>
        <span style={{ fontSize: 9, color: WS.gold, fontVariantNumeric: 'tabular-nums' }}>
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: WS.gold, cursor: 'pointer', height: 2 }}
      />
    </div>
  );
}

export function ImageEditPanel({
  image, imageIndex, uploadedFiles, filename,
  onClose, onRegenerate, onApplyEdit, onApplyColorGrading, onDownload,
}: ImageEditPanelProps) {
  const [tab, setTab] = useState<EditTab>('edit');
  const [editPrompt, setEditPrompt] = useState('');
  const [editRefs, setEditRefs] = useState<{ id: string; data: string; mimeType: string }[]>([]);
  const [editOriginalKeys, setEditOriginalKeys] = useState<string[]>([]);
  const [colorAdj, setColorAdj] = useState<ColorAdjustments>(DEFAULT_ADJUSTMENTS);
  const [colorPreview, setColorPreview] = useState<string | null>(null);
  const [isColorProcessing, setIsColorProcessing] = useState(false);
  const [base64, setBase64] = useState<string | null>(null);
  const [cropRatio, setCropRatio] = useState<string>('original');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Extract base64 from image URL for color grading
  useEffect(() => {
    if (!image.url) return;
    if (image.url.startsWith('data:')) {
      setBase64(image.url.split(',')[1]);
    } else {
      fetch(image.url)
        .then(r => r.blob())
        .then(blob => new Promise<string>(res => {
          const reader = new FileReader();
          reader.onloadend = () => res((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        }))
        .then(b64 => setBase64(b64))
        .catch(() => {});
    }
  }, [image.url]);

  // Debounced color preview
  useEffect(() => {
    if (tab !== 'color' || !base64) return;
    const allZero = Object.values(colorAdj).every(v => v === 0);
    if (allZero) { setColorPreview(null); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsColorProcessing(true);
      try {
        const result = await applyColorGrading(base64, colorAdj);
        setColorPreview(result);
      } finally {
        setIsColorProcessing(false);
      }
    }, 180);
    return () => clearTimeout(debounceRef.current);
  }, [colorAdj, base64, tab]);

  const handleAddRef = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = (reader.result as string).split(',')[1];
      setEditRefs(prev => [...prev, { id: Date.now().toString(), data: b64, mimeType: file.type }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const displaySrc = tab === 'color' && colorPreview
    ? `data:image/jpeg;base64,${colorPreview}`
    : image.url || '';

  const tabs: { key: EditTab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'edit', label: 'Edit',
      icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 12, height: 12 }}><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    {
      key: 'color', label: 'Color',
      icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 12, height: 12 }}><path d="M3 9V3m0 6a2 2 0 010 4m0-4a2 2 0 000 4M7 7V3m0 4a2 2 0 010 4m0-4a2 2 0 000 4M11 11V3" strokeLinecap="round"/></svg>,
    },
    {
      key: 'regenerate', label: 'Regenerate',
      icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 12, height: 12 }}><path d="M7 1l1.5 4.5L13 7l-4.5 1.5L7 13l-1.5-4.5L1 7l4.5-1.5z" strokeLinejoin="round"/></svg>,
    },
    {
      key: 'crop', label: 'Crop',
      icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 12, height: 12 }}><path d="M3 1v9a1 1 0 001 1h9M1 3h9a1 1 0 011 1v9" strokeLinecap="round"/></svg>,
    },
  ];

  const CROP_RATIOS = [
    { label: 'Original', value: 'original' },
    { label: '1 : 1', value: '1:1' },
    { label: '4 : 5', value: '4:5' },
    { label: '3 : 4', value: '3:4' },
    { label: '16 : 9', value: '16:9' },
  ];

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 320, background: WS.surface,
      borderLeft: `1px solid ${WS.border}`,
      display: 'flex', flexDirection: 'column',
      zIndex: 25, boxShadow: '-12px 0 40px rgba(0,0,0,0.6)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${WS.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        {/* Thumbnail */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 40, borderRadius: 4, overflow: 'hidden', background: WS.surfHi,
            flexShrink: 0, border: `1px solid ${WS.border}`,
          }}>
            {displaySrc && <img src={displaySrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: WS.txtPri }}>IMG_{String(imageIndex + 1).padStart(2, '0')}</div>
            <div style={{ fontSize: 9, color: WS.txtSec, marginTop: 2 }}>
              {image.generationTime ? `${(image.generationTime / 1000).toFixed(1)}s` : 'Generated'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Download */}
          <button
            onClick={() => onDownload(image.url, filename)}
            style={{ width: 28, height: 28, borderRadius: 4, background: WS.surfHi, border: `1px solid ${WS.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: WS.txtSec, transition: 'color 0.1s' }}
            title="Download"
            onMouseEnter={e => (e.currentTarget.style.color = WS.txtPri)}
            onMouseLeave={e => (e.currentTarget.style.color = WS.txtSec)}
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 10, height: 10 }}>
              <path d="M2 9v1.5a.5.5 0 00.5.5h7a.5.5 0 00.5-.5V9" strokeLinecap="round"/>
              <path d="M6 1v7M4 6l2 2 2-2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: WS.txtSec, transition: 'color 0.1s' }}
            onMouseEnter={e => (e.currentTarget.style.color = WS.txtPri)}
            onMouseLeave={e => (e.currentTarget.style.color = WS.txtSec)}
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 10, height: 10 }}>
              <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${WS.border}`, flexShrink: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '10px 4px', background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === t.key ? WS.gold : 'transparent'}`,
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: tab === t.key ? WS.gold : WS.txtSec, fontSize: 8, letterSpacing: '0.06em',
              transition: 'all 0.12s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (tab !== t.key) (e.currentTarget as HTMLElement).style.color = WS.txtPri; }}
            onMouseLeave={e => { if (tab !== t.key) (e.currentTarget as HTMLElement).style.color = WS.txtSec; }}
          >
            {t.icon}
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* ── Edit tab ── */}
        {tab === 'edit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Reference originals */}
            <div>
              <div style={{ fontSize: 9, color: WS.txtSec, letterSpacing: '0.08em', marginBottom: 8 }}>INCLUDE ORIGINAL INPUTS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {ITEMS_TO_UPLOAD.map(item => {
                  const key = item.key as keyof UploadedFiles;
                  if (!uploadedFiles[key]) return null;
                  const sel = editOriginalKeys.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => setEditOriginalKeys(prev => sel ? prev.filter(k => k !== key) : [...prev, key])}
                      style={{
                        padding: '3px 8px', borderRadius: 20, fontSize: 9, fontFamily: 'inherit',
                        border: `1px solid ${sel ? WS.gold + '80' : WS.border}`,
                        background: sel ? WS.gold + '12' : 'transparent',
                        color: sel ? WS.gold : WS.txtSec, cursor: 'pointer', transition: 'all 0.1s',
                      }}
                    >
                      {sel ? '✓ ' : ''}{item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom reference images */}
            <div>
              <div style={{ fontSize: 9, color: WS.txtSec, letterSpacing: '0.08em', marginBottom: 8 }}>REFERENCE IMAGES</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {editRefs.map(ref => (
                  <div key={ref.id} style={{ position: 'relative', width: 36, height: 36 }}>
                    <img src={`data:${ref.mimeType};base64,${ref.data}`} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, display: 'block', border: `1px solid ${WS.border}` }} alt="" />
                    <button
                      onClick={() => setEditRefs(prev => prev.filter(r => r.id !== ref.id))}
                      style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: WS.borderHi, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: WS.txtPri, fontSize: 9 }}
                    >×</button>
                  </div>
                ))}
                <label style={{ width: 36, height: 36, borderRadius: 4, background: WS.surfHi, border: `1px dashed ${WS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: WS.txtSec, transition: 'border-color 0.1s' }} onMouseEnter={e => (e.currentTarget.style.borderColor = WS.borderHi)} onMouseLeave={e => (e.currentTarget.style.borderColor = WS.border)}>
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 10, height: 10 }}><path d="M6 1v10M1 6h10" strokeLinecap="round"/></svg>
                  <input type="file" accept="image/*" onChange={handleAddRef} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <div style={{ fontSize: 9, color: WS.txtSec, letterSpacing: '0.08em', marginBottom: 8 }}>EDIT PROMPT</div>
              <textarea
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                placeholder="Describe your edit… e.g. make the background white"
                rows={4}
                style={{
                  width: '100%', boxSizing: 'border-box', background: WS.bg,
                  border: `1px solid ${WS.border}`, borderRadius: 6,
                  color: WS.txtPri, fontSize: 11, fontFamily: 'inherit', padding: '9px 11px',
                  outline: 'none', resize: 'none', lineHeight: 1.5,
                  transition: 'border-color 0.1s',
                }}
                onFocus={e => (e.target.style.borderColor = WS.gold)}
                onBlur={e => (e.target.style.borderColor = WS.border)}
              />
            </div>

            <button
              onClick={() => onApplyEdit(imageIndex, editPrompt, editRefs, editOriginalKeys)}
              disabled={!editPrompt.trim()}
              style={{
                width: '100%', padding: '10px', borderRadius: 6,
                background: editPrompt.trim() ? WS.gold : WS.borderHi,
                color: editPrompt.trim() ? WS.bg : WS.txtSec,
                border: 'none', fontSize: 11, fontWeight: 600, cursor: editPrompt.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', transition: 'all 0.12s',
              }}
            >
              Apply Edit
            </button>
          </div>
        )}

        {/* ── Color tab ── */}
        {tab === 'color' && (
          <div>
            {/* Mini preview */}
            <div style={{
              width: '100%', aspectRatio: '3/4', borderRadius: 6, overflow: 'hidden',
              background: WS.surfHi, border: `1px solid ${WS.border}`, marginBottom: 16, position: 'relative',
            }}>
              {displaySrc && <img src={displaySrc} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />}
              {isColorProcessing && (
                <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', color: WS.txtSec, fontSize: 9, padding: '2px 7px', borderRadius: 20 }}>
                  Rendering…
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 9, color: WS.txtSec, letterSpacing: '0.08em' }}>LIGHT</span>
              <button
                onClick={() => { setColorAdj(DEFAULT_ADJUSTMENTS); setColorPreview(null); }}
                style={{ fontSize: 9, color: WS.txtSec, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.color = WS.txtPri)}
                onMouseLeave={e => (e.currentTarget.style.color = WS.txtSec)}
              >
                Reset
              </button>
            </div>

            <InlineSlider label="Exposure" value={colorAdj.exposure} min={-100} max={100} onChange={v => setColorAdj(p => ({ ...p, exposure: v }))} />
            <InlineSlider label="Contrast" value={colorAdj.contrast} min={-100} max={100} onChange={v => setColorAdj(p => ({ ...p, contrast: v }))} />
            <InlineSlider label="Brightness" value={colorAdj.brightness} min={-100} max={100} onChange={v => setColorAdj(p => ({ ...p, brightness: v }))} />

            <div style={{ fontSize: 9, color: WS.txtSec, letterSpacing: '0.08em', margin: '16px 0 14px' }}>COLOR</div>
            <InlineSlider label="Saturation" value={colorAdj.saturation} min={-100} max={100} onChange={v => setColorAdj(p => ({ ...p, saturation: v }))} />
            <InlineSlider label="Temperature" value={colorAdj.temperature} min={-100} max={100} onChange={v => setColorAdj(p => ({ ...p, temperature: v }))} />
            <InlineSlider label="Tint" value={colorAdj.tint} min={-100} max={100} onChange={v => setColorAdj(p => ({ ...p, tint: v }))} />

            <button
              onClick={() => {
                if (!colorPreview) return;
                onApplyColorGrading(imageIndex, colorPreview);
                setColorAdj(DEFAULT_ADJUSTMENTS);
                setColorPreview(null);
              }}
              disabled={!colorPreview}
              style={{
                width: '100%', marginTop: 16, padding: '10px', borderRadius: 6,
                background: colorPreview ? WS.gold : WS.borderHi,
                color: colorPreview ? WS.bg : WS.txtSec,
                border: 'none', fontSize: 11, fontWeight: 600,
                cursor: colorPreview ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', transition: 'all 0.12s',
              }}
            >
              Apply Color Grade
            </button>
          </div>
        )}

        {/* ── Regenerate tab ── */}
        {tab === 'regenerate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              width: '100%', aspectRatio: '3/4', borderRadius: 6, overflow: 'hidden',
              background: WS.surfHi, border: `1px solid ${WS.border}`,
            }}>
              {image.url && <img src={image.url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />}
            </div>

            <div style={{ background: WS.surfHi, borderRadius: 6, padding: '10px 12px', border: `1px solid ${WS.border}` }}>
              <div style={{ fontSize: 9, color: WS.txtSec, marginBottom: 4 }}>CURRENT PROMPT</div>
              <div style={{ fontSize: 10, color: WS.txtMid, lineHeight: 1.5 }}>
                {image.prompt || 'No prompt recorded'}
              </div>
            </div>

            <button
              onClick={() => onRegenerate(imageIndex)}
              style={{
                width: '100%', padding: '10px', borderRadius: 6,
                background: WS.gold, color: WS.bg,
                border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 11, height: 11 }}>
                <path d="M7 1l1.5 4.5L13 7l-4.5 1.5L7 13l-1.5-4.5L1 7l4.5-1.5z" strokeLinejoin="round"/>
              </svg>
              Regenerate
            </button>

            <p style={{ fontSize: 9, color: WS.txtSec, textAlign: 'center', lineHeight: 1.5 }}>
              Uses the same shot settings and inputs to produce a new variation.
            </p>
          </div>
        )}

        {/* ── Crop tab ── */}
        {tab === 'crop' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              width: '100%', aspectRatio: '3/4', borderRadius: 6, overflow: 'hidden',
              background: WS.surfHi, border: `1px solid ${WS.border}`,
            }}>
              {image.url && <img src={image.url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />}
            </div>

            <div>
              <div style={{ fontSize: 9, color: WS.txtSec, letterSpacing: '0.08em', marginBottom: 10 }}>ASPECT RATIO</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {CROP_RATIOS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setCropRatio(r.value)}
                    style={{
                      padding: '8px 4px', background: cropRatio === r.value ? WS.gold + '15' : WS.surfHi,
                      border: `1px solid ${cropRatio === r.value ? WS.gold : WS.border}`,
                      borderRadius: 5, fontSize: 9, color: cropRatio === r.value ? WS.gold : WS.txtSec,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                if (!image.url) return;
                const a = document.createElement('a');
                a.href = image.url;
                a.download = filename.replace(/\.jpg$/, `_${cropRatio}.jpg`);
                a.click();
              }}
              style={{
                width: '100%', padding: '10px', borderRadius: 6,
                background: WS.gold, color: WS.bg,
                border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'opacity 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Download Cropped
            </button>

            <p style={{ fontSize: 9, color: WS.txtSec, textAlign: 'center', lineHeight: 1.5 }}>
              Full crop editor coming soon. Downloads current image with ratio metadata.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
