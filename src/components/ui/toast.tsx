'use client';
import { Check } from 'lucide-react';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

const Ctx = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; key: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((text: string) => {
    clearTimeout(timer.current);
    setMsg({ text, key: Date.now() });
    timer.current = setTimeout(() => setMsg(null), 2600);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex justify-center px-4 md:bottom-6">
        {msg && <div key={msg.key} className="flex animate-fade-up items-center gap-2 rounded-ctl bg-navy px-4 py-2.5 text-sm font-medium text-white shadow-pop"><Check size={16} className="text-[#7CE0B5]" />{msg.text}</div>}
      </div>
    </Ctx.Provider>
  );
}
