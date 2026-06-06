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
            {shotCount} shots × {skus.length} SKUs = {totalImages} images
          </p>
        </div>
        <button
          onClick={onCancel}
          style={{
            fontSize: 11, color: WS.txtSec, background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
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
            SHARED FOR ALL SKUs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {supportingSlotLabels.map(({ key, label }) => {
              const file = uploadedFiles[key as keyof UploadedFiles];
              const missing = !file;
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  background: missing ? 'rgba(229,115,115,0.06)' : WS.surface,
                  border: `1px solid ${missing ? '#E5737320' : WS.border}`, borderRadius: 6,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 4, background: WS.surfHi,
                    overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {file ? (
                      <img
                        src={`data:${file.mimeType};base64,${file.data}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt={label}
                      />
                    ) : (
                      <svg viewBox="0 0 12 12" fill="none" stroke={missing ? '#E57373' : WS.txtSec} strokeWidth="1.2" style={{ width: 14, height: 14 }}>
                        <rect x="1" y="1" width="10" height="10" rx="1" />
                        <path d="M4 6h4M6 4v4" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: missing ? '#E57373' : WS.txtPri }}>{label}</div>
                    {missing && (
                      <div style={{ fontSize: 9, color: '#E57373', marginTop: 2 }}>
                        Missing — add in Inputs tab (advisory)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
          style={{
            fontSize: 11, color: WS.txtSec, background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
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
          Generate All — {totalImages} images
        </button>
      </div>
    </div>
  );
}
