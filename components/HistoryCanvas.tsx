import React from 'react';
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

function formatBatchDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + time;
}

const ShotThumb: React.FC<{
  image: GeneratedImage | undefined;
  index: number;
  batchName: string;
  isLive: boolean;
  isCurrentlyLive: boolean;
  onSelect: (img: GeneratedImage, i: number) => void;
  onDownload: (url: string | undefined, filename: string) => void;
  onRetry?: (i: number) => void;
}> = ({ image, index, batchName, isLive, isCurrentlyLive, onSelect, onDownload, onRetry }) => {
  const isGenerating = image?.status === 'generating' || image?.status === 'pending' || image?.status === 'refining';
  const isSuccess = image?.status === 'success';
  const isFailed = image?.status === 'failed';

  return (
    <div
      style={{
        position: 'relative',
        width: 72, height: 96,
        borderRadius: 6, overflow: 'hidden',
        background: WS.surfHi, border: `1px solid ${WS.border}`,
        flexShrink: 0,
        transition: 'border-color 0.15s',
      }}
      className="hist-thumb"
    >
      {/* Empty slot */}
      {!image && (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: WS.border }} />
        </div>
      )}

      {/* Generating */}
      {image && isGenerating && (
        <>
          {image.url && (
            <img src={image.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} alt="" />
          )}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: `2px solid ${isCurrentlyLive ? WS.gold : WS.txtSec}`,
              borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        </>
      )}

      {/* Success */}
      {isSuccess && image?.url && (
        <>
          <img
            src={image.url}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
            alt={`${batchName} shot ${index + 1}`}
            onClick={() => onSelect(image, index)}
          />
          <div
            className="hist-thumb-overlay"
            style={{
              position: 'absolute', inset: 0, opacity: 0, transition: 'opacity 0.15s',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            <button
              onClick={e => { e.stopPropagation(); onSelect(image, index); }}
              style={{ width: 26, height: 26, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Open"
            >
              <svg viewBox="0 0 10 10" fill="none" stroke="#0A0908" strokeWidth="1.5" style={{ width: 9, height: 9 }}>
                <path d="M1 5h8M5 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDownload(image.url, `${batchName}_Shot_${String(index + 1).padStart(2, '0')}.jpg`); }}
              style={{ width: 26, height: 26, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Download"
            >
              <svg viewBox="0 0 10 10" fill="none" stroke="#0A0908" strokeWidth="1.5" style={{ width: 9, height: 9 }}>
                <path d="M2 8v1.5h6V8" strokeLinecap="round" />
                <path d="M5 1v6M3.5 5L5 7l1.5-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* Failed */}
      {isFailed && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(60,26,26,0.92)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 5, padding: 6, textAlign: 'center',
        }}>
          <svg viewBox="0 0 12 12" fill="none" stroke="#F2B8B5" strokeWidth="1.3" style={{ width: 14, height: 14 }}>
            <path d="M6 2v5M6 8.5v1" strokeLinecap="round" />
          </svg>
          {isLive && onRetry && (
            <button
              onClick={() => onRetry(index)}
              style={{ padding: '2px 8px', background: '#F2B8B5', color: '#602020', border: 'none', borderRadius: 20, fontSize: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Shot label */}
      <div style={{ position: 'absolute', bottom: 3, left: 5, fontSize: 7, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }}>
        {index + 1}
      </div>

      <style>{`.hist-thumb:hover .hist-thumb-overlay { opacity: 1 !important; }`}</style>
    </div>
  );
};

const BatchCard: React.FC<{
  batch?: GenerationBatch;
  images: (GeneratedImage | undefined)[];
  title: string;
  subtitle?: string;
  isLiveBatch: boolean;
  isCurrentlyLive: boolean;
  onSelectImage: (img: GeneratedImage, idx: number) => void;
  onDownloadImage: (url: string | undefined, filename: string) => void;
  onDownloadBatch?: () => void;
  onRetry?: (idx: number) => void;
}> = ({
  batch, images, title, subtitle, isLiveBatch, isCurrentlyLive,
  onSelectImage, onDownloadImage, onDownloadBatch, onRetry,
}) => {
  const successCount = images.filter(i => i?.status === 'success').length;
  const failCount = images.filter(i => i?.status === 'failed').length;
  const total = images.length;
  const batchName = title.replace(/\s+/g, '_');

  return (
    <div style={{
      marginBottom: 16,
      borderRadius: 10,
      border: `1px solid ${isLiveBatch && isCurrentlyLive ? WS.gold + '55' : WS.border}`,
      overflow: 'hidden',
      background: WS.surface,
      boxShadow: isLiveBatch && isCurrentlyLive ? `0 0 20px ${WS.gold}0A` : 'none',
      transition: 'border-color 0.3s, box-shadow 0.3s',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        borderBottom: `1px solid ${WS.borderHi}`,
        background: isLiveBatch && isCurrentlyLive ? `${WS.gold}05` : WS.surfHi,
      }}>
        {/* Live pulse dot or success dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: isLiveBatch && isCurrentlyLive ? WS.gold : successCount === total && total > 0 ? '#4CAF50' : WS.txtSec,
          animation: isLiveBatch && isCurrentlyLive ? 'pulse 1.4s ease-in-out infinite' : 'none',
        }} />

        {/* Title block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500,
            color: isLiveBatch && isCurrentlyLive ? WS.gold : WS.txtPri,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isLiveBatch && isCurrentlyLive ? `${title} — Generating` : title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 9, color: WS.txtSec, marginTop: 1 }}>{subtitle}</div>
          )}
        </div>

        {/* Meta pills */}
        {batch?.category && (
          <span style={{
            fontSize: 8, color: WS.txtSec, background: WS.bg,
            border: `1px solid ${WS.border}`, borderRadius: 20, padding: '2px 8px', flexShrink: 0,
          }}>
            {batch.category}
          </span>
        )}

        {/* Count */}
        <span style={{ fontSize: 9, color: WS.txtSec, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {successCount}/{total}
          {failCount > 0 && (
            <span style={{ color: '#E57373', marginLeft: 4 }}>· {failCount} failed</span>
          )}
        </span>

        {/* Download batch button */}
        {!isCurrentlyLive && batch && successCount > 0 && onDownloadBatch && (
          <button
            onClick={onDownloadBatch}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', background: 'none', border: `1px solid ${WS.border}`,
              borderRadius: 20, fontSize: 9, color: WS.txtSec, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'color 0.1s, border-color 0.1s', flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = WS.txtPri; (e.currentTarget as HTMLElement).style.borderColor = WS.borderHi; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = WS.txtSec; (e.currentTarget as HTMLElement).style.borderColor = WS.border; }}
            title="Download all shots"
          >
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 8, height: 8 }}>
              <path d="M2 8v1a.5.5 0 00.5.5h5a.5.5 0 00.5-.5V8" strokeLinecap="round" />
              <path d="M5 1v6M3.5 5L5 7l1.5-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download
          </button>
        )}
      </div>

      {/* Shot strip */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px',
        overflowX: 'auto',
        scrollbarWidth: 'none' as const,
      }}>
        {images.map((img, i) => (
          <ShotThumb
            key={img?.id || i}
            image={img}
            index={i}
            batchName={batchName}
            isLive={isLiveBatch}
            isCurrentlyLive={isCurrentlyLive}
            onSelect={onSelectImage}
            onDownload={onDownloadImage}
            onRetry={isLiveBatch ? onRetry : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export function HistoryCanvas({
  liveImages, isLive, liveLabel, batches,
  onSelectImage, onDownloadImage, onDownloadBatch,
  onRetryLiveShot, onClearHistory,
}: HistoryCanvasProps) {
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
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: 'italic', fontWeight: 400, color: WS.txtPri, marginBottom: 8 }}>
          Ready to generate
        </h3>
        <p style={{ fontSize: 11, color: WS.txtMid, marginBottom: 6 }}>Upload your assets, then hit Generate.</p>
        <p style={{ fontSize: 10, color: WS.txtSec }}>Open <strong style={{ color: WS.gold }}>Inputs</strong> from the bar below to upload.</p>
      </div>
    );
  }

  const liveTitle = liveLabel || 'Generation';

  return (
    <div style={{ padding: '24px 24px 32px' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Section header when history exists */}
      {hasHistory && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 9, color: WS.txtSec, letterSpacing: '0.1em', fontWeight: 500 }}>
            GENERATION RUNS — {batches.length + (hasLive ? 1 : 0)}
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
      )}

      {/* Live card */}
      {hasLive && (
        <BatchCard
          images={liveImages as (GeneratedImage | undefined)[]}
          title={liveTitle}
          subtitle={undefined}
          isLiveBatch
          isCurrentlyLive={isLive}
          onSelectImage={(img, idx) => onSelectImage(img, idx, true)}
          onDownloadImage={onDownloadImage}
          onRetry={onRetryLiveShot}
        />
      )}

      {/* History batch cards */}
      {batches.map(batch => {
        const name = batch.skuName || batch.model.replace(/_/g, ' ');
        const dateStr = formatBatchDate(batch.timestamp);
        return (
          <BatchCard
            key={batch.id}
            batch={batch}
            images={batch.images}
            title={name}
            subtitle={dateStr}
            isLiveBatch={false}
            isCurrentlyLive={false}
            onSelectImage={(img, idx) => onSelectImage(img, idx, false)}
            onDownloadImage={onDownloadImage}
            onDownloadBatch={() => onDownloadBatch(batch.id, name)}
          />
        );
      })}
    </div>
  );
}
