import React from 'react';
import { GenerationBatch, GeneratedImage, SKU } from '../types';

const WS = {
  bg: '#0A0908', surface: '#111010', surfHi: '#161412',
  border: '#1C1A18', borderHi: '#2C2A28',
  txtPri: '#E8E3DC', txtSec: '#5A5550', txtMid: '#8A8580', gold: '#C8A97A',
};

interface BulkResultsCanvasProps {
  runSKUs: SKU[];
  batches: GenerationBatch[];
  currentSKUId: string | null;
  liveImages: GeneratedImage[];
  shotCount: number;
  primarySlot: string;
  isBulkGenerating: boolean;
  onRetryShot: (batchId: string, imageIndex: number) => void;
  onDownloadImage: (url: string | undefined, filename: string) => void;
  onDownloadSKU: (batchId: string, skuName: string) => void;
  onSelectImage: (url: string) => void;
}

function StatusBadge({ status, failCount }: { status: 'queued' | 'generating' | 'done' | 'failed'; failCount?: number }) {
  const configs = {
    queued:     { color: WS.txtSec,   dot: WS.txtSec,   label: 'Queued' },
    generating: { color: WS.gold,     dot: WS.gold,     label: 'Generating' },
    done:       { color: '#4CAF50',   dot: '#4CAF50',   label: 'Done' },
    failed:     { color: '#E57373',   dot: '#E57373',   label: failCount ? `Failed (${failCount})` : 'Failed' },
  };
  const c = configs[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: c.color }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0,
        animation: status === 'generating' ? 'pulse 1.2s ease-in-out infinite' : 'none',
      }} />
      {c.label}
    </span>
  );
}

