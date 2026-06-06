import React, { useState } from 'react';
import { Project, ModelType, ProductCategory, AssetFile, ProjectAssets } from '../types';

const PRODUCT_SLOTS: Partial<Record<ProductCategory, string[]>> = {
  [ProductCategory.TOP]:     ['topFront', 'topBack'],
  [ProductCategory.JACKET]:  ['topFront', 'topBack'],
  [ProductCategory.COAT]:    ['topFront', 'topBack'],
  [ProductCategory.SWEATER]: ['topFront', 'topBack'],
  [ProductCategory.ETHNIC]:  ['topFront', 'topBack'],
  [ProductCategory.BOTTOM]:  ['bottomFront', 'bottomBack'],
  [ProductCategory.DRESS]:   ['topFront', 'bottomFront'],
  [ProductCategory.SAREE]:   ['drape', 'blouse'],
  [ProductCategory.SHOES]:       ['shoes'],
  [ProductCategory.ACCESSORIES]: ['accessories'],
};

function getProductImages(project: Project): AssetFile[] {
  const assets: ProjectAssets = project.assets || {};
  const slots = PRODUCT_SLOTS[project.category] || ['productImage'];
  const seen = new Set<string>();
  const result: AssetFile[] = [];
  for (const slot of slots) {
    for (const file of (assets[slot] || [])) {
      if (!seen.has(file.id)) { seen.add(file.id); result.push(file); }
    }
  }
  return result;
}

interface DashboardProps {
  projects: Project[];
  onCreateProject: () => void;
  onOpenProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  apiProvider: 'google' | 'kie';
  onProviderChange: (p: 'google' | 'kie') => void;
  apiKey: string;
  onApiKeyChange: (k: string) => void;
  kieApiKey: string;
  onKieApiKeyChange: (k: string) => void;
}

const MODEL_LABELS: Record<ModelType, string> = {
  [ModelType.ECOM_SHOOT]:             'E-Commerce',
  [ModelType.LIFESTYLE_SHOOT]:        'Lifestyle',
  [ModelType.CREATIVE_SHOOT]:         'Creative',
  [ModelType.EDITORIAL_HIGH_FASHION]: 'Editorial',
};

