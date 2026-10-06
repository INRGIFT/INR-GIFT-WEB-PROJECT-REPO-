'use client';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { IconButton } from './button';

/** Modal dialog built on the native <dialog>: focus is trapped, Escape closes, focus returns to the opener. */
export function Dialog({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }} aria-labelledby="dialog-title" className="w-[min(460px,calc(100vw-32px))] rounded-card border border-line2 bg-white p-0 text-navy shadow-pop">
      {open && (
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3"><h2 id="dialog-title" className="text-lg font-bold">{title}</h2><IconButton label="Close" onClick={onClose}><X size={18} /></IconButton></div>
          {children}
          {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
