"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Answers, ExtraId, StepKey } from "@/data/pricing";
import { STEPS, emptyAnswers } from "@/data/pricing";
import { buildEstimate, formatPLN } from "@/lib/calculator";
import { decodeAnswers, encodeAnswers, isComplete } from "@/lib/share";
import { EstimateSheet } from "@/components/EstimateSheet";
import { OptionCard } from "@/components/OptionCard";
import { ResultView } from "@/components/ResultView";
import { CountUp } from "@/components/CountUp";

type Phase = "intro" | "steps" | "result";

interface State {
  phase: Phase;
  stepIndex: number;
  /** 1 = w przód, -1 = w tył (kierunek animacji) */
  direction: 1 | -1;
  answers: Answers;
}

type Action =
  | { type: "START" }
  | { type: "SELECT"; key: StepKey; id: string }
  | { type: "TOGGLE_EXTRA"; id: ExtraId }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "RESTORE"; answers: Answers }
  | { type: "RESET" };

const initialState: State = {
  phase: "intro",
  stepIndex: 0,
  direction: 1,
  answers: emptyAnswers,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START":
      return { ...state, phase: "steps", stepIndex: 0, direction: 1 };
    case "SELECT":
      return {
        ...state,
        answers: { ...state.answers, [action.key]: action.id },
      };
    case "TOGGLE_EXTRA": {
      const extras = state.answers.extras.includes(action.id)
        ? state.answers.extras.filter((x) => x !== action.id)
        : [...state.answers.extras, action.id];
      return { ...state, answers: { ...state.answers, extras } };
    }
    case "NEXT":
      if (state.stepIndex >= STEPS.length - 1) {
        return { ...state, phase: "result", direction: 1 };
      }
      return { ...state, stepIndex: state.stepIndex + 1, direction: 1 };
    case "BACK":
      if (state.phase === "result") {
        return { ...state, phase: "steps", stepIndex: STEPS.length - 1, direction: -1 };
      }
      if (state.stepIndex === 0) {
        return { ...state, phase: "intro", direction: -1 };
      }
      return { ...state, stepIndex: state.stepIndex - 1, direction: -1 };
    case "RESTORE":
      return { phase: "result", stepIndex: STEPS.length - 1, direction: 1, answers: action.answers };
    case "RESET":
      return { ...initialState, phase: "intro" };
    default:
      return state;
  }
}

const stepVariants = {
  enter: (direction: 1 | -1) => ({ opacity: 0, x: 56 * direction }),
  center: { opacity: 1, x: 0 },
  exit: (direction: 1 | -1) => ({ opacity: 0, x: -56 * direction }),
};

