"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface MobileSheetProps {
  title: string;
  /** dopisek obok tytułu, np. numer dokumentu */
  meta?: string;
  onClose: () => void;
  children: ReactNode;
}

/** Szuflada od dołu ekranu: tło przyciemnia stronę, Esc i stuknięcie w tło zamykają. */
export function MobileSheet({ title, meta, onClose, children }: MobileSheetProps) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <motion.button
        type="button"
        aria-label="Zamknij kosztorys"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-ink/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto border-t-2 border-ink bg-sheet pb-[env(safe-area-inset-bottom)]"
        initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
        animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
        transition={{ duration: reduceMotion ? 0.15 : 0.32, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="flex items-center justify-between border-b-2 border-ink pl-4 pr-1">
          <span className="label !text-ink">
            {title}
            {meta && <span className="ml-2 text-ink-soft tabular">{meta}</span>}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="label min-h-11 px-3 !text-ink underline decoration-dotted underline-offset-4"
          >
            Zamknij
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
