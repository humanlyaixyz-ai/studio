import React from 'react';
import { SKU, UploadedFiles } from '../types';

interface BulkConfirmOverlayProps {
  skus: SKU[];
  uploadedFiles: UploadedFiles;
  supportingSlotLabels: { key: string; label: string }[];
  shotCount: number;
  primarySlot: string;
  onGenerate: () => void;
  onCancel: () => void;
  onRemoveSKU: (skuId: string) => void;
}

const WS = {
  bg: '#0A0908', surface: '#111010', surfHi: '#161412',
  border: '#1C1A18', borderHi: '#2C2A28',
  txtPri: '#E8E3DC', txtSec: '#5A5550', txtMid: '#8A8580', gold: '#C8A97A',
};

export function BulkConfirmOverlay({
  skus, uploadedFiles, supportingSlotLabels, shotCount,
  primarySlot, onGenerate, onCancel, onRemoveSKU,
}: BulkConfirmOverlayProps) {
  const totalImages = skus.length * shotCount;

  // Only the slots that actually have something uploaded
  const uploadedShared = supportingSlotLabels.filter(
    ({ key }) => !!uploadedFiles[key as keyof UploadedFiles]
  );

  return (
    <div style={{
      position: 'absolute', inset: 0, background: WS.bg, zIndex: 35,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 28px 16px', borderBottom: `1px solid ${WS.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 22,
            fontStyle: 'italic', fontWeight: 400, color: WS.txtPri, margin: 0,
          }}>
            Review Batch Run
          </h2>
          <p style={{ fontSize: 11, color: WS.txtSec, margin: '4px 0 0' }}>
            {shotCount} shot{shotCount !== 1 ? 's' : ''} × {skus.length} SKU{skus.length !== 1 ? 's' : ''} = {totalImages} images
          </p>
        </div>
        <button
          onClick={onCancel}
          style={{ fontSize: 11, color: WS.txtSec, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancel
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, overflow: 'hidden' }}>

        {/* Left — SKU queue */}
        <div style={{
          borderRight: `1px solid ${WS.border}`, padding: '20px 24px',
          overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 9, color: WS.txtSec, letterSpacing: '0.08em', marginBottom: 4 }}>
            SKU QUEUE ({skus.length})
          </div>
          {skus.map((sku, i) => {
            const thumb = sku.productAssets[primarySlot];
            return (
              <div key={sku.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                background: WS.surface, borderRadius: 6, border: `1px solid ${WS.border}`,
              }}>
                <span style={{ fontSize: 9, color: WS.txtSec, width: 16, textAlign: 'right', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <div style={{
                  width: 40, height: 40, borderRadius: 4, background: WS.surfHi,
                  overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {thumb ? (
                    <img
                      src={`data:${thumb.mimeType};base64,${thumb.data}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt={sku.name}
                    />
                  ) : (
                    <svg viewBox="0 0 12 12" fill="none" stroke={WS.txtSec} strokeWidth="1.2" style={{ width: 14, height: 14 }}>
                      <rect x="1" y="1" width="10" height="10" rx="1" />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: WS.txtPri, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sku.name}
                  </div>
                  {sku.skuCode && (
                    <div style={{ fontSize: 9, color: WS.txtSec, marginTop: 2 }}>{sku.skuCode}</div>
                  )}
                </div>
                <button
                  onClick={() => onRemoveSKU(sku.id)}
                  style={{
                    width: 20, height: 20, borderRadius: '50%', background: WS.borderHi,
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: WS.txtSec, fontSize: 11, flexShrink: 0,
                  }}
                  title="Remove from batch"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        {/* Right — Shared inputs */}
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <div style={{ fontSize: 9, color: WS.txtSec, letterSpacing: '0.08em', marginBottom: 12 }}>
            SHARED REFERENCES
          </div>

          {uploadedShared.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {uploadedShared.map(({ key, label }) => {
                const file = uploadedFiles[key as keyof UploadedFiles]!;
                return (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    background: WS.surface, border: `1px solid ${WS.border}`, borderRadius: 6,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 4, background: WS.surfHi,
                      overflow: 'hidden', flexShrink: 0,
                    }}>
                      <img
                        src={`data:${file.mimeType};base64,${file.data}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt={label}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: WS.txtPri }}>{label}</div>
                      <div style={{ fontSize: 9, color: WS.txtSec, marginTop: 1 }}>Shared across all SKUs</div>
                    </div>
                    <svg viewBox="0 0 10 10" fill="none" stroke="#4CAF50" strokeWidth="1.5" style={{ width: 10, height: 10, flexShrink: 0 }}>
                      <path d="M1.5 5.5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: '20px 16px', borderRadius: 8,
              border: `1px dashed ${WS.border}`, textAlign: 'center',
            }}>
              <svg viewBox="0 0 20 20" fill="none" stroke={WS.txtSec} strokeWidth="1.2" style={{ width: 28, height: 28, margin: '0 auto 10px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909"/>
              </svg>
              <p style={{ fontSize: 11, color: WS.txtMid, margin: '0 0 4px' }}>
                No shared references
              </p>
              <p style={{ fontSize: 10, color: WS.txtSec, margin: 0 }}>
                Only product images (per SKU) will be used.<br/>
                Add a model or background in Inputs to include them.
              </p>
            </div>
          )}

          {/* Info note */}
          <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 6, background: `${WS.gold}08`, border: `1px solid ${WS.gold}20` }}>
            <p style={{ fontSize: 9, color: WS.txtSec, margin: 0, lineHeight: 1.6 }}>
              <span style={{ color: WS.gold, fontWeight: 500 }}>How it works — </span>
              Each SKU's product image drives the generation. Shared references (model, background) are applied to all SKUs and are optional.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 28px', borderTop: `1px solid ${WS.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, flexShrink: 0,
      }}>
        <button
          onClick={onCancel}
          style={{ fontSize: 11, color: WS.txtSec, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancel
        </button>
        <button
          onClick={onGenerate}
          style={{
            padding: '11px 32px', borderRadius: 40, background: WS.gold, color: WS.bg,
            border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 11, height: 11 }}>
            <path d="M7 1l1.5 4.5L13 7l-4.5 1.5L7 13l-1.5-4.5L1 7l4.5-1.5L7 1z" strokeLinejoin="round" />
          </svg>
          Generate All — {totalImages} image{totalImages !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}
