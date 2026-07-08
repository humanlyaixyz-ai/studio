import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import AddSku from './AddSku';
import { useSkus } from '../data/skus';

/**
 * SKU Upload — Processing state (hi-fi build of SkuReviewWireframe).
 * Shows while the uploaded images are read + persisted as SKUs, then advances to the
 * SKU validation table (/add-sku-stored) once the in-flight uploads settle.
 */

export default function SkuReview() {
  const navigate = useNavigate();
  const { uploading } = useSkus();
  const started = useRef(false);

  // Once we've seen uploads in flight and they've all settled, advance to the list.
  useEffect(() => {
    if (uploading > 0) started.current = true;
    else if (started.current) navigate(ROUTES.addSkuStored);
  }, [uploading, navigate]);

  // Safety net: never hang here (e.g. no files were picked).
  useEffect(() => {
    const t = setTimeout(() => navigate(ROUTES.addSkuStored), 8000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative">
      {/* Origin: the Add SKU screen, dimmed behind the modal */}
      <div className="pointer-events-none select-none" aria-hidden>
        <AddSku />
      </div>

      {/* Processing modal */}
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
        <div className="flex w-[420px] flex-col items-center gap-3 rounded-xl border border-wire-border bg-wire-surface p-10 text-center shadow-pop">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-weak-2 border-t-brand" aria-hidden />
          <p className="text-lg font-semibold text-wire-text">Processing your upload…</p>
          <p className="text-sm text-wire-muted">
            We&rsquo;re grouping your files by SKU. This may take a moment.
          </p>
        </div>
      </div>
    </div>
  );
}
