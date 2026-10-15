import {
  Answers,
  BASE_PRICE,
  BASE_WEEKS,
  COPYWRITING_PRICE,
  CUSTOM_DESIGN_RATE,
  EXPRESS_MULTIPLIER,
  EXPRESS_WEEKS_FACTOR,
  EXTRA_PRICE,
  EXTRA_WEEKS,
  PAGES_MULTIPLIER,
  RANGE_DOWN,
  RANGE_UP,
  STEPS,
} from "@/data/pricing";

export interface LineItem {
  id: string;
  label: string;
  /** adnotacja techniczna, np. "×1,45" */
  detail?: string;
  amount: number;
  /** warstwa makiety, którą ta pozycja dokłada (public/makieta/<layer>.webp) */
  layer: string;
}

export interface Estimate {
  lines: LineItem[];
  total: number;
  rangeMin: number;
  rangeMax: number;
  weeksMin: number;
  weeksMax: number;
  /** deterministyczny numer dokumentu wyliczany z konfiguracji */
  docId: string;
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

function optionLabel(stepKey: string, optionId: string): string {
  const step = STEPS.find((s) => s.key === stepKey);
  return step?.options.find((o) => o.id === optionId)?.label ?? optionId;
}

/** prosty hash → numer dokumentu w stylu "WYC-7F3A" */
function docIdFor(a: Answers): string {
  const sig = [a.siteType, a.pages, a.design, a.content, [...a.extras].sort().join("+"), a.deadline].join("|");
  let h = 5381;
  for (let i = 0; i < sig.length; i++) {
    h = ((h << 5) + h + sig.charCodeAt(i)) >>> 0;
  }
  return `WYC-${h.toString(16).slice(-4).toUpperCase().padStart(4, "0")}`;
}

/**
 * Buduje kosztorys z częściowych odpowiedzi: pozycje pojawiają się
 * w arkuszu na żywo, w miarę przechodzenia przez kroki.
 */
export function buildEstimate(a: Answers): Estimate {
  const lines: LineItem[] = [];

  const base = a.siteType ? BASE_PRICE[a.siteType] : 0;
  if (a.siteType) {
    lines.push({
      id: "base",
      label: optionLabel("siteType", a.siteType),
      detail: "stawka bazowa",
      amount: base,
      layer: `type-${a.siteType}`,
    });
  }

  if (a.siteType && a.pages) {
    const mult = PAGES_MULTIPLIER[a.pages];
    if (mult !== 1) {
      lines.push({
        id: "pages",
        label: optionLabel("pages", a.pages),
        detail: `×${mult.toLocaleString("pl-PL")}`,
        amount: Math.round(base * (mult - 1)),
        layer: `pages-${a.pages}`,
      });
    }
  }

  if (a.siteType && a.design === "indywidualny") {
    lines.push({
      id: "design",
      label: "Projekt indywidualny",
      detail: `+${CUSTOM_DESIGN_RATE * 100}%`,
      amount: Math.round(base * CUSTOM_DESIGN_RATE),
      layer: "design",
    });
  }

  if (a.content === "copywriting") {
    lines.push({
      id: "content",
      label: "Copywriting treści",
      amount: COPYWRITING_PRICE,
      layer: "content",
    });
  }

  const extras = [...new Set(a.extras)];
  for (const extra of extras) {
    lines.push({
      id: `extra-${extra}`,
      label: optionLabel("extras", extra),
      amount: EXTRA_PRICE[extra],
      layer: `extra-${extra}`,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);

  if (a.deadline === "ekspres" && subtotal > 0) {
    lines.push({
      id: "express",
      label: "Tryb ekspres",
      detail: `×${EXPRESS_MULTIPLIER.toLocaleString("pl-PL")}`,
      amount: Math.round(subtotal * (EXPRESS_MULTIPLIER - 1)),
      layer: "express",
    });
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0);

  let [weeksMin, weeksMax] = a.siteType ? BASE_WEEKS[a.siteType] : [0, 0];
  if (a.design === "indywidualny") weeksMax += 1;
  if (a.content === "copywriting") weeksMax += 1;
  for (const extra of extras) weeksMax += EXTRA_WEEKS[extra] ?? 0;
  if (a.deadline === "ekspres") {
    weeksMin = Math.max(1, Math.round(weeksMin * EXPRESS_WEEKS_FACTOR));
    weeksMax = Math.max(weeksMin, Math.round(weeksMax * EXPRESS_WEEKS_FACTOR));
  }

  return {
    lines,
    total,
    rangeMin: roundTo(total * RANGE_DOWN, 50),
    rangeMax: roundTo(total * RANGE_UP, 50),
    weeksMin,
    weeksMax,
    docId: docIdFor(a),
  };
}

/*
 * Polska norma nie grupuje liczb czterocyfrowych ("2490"), ale w kosztorysie
 * kwoty mają się równać w kolumnie, więc grupujemy zawsze ("2 490").
 * Separator i spacja przed "zł" są nierozdzielające.
 */
const PLN = new Intl.NumberFormat("pl-PL", { useGrouping: "always", maximumFractionDigits: 0 });

export function formatNumber(value: number): string {
  return PLN.format(value);
}

export function formatPLN(value: number): string {
  return `${PLN.format(value)}\u00a0zł`;
}

export function formatWeeks(min: number, max: number): string {
  return min === max ? `ok. ${max} tyg.` : `${min}–${max} tyg.`;
}