const MODEL_ACCENTS: Record<ModelType, string> = {
  [ModelType.ECOM_SHOOT]:             '#7BAFD4',
  [ModelType.LIFESTYLE_SHOOT]:        '#7DC4A4',
  [ModelType.CREATIVE_SHOOT]:         '#A890E0',
  [ModelType.EDITORIAL_HIGH_FASHION]: '#C8A97A',
};

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

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onCreateProject,
  onOpenProject,
  onEditProject,
  onDeleteProject,
  apiProvider,
  onProviderChange,
  apiKey,
  onApiKeyChange,
  kieApiKey,
  onKieApiKeyChange,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      onDeleteProject(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 11px',
    background: 'transparent',
    border: `1px solid ${T.border}`,
    borderRadius: 3,
    color: T.txtPri,
    fontSize: 12,
    outline: 'none',
    fontFamily: "'Sora', sans-serif",
    transition: 'border-color 0.18s',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: T.bg, color: T.txtPri, minHeight: '100vh' }}>

      {/* Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Sora:wght@300;400;500&display=swap');`}</style>

      {/* ── Header ── */}
      <header style={{ borderBottom: `1px solid ${T.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: `${T.bg}F2`, backdropFilter: 'blur(12px)', zIndex: 10 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#0A0908" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', color: T.txtPri }}>Humanly AI</span>
            <span style={{ fontSize: 9, color: T.txtSec, marginLeft: 8, letterSpacing: '0.08em' }}>STUDIO</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowSettings(v => !v)}
            style={{ width: 32, height: 32, borderRadius: 3, border: `1px solid ${showSettings ? T.borderHi : 'transparent'}`, background: showSettings ? T.surfHi : 'transparent', color: T.txtSec, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.txtMid; }}
            onMouseLeave={e => { if (!showSettings) { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = T.txtSec; } }}
            title="Settings"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
              <path fillRule="evenodd" d="M8.34 1.804A1 1 0 019.32 1h1.36a1 1 0 01.98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 011.262.125l.962.962a1 1 0 01.125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 01.804.98v1.361a1 1 0 01-.804.98l-1.473.295a6.95 6.95 0 01-.587 1.416l.834 1.25a1 1 0 01-.125 1.262l-.962.962a1 1 0 01-1.262.125l-1.25-.834a6.953 6.953 0 01-1.416.587l-.294 1.473a1 1 0 01-.98.804H9.32a1 1 0 01-.98-.804l-.295-1.473a6.957 6.957 0 01-1.416-.587l-1.25.834a1 1 0 01-1.262-.125l-.962-.962a1 1 0 01-.125-1.262l.834-1.25a6.957 6.957 0 01-.587-1.416l-1.473-.294A1 1 0 011 10.68V9.32a1 1 0 01.804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 01.125-1.262l.962-.962A1 1 0 015.38 2.93l1.25.834a6.957 6.957 0 011.416-.587L8.34 1.804zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={onCreateProject}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 2, border: `1px solid ${T.gold}44`, background: `${T.gold}0C`, color: T.gold, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = `${T.gold}18`)}
            onMouseLeave={e => (e.currentTarget.style.background = `${T.gold}0C`)}
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 11, height: 11 }}>
              <path d="M7 1v12M1 7h12" strokeLinecap="round" />
            </svg>
            New project
          </button>
        </div>
      </header>

      {/* ── Settings panel ── */}
      {showSettings && (
        <div style={{ borderBottom: `1px solid ${T.border}`, background: T.surface, padding: '20px 32px' }}>
          <div style={{ maxWidth: 480 }}>
            <div style={{ fontSize: 9, fontWeight: 500, color: T.txtSec, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 14 }}>API settings</div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: T.bg, padding: 3, borderRadius: 3, width: 'fit-content', border: `1px solid ${T.border}` }}>
              {(['google', 'kie'] as const).map(provider => (
                <button
                  key={provider}
                  onClick={() => onProviderChange(provider)}
                  style={{
                    padding: '5px 14px', fontSize: 10, borderRadius: 2,
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    background: apiProvider === provider ? T.surfHi : 'transparent',
                    color: apiProvider === provider ? T.txtPri : T.txtSec,
                    transition: 'all 0.12s',
                  }}
                >
                  {provider === 'google' ? 'Google Cloud' : 'Kie.ai'}
                </button>
              ))}
            </div>

            <input
              type="password"
              value={apiProvider === 'google' ? apiKey : kieApiKey}
              onChange={e => apiProvider === 'google' ? onApiKeyChange(e.target.value) : onKieApiKeyChange(e.target.value)}
              placeholder={`Paste ${apiProvider === 'google' ? 'Gemini' : 'Kie.ai'} API key`}
              style={{ ...inputStyle, maxWidth: 400 }}
              onFocus={e => (e.target.style.borderColor = T.gold)}
              onBlur={e => (e.target.style.borderColor = T.border)}
            />
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main style={{ padding: '44px 32px', maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 36 }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontStyle: 'italic', fontWeight: 400, color: T.txtPri, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
              Projects
            </h2>
            <p style={{ fontSize: 11, color: T.txtSec, margin: 0 }}>
              {projects.length === 0 ? 'No projects yet' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Project grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>

          {/* New project card */}
          <button
            onClick={onCreateProject}
            style={{
              height: 200, borderRadius: 3,
              border: `1px dashed ${T.border}`,
              background: 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              color: T.txtSec,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.gold + '55'; (e.currentTarget as HTMLElement).style.color = T.gold; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.txtSec; }}
          >
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'inherit' }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 11, height: 11 }}>
                <path d="M7 1v12M1 7h12" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.04em' }}>New project</span>
          </button>

          {/* Project cards */}
          {projects.map(project => {
            const accent = MODEL_ACCENTS[project.model];
            const productImgs = getProductImages(project);
            const hasImages = productImgs.length > 0;
            return (
              <div
                key={project.id}
                onClick={() => onOpenProject(project)}
                style={{
                  borderRadius: 4,
                  border: `1px solid ${T.border}`,
                  background: T.surface,
                  cursor: 'pointer', position: 'relative',
                  display: 'flex', flexDirection: 'column',
                  transition: 'border-color 0.15s, background 0.15s',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.borderHi; (e.currentTarget as HTMLElement).style.background = T.surfHi; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.background = T.surface; }}
              >
                {/* Visual area */}
                <div style={{ height: 160, background: T.bg, position: 'relative', overflow: 'hidden', display: 'flex' }}>
                  {hasImages ? (
                    productImgs.length === 1 ? (
                      /* Single image — fill card */
                      <img
                        src={`data:${productImgs[0].mimeType};base64,${productImgs[0].data}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        alt=""
                      />
                    ) : productImgs.length === 2 ? (
                      /* Two images side by side */
                      <>
                        {productImgs.slice(0, 2).map((f, i) => (
                          <div key={f.id} style={{ flex: 1, overflow: 'hidden', borderRight: i === 0 ? `1px solid ${T.border}` : 'none' }}>
                            <img src={`data:${f.mimeType};base64,${f.data}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                          </div>
                        ))}
                      </>
                    ) : productImgs.length === 3 ? (
                      /* Three: large left + two small right */
                      <>
                        <div style={{ flex: 2, overflow: 'hidden', borderRight: `1px solid ${T.border}` }}>
                          <img src={`data:${productImgs[0].mimeType};base64,${productImgs[0].data}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          {productImgs.slice(1, 3).map((f, i) => (
                            <div key={f.id} style={{ flex: 1, overflow: 'hidden', borderBottom: i === 0 ? `1px solid ${T.border}` : 'none' }}>
                              <img src={`data:${f.mimeType};base64,${f.data}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      /* 4+ images: 2×2 grid, overflow count badge */
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '100%', height: '100%', gap: 1, background: T.border }}>
                          {productImgs.slice(0, 4).map((f, i) => (
                            <div key={f.id} style={{ overflow: 'hidden', position: 'relative' }}>
                              <img src={`data:${f.mimeType};base64,${f.data}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                              {i === 3 && productImgs.length > 4 && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,9,8,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: T.txtPri }}>+{productImgs.length - 4}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )
                  ) : (
                    /* No assets yet */
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, #0D0C0B 0%, #111010 100%)` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.3 }}>
                        <svg viewBox="0 0 40 30" fill="none" style={{ width: 40, height: 30 }}>
                          <rect x="0.5" y="0.5" width="39" height="29" rx="1.5" stroke="#E8E3DC" />
                          <circle cx="7.5" cy="8" r="2" stroke="#E8E3DC" />
                          <path d="M0 21l10-6.5 6.5 4 10-8 13 10.5" stroke="#E8E3DC" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ fontSize: 9, color: T.txtSec, fontFamily: 'inherit' }}>No assets yet</span>
                      </div>
                    </div>
                  )}

                  {/* Gradient overlay at bottom for legibility */}
                  {hasImages && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to top, rgba(10,9,8,0.7) 0%, transparent 100%)', pointerEvents: 'none' }} />
                  )}

                  {/* Accent dot */}
                  <div style={{ position: 'absolute', top: 10, left: 10, width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 6px ${accent}88` }} />

                  {/* Image count badge if >1 */}
                  {productImgs.length > 1 && (
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(10,9,8,0.75)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 20, padding: '2px 7px', fontSize: 8, color: T.txtMid, backdropFilter: 'blur(4px)' }}>
                      {productImgs.length} images
                    </div>
                  )}
                </div>

                {/* Card info */}
                <div style={{ padding: '11px 14px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: T.txtPri, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {project.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, color: accent, fontWeight: 500 }}>{MODEL_LABELS[project.model]}</span>
                    <span style={{ color: T.border }}>·</span>
                    <span style={{ fontSize: 9, color: T.txtSec }}>{project.category}</span>
                    <span style={{ color: T.border }}>·</span>
                    <span style={{ fontSize: 9, color: T.txtSec }}>{new Date(project.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </div>

                {/* Card actions — revealed on hover */}
                <div className="card-actions" style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.15s' }}>
                  <button
                    onClick={e => { e.stopPropagation(); onEditProject(project); }}
                    title="Edit project"
                    style={{ width: 24, height: 24, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.border}`, background: `${T.bg}CC`, color: T.txtSec, cursor: 'pointer', transition: 'all 0.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.gold; (e.currentTarget as HTMLElement).style.borderColor = `${T.gold}55`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.txtSec; (e.currentTarget as HTMLElement).style.borderColor = T.border; }}
                  >
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 10, height: 10 }}>
                      <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5zM8 4l2 2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={e => handleDelete(e, project.id)}
                    title={deleteConfirm === project.id ? 'Click again to confirm' : 'Delete'}
                    style={{ width: 24, height: 24, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${deleteConfirm === project.id ? '#C0392B44' : T.border}`, background: deleteConfirm === project.id ? 'rgba(192,57,43,0.12)' : `${T.bg}CC`, color: deleteConfirm === project.id ? '#E57373' : T.txtSec, cursor: 'pointer', transition: 'all 0.12s' }}
                    onMouseEnter={e => { if (!deleteConfirm) { (e.currentTarget as HTMLElement).style.color = '#E57373'; (e.currentTarget as HTMLElement).style.borderColor = '#C0392B44'; } }}
                    onMouseLeave={e => { if (!deleteConfirm) { (e.currentTarget as HTMLElement).style.color = T.txtSec; (e.currentTarget as HTMLElement).style.borderColor = T.border; } }}
                  >
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 10, height: 10 }}>
                      <path d="M2 3.5h10M5.5 3.5V2.25a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75V3.5M6 6.5v3.5M8 6.5v3.5M3.5 3.5l.75 7.5a.75.75 0 00.75.75h4a.75.75 0 00.75-.75L10.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {projects.length === 0 && (
          <div style={{ marginTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg viewBox="0 0 48 36" fill="none" style={{ width: 32, height: 24, opacity: 0.3 }}>
                <rect x="0.5" y="0.5" width="47" height="35" rx="1.5" stroke="#E8E3DC" />
                <circle cx="9" cy="10" r="2.5" stroke="#E8E3DC" />
                <path d="M0 26l12-8 8 5 12-10 16 13" stroke="#E8E3DC" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontStyle: 'italic', fontWeight: 400, color: T.txtPri, marginBottom: 8 }}>
              No projects yet
            </h3>
            <p style={{ fontSize: 11, color: T.txtSec, marginBottom: 24, maxWidth: 280, lineHeight: 1.7 }}>
              Create your first virtual shoot to start generating commercial photography at scale.
            </p>
            <button
              onClick={onCreateProject}
              style={{ padding: '9px 20px', borderRadius: 2, border: `1px solid ${T.gold}44`, background: `${T.gold}0C`, color: T.gold, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = `${T.gold}18`)}
              onMouseLeave={e => (e.currentTarget.style.background = `${T.gold}0C`)}
            >
              Create first project
            </button>
          </div>
        )}
      </main>

      {/* Hover reveal card actions */}
      <style>{`
        div:hover > .card-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
};
