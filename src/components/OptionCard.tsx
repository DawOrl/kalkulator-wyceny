"use client";

import type { Option } from "@/data/pricing";
import { OptionIcon } from "@/components/icons";

interface OptionCardProps {
  option: Option;
  index: number;
  selected: boolean;
  multi?: boolean;
  onSelect: () => void;
}

export function OptionCard({ option, index, selected, multi, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-selected={selected}
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      className={`cropmarks group relative w-full border-2 bg-sheet p-4 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-5 ${
        selected
          ? "border-accent shadow-sheet"
          : "border-line hover:border-ink-soft"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`mt-0.5 size-10 shrink-0 border p-2 transition-colors ${
            selected
              ? "border-accent bg-accent text-sheet"
              : "border-line text-ink-soft group-hover:text-ink"
          }`}
        >
          <OptionIcon id={option.id} className="size-full" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium leading-snug">{option.label}</span>
            <span
              className={`shrink-0 font-mono text-[11px] tabular tracking-wide ${
                selected ? "text-accent-deep" : "text-ink-soft"
              }`}
            >
              {option.hint}
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            {option.description}
          </p>
        </div>
      </div>
      <span
        className="absolute right-2 top-1.5 font-mono text-[10px] text-ink-soft/50 tabular"
        aria-hidden="true"
      >
        {String.fromCharCode(65 + index)}
      </span>
    </button>
  );
}
