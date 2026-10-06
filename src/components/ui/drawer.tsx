'use client';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { IconButton } from './button';

/** Side sheet built on the native <dialog>: modal, focus-trapped, Escape and backdrop close, focus returns to the opener. */
export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} data-drawer onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }} aria-label={title}
      className="m-0 h-full max-h-none w-[min(360px,88vw)] max-w-none border-r border-line2 bg-white p-0 text-navy shadow-pop">
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4"><p className="font-display text-base font-bold">{title}</p><IconButton label="Close menu" onClick={onClose}><X size={18} /></IconButton></div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="shrink-0 border-t border-line p-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
