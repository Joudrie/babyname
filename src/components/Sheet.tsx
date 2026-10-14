import { useEffect, useState, type ReactNode } from 'react';

/** Bottom sheet that slides up over the deck. Stays mounted briefly after closing so it can slide back down. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  level = 0,
}: {
  open: boolean;
  onClose(): void;
  title: ReactNode;
  children: ReactNode;
  /** Stacking order when a sheet opens on top of another one. */
  level?: number;
}) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), 260);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;
  return (
    <div className={`sheet-layer ${open ? 'is-open' : 'is-closing'}`} style={{ zIndex: 20 + level }}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="sheet-close" onClick={onClose} aria-label="Close">
            Done
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