const ShotCell: React.FC<{
  image?: GeneratedImage;
  index: number;
  batchId: string;
  skuName: string;
  isCurrent: boolean;
  onRetry: (batchId: string, idx: number) => void;
  onDownload: (url: string | undefined, filename: string) => void;
  onSelect: (url: string) => void;
}> = function ShotCell({
  image, index, batchId, skuName, isCurrent,
  onRetry, onDownload, onSelect,
}) {
  const isGenerating = image?.status === 'generating' || image?.status === 'pending';
  const isSuccess = image?.status === 'success';
  const isFailed = image?.status === 'failed';

  return (
    <div style={{
      flexShrink: 0,
      width: 'clamp(100px, calc((100% - 120px) / 6), 180px)',
      aspectRatio: '3/4', borderRadius: 6, overflow: 'hidden',
      background: WS.surfHi, border: `1px solid ${WS.border}`,
      position: 'relative', transition: 'border-color 0.15s',
    }}
      className="bulk-shot-cell"
    >
      {/* Empty / queued */}
      {!image && (
        <div style={{
          width: '100%', height: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: WS.border }} />
        </div>
      )}

      {/* Generating / pending */}
      {isGenerating && (
        <div style={{
          width: '100%', height: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 18, height: 18, border: `2px solid ${isCurrent ? WS.gold : WS.txtSec}`,
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      )}

      {/* Success */}
      {isSuccess && image?.url && (
        <>
          <img
            src={image.url}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
            alt={`${skuName} shot ${index + 1}`}
            onClick={() => onSelect(image.url!)}
          />
          <div className="bulk-cell-overlay" style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
            opacity: 0, transition: 'opacity 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <button
              onClick={e => { e.stopPropagation(); onDownload(image.url, `${skuName}_Shot_${String(index + 1).padStart(2, '0')}.jpg`); }}
              style={{ width: 30, height: 30, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Download"
            >
              <svg viewBox="0 0 12 12" fill="none" stroke="#0A0908" strokeWidth="1.5" style={{ width: 10, height: 10 }}>
                <path d="M2 9v1.5a.5.5 0 00.5.5h7a.5.5 0 00.5-.5V9" strokeLinecap="round" />
                <path d="M6 1v7M4 5.5L6 8l2-2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* Failed */}
      {isFailed && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(60,26,26,0.92)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 6, padding: 8, textAlign: 'center',
        }}>
          <span style={{ fontSize: 8, color: '#F2B8B5', lineHeight: 1.4 }}>
            {image?.errorMessage?.slice(0, 60) || 'Failed'}
          </span>
          <button
            onClick={() => onRetry(batchId, index)}
            style={{
              padding: '3px 10px', background: '#F2B8B5', color: '#602020',
              border: 'none', borderRadius: 20, fontSize: 9, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Shot number label */}
      <div style={{
        position: 'absolute', bottom: 4, left: 6,
        fontSize: 8, color: 'rgba(255,255,255,0.4)', pointerEvents: 'none',
      }}>
        {index + 1}
      </div>
    </div>
  );
}

export function BulkResultsCanvas({
  runSKUs, batches, currentSKUId, liveImages, shotCount,
  primarySlot, isBulkGenerating,
  onRetryShot, onDownloadImage, onDownloadSKU, onSelectImage,
}: BulkResultsCanvasProps) {
  return (
    <div style={{ padding: 24 }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .bulk-shot-cell:hover .bulk-cell-overlay { opacity: 1 !important; }
      `}</style>

      {runSKUs.map(sku => {
        const isCurrent = sku.id === currentSKUId;
        const batch = batches.find(b => b.skuId === sku.id);
        const images: (GeneratedImage | undefined)[] = isCurrent
          ? liveImages
          : batch
            ? batch.images
            : Array(shotCount).fill(undefined);

        const successCount = images.filter(i => i?.status === 'success').length;
        const failCount = images.filter(i => i?.status === 'failed').length;
        const isDone = !isBulkGenerating && batch !== undefined;
        const isQueued = !isCurrent && !batch;
        const badgeStatus: 'queued' | 'generating' | 'done' | 'failed' =
          isQueued ? 'queued'
          : isCurrent ? 'generating'
          : failCount === images.length ? 'failed'
          : 'done';

        const thumb = sku.productAssets[primarySlot];

        return (
          <div
            key={sku.id}
            id={`bulk-sku-${sku.id}`}
            style={{ marginBottom: 24 }}
          >
            {/* Card header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', background: WS.surface,
              borderRadius: '8px 8px 0 0', border: `1px solid ${WS.border}`,
              borderBottom: 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 4, background: WS.surfHi,
                overflow: 'hidden', flexShrink: 0,
              }}>
                {thumb ? (
                  <img src={`data:${thumb.mimeType};base64,${thumb.data}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={sku.name} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: WS.borderHi }} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: WS.txtPri }}>{sku.name}</div>
                {sku.skuCode && <div style={{ fontSize: 9, color: WS.txtSec, marginTop: 1 }}>{sku.skuCode}</div>}
              </div>

              <StatusBadge status={badgeStatus} failCount={failCount} />

              {isDone && (
                <span style={{ fontSize: 9, color: WS.txtSec, marginLeft: 8 }}>
                  {successCount}/{images.length}
                </span>
              )}

              {isCurrent && (
                <span style={{ fontSize: 9, color: WS.gold, marginLeft: 8 }}>
                  {liveImages.filter(i => i.status === 'success').length}/{shotCount}
                </span>
              )}

              {isDone && batch && successCount > 0 && (
                <button
                  onClick={() => onDownloadSKU(batch.id, sku.name)}
                  style={{
                    padding: '4px 10px', background: 'none', border: `1px solid ${WS.border}`,
                    borderRadius: 20, fontSize: 9, color: WS.txtSec, cursor: 'pointer',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
                    marginLeft: 8, transition: 'color 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = WS.txtPri)}
                  onMouseLeave={e => (e.currentTarget.style.color = WS.txtSec)}
                  title="Download all shots for this SKU"
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
              display: 'flex', gap: 8, padding: '12px 14px',
              background: WS.surface, border: `1px solid ${WS.border}`,
              borderRadius: '0 0 8px 8px', borderTop: `1px solid ${WS.borderHi}`,
              flexWrap: 'wrap',
            }}>
              {Array.from({ length: shotCount }, (_, i) => (
                <ShotCell
                  key={i}
                  image={images[i]}
                  index={i}
                  batchId={batch?.id || ''}
                  skuName={sku.name}
                  isCurrent={isCurrent}
                  onRetry={onRetryShot}
                  onDownload={onDownloadImage}
                  onSelect={onSelectImage}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
