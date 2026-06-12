"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Answers } from "@/data/pricing";
import { STEPS } from "@/data/pricing";
import { buildEstimate, formatPLN } from "@/lib/calculator";
import { encodeAnswers } from "@/lib/share";
import { CountUp } from "@/components/CountUp";
import { ContactForm } from "@/components/ContactForm";

interface ResultViewProps {
  answers: Answers;
  onRestart: () => void;
}

function summaryText(answers: Answers): string {
  return STEPS.map((step) => {
    const value = answers[step.key];
    const ids = Array.isArray(value) ? value : value ? [value] : [];
    const labels = ids.map(
      (id) => step.options.find((o) => o.id === id)?.label ?? id,
    );
    return `${step.title}: ${labels.length ? labels.join(", ") : "—"}`;
  }).join("\n");
}

export function ResultView({ answers, onRestart }: ResultViewProps) {
  const reduceMotion = useReducedMotion();
  const estimate = buildEstimate(answers);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?${encodeAnswers(answers)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Skopiuj link:", url);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* karta wyniku */}
      <div className="receipt-edge relative bg-sheet shadow-sheet">
        {/* pieczątka */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 1.7, rotate: -18 }}
          animate={{ opacity: 1, scale: 1, rotate: -8 }}
          transition={{ type: "spring", stiffness: 320, damping: 17, delay: 0.45 }}
          className="pointer-events-none absolute -top-4 right-4 z-10 border-[3px] border-accent px-3 py-1.5 sm:right-8"
          aria-hidden="true"
        >
          <span className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-accent">
            Wycena wstępna
          </span>
        </motion.div>

        <div className="border-b-2 border-ink px-6 pt-6 pb-4 sm:px-8">
          <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            <span>Dokument {estimate.docId}</span>
            <span>Pracownia Kreska</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Twoja orientacyjna wycena
          </h2>
        </div>

        {/* widełki + czas */}
        <div className="grid gap-6 px-6 py-6 sm:grid-cols-[1fr_auto] sm:items-end sm:px-8">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              Przedział cenowy (netto)
            </div>
            <div className="mt-1 font-mono text-3xl font-bold tracking-tight text-accent-deep sm:text-[2.6rem] sm:leading-tight">
              <CountUp value={estimate.rangeMin} format={formatPLN} duration={1} />
              <span className="mx-2 text-ink-soft">–</span>
              <CountUp value={estimate.rangeMax} format={formatPLN} duration={1.4} />
            </div>
          </div>
          <div className="sm:pb-1 sm:text-right">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              Czas realizacji
            </div>
            <div className="mt-1 font-mono text-xl font-semibold tabular">
              {estimate.weeksMin === estimate.weeksMax
                ? `~${estimate.weeksMax} tyg.`
                : `${estimate.weeksMin}–${estimate.weeksMax} tyg.`}
            </div>
          </div>
        </div>

        {/* rozpis pozycji */}
        <div className="border-t-2 border-dashed border-line px-6 py-5 sm:px-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Rozpis pozycji
          </div>
          <ul className="mt-3">
            {estimate.lines.map((line, i) => (
              <li key={line.id} className="flex items-baseline py-1.5 text-sm">
                <span className="mr-2 font-mono text-[11px] text-ink-soft/80 tabular">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  {line.label}
                  {line.detail && (
                    <span className="ml-1.5 font-mono text-[11px] text-accent">
                      {line.detail}
                    </span>
                  )}
                </span>
                <span className="leader" aria-hidden="true" />
                <span className="font-mono tabular">{formatPLN(line.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-baseline justify-between border-t-2 border-ink pt-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              Punkt odniesienia
            </span>
            <span className="font-mono text-lg font-semibold tabular">
              {formatPLN(estimate.total)}
            </span>
          </div>
        </div>

        {/* formularz */}
        <div className="border-t-2 border-dashed border-line">
          <ContactForm summary={`${estimate.docId}\n${summaryText(answers)}`} />
        </div>
      </div>

      {/* akcje pod kartą */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pb-4">
        <button
          type="button"
          onClick={copyLink}
          className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft underline decoration-dotted underline-offset-4 transition-colors hover:text-accent"
        >
          {copied ? "✓ Skopiowano link" : "Kopiuj link do tej wyceny"}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft underline decoration-dotted underline-offset-4 transition-colors hover:text-accent"
        >
          Zacznij od nowa
        </button>
      </div>
    </div>
  );
}