export function Wizard() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const reduceMotion = useReducedMotion();
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { phase, stepIndex, direction, answers } = state;
  const step = STEPS[stepIndex];
  const estimate = buildEstimate(answers);
  const answered = step.multi ? true : answers[step.key] !== null;

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, []);

  const next = useCallback(() => {
    clearAdvanceTimer();
    dispatch({ type: "NEXT" });
  }, [clearAdvanceTimer]);

  const back = useCallback(() => {
    clearAdvanceTimer();
    setSheetOpen(false);
    dispatch({ type: "BACK" });
  }, [clearAdvanceTimer]);

  /* odtworzenie konfiguracji z linka (?t=...&p=...) */
  useEffect(() => {
    const restored = decodeAnswers(window.location.search);
    if (restored && isComplete(restored)) {
      dispatch({ type: "RESTORE", answers: restored });
    }
  }, []);

  /* shareable link: wynik trzyma konfigurację w query stringu */
  useEffect(() => {
    if (phase === "result") {
      window.history.replaceState(null, "", `?${encodeAnswers(answers)}`);
    } else if (phase === "intro") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [phase, answers]);

  /* Enter = dalej */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName)) {
        return;
      }
      if (phase === "intro") dispatch({ type: "START" });
      if (phase === "steps" && answered) next();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, answered, next]);

  /* focus na pytaniu przy zmianie kroku */
  useEffect(() => {
    if (phase === "steps") {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [phase, stepIndex]);

  useEffect(() => clearAdvanceTimer, [clearAdvanceTimer]);

  function selectSingle(key: StepKey, id: string) {
    dispatch({ type: "SELECT", key, id });
    clearAdvanceTimer();
    // chwila na feedback zaznaczenia, potem auto-przejście
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      dispatch({ type: "NEXT" });
    }, reduceMotion ? 80 : 320);
  }

  /* ----------------------------- intro ----------------------------- */
  if (phase === "intro") {
    return (
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16"
      >
        {/* tabliczka rysunkowa jak na rysunku technicznym */}
        <div className="border-2 border-ink bg-sheet shadow-sheet">
          <div className="grid grid-cols-3 border-b-2 border-ink font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">
            <span className="border-r-2 border-ink px-3 py-2">Arkusz: wycena</span>
            <span className="border-r-2 border-ink px-3 py-2">Skala 1:1</span>
            <span className="px-3 py-2 text-right">Pracownia Kreska</span>
          </div>
          <div className="px-6 py-10 sm:px-10 sm:py-14">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-[2.6rem]">
              Sprawdź orientacyjną cenę swojej strony{" "}
              <span className="whitespace-nowrap text-accent">w 60 sekund</span>.
            </h1>
            <p className="mt-4 max-w-lg text-ink-soft leading-relaxed">
              Odpowiedz na 6 krótkich pytań, a kosztorys naszkicuje się sam —
              pozycja po pozycji, jak u dobrego rzemieślnika.
            </p>
            <ul className="mt-6 space-y-1.5 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
              <li>① 6 pytań, zero żargonu</li>
              <li>② Widełki cen + czas realizacji</li>
              <li>③ Bez maila, bez zobowiązań</li>
            </ul>
            <button
              type="button"
              onClick={() => dispatch({ type: "START" })}
              className="mt-8 border-2 border-accent bg-accent px-8 py-3.5 font-medium text-sheet transition-colors hover:border-accent-deep hover:bg-accent-deep"
            >
              Zaczynamy →
            </button>
            <p className="mt-3 font-mono text-[11px] text-ink-soft">
              Enter też działa ↵
            </p>
          </div>
        </div>
      </motion.section>
    );
  }

  /* ----------------------------- wynik ----------------------------- */
  if (phase === "result") {
    return (
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ResultView answers={answers} onRestart={() => dispatch({ type: "RESET" })} />
        </motion.div>
      </section>
    );
  }

  /* ----------------------------- kroki ----------------------------- */
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:pt-12 lg:pb-12">
      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {/* linijka postępu */}
          <div className="mb-8">
            <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              <span className="tabular">
                Krok {step.no} / {String(STEPS.length).padStart(2, "0")}
              </span>
              <span>{step.title}</span>
            </div>
            <div className="relative mt-2 h-4">
              {/* podziałka jak na linijce */}
              <div className="absolute inset-x-0 top-0 h-2 border-b-2 border-ink/20" />
              {STEPS.map((s, i) => (
                <div
                  key={s.key}
                  className="absolute top-0 h-2 w-0.5 bg-ink/30"
                  style={{ left: `${(i / STEPS.length) * 100}%` }}
                />
              ))}
              <motion.div
                className="absolute left-0 top-0 h-2 border-b-[3px] border-accent"
                animate={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 26 }}
              />
            </div>
          </div>

          {/* pytanie */}
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step.key}
              custom={direction}
              variants={stepVariants}
              initial={reduceMotion ? false : "enter"}
              animate="center"
              exit={reduceMotion ? undefined : "exit"}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl font-semibold tracking-tight outline-none sm:text-3xl"
              >
                {step.title}
              </h2>
              <p className="mt-1.5 text-ink-soft">{step.subtitle}</p>

              <div
                role={step.multi ? "group" : "radiogroup"}
                aria-label={step.title}
                className="mt-6 grid gap-3 sm:grid-cols-2"
              >
                {step.options.map((option, i) => {
                  const selected = step.multi
                    ? answers.extras.includes(option.id as ExtraId)
                    : answers[step.key] === option.id;
                  return (
                    <OptionCard
                      key={option.id}
                      option={option}
                      index={i}
                      selected={selected}
                      multi={step.multi}
                      onSelect={() =>
                        step.multi
                          ? dispatch({ type: "TOGGLE_EXTRA", id: option.id as ExtraId })
                          : selectSingle(step.key, option.id)
                      }
                    />
                  );
                })}
              </div>

              {/* nawigacja */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={back}
                  className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft underline decoration-dotted underline-offset-4 transition-colors hover:text-accent"
                >
                  ← Wstecz
                </button>
                <button
                  type="button"
                  onClick={next}
                  disabled={!answered}
                  className="border-2 border-ink bg-ink px-6 py-2.5 text-sm font-medium text-sheet transition-colors hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {step.multi && answers.extras.length === 0
                    ? "Pomiń ten krok →"
                    : stepIndex === STEPS.length - 1
                      ? "Pokaż wycenę →"
                      : "Dalej →"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* kosztorys na żywo — desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-10">
            <EstimateSheet estimate={estimate} />
          </div>
        </aside>
      </div>

      {/* kosztorys na żywo — mobile: pasek + szuflada */}
      <div className="fixed inset-x-0 bottom-0 z-20 lg:hidden">
        <AnimatePresence>
          {sheetOpen && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 24 }}
              transition={{ duration: 0.22 }}
              className="mx-4 mb-3"
            >
              <EstimateSheet estimate={estimate} compact />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => setSheetOpen((open) => !open)}
          aria-expanded={sheetOpen}
          className="flex w-full items-baseline justify-between border-t-2 border-ink bg-sheet px-5 py-3.5 shadow-[0_-8px_24px_-12px_rgba(30,41,54,0.3)]"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Kosztorys {sheetOpen ? "▾" : "▴"}
          </span>
          <span className="font-mono text-lg font-semibold text-accent-deep">
            <CountUp value={estimate.total} format={formatPLN} />
          </span>
        </button>
      </div>
    </section>
  );
}
