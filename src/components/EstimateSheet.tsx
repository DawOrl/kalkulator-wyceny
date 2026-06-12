"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Estimate } from "@/lib/calculator";
import { formatPLN } from "@/lib/calculator";
import { CountUp } from "@/components/CountUp";

interface EstimateSheetProps {
  estimate: Estimate;
  /** zwarty wariant do mobilnej szuflady */
  compact?: boolean;
}

/**
 * Papierowy kosztorys "drukujący się" na żywo — pozycje wjeżdżają
 * w miarę odpowiadania, suma tyka jak taksometr.
 */
export function EstimateSheet({ estimate, compact = false }: EstimateSheetProps) {
  const reduceMotion = useReducedMotion();
  const empty = estimate.lines.length === 0;

  return (
    <div
      className={`receipt-edge bg-sheet shadow-sheet ${
        compact ? "" : "-rotate-[0.4deg]"
      }`}
    >
      {/* nagłówek dokumentu */}
      <div className="border-b-2 border-ink px-5 pt-4 pb-3">
        <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          <span>Kosztorys wstępny</span>
          <span>{estimate.docId}</span>
        </div>
        <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          Pracownia Kreska · wycena orientacyjna
        </div>
      </div>

      {/* pozycje */}
      <div className={`px-5 ${compact ? "py-3" : "py-4"} min-h-[120px]`}>
        {empty && (
          <p className="py-6 text-center font-mono text-xs uppercase tracking-[0.18em] text-ink-soft/70">
            — oczekuje na dane —
          </p>
        )}
        <ul aria-live="polite">
          <AnimatePresence initial={false}>
            {estimate.lines.map((line, i) => (
              <motion.li
                key={line.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-baseline py-1.5 text-sm"
              >
                <span className="mr-2 font-mono text-[11px] text-ink-soft/80 tabular">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-ink">
                  {line.label}
                  {line.detail && (
                    <span className="ml-1.5 font-mono text-[11px] text-accent">
                      {line.detail}
                    </span>
                  )}
                </span>
                <span className="leader" aria-hidden="true" />
                <span className="font-mono text-sm tabular">
                  {formatPLN(line.amount)}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      {/* suma */}
      <div className="border-t-2 border-dashed border-line px-5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Suma orientacyjna
          </span>
          <span className="font-mono text-xl font-semibold text-accent-deep">
            <CountUp value={estimate.total} format={formatPLN} />
          </span>
        </div>
        {!compact && (
          <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
            Kwoty netto. Ostateczna wycena po rozmowie o szczegółach.
          </p>
        )}
      </div>
    </div>
  );
}
