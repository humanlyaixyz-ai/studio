import React, { useState, useEffect, useCallback, useRef } from 'react';
import PoseEditor from '../components/PoseEditor';
import { ModelType, ProductCategory, Project, ShotConfig, AssetFile, ProjectAssets } from '../types';
import {
  FASHION_TYPES, MOODS, IMAGES_PER_GENERATION,
  CATEGORY_POSES, LIFESTYLE_POSES, CREATIVE_POSES, EDITORIAL_HIGH_FASHION_POSES,
} from '../constants';

interface CreateProjectProps {
  onBack: () => void;
  onSave: (project: Omit<Project, 'id' | 'createdAt'>, editId?: string) => void;
  initialProject?: Project;
}

const CATEGORIES: { value: ProductCategory; group: string }[] = [
  { value: ProductCategory.TOP,                    group: 'Fashion' },
  { value: ProductCategory.BOTTOM,                 group: 'Fashion' },
  { value: ProductCategory.DRESS,                  group: 'Fashion' },
  { value: ProductCategory.JACKET,                 group: 'Fashion' },
  { value: ProductCategory.COAT,                   group: 'Fashion' },
  { value: ProductCategory.ETHNIC,                 group: 'Fashion' },
  { value: ProductCategory.SWEATER,                group: 'Fashion' },
  { value: ProductCategory.SAREE,                  group: 'Fashion' },
  { value: ProductCategory.SHOES,                  group: 'Accessories' },
  { value: ProductCategory.ACCESSORIES,            group: 'Accessories' },
  { value: ProductCategory.BEAUTY,                 group: 'Lifestyle' },
  { value: ProductCategory.HOME_LIGHTS,            group: 'Lifestyle' },
  { value: ProductCategory.HOME_APPLIANCE,         group: 'Lifestyle' },
  { value: ProductCategory.ELECTRONIC_APPLIANCE,  group: 'Lifestyle' },
  { value: ProductCategory.HOME_WARE,              group: 'Lifestyle' },
  { value: ProductCategory.FMCG,                   group: 'Lifestyle' },
];

const SHOOT_STYLES = [
  { value: ModelType.ECOM_SHOOT,             label: 'E-Commerce', desc: 'Clean studio shots for product listings',  accent: '#7BAFD4' },
  { value: ModelType.LIFESTYLE_SHOOT,        label: 'Lifestyle',  desc: 'Natural, real-world context',             accent: '#7DC4A4' },
  { value: ModelType.CREATIVE_SHOOT,         label: 'Creative',   desc: 'Bold, artistic, experimental',           accent: '#A890E0' },
  { value: ModelType.EDITORIAL_HIGH_FASHION, label: 'Editorial',  desc: 'Avant-garde, high fashion',              accent: '#C8A97A' },
];

// ── Master asset list (mirrors UploadedFiles, same keys) ─────
type AssetSlot = { key: string; label: string; hint: string };

const ALL_FASHION_SLOTS: AssetSlot[] = [
  { key: 'characterFace', label: 'Character face',  hint: 'Front-facing portrait of the model' },
  { key: 'topFront',      label: 'Top — front',     hint: 'Front view of top garment' },
  { key: 'topBack',       label: 'Top — back',      hint: 'Back view of top garment' },
  { key: 'bottomFront',   label: 'Bottom — front',  hint: 'Front view of bottom garment' },
  { key: 'bottomBack',    label: 'Bottom — back',   hint: 'Back view of bottom garment' },
  { key: 'shoes',         label: 'Shoes',           hint: 'Footwear to pair with the outfit' },
  { key: 'accessories',   label: 'Accessories',     hint: 'Jewellery, belts, bags' },
  { key: 'sunglasses',    label: 'Sunglasses',      hint: 'Eyewear to style with' },
  { key: 'background',    label: 'Background',      hint: 'Scene or backdrop reference' },
];

