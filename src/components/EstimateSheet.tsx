"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Estimate } from "@/lib/calculator";
import { formatPLN, formatWeeks } from "@/lib/calculator";
import { CountUp } from "@/components/CountUp";

interface EstimateSheetProps {
  estimate: Estimate;
  /** panel obok pytań, szuflada na telefonie, wykaz w wyniku albo przykład na starcie */
  variant?: "panel" | "drawer" | "result" | "sample";
  className?: string;
}

/**
 * Kosztorys pisany na żywo: każda odpowiedź dopisuje pozycję jak ręką
 * kosztorysanta (wiersz odsłania się od lewej, kwota dolicza się od zera,
 * marker podkreśla nowość), a suma tyka jak taksometr. Numery w kółkach
 * są tymi samymi odnośnikami, które wskazują elementy na makiecie.
 */
export function EstimateSheet({ estimate, variant = "panel", className }: EstimateSheetProps) {
  const reduceMotion = useReducedMotion();
  const empty = estimate.lines.length === 0;
  const sample = variant === "sample";
  const result = variant === "result";

  // tylko pozycje dopisane od poprzedniej zmiany dostają marker
  const ids = estimate.lines.map((l) => l.id).join("|");
  const [tracked, setTracked] = useState({ ids, fresh: new Set<string>() });
  if (tracked.ids !== ids) {
    const before = new Set(tracked.ids.split("|"));
    setTracked({ ids, fresh: new Set(estimate.lines.map((l) => l.id).filter((id) => !before.has(id))) });
  }

  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      {variant !== "drawer" && (
        <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink px-4 py-2.5 sm:px-5">
          <span className="label !text-ink">
            {sample ? "Przykładowy kosztorys" : result ? "Wykaz pozycji" : "Kosztorys wstępny"}
          </span>
          <span className="label tabular">
            {sample ? "Poglądowo" : `${estimate.lines.length} poz.`}
          </span>
        </div>
      )}

      <div className={`flex-1 px-4 sm:px-5 ${sample ? "py-2" : "py-3"}`}>
        {empty && (
          <p className="py-5 text-center text-sm leading-relaxed text-ink-soft">
            Arkusz czeka na pierwszą odpowiedź.
            <br />
            Pozycje dopiszą się tutaj, jedna po drugiej.
          </p>
        )}
        <ol>
          <AnimatePresence initial={false} mode="popLayout">
            {estimate.lines.map((line, i) => {
              const fresh = !sample && tracked.fresh.has(line.id);
              return (
                <motion.li
                  key={line.id}
                  layout={reduceMotion ? false : "position"}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 1, clipPath: "inset(0 100% 0 0)" }}
                  animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: reduceMotion ? 0.15 : 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className={`relative flex items-center gap-2.5 leading-snug ${
                    sample ? "py-[3px] text-[13px]" : "py-1 text-[14px]"
                  }`}
                >
                  {fresh && <span className="marker" aria-hidden="true" />}
                  <span className="balloon relative">{i + 1}</span>
                  <span className="relative min-w-0">
                    <span className="text-ink">{line.label}</span>
                    {line.detail && !sample && (
                      <span className="whitespace-nowrap font-mono text-[11px] text-accent-ink max-sm:block sm:ml-1.5">
                        {line.detail}
                      </span>
                    )}
                  </span>
                  <span className="leader relative" aria-hidden="true" />
                  <span className="relative whitespace-nowrap font-mono text-[13px] tabular">
                    {sample ? formatPLN(line.amount) : <CountUp value={line.amount} format={formatPLN} />}
                  </span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      </div>

      {/* tabliczka z sumą */}
      <div className="grid grid-cols-2 border-t-2 border-ink">
        <div className="col-span-2 flex items-baseline justify-between gap-3 px-4 py-3 sm:px-5">
          <span className="label !text-ink">Razem netto</span>
          <span className="font-mono text-2xl font-semibold tracking-tight text-accent-ink">
            {sample ? formatPLN(estimate.total) : <CountUp value={estimate.total} format={formatPLN} />}
          </span>
        </div>
        {!sample && !result && (
          <>
            <div className="border-r border-t border-line px-4 py-2 sm:px-5">
              <div className="label">Widełki</div>
              <div className="mt-0.5 font-mono text-[13px] tabular">
                {empty ? "–" : `${formatPLN(estimate.rangeMin)} – ${formatPLN(estimate.rangeMax)}`}
              </div>
            </div>
            <div className="border-t border-line px-4 py-2 sm:px-5">
              <div className="label">Termin</div>
              <div className="mt-0.5 font-mono text-[13px] tabular">
                {empty ? "–" : formatWeeks(estimate.weeksMin, estimate.weeksMax)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
