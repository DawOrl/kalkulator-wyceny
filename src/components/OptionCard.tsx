"use client";

import type { KeyboardEvent, Ref } from "react";
import type { Option } from "@/data/pricing";
import { OptionIcon } from "@/components/icons";

interface OptionCardProps {
  option: Option;
  index: number;
  selected: boolean;
  multi?: boolean;
  tabIndex: number;
  buttonRef: Ref<HTMLButtonElement>;
  onSelect: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  /** podgląd na makiecie (kursor albo fokus) */
  onPreview: (on: boolean) => void;
}

/** Wiersz odpowiedzi: ikona, nazwa, opis, adnotacja cenowa i klawisz skrótu. */
export function OptionCard({
  option,
  index,
  selected,
  multi,
  tabIndex,
  buttonRef,
  onSelect,
  onKeyDown,
  onPreview,
}: OptionCardProps) {
  const key = String.fromCharCode(65 + index);
  return (
    <button
      ref={buttonRef}
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      aria-keyshortcuts={key}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      onMouseEnter={() => onPreview(true)}
      onMouseLeave={() => onPreview(false)}
      onFocus={() => onPreview(true)}
      onBlur={() => onPreview(false)}
      className={`press group relative flex w-full min-h-[64px] items-center gap-3.5 border-2 px-3.5 py-3 text-left sm:px-4 ${
        selected
          ? "border-accent-ink bg-sheet shadow-sheet"
          : "border-line bg-sheet/80 hover:border-ink/50 hover:bg-sheet"
      }`}
    >
      <span
        className={`grid size-10 shrink-0 place-items-center border transition-colors duration-150 ${
          selected ? "border-accent-ink bg-accent-ink text-sheet" : "border-line text-ink-soft group-hover:text-ink"
        }`}
        aria-hidden="true"
      >
        {selected ? (
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5.5 12.5 4 4 9-9.5" />
          </svg>
        ) : (
          <OptionIcon id={option.id} className="size-6" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="text-[16px] font-semibold leading-snug tracking-tight">{option.label}</span>
          <span
            className={`font-mono text-[12px] tabular ${selected ? "font-semibold text-accent-ink" : "text-ink-soft"}`}
          >
            {option.hint}
          </span>
        </span>
        <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-soft">{option.description}</span>
      </span>

      <span className="keycap hidden pointer-fine:inline-grid" aria-hidden="true">
        {key}
      </span>
    </button>
  );
}
