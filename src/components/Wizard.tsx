"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Answers, ExtraId, StepKey } from "@/data/pricing";
import { STEPS, emptyAnswers } from "@/data/pricing";
import { buildEstimate, formatPLN } from "@/lib/calculator";
import { layerForOption, layersFor, slotForStep } from "@/lib/makieta";
import { decodeAnswers, encodeAnswers, isComplete } from "@/lib/share";
import { EstimateSheet } from "@/components/EstimateSheet";
import { Makieta, type MakietaPreview } from "@/components/Makieta";
import { MobileSheet } from "@/components/MobileSheet";
import { OptionCard } from "@/components/OptionCard";
import { ResultView } from "@/components/ResultView";
import { CountUp } from "@/components/CountUp";

type Phase = "intro" | "steps" | "result";

interface State {
  phase: Phase;
  stepIndex: number;
  /** najdalszy odwiedzony krok: do niego można wrócić z linijki postępu */
  furthest: number;
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
  | { type: "GOTO"; index: number }
  | { type: "RESULT" }
  | { type: "RESTORE"; answers: Answers }
  | { type: "RESET" };

const LAST = STEPS.length - 1;

const initialState: State = {
  phase: "intro",
  stepIndex: 0,
  furthest: 0,
  direction: 1,
  answers: emptyAnswers,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START":
      return { ...state, phase: "steps", stepIndex: 0, direction: 1 };
    case "SELECT":
      return { ...state, answers: { ...state.answers, [action.key]: action.id } };
    case "TOGGLE_EXTRA": {
      const extras = state.answers.extras.includes(action.id)
        ? state.answers.extras.filter((x) => x !== action.id)
        : [...state.answers.extras, action.id];
      return { ...state, answers: { ...state.answers, extras } };
    }
    case "NEXT": {
      if (state.stepIndex >= LAST) return { ...state, phase: "result", direction: 1, furthest: LAST };
      const stepIndex = state.stepIndex + 1;
      return { ...state, stepIndex, direction: 1, furthest: Math.max(state.furthest, stepIndex) };
    }
    case "BACK":
      if (state.phase === "result") return { ...state, phase: "steps", stepIndex: LAST, direction: -1 };
      if (state.stepIndex === 0) return { ...state, phase: "intro", direction: -1 };
      return { ...state, stepIndex: state.stepIndex - 1, direction: -1 };
    case "GOTO":
      if (action.index > state.furthest) return state;
      return {
        ...state,
        phase: "steps",
        stepIndex: action.index,
        direction: action.index < state.stepIndex || state.phase === "result" ? -1 : 1,
      };
    case "RESULT":
      return isComplete(state.answers) ? { ...state, phase: "result", direction: 1 } : state;
    case "RESTORE":
      return { phase: "result", stepIndex: LAST, furthest: LAST, direction: 1, answers: action.answers };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

/** przykładowa konfiguracja na ekranie startowym (podpisana jako przykład) */
const SAMPLE: Answers = {
  siteType: "firmowa",
  pages: "p6_10",
  design: "indywidualny",
  content: "copywriting",
  extras: ["rezerwacje", "integracje"],
  deadline: "ekspres",
};
const SAMPLE_ESTIMATE = buildEstimate(SAMPLE);

const stepVariants = {
  enter: (direction: 1 | -1) => ({ opacity: 0, x: 40 * direction }),
  center: { opacity: 1, x: 0 },
  exit: (direction: 1 | -1) => ({ opacity: 0, x: -40 * direction }),
};

const PLAN_SIZES = "(min-width: 1360px) 700px, (min-width: 1024px) 52vw, 100vw";

/**
 * Pytanie bieżącego kroku. Fokus przechodzi na nie w chwili zamontowania,
 * czyli dopiero gdy stary krok zniknie (AnimatePresence mode="wait"): czytnik
 * odczyta pytanie, a skróty klawiszowe działają dalej, bo fokus jest w kreatorze.
 */
function StepHeading({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <h2
      ref={ref}
      id="pytanie"
      tabIndex={-1}
      className="wide text-[1.85rem] font-bold leading-[1.02] tracking-[-0.03em] outline-none sm:text-[2.5rem]"
    >
      {children}
    </h2>
  );
}

function makietaLabel(lines: { label: string }[]): string {
  if (lines.length === 0) return "Makieta projektu: pusta mata, czeka na pierwszą odpowiedź.";
  return `Makieta projektu: ${lines.map((l) => l.label).join(", ")}.`;
}

export function Wizard() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const reduceMotion = useReducedMotion();
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const wizardRef = useRef<HTMLElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // podgląd przypięty do kroku: po zmianie kroku sam wygasa
  const [hover, setHover] = useState<{ step: number; preview: MakietaPreview } | null>(null);

  const { phase, stepIndex, direction, answers, furthest } = state;
  const step = STEPS[stepIndex];
  const estimate = buildEstimate(answers);
  const answered = step.multi ? true : answers[step.key] !== null;
  const preview = hover?.step === stepIndex ? hover.preview : null;

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
    dispatch({ type: "BACK" });
  }, [clearAdvanceTimer]);

  const goto = useCallback(
    (index: number) => {
      clearAdvanceTimer();
      dispatch({ type: "GOTO", index });
    },
    [clearAdvanceTimer],
  );

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const selectOption = useCallback(
    (index: number, advanceAfter: number | null) => {
      const option = step.options[index];
      if (!option) return;
      if (step.multi) {
        dispatch({ type: "TOGGLE_EXTRA", id: option.id as ExtraId });
        return;
      }
      dispatch({ type: "SELECT", key: step.key, id: option.id });
      clearAdvanceTimer();
      if (advanceAfter !== null) {
        // chwila na zobaczenie, jak element ląduje na makiecie, potem dalej
        advanceTimer.current = setTimeout(() => {
          advanceTimer.current = null;
          dispatch({ type: "NEXT" });
        }, reduceMotion ? 60 : advanceAfter);
      }
    },
    [step, clearAdvanceTimer, reduceMotion],
  );

  /* odtworzenie konfiguracji z linka (?t=...&p=...) */
  useEffect(() => {
    const restored = decodeAnswers(window.location.search);
    if (restored && isComplete(restored)) {
      dispatch({ type: "RESTORE", answers: restored });
    }
  }, []);

  /* link do wyniku trzyma konfigurację w query stringu */
  useEffect(() => {
    if (phase === "result") {
      window.history.replaceState(null, "", `?${encodeAnswers(answers)}`);
    } else if (phase === "intro") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [phase, answers]);

  /*
   * Skróty: Enter = dalej, litery = wybór opcji, strzałki = wejście w listę.
   * W krokach działają tylko przy fokusie wewnątrz kreatora (WCAG 2.1.4),
   * więc litery wpisywane gdzie indziej niczego nie wybierają.
   */
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName ?? "";
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || target?.isContentEditable) return;
      const onControl = tag === "BUTTON" || tag === "A";

      if (phase === "intro") {
        if (e.key === "Enter" && !onControl) {
          e.preventDefault();
          dispatch({ type: "START" });
        }
        return;
      }
      if (phase !== "steps" || sheetOpen) return;
      if (!target || !wizardRef.current?.contains(target)) return;

      if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        const index = e.key.toUpperCase().charCodeAt(0) - 65;
        if (index < step.options.length) {
          e.preventDefault();
          optionRefs.current[index]?.focus({ preventScroll: true });
          selectOption(index, 260);
        }
        return;
      }
      if (e.key === "Enter" && !onControl && answered) {
        e.preventDefault();
        next();
        return;
      }
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !onControl) {
        e.preventDefault();
        const checked = step.options.findIndex((o) =>
          step.multi ? answers.extras.includes(o.id as ExtraId) : answers[step.key] === o.id,
        );
        optionRefs.current[Math.max(checked, 0)]?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, step, answers, answered, next, selectOption, sheetOpen]);

  /* nowy krok zaczyna się od góry: na telefonie widać, jak element ląduje na makiecie */
  useEffect(() => {
    if (phase === "intro" || window.scrollY === 0) return;
    window.scrollTo({ top: 0, behavior: reduceMotion || phase === "result" ? "instant" : "smooth" });
  }, [phase, stepIndex, reduceMotion]);

  useEffect(() => clearAdvanceTimer, [clearAdvanceTimer]);

  function onOptionKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const n = step.options.length;
    const move = (to: number) => {
      const j = (to + n) % n;
      optionRefs.current[j]?.focus();
      if (!step.multi) selectOption(j, null);
    };
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        move(index + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        move(index - 1);
        break;
      case "Home":
        e.preventDefault();
        move(0);
        break;
      case "End":
        e.preventDefault();
        move(n - 1);
        break;
      case " ":
        e.preventDefault();
        selectOption(index, null);
        break;
      case "Enter":
        e.preventDefault();
        if (step.multi) next();
        else selectOption(index, 200);
        break;
    }
  }

  /* ----------------------------- intro ----------------------------- */
  if (phase === "intro") {
    const sampleCallouts = SAMPLE_ESTIMATE.lines.map((l, i) => ({ layer: l.layer, no: i + 1 }));
    return (
      <section className="mx-auto grid w-full max-w-[1360px] flex-1 content-center gap-x-14 px-4 pb-14 pt-7 sm:px-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:grid-rows-[auto_auto] lg:py-10">
        <div className="rise min-w-0 lg:col-start-1 lg:row-start-1 lg:self-end">
          {/* tabliczka rysunkowa */}
          <div className="label inline-flex border-2 border-ink bg-sheet">
            <span className="border-r-2 border-ink px-2.5 py-1.5">Arkusz: wycena</span>
            <span className="hidden border-r-2 border-ink px-2.5 py-1.5 sm:block">Skala 1:100</span>
            <span className="px-2.5 py-1.5 !text-ink">Pracownia Kreska</span>
          </div>

          <h1 className="wide mt-6 max-w-full text-[2.45rem] font-bold leading-[0.98] tracking-[-0.035em] sm:text-[3.4rem] xl:text-[3.9rem]">
            Ile kosztuje Twoja strona?{" "}
            <span className="text-accent">Sprawdź w&nbsp;60&nbsp;sekund.</span>
          </h1>
          <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-ink-soft sm:text-[17px]">
            Odpowiedz na 6 krótkich pytań. Obok wyrośnie makieta Twojego projektu, a kosztorys dopisze
            pozycje jedna po drugiej, każdą z ceną i numerem odnośnika.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={() => dispatch({ type: "START" })}
              className="press wide min-h-14 bg-accent-ink px-8 text-[17px] font-semibold text-sheet hover:bg-accent-deep"
            >
              Zacznij wycenę
            </button>
            <span className="label hidden pointer-fine:inline">
              albo naciśnij <span className="keycap ml-1">Enter</span>
            </span>
          </div>
        </div>

        <div className="relative mt-8 min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:self-center lg:pb-44">
          <div className="-mx-4 sm:mx-0">
            <Makieta
              layers={layersFor(SAMPLE)}
              callouts={sampleCallouts}
              label={`Przykładowa makieta: ${SAMPLE_ESTIMATE.lines.map((l) => l.label).join(", ")}.`}
              sizes="(min-width: 1360px) 800px, (min-width: 1024px) 58vw, 100vw"
              eager
              stagger={0.11}
            />
          </div>
          <div className="mt-3 sm:flex sm:items-end sm:gap-8 lg:contents">
            <div className="slip receipt-edge relative w-full shrink-0 bg-sheet shadow-sheet sm:max-w-[320px] lg:absolute lg:bottom-4 lg:left-2">
              <EstimateSheet estimate={SAMPLE_ESTIMATE} variant="sample" />
            </div>
            <p className="mt-7 max-w-[38ch] text-[13px] leading-relaxed text-ink-soft sm:mt-0 sm:pb-3 lg:absolute lg:bottom-6 lg:right-0 lg:max-w-[40%] lg:pb-0 lg:text-right">
              Przykład: strona firmowa z 6–10 podstronami, własnym projektem, tekstami, dwoma dodatkami
              i trybem ekspres. Ceny z tego samego cennika co kalkulator.
            </p>
          </div>
        </div>

        <dl className="rise mt-8 max-w-md border-t-2 border-ink lg:col-start-1 lg:row-start-2 lg:mt-10 lg:self-start">
          {[
            ["01", "6 pytań, zero żargonu"],
            ["02", "Widełki cen i czas realizacji"],
            ["03", "Bez maila i bez zobowiązań"],
          ].map(([no, text]) => (
            <div key={no} className="flex items-baseline gap-4 border-b border-line py-2.5">
              <dt className="label tabular">{no}</dt>
              <dd className="text-[15px]">{text}</dd>
            </div>
          ))}
        </dl>
      </section>
    );
  }

  /* ----------------------------- wynik ----------------------------- */
  if (phase === "result") {
    return (
      <ResultView
        answers={answers}
        onRestart={() => dispatch({ type: "RESET" })}
        onEdit={(index) => goto(index)}
      />
    );
  }

  /* ----------------------------- kroki ----------------------------- */
  const callouts = estimate.lines.map((l, i) => ({ layer: l.layer, no: i + 1 }));
  const prefetch = step.options
    .map((o) => layerForOption(step.key, o.id))
    .filter((l): l is string => Boolean(l));
  const checkedIndex = step.options.findIndex((o) =>
    step.multi ? answers.extras.includes(o.id as ExtraId) : answers[step.key] === o.id,
  );
  const plan = layersFor(answers);
  const complete = isComplete(answers);

  return (
    <section
      ref={wizardRef}
      aria-label="Kreator wyceny"
      className="mx-auto grid w-full max-w-[1360px] grid-cols-1 content-start gap-x-12 px-4 pb-32 pt-5 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:grid-rows-[auto_1fr] lg:pb-14 lg:pt-9">
      {/* linijka postępu */}
      <nav aria-label="Postęp wyceny" className="order-1 lg:col-start-1 lg:row-start-1">
        <div className="flex items-baseline justify-between gap-4">
          <span className="label tabular !text-ink">
            Krok {step.no} / {String(STEPS.length).padStart(2, "0")}
          </span>
          {complete && stepIndex < LAST && (
            <button
              type="button"
              onClick={() => dispatch({ type: "RESULT" })}
              className="label min-h-11 !text-accent-ink underline decoration-dotted underline-offset-4"
            >
              Wróć do wyceny
            </button>
          )}
        </div>
        <ol className="mt-1 grid grid-cols-6 gap-1">
          {STEPS.map((s, i) => {
            const state = i < stepIndex ? "done" : i === stepIndex ? "now" : i <= furthest ? "seen" : "todo";
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => goto(i)}
                  disabled={i > furthest}
                  aria-current={i === stepIndex ? "step" : undefined}
                  aria-label={`Krok ${i + 1}: ${s.title}`}
                  className="group flex min-h-11 w-full flex-col justify-start gap-1.5 pt-1.5 text-left disabled:cursor-default"
                >
                  <span
                    className={`block h-[5px] w-full transition-colors duration-300 ${
                      state === "now"
                        ? "bg-accent"
                        : state === "done" || state === "seen"
                          ? "bg-ink group-hover:bg-accent-ink"
                          : "bg-ink/15"
                    }`}
                  />
                  <span className={`label tabular !text-[10px] ${state === "todo" ? "opacity-60" : "!text-ink"}`}>
                    {s.no}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* makieta + kosztorys: na telefonie makieta nad pytaniem, na desktopie arkusz po prawej */}
      <div className="contents lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:block lg:self-start">
        <div className="order-2 mt-3 lg:mt-0 lg:border-2 lg:border-ink lg:bg-sheet lg:shadow-sheet">
          <div className="hidden grid-cols-[1fr_auto_auto] border-b-2 border-ink lg:grid">
            <span className="label border-r-2 border-ink px-4 py-2 !text-ink">Rzut makiety</span>
            <span className="label border-r-2 border-ink px-4 py-2">Skala 1:100</span>
            <span className="label px-4 py-2 tabular">{estimate.docId}</span>
          </div>
          <div className="relative -mx-4 max-lg:-mt-[6%] sm:mx-0 lg:px-3 lg:pt-2">
            <Makieta
              layers={plan}
              preview={preview}
              callouts={callouts}
              prefetch={prefetch}
              label={makietaLabel(estimate.lines)}
              sizes={PLAN_SIZES}
            />
            {plan.length === 0 && !preview && (
              <p className="pointer-events-none absolute left-1/2 top-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 text-center text-[13px] leading-snug text-sheet/85 sm:text-[15px]">
                Tu stanie Twoja strona.
                <span className="block text-sheet/60">Wybierz typ, a postawimy pierwszy budynek.</span>
              </p>
            )}
          </div>
          <div className="hidden lg:block">
            <EstimateSheet estimate={estimate} variant="panel" className="border-t-2 border-ink" />
          </div>
        </div>
      </div>

      {/* pytanie */}
      <div className="order-3 min-w-0 lg:col-start-1 lg:row-start-2">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step.key}
            custom={direction}
            variants={stepVariants}
            initial={reduceMotion ? false : "enter"}
            animate="center"
            exit={reduceMotion ? undefined : "exit"}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="pt-5 lg:pt-8"
          >
            <StepHeading>{step.title}</StepHeading>
            <p className="mt-2 max-w-[52ch] text-[15px] text-ink-soft sm:text-base">{step.subtitle}</p>

            <div
              role={step.multi ? "group" : "radiogroup"}
              aria-labelledby="pytanie"
              className="mt-5 grid gap-2 sm:mt-6"
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
                    tabIndex={step.multi || i === Math.max(checkedIndex, 0) ? 0 : -1}
                    buttonRef={(el) => {
                      optionRefs.current[i] = el;
                    }}
                    onSelect={() => selectOption(i, 380)}
                    onKeyDown={(e) => onOptionKey(e, i)}
                    onPreview={(on) =>
                      setHover((current) =>
                        on
                          ? {
                              step: stepIndex,
                              preview: {
                                slot: slotForStep(step.key, option.id),
                                layer: layerForOption(step.key, option.id),
                              },
                            }
                          : current?.preview.slot === slotForStep(step.key, option.id)
                            ? null
                            : current,
                      )
                    }
                  />
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={back}
                className="label min-h-11 pr-3 !text-ink underline decoration-dotted underline-offset-4 transition-colors hover:!text-accent-ink"
              >
                ← Wstecz
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!answered}
                className="press wide min-h-12 bg-ink px-7 text-[15px] font-semibold text-sheet hover:bg-accent-ink disabled:cursor-not-allowed disabled:bg-ink/30"
              >
                {step.multi && answers.extras.length === 0
                  ? "Pomiń ten krok"
                  : stepIndex === LAST
                    ? "Pokaż wycenę"
                    : "Dalej"}
              </button>
            </div>

            <p className="label mt-6 hidden flex-wrap items-center gap-x-4 gap-y-2 pointer-fine:flex">
              <span>
                <span className="keycap">A</span>–<span className="keycap">{String.fromCharCode(64 + step.options.length)}</span>{" "}
                {step.multi ? "zaznacz" : "wybierz"}
              </span>
              <span>
                <span className="keycap">↑</span> <span className="keycap">↓</span> przesuń
              </span>
              <span>
                <span className="keycap">Enter</span> dalej
              </span>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <h1 className="sr-only">Kalkulator wyceny strony www</h1>
      {/* zapowiedź dla czytników ekranu */}
      <p className="sr-only" aria-live="polite">
        {estimate.lines.length
          ? `Kosztorys: ${estimate.lines.length} poz., razem ${formatPLN(estimate.total)}.`
          : ""}
      </p>

      {/* kosztorys na telefonie: pasek z sumą + szuflada */}
      <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          className="flex min-h-14 w-full items-center justify-between gap-4 border-t-2 border-ink bg-sheet px-4 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_24px_-14px_rgba(30,41,54,0.35)]"
        >
          <span className="label !text-ink">
            Kosztorys
            <span className="ml-2 text-ink-soft">{estimate.lines.length} poz.</span>
          </span>
          <span className="flex items-center gap-2.5">
            <span className="font-mono text-lg font-semibold text-accent-ink">
              <CountUp value={estimate.total} format={formatPLN} />
            </span>
            <svg viewBox="0 0 16 16" className="size-4 text-ink" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="m3.5 10 4.5-4.5 4.5 4.5" />
            </svg>
          </span>
        </button>
      </div>
      <AnimatePresence>
        {sheetOpen && (
          <MobileSheet title="Kosztorys wstępny" meta={estimate.docId} onClose={closeSheet}>
            <EstimateSheet estimate={estimate} variant="drawer" />
          </MobileSheet>
        )}
      </AnimatePresence>
    </section>
  );
}
