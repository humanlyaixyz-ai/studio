import React, { useState } from 'react';
import { GeneratedImage, GenerationBatch } from '../types';

const WS = {
  bg: '#0A0908', surface: '#111010', surfHi: '#161412',
  border: '#1C1A18', borderHi: '#2C2A28',
  txtPri: '#E8E3DC', txtSec: '#5A5550', txtMid: '#8A8580', gold: '#C8A97A',
};

interface HistoryCanvasProps {
  liveImages: GeneratedImage[];
  isLive: boolean;
  liveLabel?: string;
  batches: GenerationBatch[];
  onSelectImage: (image: GeneratedImage, index: number, isLive: boolean) => void;
  onDownloadImage: (url: string | undefined, filename: string) => void;
  onDownloadBatch: (batchId: string, name: string) => void;
  onRetryLiveShot: (index: number) => void;
  onClearHistory: () => void;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Stacked card thumbnail for a completed batch */
const BatchStack: React.FC<{
  batch: GenerationBatch;
  onClick: () => void;
}> = ({ batch, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const successImgs = batch.images.filter(i => i.status === 'success' && i.url);
  const failCount = batch.images.filter(i => i.status === 'failed').length;
  const front = successImgs[0];
  const mid = successImgs[1];
  const back = successImgs[2];
  const title = batch.skuName || batch.model.replace(/_/g, ' ');
  const allDone = successImgs.length === batch.images.length;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 120 }}
    >
      {/* Stack visual */}
      <div style={{ position: 'relative', width: 100, height: 134 }}>
        {/* Back card */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 6, overflow: 'hidden',
          background: WS.surfHi, border: `1px solid ${WS.border}`,
          transform: hovered ? 'rotate(-6deg) translate(-6px, 2px)' : 'rotate(-3deg) translate(-4px, 2px)',
          transition: 'transform 0.2s ease',
          opacity: 0.45,
        }}>
          {back?.url && <img src={back.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
        </div>

        {/* Mid card */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 6, overflow: 'hidden',
          background: WS.surfHi, border: `1px solid ${WS.border}`,
          transform: hovered ? 'rotate(3deg) translate(4px, -1px)' : 'rotate(1.5deg) translate(2px, 0px)',
          transition: 'transform 0.2s ease',
          opacity: 0.65,
        }}>
          {mid?.url && <img src={mid.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
        </div>

        {/* Front card */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 6, overflow: 'hidden',
          background: WS.surfHi,
          border: `1px solid ${hovered ? WS.borderHi : WS.border}`,
          transform: hovered ? 'scale(1.03)' : 'scale(1)',
          transition: 'transform 0.2s ease, border-color 0.15s',
          boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {front?.url ? (
            <img src={front.url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt={title} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {failCount > 0 ? (
                <svg viewBox="0 0 14 14" fill="none" stroke="#E57373" strokeWidth="1.3" style={{ width: 16, height: 16 }}>
                  <path d="M7 2v6M7 9.5v1" strokeLinecap="round"/>
                </svg>
              ) : (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: WS.border }} />
              )}
            </div>
          )}

          {/* Count badge */}
          <div style={{
            position: 'absolute', bottom: 4, right: 4,
            background: 'rgba(0,0,0,0.7)', borderRadius: 10,
            padding: '1px 6px', fontSize: 8,
            color: allDone ? '#4CAF50' : failCount > 0 ? '#E57373' : WS.txtSec,
          }}>
            {successImgs.length}/{batch.images.length}
          </div>
        </div>
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: 10, color: WS.txtMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {title}
        </div>
        <div style={{ fontSize: 8, color: WS.txtSec, marginTop: 1 }}>
          {formatDate(batch.timestamp)}
        </div>
      </div>
    </div>
  );
};

/** Batch detail overlay — shows all shots for a selected batch */
const BatchDetail: React.FC<{
  batch: GenerationBatch;
  onClose: () => void;
  onSelectImage: (img: GeneratedImage, idx: number) => void;
  onDownloadImage: (url: string | undefined, filename: string) => void;
  onDownloadBatch: () => void;
}> = ({ batch, onClose, onSelectImage, onDownloadImage, onDownloadBatch }) => {
  const name = batch.skuName || batch.model.replace(/_/g, ' ');
  const successCount = batch.images.filter(i => i.status === 'success').length;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(10,9,8,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: WS.surface, border: `1px solid ${WS.borderHi}`,
          borderRadius: 12, overflow: 'hidden',
          width: 'min(680px, 92vw)', maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${WS.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: WS.txtPri }}>{name}</div>
            <div style={{ fontSize: 9, color: WS.txtSec, marginTop: 2 }}>
              {formatDate(batch.timestamp)} · {successCount}/{batch.images.length} shots
              {batch.category && ` · ${batch.category}`}
            </div>
          </div>
          {successCount > 0 && (
            <button
              onClick={onDownloadBatch}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'none', border: `1px solid ${WS.border}`, borderRadius: 20, fontSize: 9, color: WS.txtSec, cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = WS.txtPri; (e.currentTarget as HTMLElement).style.borderColor = WS.borderHi; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = WS.txtSec; (e.currentTarget as HTMLElement).style.borderColor = WS.border; }}
            >
              <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 8, height: 8 }}>
                <path d="M2 8v1a.5.5 0 00.5.5h5a.5.5 0 00.5-.5V8" strokeLinecap="round"/>
                <path d="M5 1v6M3.5 5L5 7l1.5-2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download all
            </button>
          )}
          <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: '50%', background: WS.surfHi, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: WS.txtSec }}>
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 8, height: 8 }}>
              <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Shot grid */}
        <div style={{ overflowY: 'auto', padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
          {batch.images.map((img, i) => (
            <div
              key={img.id || i}
              style={{ aspectRatio: '3/4', borderRadius: 6, overflow: 'hidden', background: WS.surfHi, border: `1px solid ${WS.border}`, position: 'relative', cursor: img.status === 'success' ? 'pointer' : 'default' }}
              onClick={() => img.status === 'success' && onSelectImage(img, i)}
            >
              {img.url ? (
                <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Shot ${i + 1}`} />
              ) : img.status === 'failed' ? (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(60,26,26,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 12 12" fill="none" stroke="#F2B8B5" strokeWidth="1.3" style={{ width: 14, height: 14 }}><path d="M6 2v5M6 8.5v1" strokeLinecap="round"/></svg>
                </div>
              ) : null}
              {img.status === 'success' && img.url && (
                <button
                  onClick={e => { e.stopPropagation(); onDownloadImage(img.url, `${name}_Shot_${String(i + 1).padStart(2, '0')}.jpg`); }}
                  style={{ position: 'absolute', bottom: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                  className="dl-btn"
                >
                  <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.4" style={{ width: 8, height: 8 }}>
                    <path d="M2 8v1.5h6V8" strokeLinecap="round"/>
                    <path d="M5 1v6M3.5 5L5 7l1.5-2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              <div style={{ position: 'absolute', bottom: 3, left: 5, fontSize: 7, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }}>{i + 1}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`div:hover .dl-btn { opacity: 1 !important; }`}</style>
    </div>
  );
};

/** Live generation row — compact horizontal strip with spinners/images */
const LiveRow: React.FC<{
  images: GeneratedImage[];
  isLive: boolean;
  label: string;
  onSelectImage: (img: GeneratedImage, idx: number) => void;
  onDownloadImage: (url: string | undefined, filename: string) => void;
  onRetry: (idx: number) => void;
}> = ({ images, isLive, label, onSelectImage, onDownloadImage, onRetry }) => (
  <div style={{ background: WS.surface, border: `1px solid ${isLive ? WS.gold + '44' : WS.border}`, borderRadius: 10, overflow: 'hidden' }}>
    <div style={{ padding: '9px 14px', borderBottom: `1px solid ${WS.borderHi}`, display: 'flex', alignItems: 'center', gap: 8, background: isLive ? `${WS.gold}06` : 'transparent' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: isLive ? WS.gold : '#4CAF50', flexShrink: 0, animation: isLive ? 'pulse 1.4s ease-in-out infinite' : 'none' }} />
      <span style={{ fontSize: 11, color: isLive ? WS.gold : WS.txtPri, fontWeight: 500, flex: 1 }}>
        {isLive ? `${label} — Generating` : label}
      </span>
      <span style={{ fontSize: 9, color: WS.txtSec }}>
        {images.filter(i => i.status === 'success').length}/{images.length}
      </span>
    </div>
    <div style={{ display: 'flex', gap: 8, padding: '10px 14px', overflowX: 'auto', scrollbarWidth: 'none' as const }}>
      {images.map((img, i) => {
        const isGenerating = img.status === 'generating' || img.status === 'pending' || img.status === 'refining';
        const isSuccess = img.status === 'success';
        const isFailed = img.status === 'failed';
        return (
          <div
            key={img.id || i}
            style={{ flexShrink: 0, width: 72, height: 96, borderRadius: 6, overflow: 'hidden', background: WS.surfHi, border: `1px solid ${WS.border}`, position: 'relative', cursor: isSuccess ? 'pointer' : 'default' }}
            onClick={() => isSuccess && onSelectImage(img, i)}
          >
            {img.url && <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isGenerating ? 0.35 : 1 }} alt="" />}
            {isGenerating && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 18, height: 18, border: `2px solid ${WS.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              </div>
            )}
            {isFailed && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(60,26,26,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <svg viewBox="0 0 12 12" fill="none" stroke="#F2B8B5" strokeWidth="1.3" style={{ width: 12, height: 12 }}><path d="M6 2v5M6 8v1" strokeLinecap="round"/></svg>
                <button onClick={e => { e.stopPropagation(); onRetry(i); }} style={{ padding: '2px 7px', background: '#F2B8B5', color: '#602020', border: 'none', borderRadius: 10, fontSize: 7, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
              </div>
            )}
            {isSuccess && img.url && (
              <button
                onClick={e => { e.stopPropagation(); onDownloadImage(img.url, `Shot_${String(i + 1).padStart(2, '0')}.jpg`); }}
                style={{ position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                className="live-dl-btn"
              >
                <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" style={{ width: 7, height: 7 }}>
                  <path d="M2 8v1.5h6V8" strokeLinecap="round"/>
                  <path d="M5 1v6M3.5 5L5 7l1.5-2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <div style={{ position: 'absolute', bottom: 3, left: 5, fontSize: 7, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>{i + 1}</div>
          </div>
        );
      })}
    </div>
  </div>
);

export function HistoryCanvas({
  liveImages, isLive, liveLabel, batches,
  onSelectImage, onDownloadImage, onDownloadBatch,
  onRetryLiveShot, onClearHistory,
}: HistoryCanvasProps) {
  const [openBatchId, setOpenBatchId] = useState<string | null>(null);
  const openBatch = batches.find(b => b.id === openBatchId) || null;

  const hasLive = isLive || liveImages.length > 0;
  const hasHistory = batches.length > 0;

  if (!hasLive && !hasHistory) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', pointerEvents: 'none' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', border: `1px solid ${WS.borderHi}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={WS.txtSec} strokeWidth="1" style={{ width: 28, height: 28 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>
          </svg>
        </div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: 'italic', fontWeight: 400, color: WS.txtPri, marginBottom: 8 }}>Ready to generate</h3>
        <p style={{ fontSize: 11, color: WS.txtMid, marginBottom: 6 }}>Upload your assets, then hit Generate.</p>
        <p style={{ fontSize: 10, color: WS.txtSec }}>Open <strong style={{ color: WS.gold }}>Inputs</strong> from the bar below to upload.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px 32px' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes spin { to { transform: rotate(360deg); } }
        div:hover .live-dl-btn { opacity: 1 !important; }
      `}</style>

      {/* History grid */}
      {hasHistory && (
        <div style={{ marginBottom: hasLive ? 24 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 9, color: WS.txtSec, letterSpacing: '0.1em', fontWeight: 500 }}>
              RUNS — {batches.length}
            </span>
            <button
              onClick={onClearHistory}
              style={{ fontSize: 9, color: WS.txtSec, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#E57373')}
              onMouseLeave={e => (e.currentTarget.style.color = WS.txtSec)}
            >
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 9, height: 9 }}>
                <path d="M2 3h8M5 3V2h2v1M4 3l.5 7h3L8 3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Clear all
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {batches.map(batch => (
              <BatchStack
                key={batch.id}
                batch={batch}
                onClick={() => setOpenBatchId(batch.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Live generation */}
      {hasLive && (
        <div>
          {hasHistory && (
            <div style={{ fontSize: 9, color: WS.txtSec, letterSpacing: '0.1em', fontWeight: 500, marginBottom: 12 }}>
              LIVE
            </div>
          )}
          <LiveRow
            images={liveImages}
            isLive={isLive}
            label={liveLabel || 'Generation'}
            onSelectImage={(img, idx) => onSelectImage(img, idx, true)}
            onDownloadImage={onDownloadImage}
            onRetry={onRetryLiveShot}
          />
        </div>
      )}

      {/* Batch detail overlay */}
      {openBatch && (
        <BatchDetail
          batch={openBatch}
          onClose={() => setOpenBatchId(null)}
          onSelectImage={(img, idx) => { onSelectImage(img, idx, false); setOpenBatchId(null); }}
          onDownloadImage={onDownloadImage}
          onDownloadBatch={() => onDownloadBatch(openBatch.id, openBatch.skuName || openBatch.model)}
        />
      )}
    </div>
  );
}