// Keys that ARE the product for each category — excluded from assets panel
const PRODUCT_KEYS: Partial<Record<ProductCategory, string[]>> = {
  [ProductCategory.TOP]:     ['topFront', 'topBack'],
  [ProductCategory.JACKET]:  ['topFront', 'topBack'],
  [ProductCategory.COAT]:    ['topFront', 'topBack'],
  [ProductCategory.SWEATER]: ['topFront', 'topBack'],
  [ProductCategory.ETHNIC]:  ['topFront', 'topBack'],
  [ProductCategory.BOTTOM]:  ['bottomFront', 'bottomBack'],
  [ProductCategory.DRESS]:   ['topFront', 'topBack', 'bottomFront', 'bottomBack'],
  [ProductCategory.SAREE]:   ['topFront', 'topBack', 'bottomFront', 'bottomBack'],
  [ProductCategory.SHOES]:        ['shoes'],
  [ProductCategory.ACCESSORIES]:  ['accessories', 'sunglasses'],
};

// Non-fashion categories get a different minimal set
const NON_FASHION_SLOTS: AssetSlot[] = [
  { key: 'productImage', label: 'Product shots',  hint: 'Multiple angles of the product' },
  { key: 'background',   label: 'Background',     hint: 'Scene or backdrop reference' },
];

const NON_FASHION_CATS = new Set<ProductCategory>([
  ProductCategory.BEAUTY, ProductCategory.HOME_LIGHTS, ProductCategory.HOME_APPLIANCE,
  ProductCategory.ELECTRONIC_APPLIANCE, ProductCategory.HOME_WARE, ProductCategory.FMCG,
]);

function getSlotsForCategory(category: ProductCategory): AssetSlot[] {
  if (NON_FASHION_CATS.has(category)) return NON_FASHION_SLOTS;
  const excluded = new Set(PRODUCT_KEYS[category] || []);
  return ALL_FASHION_SLOTS.filter(s => !excluded.has(s.key));
}

// ── Assets panel component ───────────────────────────────────
interface AssetsPanelProps {
  category: ProductCategory;
  assets: ProjectAssets;
  onAdd: (slotKey: string, file: File) => void;
  onRemove: (slotKey: string, assetId: string) => void;
  T: Record<string, string>;
}

