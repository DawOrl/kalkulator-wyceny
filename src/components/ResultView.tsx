"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Answers } from "@/data/pricing";
import { RANGE_DOWN, RANGE_UP, STEPS } from "@/data/pricing";
import { buildEstimate, formatNumber, formatPLN, formatWeeks } from "@/lib/calculator";
import { layersFor } from "@/lib/makieta";
import { encodeAnswers } from "@/lib/share";
import { CountUp } from "@/components/CountUp";
import { ContactForm } from "@/components/ContactForm";
import { EstimateSheet } from "@/components/EstimateSheet";
import { Makieta } from "@/components/Makieta";

interface ResultViewProps {
  answers: Answers;
  onRestart: () => void;
  /** powrót do wybranego kroku z zachowaniem odpowiedzi */
  onEdit: (stepIndex: number) => void;
}

function chosenLabels(answers: Answers, stepIndex: number): string {
  const step = STEPS[stepIndex];
  const value = answers[step.key];
  const ids = Array.isArray(value) ? value : value ? [value] : [];
  const labels = ids.map((id) => step.options.find((o) => o.id === id)?.label ?? id);
  return labels.length ? labels.join(", ") : "Bez dodatków";
}

const NEXT_STEPS = [
  {
    title: "Wysyłasz konfigurację",
    text: "E-mail i telefon wystarczą. Numer dokumentu łączy zapytanie z tą wyceną.",
  },
  {
    title: "Dostajesz szczegółową wycenę",
    text: "W ciągu 24 godzin roboczych, przygotowaną na bazie tej konfiguracji.",
  },
  {
    title: "Rozmawiamy o szczegółach",
    text: "Ostateczna cena zapada po rozmowie o zakresie, nie wcześniej.",
  },
];

