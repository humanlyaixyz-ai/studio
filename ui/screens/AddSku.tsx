import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';
import { useSkus } from '../data/skus';
import { useProjects } from '../data/projects';

// Which asset slot a single uploaded image fills, by chosen subcategory.
const PRIMARY_SLOT: Record<string, string> = {
  Top: 'topFront', Bottom: 'bottomFront', Dress: 'topFront', Outerwear: 'topFront', Footwear: 'shoes',
};
const primarySlotFor = (sub: string) => PRIMARY_SLOT[sub] || 'productImage';

function readFileAsBase64(file: File): Promise<{ name: string; data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => resolve({ name: file.name, data: (reader.result as string).split(',')[1], mimeType: file.type });
    reader.readAsDataURL(file);
  });
}

/**
 * Add SKUs — hi-fi build of AddSkuWireframe.
 * Step 1: select SKU type (category + subcategory, locked once SKUs added).
 * Step 2: upload SKUs (single dropzone → opens the processing/review screen).
 * Reading order: Heading → Step 1 → Step 2 → footer actions.
 */

const ico = (d: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

function FieldLabel({ children }: { children: string }) {
  return <p className="mb-2 text-xs font-medium uppercase tracking-wide text-wire-muted">{children}</p>;
}

function Dropdown({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <FieldLabel>{label}</FieldLabel>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={['flex h-10 w-full items-center justify-between rounded-md border bg-wire-surface px-3 transition-colors', open ? 'border-brand' : 'border-wire-border hover:border-wire-border-strong'].join(' ')}
      >
        <span className="text-sm text-wire-text">{value}</span>
        <span className={['text-wire-muted transition-transform', open ? 'rotate-180' : ''].join(' ')}>{ico('M6 9l6 6 6-6', 16)}</span>
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-wire-border bg-wire-surface py-1 shadow-pop">
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => { onChange(o); setOpen(false); }}
                className={['block w-full px-3 py-2 text-left text-sm hover:bg-wire-bg', o === value ? 'font-semibold text-brand' : 'text-wire-text'].join(' ')}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

const CATEGORIES: Record<string, string[]> = {
  Fashion: ['Top', 'Bottom', 'Dress', 'Outerwear', 'Footwear'],
  Jewelry: ['Ring', 'Necklace', 'Earring', 'Bracelet'],
  Accessories: ['Bag', 'Belt', 'Hat', 'Eyewear'],
  Beauty: ['Skincare', 'Makeup', 'Fragrance'],
};

function StepHeader({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white">{n}</div>
      <div>
        <p className="text-sm font-semibold text-wire-text">{title}</p>
        <p className="text-xs text-wire-muted">{hint}</p>
      </div>
    </div>
  );
}

export default function AddSku() {
  const navigate = useNavigate();
  const { addFromFiles } = useSkus();
  const { projects, selectedId } = useProjects();
  const fileInput = useRef<HTMLInputElement>(null);

  const projectCategory = projects.find((p) => p.id === selectedId)?.category;
  const initialSub = projectCategory && CATEGORIES.Fashion.includes(projectCategory) ? projectCategory : 'Top';

  const [category, setCategory] = useState('Fashion');
  const [subcategory, setSubcategory] = useState(initialSub);
  const setCat = (c: string) => { setCategory(c); setSubcategory(CATEGORIES[c][0]); };

  const pickFiles = () => fileInput.current?.click();

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const images = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;
    navigate(ROUTES.skuReview); // show processing screen while we read + upload
    const files = await Promise.all(images.map(readFileAsBase64));
    await addFromFiles(files, primarySlotFor(subcategory));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Heading */}
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Add SKUs</h2>
        <p className="mt-1 text-sm text-wire-muted">
          Upload the SKU images for this project. These files stay inside this project only.
        </p>
      </div>

      {/* Step 1 — Select SKU type */}
      <section className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
        <StepHeader
          n={1}
          title="Select SKU type"
          hint="Choose one SKU type for this project. This will be locked after SKUs are added."
        />
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Dropdown label="Category" value={category} options={Object.keys(CATEGORIES)} onChange={setCat} />
            <Dropdown label="Subcategory" value={subcategory} options={CATEGORIES[category]} onChange={setSubcategory} />
          </div>
          <div className="flex items-center gap-2 rounded-md border border-wire-border bg-wire-bg px-3 py-2">
            <span className="text-brand">{ico('M18 8h1a4 4 0 010 8h-1M6 8H5a4 4 0 000 8h1M9 12h6', 16)}</span>
            <span className="text-sm font-medium text-wire-text">SKU type: {category} → {subcategory}</span>
            <span className="text-xs text-wire-muted">(locked once SKUs are added)</span>
          </div>
        </div>
      </section>

      {/* Step 2 — Upload SKUs */}
      <section className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
        <StepHeader
          n={2}
          title="Upload SKUs"
          hint="Drop a ZIP, folder or images here. You can also connect Drive."
        />
        <div className="mt-5">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }}
          />
          <button
            type="button"
            onClick={pickFiles}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-wire-border bg-wire-bg px-6 py-14 text-center transition-colors hover:border-brand hover:bg-brand-weak"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-weak text-brand">
              {ico('M12 16V4M7 9l5-5 5 5M4 20h16', 22)}
            </span>
            <span>
              <span className="block text-sm text-wire-text">
                <span className="font-medium text-brand underline">Click to upload</span> or drag and drop
              </span>
              <span className="mt-0.5 block text-xs text-wire-muted">One image per SKU · named from the file name</span>
            </span>
          </button>
          <p className="mt-3 text-center text-xs text-wire-muted">
            Each image becomes a SKU (slot: {primarySlotFor(subcategory)}). You can add more angles later.
          </p>
        </div>
      </section>

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t border-wire-border pt-5">
        <Button variant="ghost" onClick={() => navigate(ROUTES.createProject)}>
          {ico('M15 18l-6-6 6-6', 16)} Go back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary">Save draft</Button>
          <Button disabled title="Add SKUs to continue">Continue to Service Setup</Button>
        </div>
      </div>
    </div>
  );
}