const AssetThumbnail: React.FC<{ asset: AssetFile; onRemove: () => void; T: Record<string, string> }> = ({ asset, onRemove, T }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: 'relative', width: 88, height: 88, borderRadius: 5, overflow: 'hidden', border: `1px solid ${hovered ? T.borderHi : T.border}`, flexShrink: 0, transition: 'border-color 0.15s', cursor: 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img src={`data:${asset.mimeType};base64,${asset.data}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {hovered && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,9,8,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 5 }}>
          <button
            onClick={onRemove}
            style={{ width: 20, height: 20, borderRadius: 3, background: 'rgba(10,9,8,0.9)', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Remove"
          >
            <svg viewBox="0 0 10 10" fill="none" stroke="#E8E3DC" strokeWidth="1.4" style={{ width: 8, height: 8 }}>
              <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

const AssetsPanel: React.FC<AssetsPanelProps> = ({ category, assets, onAdd, onRemove, T }) => {
  const slots = getSlotsForCategory(category);

  const handleFileChange = (slotKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    (Array.from(e.target.files || []) as File[]).forEach(file => {
      if (file.type.startsWith('image/')) onAdd(slotKey, file);
    });
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <p style={{ fontSize: 11, color: T.txtSec, marginBottom: 36, lineHeight: 1.75, maxWidth: 500, margin: '0 0 36px' }}>
        Upload supporting references — model face, backgrounds, accessories. These persist with the project and become selectable during each shoot without re-uploading.
      </p>

      {slots.map((slot) => {
        const files = assets[slot.key] || [];
        const hasFiles = files.length > 0;
        return (
          <div key={slot.key} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${T.border}` }}>

            {/* Slot header */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: T.txtPri }}>{slot.label}</span>
              <span style={{ fontSize: 9, color: hasFiles ? T.txtSec : T.border, letterSpacing: '0.04em' }}>
                {hasFiles ? `${files.length} ${files.length === 1 ? 'image' : 'images'}` : 'optional'}
              </span>
            </div>
            <p style={{ fontSize: 10, color: T.txtSec, margin: '0 0 14px', lineHeight: 1.5 }}>{slot.hint}</p>

            {/* Thumbnails + upload */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {files.map(asset => (
                <AssetThumbnail key={asset.id} asset={asset} onRemove={() => onRemove(slot.key, asset.id)} T={T} />
              ))}

              {hasFiles ? (
                <label
                  style={{ width: 88, height: 88, borderRadius: 5, border: `1px dashed ${T.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 5, flexShrink: 0, transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.gold; (e.currentTarget as HTMLElement).style.background = `${T.gold}08`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <svg viewBox="0 0 12 12" fill="none" stroke={T.txtSec} strokeWidth="1.3" style={{ width: 13, height: 13 }}>
                    <path d="M6 1v10M1 6h10" strokeLinecap="round" />
                  </svg>
                  <span style={{ fontSize: 8, color: T.txtSec, letterSpacing: '0.04em' }}>Add more</span>
                  <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFileChange(slot.key, e)} />
                </label>
              ) : (
                <label
                  style={{ flex: 1, minWidth: 180, height: 88, borderRadius: 5, border: `1px dashed ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.gold; (e.currentTarget as HTMLElement).style.background = `${T.gold}06`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <svg viewBox="0 0 14 14" fill="none" stroke={T.txtSec} strokeWidth="1.2" style={{ width: 15, height: 15 }}>
                    <path d="M2 10v2a1 1 0 001 1h8a1 1 0 001-1v-2" strokeLinecap="round" />
                    <path d="M7 1v8M4.5 3.5L7 1l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 10, color: T.txtSec }}>Upload images</span>
                  <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFileChange(slot.key, e)} />
                </label>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MOOD_COLORS: Record<string, string> = {
  'Neutral Studio':         '#7A7A7A',
  'Bright Commercial':      '#D4C47A',
  'Natural Daylight':       '#8BBDD4',
  'Soft Premium':           '#C4A8D4',
  'High Contrast Editorial':'#2A2A2A',
  'Low-Key Dramatic':       '#3A3A3A',
  'Warm Lifestyle':         '#D4A87A',
  'Cool Minimal':           '#8AAED4',
  'Clean Technical':        '#8AD4B4',
  'Luxury Cinematic':       '#251E3E',
};

export const CreateProject: React.FC<CreateProjectProps> = ({ onBack, onSave, initialProject }) => {
  const isEditing = !!initialProject;
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(initialProject?.category ?? ProductCategory.TOP);
  const [selectedModel, setSelectedModel] = useState<ModelType>(initialProject?.model ?? ModelType.ECOM_SHOOT);
  const [brandName, setBrandName] = useState(initialProject?.brandName ?? '');
  const [fashionType, setFashionType] = useState(initialProject?.fashionType ?? 'Everyday Casual');
  const [mood, setMood] = useState(initialProject?.mood ?? 'Neutral Studio');
  const [environment, setEnvironment] = useState(initialProject?.environment ?? '');
  const [lighting, setLighting] = useState(initialProject?.lighting ?? '');
  const [negativePrompt, setNegativePrompt] = useState(initialProject?.negativePrompt ?? '');
  const [seed, setSeed] = useState<number | undefined>(initialProject?.seed);
  const [shots, setShots] = useState<ShotConfig[]>(initialProject?.shots ?? []);
  const [assets, setAssets] = useState<ProjectAssets>(initialProject?.assets ?? {});
  const [panel, setPanel] = useState<'shots' | 'assets'>('shots');

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Sora:wght@300;400;500&display=swap';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  const initializedRef = useRef(isEditing);
  useEffect(() => {
    if (initializedRef.current) { initializedRef.current = false; return; }
    const poseMap: Record<ModelType, Record<ProductCategory, string[]>> = {
      [ModelType.LIFESTYLE_SHOOT]:        LIFESTYLE_POSES,
      [ModelType.CREATIVE_SHOOT]:         CREATIVE_POSES,
      [ModelType.EDITORIAL_HIGH_FASHION]: EDITORIAL_HIGH_FASHION_POSES,
      [ModelType.ECOM_SHOOT]:             CATEGORY_POSES,
    };
    const poses = poseMap[selectedModel][selectedCategory] || CATEGORY_POSES[selectedCategory] || [];
    const initial = Array.from({ length: IMAGES_PER_GENERATION }, (_, i) => poses[i % poses.length]);
    setShots(initial.map(p => ({ prompt: p })));
  }, [selectedModel, selectedCategory]);

  const handleSave = () => {
    onSave({
      name: `${brandName || 'Untitled'} — ${selectedCategory}`,
      category: selectedCategory,
      model: selectedModel,
      brandName,
      shots,
      assets,
      environment,
      lighting,
      negativePrompt,
      seed,
      fashionType,
      mood,
    }, initialProject?.id);
  };

  const addAsset = useCallback((slotKey: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const data = reader.result.split(',')[1];
        const newAsset: AssetFile = { id: `${slotKey}-${Date.now()}`, data, mimeType: file.type };
        setAssets(prev => ({ ...prev, [slotKey]: [...(prev[slotKey] || []), newAsset] }));
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const removeAsset = useCallback((slotKey: string, assetId: string) => {
    setAssets(prev => ({ ...prev, [slotKey]: (prev[slotKey] || []).filter(a => a.id !== assetId) }));
  }, []);

  const grouped = CATEGORIES.reduce<Record<string, typeof CATEGORIES>>((acc, c) => {
    (acc[c.group] ??= []).push(c);
    return acc;
  }, {});

  const activeStyle = SHOOT_STYLES.find(s => s.value === selectedModel)!;

  const T = {
    bg:       '#0A0908',
    surface:  '#100F0E',
    border:   '#1C1A18',
    borderHi: '#2C2A28',
    txtPri:   '#E8E3DC',
    txtSec:   '#5A5550',
    txtMid:   '#8A8580',
    gold:     '#C8A97A',
  };

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '9px 11px',
    background: 'transparent',
    border: `1px solid ${T.border}`,
    borderRadius: 3,
    color: T.txtPri,
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Sora', sans-serif",
    transition: 'border-color 0.18s',
  };

  const microLabel: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 500,
    color: T.txtSec,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  };

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: T.bg, color: T.txtPri, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <header style={{ borderBottom: `1px solid ${T.border}`, padding: '13px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ color: T.txtSec, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.15s', padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = T.txtPri)}
          onMouseLeave={e => (e.currentTarget.style.color = T.txtSec)}
        >
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 11, height: 11 }}>
            <path d="M9 2L4 7l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Projects
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {['Configure', 'Shot list'].map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <div style={{ width: 20, height: 1, background: T.border }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: step === i + 1 ? T.gold : (step > i + 1 ? T.txtSec : T.border),
                  transition: 'background 0.2s',
                }} />
                <span style={{ fontSize: 10, letterSpacing: '0.04em', color: step === i + 1 ? T.txtPri : T.txtSec, fontWeight: step === i + 1 ? 500 : 400, transition: 'color 0.2s' }}>
                  {label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div style={{ fontSize: 10, color: T.txtSec, letterSpacing: '0.06em' }}>{step} / 2</div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {step === 1 ? (
          <>
            {/* Left nav panel */}
            <aside style={{ width: 220, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: `${T.border} transparent` }}>

              {/* Brand input */}
              <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${T.border}` }}>
                <div style={microLabel}>Brand</div>
                <input
                  type="text"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="Nike, Zara, H&M..."
                  style={inputBase}
                  onFocus={e => (e.target.style.borderColor = T.gold)}
                  onBlur={e => (e.target.style.borderColor = T.border)}
                />
              </div>

              {/* Category nav */}
              <div style={{ padding: '20px 0 24px' }}>
                <div style={{ ...microLabel, padding: '0 20px 6px' }}>Category</div>
                {Object.entries(grouped).map(([group, cats]) => (
                  <div key={group}>
                    <div style={{ padding: '10px 20px 4px', fontSize: 9, color: '#3A3530', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                      {group}
                    </div>
                    {cats.map(cat => {
                      const isSel = selectedCategory === cat.value;
                      return (
                        <button
                          key={cat.value}
                          onClick={() => setSelectedCategory(cat.value)}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '7px 20px',
                            fontSize: 11,
                            background: isSel ? 'rgba(200,169,122,0.07)' : 'transparent',
                            border: 'none',
                            borderLeft: `2px solid ${isSel ? T.gold : 'transparent'}`,
                            color: isSel ? T.gold : T.txtSec,
                            cursor: 'pointer', fontFamily: 'inherit',
                            fontWeight: isSel ? 500 : 400,
                            transition: 'all 0.12s',
                          }}
                          onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.color = T.txtMid; }}
                          onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.color = T.txtSec; }}
                        >
                          {cat.value}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </aside>

            {/* Right settings panel */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '44px 52px 140px', scrollbarWidth: 'thin', scrollbarColor: `${T.border} transparent` }}>

              {/* Page title */}
              <div style={{ marginBottom: 52 }}>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontStyle: 'italic', fontWeight: 400, color: T.txtPri, margin: '0 0 6px', letterSpacing: '-0.5px', lineHeight: 1 }}>
                  {isEditing ? 'Edit project' : 'New shoot'}
                </h1>
                <p style={{ fontSize: 11, color: T.txtSec, margin: 0 }}>
                  {selectedCategory} · {activeStyle.label}
                </p>
              </div>

              {/* Shoot style */}
              <section style={{ marginBottom: 44 }}>
                <div style={microLabel}>Shoot style</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {SHOOT_STYLES.map(style => {
                    const isSel = selectedModel === style.value;
                    return (
                      <button
                        key={style.value}
                        onClick={() => setSelectedModel(style.value)}
                        style={{
                          textAlign: 'left', padding: '16px 18px', borderRadius: 3,
                          border: `1px solid ${isSel ? style.accent + '55' : T.border}`,
                          background: isSel ? style.accent + '0C' : 'transparent',
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                          position: 'relative',
                        }}
                        onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.borderColor = T.borderHi; }}
                        onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.borderColor = T.border; }}
                      >
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: style.accent, marginBottom: 12, opacity: isSel ? 1 : 0.35 }} />
                        <div style={{ fontSize: 12, fontWeight: 500, color: isSel ? style.accent : T.txtMid, marginBottom: 5 }}>
                          {style.label}
                        </div>
                        <div style={{ fontSize: 10, color: '#403C38', lineHeight: 1.5 }}>
                          {style.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Fashion type */}
              <section style={{ marginBottom: 44 }}>
                <div style={microLabel}>Fashion type</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {FASHION_TYPES.map(type => {
                    const isSel = fashionType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setFashionType(type)}
                        style={{
                          padding: '5px 11px', borderRadius: 2,
                          border: `1px solid ${isSel ? T.gold + '55' : T.border}`,
                          background: isSel ? 'rgba(200,169,122,0.08)' : 'transparent',
                          color: isSel ? T.gold : T.txtSec,
                          fontSize: 10, fontWeight: isSel ? 500 : 400,
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                        }}
                        onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.color = T.txtMid; }}
                        onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.color = T.txtSec; }}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Mood */}
              <section style={{ marginBottom: 44 }}>
                <div style={microLabel}>Mood & atmosphere</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {MOODS.map(m => {
                    const isSel = mood === m;
                    const col = MOOD_COLORS[m] || '#6B7280';
                    return (
                      <button
                        key={m}
                        onClick={() => setMood(m)}
                        title={m}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                          padding: '12px 6px', borderRadius: 3,
                          border: `1px solid ${isSel ? col + '50' : T.border}`,
                          background: isSel ? col + '0E' : 'transparent',
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                        }}
                        onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.borderColor = T.borderHi; }}
                        onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.borderColor = T.border; }}
                      >
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: col, flexShrink: 0 }} />
                        <span style={{ fontSize: 8.5, color: isSel ? T.txtMid : '#3A3530', textAlign: 'center', lineHeight: 1.4, fontWeight: isSel ? 500 : 400 }}>
                          {m}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Scene */}
              <section style={{ marginBottom: 44 }}>
                <div style={microLabel}>Scene setup</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Environment', value: environment, set: setEnvironment, ph: 'Minimal studio, rooftop...' },
                    { label: 'Lighting',    value: lighting,    set: setLighting,    ph: 'Soft daylight, ring light...' },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize: 10, color: T.txtSec, marginBottom: 7 }}>{f.label}</div>
                      <input
                        type="text" value={f.value}
                        onChange={e => f.set(e.target.value)}
                        placeholder={f.ph} style={inputBase}
                        onFocus={e => (e.target.style.borderColor = T.gold)}
                        onBlur={e => (e.target.style.borderColor = T.border)}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Advanced */}
              <details style={{ border: `1px solid ${T.border}`, borderRadius: 3 }}>
                <summary style={{ padding: '11px 14px', fontSize: 10, color: T.txtSec, cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit' }}>
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 9, height: 9, flexShrink: 0 }}>
                    <path d="M4.5 2L8 6l-3.5 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Advanced constraints
                </summary>
                <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.txtSec, marginBottom: 7 }}>Negative prompt</div>
                    <textarea
                      value={negativePrompt}
                      onChange={e => setNegativePrompt(e.target.value)}
                      placeholder="blur, text, low quality, overexposed..."
                      style={{ ...inputBase, height: 68, resize: 'none', lineHeight: 1.6 }}
                      onFocus={e => (e.target.style.borderColor = T.gold)}
                      onBlur={e => (e.target.style.borderColor = T.border)}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.txtSec, marginBottom: 7 }}>Seed</div>
                    <input
                      type="number" value={seed ?? ''}
                      onChange={e => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="42"
                      style={{ ...inputBase, width: 110 }}
                      onFocus={e => (e.target.style.borderColor = T.gold)}
                      onBlur={e => (e.target.style.borderColor = T.border)}
                    />
                  </div>
                </div>
              </details>

            </main>
          </>
        ) : (

          /* Step 2 — Shots + Assets */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Step 2 header */}
            <div style={{ padding: '28px 52px 0', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontStyle: 'italic', fontWeight: 400, color: T.txtPri, margin: 0, lineHeight: 1 }}>
                  {panel === 'shots' ? 'Shot list' : 'Project assets'}
                </h1>
                <span style={{ fontSize: 10, color: T.txtSec }}>
                  {selectedCategory} · {activeStyle.label}
                </span>
              </div>

              {/* Tab bar */}
              <div style={{ display: 'flex', gap: 0 }}>
                {([
                  { key: 'shots', label: 'Shots', count: shots.length },
                  { key: 'assets', label: 'Assets', count: (Object.values(assets) as AssetFile[][]).reduce((n, a) => n + a.length, 0) },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setPanel(tab.key)}
                    style={{
                      padding: '10px 20px',
                      background: 'none', border: 'none',
                      borderBottom: `2px solid ${panel === tab.key ? T.gold : 'transparent'}`,
                      color: panel === tab.key ? T.txtPri : T.txtSec,
                      fontSize: 11, fontWeight: panel === tab.key ? 500 : 400,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}
                    onMouseEnter={e => { if (panel !== tab.key) (e.currentTarget as HTMLElement).style.color = T.txtMid; }}
                    onMouseLeave={e => { if (panel !== tab.key) (e.currentTarget as HTMLElement).style.color = T.txtSec; }}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: panel === tab.key ? `${T.gold}20` : T.surface, color: panel === tab.key ? T.gold : T.txtSec, fontWeight: 500 }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Panel content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 52px 120px', scrollbarWidth: 'thin', scrollbarColor: `${T.border} transparent` }}>

              {panel === 'shots' ? (
                <PoseEditor
                  selectedModel={selectedModel}
                  selectedCategory={selectedCategory}
                  currentShots={shots}
                  onShotsChange={setShots}
                />
              ) : (
                <AssetsPanel
                  category={selectedCategory}
                  assets={assets}
                  onAdd={addAsset}
                  onRemove={removeAsset}
                  T={T}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: '13px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: T.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {brandName && <span style={{ fontSize: 10, color: T.txtSec }}>{brandName}</span>}
          {brandName && <span style={{ color: T.border }}>·</span>}
          <span style={{ fontSize: 10, color: activeStyle.accent, fontWeight: 500 }}>{activeStyle.label}</span>
          <span style={{ color: T.border }}>·</span>
          <span style={{ fontSize: 10, color: T.txtSec }}>{selectedCategory}</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={step === 1 ? onBack : () => setStep(1)}
            style={{ padding: '8px 16px', borderRadius: 2, border: `1px solid ${T.border}`, background: 'transparent', color: T.txtSec, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.txtPri; (e.currentTarget as HTMLElement).style.borderColor = T.borderHi; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.txtSec; (e.currentTarget as HTMLElement).style.borderColor = T.border; }}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              style={{ padding: '8px 18px', borderRadius: 2, border: `1px solid ${T.gold}44`, background: `${T.gold}0C`, color: T.gold, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = `${T.gold}18`)}
              onMouseLeave={e => (e.currentTarget.style.background = `${T.gold}0C`)}
            >
              Review shot list →
            </button>
          ) : (
            <button
              onClick={handleSave}
              style={{ padding: '8px 18px', borderRadius: 2, border: 'none', background: T.gold, color: T.bg, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {isEditing ? 'Save changes' : 'Create project'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