export function ResultView({ answers, onRestart, onEdit }: ResultViewProps) {
  const reduceMotion = useReducedMotion();
  const estimate = buildEstimate(answers);
  const [copied, setCopied] = useState(false);
  const callouts = estimate.lines.map((l, i) => ({ layer: l.layer, no: i + 1 }));

  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?${encodeAnswers(answers)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Skopiuj link:", url);
    }
  }

  return (
    <section className="mx-auto w-full max-w-[1360px] px-4 pb-16 pt-5 sm:px-6 lg:pt-9">
      <article className="border-2 border-ink bg-sheet shadow-sheet">
        {/* tabliczka rysunkowa */}
        <div className="grid grid-cols-2 border-b-2 border-ink sm:grid-cols-[1fr_auto_auto_auto]">
          <span className="label col-span-2 border-b-2 border-ink px-4 py-2 !text-ink sm:col-span-1 sm:border-b-0 sm:border-r-2">
            Wycena wstępna
          </span>
          <span className="label border-r-2 border-ink px-4 py-2 tabular">Dok. {estimate.docId}</span>
          <span className="label px-4 py-2 sm:border-r-2 sm:border-ink">Skala 1:100</span>
          <span className="label hidden px-4 py-2 sm:block">Pracownia Kreska</span>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
          {/* rzut makiety */}
          <div className="relative flex flex-col justify-center border-b-2 border-ink lg:border-b-0 lg:border-r-2">
            <div className="px-0 pb-2 pt-4 sm:px-4">
              <Makieta
                layers={layersFor(answers)}
                callouts={callouts}
                label={`Makieta Twojego projektu: ${estimate.lines.map((l) => l.label).join(", ")}.`}
                sizes="(min-width: 1360px) 720px, (min-width: 1024px) 54vw, 100vw"
                eager
                stagger={0.07}
              />
            </div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 1.6, rotate: -16 }}
              animate={{ opacity: 1, scale: 1, rotate: -7 }}
              transition={{ type: "spring", stiffness: 320, damping: 18, delay: reduceMotion ? 0 : 1.1 }}
              className="pointer-events-none absolute left-7 top-6 hidden border-[3px] border-accent-ink px-3 py-1.5 sm:block"
              aria-hidden="true"
            >
              <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Wycena wstępna
              </span>
            </motion.div>
          </div>

          {/* wynik */}
          <div className="flex flex-col px-5 py-6 sm:px-8 sm:py-8">
            <h1 className="wide text-[2rem] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[2.6rem]">
              Twoja orientacyjna wycena
            </h1>

            <div className="label mt-7">Przedział cenowy netto</div>
            <p className="mt-1.5 font-mono text-[2.05rem] font-semibold leading-none tracking-[-0.03em] text-accent-ink tabular sm:text-[2.9rem]">
              <CountUp value={estimate.rangeMin} format={formatNumber} duration={1} />
              <span className="mx-2 text-ink-soft">–</span>
              <span className="whitespace-nowrap">
                <CountUp value={estimate.rangeMax} format={formatNumber} duration={1.3} /> zł
              </span>
            </p>

            <dl className="mt-7 grid grid-cols-2 border-y-2 border-ink">
              <div className="border-r border-line py-3 pr-4">
                <dt className="label">Czas realizacji</dt>
                <dd className="mt-1 font-mono text-xl font-semibold tabular">
                  {formatWeeks(estimate.weeksMin, estimate.weeksMax)}
                </dd>
              </div>
              <div className="py-3 pl-4">
                <dt className="label">Suma pozycji</dt>
                <dd className="mt-1 font-mono text-xl font-semibold tabular">{formatPLN(estimate.total)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink-soft">
              Widełki to od {Math.round((1 - RANGE_DOWN) * 100)}% mniej do {Math.round((RANGE_UP - 1) * 100)}% więcej
              niż suma pozycji. Ostateczna cena zapada po rozmowie o szczegółach.
            </p>

            <div className="mt-auto pt-7">
              <a
                href="#zamow"
                className="press wide flex min-h-14 items-center justify-center bg-accent-ink px-6 text-center text-[16px] font-semibold text-sheet hover:bg-accent-deep"
              >
                Wyślij mi szczegółową wycenę
              </a>
            </div>
          </div>
        </div>

        {/* wykaz pozycji + założenia */}
        <div className="grid border-t-2 border-ink lg:grid-cols-2">
          <EstimateSheet estimate={estimate} variant="result" className="border-b-2 border-ink lg:border-b-0 lg:border-r-2" />

          <div>
            <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink px-4 py-2.5 sm:px-5">
              <span className="label !text-ink">Założenia</span>
              <span className="label">Twoje odpowiedzi</span>
            </div>
            <ol className="px-4 py-2 sm:px-5">
              {STEPS.map((step, i) => (
                <li key={step.key} className="flex items-center gap-3 border-b border-line py-1 last:border-b-0">
                  <span className="label w-6 shrink-0 tabular">{step.no}</span>
                  <span className="min-w-0 flex-1 py-1.5 text-[14px] leading-snug">
                    <span className="block text-ink-soft">{step.title}</span>
                    <span className="block font-medium">{chosenLabels(answers, i)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onEdit(i)}
                    aria-label={`Zmień: ${step.title}`}
                    className="label min-h-11 shrink-0 px-2 !text-ink underline decoration-dotted underline-offset-4 hover:!text-accent-ink"
                  >
                    Zmień
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* co dalej + formularz */}
        <div id="zamow" className="grid scroll-mt-6 border-t-2 border-ink lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="border-b-2 border-ink px-5 py-6 sm:px-8 lg:border-b-0 lg:border-r-2">
            <h2 className="wide text-xl font-bold tracking-tight">Co dalej</h2>
            <ol className="mt-4 space-y-4">
              {NEXT_STEPS.map((item, i) => (
                <li key={item.title} className="flex gap-3.5">
                  <span className="balloon mt-0.5">{i + 1}</span>
                  <div>
                    <div className="font-semibold leading-snug">{item.title}</div>
                    <p className="mt-0.5 text-[14px] leading-relaxed text-ink-soft">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <ContactForm docId={estimate.docId} />
        </div>
      </article>

      {/* akcje pod arkuszem */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-1">
        <button
          type="button"
          onClick={copyLink}
          className="label min-h-11 !text-ink underline decoration-dotted underline-offset-4 hover:!text-accent-ink"
        >
          {copied ? "Skopiowano link" : "Kopiuj link do tej wyceny"}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="label min-h-11 !text-ink underline decoration-dotted underline-offset-4 hover:!text-accent-ink"
        >
          Zacznij od nowa
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {copied ? "Link do wyceny skopiowany do schowka." : ""}
      </p>
    </section>
  );
}
